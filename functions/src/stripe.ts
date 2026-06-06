import { onRequest } from "firebase-functions/v2/https";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import Stripe from "stripe";
import * as admin from "firebase-admin";
import { generateCareerVividEmail } from "./emailTemplates";
import { ENTERPRISE_MINIMUM_SEATS } from "./utils/planLimits";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

const envPrice = (name: string) => process.env[name]?.trim() || "";

// Price IDs for the different plans. Stripe Price amounts are immutable, so the
// 2026 catalog IDs must be supplied after the new Prices are created in Stripe.
const PRICE_IDS = {
    SPRINT: "price_1ScLNsRJNflGxv32cvu6cTsK", // The 7-Day Sprint - One-time
    DOWNLOAD_ONCE: "price_1TcIecRJNflGxv32sYZFOnn5", // Download Once - $2.99
    DOWNLOAD_ONCE_LEGACY: "price_1ScLPERJNflGxv32Wxtpvg62", // Download Once - $1.99 legacy price
    NFC_CUSTOM: "price_1So67jRJNflGxv32TKsC7AbX", // Custom NFC Card - $12.90
    NFC_STANDARD: "price_1So6AtRJNflGxv32qHMPnhwz", // Standard NFC Card - $9.89
    // Active 2026 subscription catalog
    PRO_MONTHLY: envPrice("STRIPE_PRICE_PRO_MONTHLY"),
    PRO_ANNUAL: envPrice("STRIPE_PRICE_PRO_ANNUAL"),
    MAX_MONTHLY: envPrice("STRIPE_PRICE_MAX_MONTHLY"),
    MAX_ANNUAL: envPrice("STRIPE_PRICE_MAX_ANNUAL"),
    ENTERPRISE_MONTHLY: envPrice("STRIPE_PRICE_ENTERPRISE_MONTHLY") || "price_1TJoQyRJNflGxv32FQ9TxIjq",
    // Legacy subscription listeners retained for existing subscribers and old webhooks.
    LEGACY_PRO_MONTHLY: "price_1ScLOaRJNflGxv32BwQnSBs0",
    LEGACY_PRO_LIVE: "price_1TJoONRJNflGxv32zSqxC9bZ",
    LEGACY_MAX_LIVE: "price_1TJoONRJNflGxv32wxPHw9FR",
    LEGACY_ENTERPRISE_LIVE: "price_1TJoQyRJNflGxv32FQ9TxIjq",
} as const;

// One-time payment price IDs
const ONE_TIME_PRICE_IDS = [
    PRICE_IDS.SPRINT,
    PRICE_IDS.DOWNLOAD_ONCE,
    PRICE_IDS.DOWNLOAD_ONCE_LEGACY,
    PRICE_IDS.NFC_CUSTOM,
    PRICE_IDS.NFC_STANDARD,
];

const DOWNLOAD_ONCE_PRICE_IDS = [
    PRICE_IDS.DOWNLOAD_ONCE,
    PRICE_IDS.DOWNLOAD_ONCE_LEGACY,
];

const ACTIVE_SUBSCRIPTION_PRICE_IDS = [
    PRICE_IDS.PRO_MONTHLY,
    PRICE_IDS.PRO_ANNUAL,
    PRICE_IDS.MAX_MONTHLY,
    PRICE_IDS.MAX_ANNUAL,
    PRICE_IDS.ENTERPRISE_MONTHLY,
].filter(Boolean);

const LEGACY_SUBSCRIPTION_PRICE_IDS = [
    PRICE_IDS.LEGACY_PRO_MONTHLY,
    PRICE_IDS.LEGACY_PRO_LIVE,
    PRICE_IDS.LEGACY_MAX_LIVE,
    PRICE_IDS.LEGACY_ENTERPRISE_LIVE,
];

function resolveSubscriptionPrice(priceId?: string | null): {
    plan: "pro" | "max" | "enterprise" | "pro_monthly";
    billingInterval: "month" | "year";
    legacy: boolean;
} | null {
    if (!priceId) return null;

    if (priceId === PRICE_IDS.PRO_MONTHLY) return { plan: "pro", billingInterval: "month", legacy: false };
    if (priceId === PRICE_IDS.PRO_ANNUAL) return { plan: "pro", billingInterval: "year", legacy: false };
    if (priceId === PRICE_IDS.MAX_MONTHLY) return { plan: "max", billingInterval: "month", legacy: false };
    if (priceId === PRICE_IDS.MAX_ANNUAL) return { plan: "max", billingInterval: "year", legacy: false };
    if (priceId === PRICE_IDS.ENTERPRISE_MONTHLY) return { plan: "enterprise", billingInterval: "month", legacy: false };

    if (priceId === PRICE_IDS.LEGACY_PRO_MONTHLY) return { plan: "pro_monthly", billingInterval: "month", legacy: true };
    if (priceId === PRICE_IDS.LEGACY_PRO_LIVE) return { plan: "pro", billingInterval: "month", legacy: true };
    if (priceId === PRICE_IDS.LEGACY_MAX_LIVE) return { plan: "max", billingInterval: "month", legacy: true };
    if (priceId === PRICE_IDS.LEGACY_ENTERPRISE_LIVE) return { plan: "enterprise", billingInterval: "month", legacy: true };

    return null;
}

function assertCheckoutPriceAllowed(priceId: string, mode: Stripe.Checkout.SessionCreateParams.Mode) {
    if (mode === "payment") {
        if (ONE_TIME_PRICE_IDS.includes(priceId as any)) return;
        throw new HttpsError("invalid-argument", "Unsupported one-time Stripe price ID.");
    }

    if (ACTIVE_SUBSCRIPTION_PRICE_IDS.includes(priceId)) return;

    throw new HttpsError(
        "failed-precondition",
        "This subscription price is not configured in the active CareerVivid catalog. Create the Stripe Price and set the matching STRIPE_PRICE_* environment variable."
    );
}

function normalizeCheckoutQuantity(
    quantity: unknown,
    priceId: string,
    mode: Stripe.Checkout.SessionCreateParams.Mode
) {
    const requestedQuantity = Math.floor(Number(quantity || 1));
    const safeQuantity = Number.isFinite(requestedQuantity) && requestedQuantity > 0 ? requestedQuantity : 1;

    if (mode === "subscription" && priceId === PRICE_IDS.ENTERPRISE_MONTHLY) {
        return Math.max(ENTERPRISE_MINIMUM_SEATS, safeQuantity);
    }

    return safeQuantity;
}

// One visible "Download Once" purchase gets backend retry allowance for failed exports.
const PDF_DOWNLOAD_CREDITS_PER_PURCHASE = 3;

/**
 * Creates a Stripe checkout session for purchasing a plan
 */
export const createCheckoutSession = onCall(
    {
        secrets: [stripeSecretKey],
        region: "us-west1",
        memory: "512MiB",
    },
    async (request) => {
        // Verify authentication
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        const { priceId, successUrl, cancelUrl, quantity, metadata, mode: requestedMode } = request.data;

        if (!priceId || !successUrl || !cancelUrl) {
            throw new HttpsError(
                "invalid-argument",
                "Missing required parameters: priceId, successUrl, cancelUrl"
            );
        }

        try {
            const stripe = new Stripe(stripeSecretKey.value(), {
                apiVersion: "2026-02-25.clover",
            });

            const userId = request.auth.uid;
            const userEmail = request.auth.token.email || undefined;

            // Get or create Stripe customer
            const userDoc = await admin.firestore().collection("users").doc(userId).get();
            let stripeCustomerId = userDoc.data()?.stripeCustomerId;

            if (!stripeCustomerId) {
                const customer = await stripe.customers.create({
                    email: userEmail,
                    metadata: {
                        firebaseUID: userId,
                    },
                });
                stripeCustomerId = customer.id;

                // Save customer ID to Firestore
                await admin.firestore().collection("users").doc(userId).set(
                    { stripeCustomerId: stripeCustomerId },
                    { merge: true }
                );
            }

            // Determine mode: use requested mode if provided, otherwise check if price is one-time
            const mode: Stripe.Checkout.SessionCreateParams.Mode =
                requestedMode === 'payment' || ONE_TIME_PRICE_IDS.includes(priceId) ? "payment" : "subscription";
            assertCheckoutPriceAllowed(priceId, mode);
            const checkoutQuantity = normalizeCheckoutQuantity(quantity, priceId, mode);
            const checkoutMetadata = {
                userId: userId,
                priceId: priceId,
                ...metadata,
                ...(priceId === PRICE_IDS.ENTERPRISE_MONTHLY ? { seats: String(checkoutQuantity) } : {}),
            };

            try {
                // Create checkout session
                const session = await stripe.checkout.sessions.create({
                    customer: stripeCustomerId,
                    mode: mode,
                    line_items: [{ price: priceId, quantity: checkoutQuantity }],
                    success_url: successUrl,
                    cancel_url: cancelUrl,
                    metadata: checkoutMetadata,
                });

                return { url: session.url, sessionId: session.id };
            } catch (error: any) {
                // Handle "No such customer" error (e.g. from environment switch)
                if (error.code === 'resource_missing' && error.param === 'customer') {
                    console.warn(`Customer ${stripeCustomerId} not found in Stripe. Creating new customer...`);

                    const newCustomer = await stripe.customers.create({
                        email: userEmail,
                        metadata: { firebaseUID: userId },
                    });
                    const newCustomerId = newCustomer.id;

                    await admin.firestore().collection("users").doc(userId).set(
                        { stripeCustomerId: newCustomerId },
                        { merge: true }
                    );

                    // Retry with new customer ID
                    const session = await stripe.checkout.sessions.create({
                        customer: newCustomerId,
                        mode: mode,
                        line_items: [{ price: priceId, quantity: checkoutQuantity }],
                        success_url: successUrl,
                        cancel_url: cancelUrl,
                        metadata: checkoutMetadata,
                    });

                    return { url: session.url, sessionId: session.id };
                }
                throw error;
            }
        } catch (error: any) {
            console.error("Error creating checkout session:", error);
            throw new HttpsError("internal", `Failed to create checkout session: ${error.message}`);
        }
    }
);

/**
 * Handles Stripe webhook events
 */
export const stripeWebhook = onRequest(
    {
        secrets: [stripeSecretKey, stripeWebhookSecret],
        region: "us-west1",
        memory: "512MiB",
    },
    async (req, res) => {
        const stripe = new Stripe(stripeSecretKey.value(), {
            apiVersion: "2026-02-25.clover",
        });

        // Verify webhook signature
        const sig = req.headers["stripe-signature"];
        if (!sig) {
            console.error("No stripe-signature header");
            res.status(400).send("Missing stripe-signature header");
            return;
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(
                req.rawBody,
                sig,
                stripeWebhookSecret.value()
            );
        } catch (err: any) {
            console.error("Webhook signature verification failed:", err.message);
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }

        // Handle the event
        try {
            switch (event.type) {
                case "checkout.session.completed": {
                    const session = event.data.object as Stripe.Checkout.Session;
                    await handleCheckoutCompleted(session);
                    break;
                }

                case "customer.subscription.updated": {
                    const subscription = event.data.object as Stripe.Subscription;
                    await handleSubscriptionUpdated(subscription);
                    break;
                }

                case "customer.subscription.deleted": {
                    const subscription = event.data.object as Stripe.Subscription;
                    await handleSubscriptionDeleted(subscription);
                    break;
                }

                case "invoice.paid": {
                    const invoice = event.data.object as Stripe.Invoice;
                    await handleInvoicePaid(invoice);
                    break;
                }

                case "invoice.payment_failed": {
                    const invoice = event.data.object as Stripe.Invoice;
                    await handleInvoicePaymentFailed(invoice);
                    break;
                }

                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }

            res.json({ received: true });
        } catch (error: any) {
            console.error("Error processing webhook:", error);
            res.status(500).send(`Webhook processing error: ${error.message}`);
        }
    }
);

async function grantPdfDownloadCreditForCheckoutSession(
    session: Stripe.Checkout.Session,
    userId: string,
    source: "webhook" | "return_verification"
): Promise<{ credited: boolean; downloadCredits: number }> {
    const priceId = session.metadata?.priceId;

    if (!priceId || !DOWNLOAD_ONCE_PRICE_IDS.includes(priceId as any)) {
        throw new HttpsError("invalid-argument", "Checkout session is not for a PDF download credit.");
    }

    if (session.payment_status !== "paid") {
        throw new HttpsError("failed-precondition", "Checkout session has not been paid.");
    }

    const db = admin.firestore();
    const userRef = db.collection("users").doc(userId);
    const processedRef = db.collection("stripeProcessedCheckoutSessions").doc(session.id);
    const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id || null;
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null;
    let credited = false;
    let downloadCredits = 0;

    await db.runTransaction(async (transaction) => {
        const [processedDoc, userDoc] = await Promise.all([
            transaction.get(processedRef),
            transaction.get(userRef),
        ]);
        const currentCredits = Number(userDoc.data()?.downloadCredits || 0);

        if (processedDoc.exists) {
            downloadCredits = currentCredits;
            return;
        }

        downloadCredits = currentCredits + PDF_DOWNLOAD_CREDITS_PER_PURCHASE;
        credited = true;

        transaction.set(userRef, {
            downloadCredits: admin.firestore.FieldValue.increment(PDF_DOWNLOAD_CREDITS_PER_PURCHASE),
            stripeCustomerId: stripeCustomerId || userDoc.data()?.stripeCustomerId || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        transaction.set(processedRef, {
            sessionId: session.id,
            userId,
            priceId,
            purchaseType: "pdf_download_credit",
            creditsGranted: PDF_DOWNLOAD_CREDITS_PER_PURCHASE,
            customer: stripeCustomerId,
            paymentIntent: paymentIntentId,
            source,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });

    return { credited, downloadCredits };
}

export const verifyPdfCreditCheckout = onCall(
    {
        secrets: [stripeSecretKey],
        region: "us-west1",
        memory: "512MiB",
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        const sessionId = String(request.data?.sessionId || "");
        if (!sessionId.startsWith("cs_")) {
            throw new HttpsError("invalid-argument", "Missing or invalid checkout session ID.");
        }

        const stripe = new Stripe(stripeSecretKey.value(), {
            apiVersion: "2026-02-25.clover",
        });

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const sessionUserId = session.metadata?.userId;

        if (sessionUserId !== request.auth.uid) {
            throw new HttpsError("permission-denied", "Checkout session does not belong to this user.");
        }

        return grantPdfDownloadCreditForCheckoutSession(session, request.auth.uid, "return_verification");
    }
);

/**
 * Cancels a user's subscription at the end of the current billing period
 */
export const cancelSubscription = onCall(
    {
        secrets: [stripeSecretKey],
        region: "us-west1",
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        const userId = request.auth.uid;
        const { cancellationReason, feedbackText } = request.data; // Capture feedback

        try {
            const userDoc = await admin.firestore().collection("users").doc(userId).get();
            const userData = userDoc.data();
            let stripeSubscriptionId = userData?.stripeSubscriptionId;
            const stripeCustomerId = userData?.stripeCustomerId;

            // Log Feedback if provided
            if (cancellationReason) {
                try {
                    const feedbackMessage = {
                        subject: `Subscription Cancelled: ${cancellationReason}`,
                        name: userData?.displayName || userData?.email || `User ${userId}`,
                        email: userData?.email || 'unknown@user.com',
                        message: feedbackText || `Reason: ${cancellationReason} (No additional details provided)`,
                        status: 'unread',
                        timestamp: admin.firestore.FieldValue.serverTimestamp(),
                        type: 'cancellation_feedback',
                        userId: userId
                    };
                    await admin.firestore().collection("contact_messages").add(feedbackMessage);
                } catch (logError) {
                    console.error("Failed to log cancellation feedback:", logError);
                    // Don't block cancellation if logging fails
                }
            }

            const stripe = new Stripe(stripeSecretKey.value(), {
                apiVersion: "2026-02-25.clover",
            });

            // Fallback: If no subscription ID but we have a customer ID, try to find it from Stripe
            if (!stripeSubscriptionId && stripeCustomerId) {
                console.log(`No subscription ID for user ${userId}, searching via customer ${stripeCustomerId}...`);
                const subscriptions = await stripe.subscriptions.list({
                    customer: stripeCustomerId,
                    status: 'active',
                    limit: 1
                });

                if (subscriptions.data.length > 0) {
                    stripeSubscriptionId = subscriptions.data[0].id;
                    console.log(`Found active subscription ${stripeSubscriptionId} for user ${userId}`);

                    // Self-repair: Save this ID back to Firestore
                    await admin.firestore().collection("users").doc(userId).update({
                        stripeSubscriptionId: stripeSubscriptionId
                    });
                }
            }

            if (!stripeSubscriptionId) {
                // If still no ID, we really can't cancel anything.
                // But if the user THINKS they are active (in Firestore), we should fix their state 
                // so they aren't stuck in "Active" limbo forever.
                if (userData?.subscriptionStatus === 'active') {
                    console.warn(`User ${userId} has 'active' status but no Stripe subscription found. Resetting to free.`);
                    await admin.firestore().collection("users").doc(userId).update({
                        subscriptionStatus: 'canceled',
                        plan: 'free',
                        resumeLimit: 1,
                        promotions: { isPremium: false }
                    });
                    return { status: "fixed_state", message: "Subscription not found in Stripe. local status updated." };
                }

                throw new HttpsError("not-found", "No active subscription found to cancel.");
            }

            // Update subscription to cancel at period end
            const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
                cancel_at_period_end: true,
            });

            // Update Firestore immediately to reflect key status
            await admin.firestore().collection("users").doc(userId).set(
                {
                    subscriptionStatus: "active_canceling", // Indicates active but will cancel
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

            // Send cancellation confirmation email with win-back CTA
            const cancelDate = subscription.cancel_at
                ? new Date(subscription.cancel_at * 1000).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric"
                })
                : "your next billing date";

            await sendCancellationConfirmationEmail(
                userData?.email,
                userData?.displayName || "there",
                cancelDate
            );

            return {
                status: "success",
                cancelAt: subscription.cancel_at
            };
        } catch (error: any) {
            console.error("Error canceling subscription:", error);
            throw new HttpsError("internal", `Failed to cancel subscription: ${error.message}`);
        }
    }
);

/**
 * Applies a retention discount to an active subscription
 */
export const applyDiscount = onCall(
    {
        secrets: [stripeSecretKey],
        region: "us-west1",
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        const { discountType } = request.data;
        if (!['RETENTION_10', 'RETENTION_20'].includes(discountType)) {
            throw new HttpsError("invalid-argument", "Invalid discount type");
        }

        const userId = request.auth.uid;
        const stripe = new Stripe(stripeSecretKey.value(), {
            apiVersion: "2026-02-25.clover",
        });

        try {
            const userDoc = await admin.firestore().collection("users").doc(userId).get();
            const userData = userDoc.data();
            let stripeSubscriptionId = userData?.stripeSubscriptionId;

            // Fallback logic from cancelSubscription
            if (!stripeSubscriptionId && userData?.stripeCustomerId) {
                const subscriptions = await stripe.subscriptions.list({
                    customer: userData.stripeCustomerId,
                    status: 'active',
                    limit: 1
                });
                if (subscriptions.data.length > 0) {
                    stripeSubscriptionId = subscriptions.data[0].id;
                }
            }

            if (!stripeSubscriptionId) {
                throw new HttpsError("not-found", "No active subscription found to apply discount.");
            }

            // Ensure Coupon Exists
            const couponId = discountType === 'RETENTION_10' ? 'RETENTION_10_OFF_3_MONTHS' : 'RETENTION_20_OFF_3_MONTHS';
            const percentOff = discountType === 'RETENTION_10' ? 10 : 20;

            try {
                await stripe.coupons.retrieve(couponId);
            } catch (err) {
                // Create if missing
                await stripe.coupons.create({
                    id: couponId,
                    percent_off: percentOff,
                    duration: 'repeating',
                    duration_in_months: 3,
                    name: `${percentOff}% Off Retention Offer`
                });
            }

            // Apply to Subscription (using modern discounts array)
            // CRITICAL: We must also set cancel_at_period_end: false to ensure we UN-CANCEL if they were previously cancelling
            await stripe.subscriptions.update(stripeSubscriptionId, {
                discounts: [{ coupon: couponId }],
                cancel_at_period_end: false,
            });

            // Log it
            await admin.firestore().collection("users").doc(userId).collection("activity_logs").add({
                action: 'retention_discount_applied',
                discountType,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            // Ensure user status is active (in case they were active_canceling)
            await admin.firestore().collection("users").doc(userId).set({
                subscriptionStatus: 'active',
                promotions: { isPremium: true },
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            return { status: "success", message: `Applied ${percentOff}% discount.` };

        } catch (error: any) {
            console.error("Error applying discount:", error);

            // Handle "No such customer" or "No such subscription"
            if (error.code === 'resource_missing') {
                console.warn(`Stripe resource missing for user ${userId}. Resetting to free.`);
                await admin.firestore().collection("users").doc(userId).update({
                    subscriptionStatus: 'canceled',
                    plan: 'free',
                    resumeLimit: 1,
                    promotions: { isPremium: false }
                });
                return { status: "fixed_state", message: "Subscription not found in Stripe. Local status updated to Free." };
            }

            throw new HttpsError("internal", `Failed to apply discount: ${error.message}`);
        }
    }
);

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const priceId = session.metadata?.priceId;

    if (!userId) {
        console.error("No userId in session metadata");
        return;
    }

    const userRef = admin.firestore().collection("users").doc(userId);

    try {
        if (priceId && DOWNLOAD_ONCE_PRICE_IDS.includes(priceId as any)) {
            const result = await grantPdfDownloadCreditForCheckoutSession(session, userId, "webhook");
            console.log(
                result.credited
                    ? `Download credit added for user ${userId}`
                    : `Download credit already processed for session ${session.id}`
            );
        } else if (priceId === PRICE_IDS.SPRINT) {
            // One-time Sprint purchase
            const expiresAt = admin.firestore.Timestamp.fromMillis(
                Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
            );

            await userRef.set(
                {
                    plan: "pro_sprint",
                    resumeLimit: 9999,
                    expiresAt: expiresAt,
                    stripeCustomerId: session.customer,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    promotions: {
                        isPremium: true,
                    },
                },
                { merge: true }
            );

            console.log(`Sprint plan activated for user ${userId}, expires at ${expiresAt.toDate()}`);
        } else {
            const subscriptionPrice = resolveSubscriptionPrice(priceId);

            if (!subscriptionPrice) {
                console.warn(`Ignoring checkout session ${session.id} for unrecognized subscription price ${priceId}`);
                return;
            }

            const seats = subscriptionPrice.plan === "enterprise"
                ? normalizeCheckoutQuantity(session.metadata?.seats, PRICE_IDS.ENTERPRISE_MONTHLY, "subscription")
                : null;

            // Subscription activated
            await userRef.set(
                {
                    plan: subscriptionPrice.plan,
                    ...(seats ? { seats } : {}),
                    resumeLimit: 9999, // Legacy unrestricted resumes (credits handle AI logic)
                    subscriptionStatus: "active",
                    stripeCustomerId: session.customer,
                    stripeSubscriptionId: session.subscription,
                    stripePriceId: priceId,
                    billingInterval: subscriptionPrice.billingInterval,
                    subscriptionCatalogVersion: subscriptionPrice.legacy ? "legacy" : "2026-06-06",
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    promotions: {
                        isPremium: true,
                    },
                },
                { merge: true }
            );

            console.log(`${subscriptionPrice.plan} subscription activated for user ${userId}`);
        }
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        throw error;
    }
}

/**
 * Handle subscription updates (e.g., renewed, downgraded, etc.)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Find user by Stripe customer ID
    const usersSnapshot = await admin
        .firestore()
        .collection("users")
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();

    if (usersSnapshot.empty) {
        console.error(`No user found for customer ${customerId}`);
        return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    const status = subscription.status;
    let firestoreStatus: string = status;
    const subscriptionPriceId = subscription.items.data[0]?.price?.id;
    const subscriptionPrice = resolveSubscriptionPrice(subscriptionPriceId);

    // If subscription is active but scheduled to cancel, mark as 'active_canceling'
    if (status === 'active' && subscription.cancel_at_period_end) {
        firestoreStatus = 'active_canceling';
    }

    const isPremium = status === "active" || status === "trialing";

    const updateData: admin.firestore.UpdateData<admin.firestore.DocumentData> = {
        subscriptionStatus: firestoreStatus as any,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscriptionPriceId || null,
        promotions: {
            isPremium: isPremium,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (subscriptionPrice) {
        updateData.plan = subscriptionPrice.plan;
        updateData.billingInterval = subscriptionPrice.billingInterval;
        updateData.subscriptionCatalogVersion = subscriptionPrice.legacy ? "legacy" : "2026-06-06";
        updateData.resumeLimit = isPremium ? 9999 : 1;

        if (subscriptionPrice.plan === "enterprise") {
            updateData.seats = normalizeCheckoutQuantity(
                subscription.items.data[0]?.quantity,
                PRICE_IDS.ENTERPRISE_MONTHLY,
                "subscription"
            );
        }
    }

    await userDoc.ref.set(updateData, { merge: true });

    console.log(`Subscription updated for user ${userId}: ${firestoreStatus} (Stripe: ${status})`);
}

/**
 * Handle subscription cancellation/deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Find user by Stripe customer ID
    const usersSnapshot = await admin
        .firestore()
        .collection("users")
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();

    if (usersSnapshot.empty) {
        console.error(`No user found for customer ${customerId}`);
        return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    await userDoc.ref.set(
        {
            subscriptionStatus: "canceled",
            resumeLimit: 1, // Revert to free tier
            plan: "free",
            promotions: {
                isPremium: false,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
    );

    console.log(`Subscription canceled for user ${userId}, reverted to free tier`);
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    // Find user by Stripe customer ID
    const usersSnapshot = await admin
        .firestore()
        .collection("users")
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();

    if (usersSnapshot.empty) {
        console.error(`No user found for customer ${customerId}`);
        return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Send invoice email
    await sendInvoiceEmail(
        userData.email,
        userData.displayName || "Valued Customer",
        invoice
    );

    console.log(`Invoice ${invoice.id} paid and email sent to user ${userDoc.id}`);
}

/**
 * Handle failed invoice payment
 * Revokes premium access and notifies user
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    // Find user by Stripe customer ID
    const usersSnapshot = await admin
        .firestore()
        .collection("users")
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();

    if (usersSnapshot.empty) {
        console.error(`No user found for customer ${customerId}`);
        return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // CRITICAL: Revoke premium access immediately
    await userDoc.ref.set({
        subscriptionStatus: "payment_failed",
        promotions: { isPremium: false },
        paymentFailedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`Premium access revoked for user ${userDoc.id} due to payment failure`);

    // Send payment failed notification with update payment link
    await sendPaymentFailedEmail(
        userData.email,
        userData.displayName || "Valued Customer",
        invoice
    );

    console.log(`Payment failed email sent to user ${userDoc.id}`);
}

/**
 * Send invoice email using Firestore mail collection
 */
async function sendInvoiceEmail(
    userEmail: string,
    userName: string,
    invoice: Stripe.Invoice
) {
    const mailRef = admin.firestore().collection("mail").doc();

    const invoiceNumber = invoice.number || invoice.id;
    const amount = (invoice.amount_paid / 100).toFixed(2);
    const date = new Date(invoice.created * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const planName = getPlanName(invoice);
    const invoiceUrl = invoice.invoice_pdf || invoice.hosted_invoice_url || "#";

    await mailRef.set({
        to: userEmail,
        message: {
            subject: `Payment Received - Invoice #${invoiceNumber}`,
            html: generateInvoiceEmailHTML(userName, invoiceNumber, amount, date, planName, invoiceUrl),
            text: generateInvoiceEmailText(userName, invoiceNumber, amount, date, planName, invoiceUrl),
        },
    });

    console.log(`Invoice email queued for ${userEmail}`);
}

/**
 * Send payment failed email
 */
async function sendPaymentFailedEmail(
    userEmail: string,
    userName: string,
    invoice: Stripe.Invoice
) {
    const mailRef = admin.firestore().collection("mail").doc();

    const invoiceNumber = invoice.number || invoice.id;
    const amount = (invoice.amount_due / 100).toFixed(2);
    const invoiceUrl = invoice.hosted_invoice_url || "#";

    await mailRef.set({
        to: userEmail,
        message: {
            subject: `Payment Failed - Action Required`,
            html: generatePaymentFailedEmailHTML(userName, invoiceNumber, amount, invoiceUrl),
            text: generatePaymentFailedEmailText(userName, invoiceNumber, amount, invoiceUrl),
        },
    });

    console.log(`Payment failed email queued for ${userEmail}`);
}

/**
 * Send cancellation confirmation email with win-back CTA
 */
async function sendCancellationConfirmationEmail(
    userEmail: string,
    userName: string,
    accessEndDate: string
): Promise<void> {
    const mailRef = admin.firestore().collection("mail").doc();
    const APP_URL = "https://careervivid.app";

    const emailHtml = generateCareerVividEmail({
        title: "Your subscription is canceled",
        userName: userName,
        eyebrow: "Subscription notice",
        preheader: `Your premium access remains active until ${accessEndDate}.`,
        messageLines: [
            "Your subscription cancellation has been confirmed.",
            "You can keep using premium features until the access end date below. After that, your account will move back to the free plan."
        ],
        boxContent: {
            title: "Access details",
            type: "warning",
            lines: [
                "<strong>Your premium access will remain active until:</strong>",
                `<span style="font-size: 18px; font-weight: bold;">${accessEndDate}</span>`,
                "You can resubscribe any time if you want to restore premium access later."
            ]
        },
        mainButton: {
            text: "View plans",
            url: `${APP_URL}/subscription`
        },
        footerText: "You can continue using CareerVivid on the free plan after premium access ends."
    });

    await mailRef.set({
        to: userEmail,
        message: {
            subject: `Your subscription has been canceled`,
            html: emailHtml,
            text: `Hi ${userName},\n\nYour subscription cancellation has been confirmed.\n\nYour premium access will remain active until: ${accessEndDate}\n\nAfter this date, your account will revert to the free plan.\n\nChanged your mind? Resubscribe at: ${APP_URL}/subscription\n\nThank you for being a part of CareerVivid.\n\nThe CareerVivid Team`
        },
    });

    console.log(`Cancellation confirmation email queued for ${userEmail}`);
}

/**
 * Get plan name from invoice
 */
function getPlanName(invoice: Stripe.Invoice): string {
    const lineItem = invoice.lines.data[0];
    if (lineItem?.description) {
        return lineItem.description;
    }
    // Access price as any since Stripe types don't include it properly
    const price = (lineItem as any)?.price;
    if (price?.nickname) {
        return price.nickname;
    }
    return "Premium Plan";
}

/**
 * Generate HTML email for invoice paid
 */
function generateInvoiceEmailHTML(
    userName: string,
    invoiceNumber: string,
    amount: string,
    date: string,
    planName: string,
    invoiceUrl: string
): string {
    return generateCareerVividEmail({
        title: "Payment received",
        userName,
        eyebrow: "Receipt",
        preheader: `Your CareerVivid invoice ${invoiceNumber} has been paid.`,
        messageLines: [
            "Thank you. Your payment was received and your CareerVivid account has been updated.",
            "You can download the invoice for your records from the link below."
        ],
        boxContent: {
            title: "Invoice details",
            type: "success",
            lines: [
                `<strong>Invoice number:</strong> ${invoiceNumber}`,
                `<strong>Amount paid:</strong> $${amount}`,
                `<strong>Payment date:</strong> ${date}`,
                `<strong>Plan:</strong> ${planName}`
            ]
        },
        mainButton: {
            text: "Download invoice",
            url: invoiceUrl
        },
        footerText: "This is an automated billing receipt from CareerVivid."
    });
}

/**
 * Generate text email for invoice paid
 */
function generateInvoiceEmailText(
    userName: string,
    invoiceNumber: string,
    amount: string,
    date: string,
    planName: string,
    invoiceUrl: string
): string {
    return `
Payment Received

Hello ${userName},

Thank you for your payment! Your invoice has been paid successfully and your account has been updated.

Invoice Details:
- Invoice Number: ${invoiceNumber}
- Amount Paid: $${amount}
- Payment Date: ${date}
- Plan: ${planName}

Download your invoice: ${invoiceUrl}

If you have any questions about your invoice or payment, please don't hesitate to contact our support team.

Best regards,
The CareerVivid Team

---
This is an automated message from CareerVivid
Contact us at support@careervivid.app
    `;
}

/**
 * Generate HTML email for payment failed
 */
function generatePaymentFailedEmailHTML(
    userName: string,
    invoiceNumber: string,
    amount: string,
    invoiceUrl: string
): string {
    const APP_URL = "https://careervivid.app";

    return generateCareerVividEmail({
        title: "Payment needs attention",
        userName: userName,
        eyebrow: "Billing issue",
        preheader: "We could not process your recent CareerVivid payment.",
        messageLines: [
            "We were unable to process your payment for the following invoice.",
            "<strong>Your premium access has been temporarily paused.</strong>"
        ],
        boxContent: {
            title: "Invoice details",
            type: "critical",
            lines: [
                `<strong>Invoice number:</strong> ${invoiceNumber}`,
                `<strong>Amount due:</strong> $${amount}`,
                `<strong>Status:</strong> Payment failed`
            ]
        },
        mainButton: {
            text: "Update payment method",
            url: invoiceUrl
        },
        secondaryButton: {
            text: "View plans",
            url: `${APP_URL}/subscription`
        },
        footerText: "Contact support@careervivid.app if you believe this notice is incorrect."
    });
}

/**
 * Generate text email for payment failed
 */
function generatePaymentFailedEmailText(
    userName: string,
    invoiceNumber: string,
    amount: string,
    invoiceUrl: string
): string {
    return `
Payment Failed - Action Required

Hello ${userName},

We were unable to process your payment for the following invoice. Please update your payment method to avoid service interruption.

Action Required:
- Invoice Number: ${invoiceNumber}
- Amount Due: $${amount}
- Status: Payment Failed

What to do next:
1. Update your payment method in your account settings
2. Ensure your card has sufficient funds
3. Check that your billing information is correct

Update payment method: ${invoiceUrl}

If you continue to experience issues, please contact our support team for assistance.

Best regards,
The CareerVivid Team

---
This is an automated message from CareerVivid
Contact us at support@careervivid.app
    `;
}

/**
 * Fetches financial metrics from Stripe for the Strategy Dashboard
 * Calculates MRR, Churn Rate, and Average LTV
 */
export const getFinancialMetrics = onCall(
    {
        secrets: [stripeSecretKey],
        region: "us-west1",
    },
    async (request) => {
        // Verify authentication
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        try {
            const stripe = new Stripe(stripeSecretKey.value(), {
                apiVersion: "2026-02-25.clover",
            });

            // 1. Calculate Monthly Recurring Revenue (MRR)
            const activeSubs = await stripe.subscriptions.list({
                status: 'active',
                limit: 100,
                expand: ['data.plan']
            });

            let mrr = 0;
            let activeSubscriberCount = 0;

            activeSubs.data.forEach(sub => {
                const price = sub.items.data[0].price;
                if (price.unit_amount && (price.recurring?.interval === 'month' || price.recurring?.interval === 'year')) {
                    let monthlyAmount = price.unit_amount;
                    if (price.recurring.interval === 'year') {
                        monthlyAmount = Math.round(monthlyAmount / 12);
                    }
                    mrr += monthlyAmount;
                    activeSubscriberCount++;
                }
            });

            // 2. Calculate Churn Rate
            const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
            const canceledSubs = await stripe.subscriptions.list({
                status: 'canceled',
                created: { gte: thirtyDaysAgo },
                limit: 100
            });

            const canceledCount = canceledSubs.data.length;
            const totalConsidered = activeSubscriberCount + canceledCount;
            const churnRate = totalConsidered > 0
                ? ((canceledCount / totalConsidered) * 100).toFixed(1)
                : "0.0";

            // 3. Estimate LTV
            const arpu = activeSubscriberCount > 0 ? mrr / activeSubscriberCount : 0;
            let ltv = 0;
            const churnDecimal = parseFloat(churnRate) / 100;

            if (churnDecimal > 0) {
                ltv = arpu / churnDecimal;
            } else {
                ltv = arpu * 12;
            }

            return {
                activeRevenue: (mrr / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                churn: `${churnRate}%`,
                ltv: (ltv / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                subscriberCount: activeSubscriberCount
            };

        } catch (error: any) {
            console.error("Error fetching financial metrics:", error);
            throw new HttpsError("internal", `Failed to fetch financial metrics: ${error.message}`);
        }
    }
);
