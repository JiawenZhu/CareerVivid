import { onRequest } from "firebase-functions/v2/https";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import Stripe from "stripe";
import * as admin from "firebase-admin";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// Price IDs for the different plans
const PRICE_IDS = {
    SPRINT: "price_1ScLNsRJNflGxv32cvu6cTsK", // The 7-Day Sprint - One-time
    MONTHLY: "price_1ScLOaRJNflGxv32BwQnSBs0", // Pro Monthly - Subscription
    DOWNLOAD_ONCE: "price_1ScLPERJNflGxv32Wxtpvg62", // Download Once - $1.99
    NFC_CUSTOM: "price_1So67jRJNflGxv32TKsC7AbX", // Custom NFC Card - $12.90
    NFC_STANDARD: "price_1So6AtRJNflGxv32qHMPnhwz", // Standard NFC Card - $9.89
} as const;

// One-time payment price IDs
const ONE_TIME_PRICE_IDS = [
    PRICE_IDS.SPRINT,
    PRICE_IDS.DOWNLOAD_ONCE,
    PRICE_IDS.NFC_CUSTOM,
    PRICE_IDS.NFC_STANDARD,
];

/**
 * Creates a Stripe checkout session for purchasing a plan
 */
export const createCheckoutSession = onCall(
    {
        secrets: [stripeSecretKey],
        region: "us-west1",
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
                apiVersion: "2025-11-17.clover",
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

            try {
                // Create checkout session
                const session = await stripe.checkout.sessions.create({
                    customer: stripeCustomerId,
                    mode: mode,
                    line_items: [{ price: priceId, quantity: quantity || 1 }],
                    success_url: successUrl,
                    cancel_url: cancelUrl,
                    metadata: { userId: userId, priceId: priceId, ...metadata },
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
                        line_items: [{ price: priceId, quantity: quantity || 1 }],
                        success_url: successUrl,
                        cancel_url: cancelUrl,
                        metadata: { userId: userId, priceId: priceId, ...metadata },
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
    },
    async (req, res) => {
        const stripe = new Stripe(stripeSecretKey.value(), {
            apiVersion: "2025-11-17.clover",
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
                apiVersion: "2025-11-17.clover",
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
                        resumeLimit: 2,
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
            apiVersion: "2025-11-17.clover",
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
                    resumeLimit: 2,
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
        if (priceId === PRICE_IDS.DOWNLOAD_ONCE) {
            // Download Once purchase - increment download credits
            await userRef.set(
                {
                    downloadCredits: admin.firestore.FieldValue.increment(1),
                    stripeCustomerId: session.customer,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );
            console.log(`Download credit added for user ${userId}`);
        } else if (priceId === PRICE_IDS.SPRINT) {
            // One-time Sprint purchase
            const expiresAt = admin.firestore.Timestamp.fromMillis(
                Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
            );

            await userRef.set(
                {
                    plan: "pro_sprint",
                    resumeLimit: 8,
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
        } else if (priceId === PRICE_IDS.MONTHLY) {
            // Monthly subscription
            await userRef.set(
                {
                    plan: "pro_monthly",
                    resumeLimit: 15,
                    subscriptionStatus: "active",
                    stripeCustomerId: session.customer,
                    stripeSubscriptionId: session.subscription,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    promotions: {
                        isPremium: true,
                    },
                },
                { merge: true }
            );

            console.log(`Monthly subscription activated for user ${userId}`);
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

    // If subscription is active but scheduled to cancel, mark as 'active_canceling'
    if (status === 'active' && subscription.cancel_at_period_end) {
        firestoreStatus = 'active_canceling';
    }

    const isPremium = status === "active" || status === "trialing";

    await userDoc.ref.set(
        {
            subscriptionStatus: firestoreStatus as any,
            promotions: {
                isPremium: isPremium,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
    );

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
            resumeLimit: 2, // Revert to free tier
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
import { generateNeoBrutalistEmail } from "./emailTemplates";

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

    const emailHtml = generateNeoBrutalistEmail({
        title: "Subscription Canceled",
        userName: userName,
        messageLines: [
            "We're sorry to see you go. Your subscription cancellation has been confirmed."
        ],
        boxContent: {
            title: "Access Details",
            type: "warning", // Yellow box
            lines: [
                "<strong>Your premium access will remain active until:</strong>",
                `<span style="font-size: 18px; font-weight: bold;">${accessEndDate}</span>`,
                "After this date, your account will revert to the free plan."
            ]
        },
        mainButton: {
            text: "Resubscribe Now",
            url: `${APP_URL}/subscription`
        },
        footerText: "We'd love to have you back!"
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
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 40px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .content p { margin: 0 0 16px 0; font-size: 16px; }
        .invoice-details { background: #f8f9fa; padding: 24px; margin: 24px 0; border-radius: 8px; border-left: 4px solid #6366f1; }
        .invoice-details h3 { margin: 0 0 16px 0; font-size: 18px; color: #1f2937; }
        .invoice-details p { margin: 8px 0; font-size: 15px; }
        .invoice-details strong { color: #1f2937; font-weight: 600; }
        .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .button:hover { opacity: 0.9; }
        .footer { text-align: center; padding: 30px 20px; color: #6b7280; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
        .footer p { margin: 8px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✓ Payment Received</h1>
        </div>
        <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Thank you for your payment! Your invoice has been paid successfully and your account has been updated.</p>
            
            <div class="invoice-details">
                <h3>Invoice Details</h3>
                <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                <p><strong>Amount Paid:</strong> $${amount}</p>
                <p><strong>Payment Date:</strong> ${date}</p>
                <p><strong>Plan:</strong> ${planName}</p>
            </div>
            
            <p>You can download your invoice using the button below:</p>
            <div style="text-align: center;">
                <a href="${invoiceUrl}" class="button">Download Invoice</a>
            </div>
            
            <p style="margin-top: 30px;">If you have any questions about your invoice or payment, please don't hesitate to contact our support team.</p>
            
            <p style="margin-top: 20px;">Best regards,<br><strong>The CareerVivid Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated message from CareerVivid</p>
            <p>If you have any questions, contact us at <a href="mailto:support@careervivid.app" style="color: #6366f1;">support@careervivid.app</a></p>
        </div>
    </div>
</body>
</html>
    `;
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

    return generateNeoBrutalistEmail({
        title: "Payment Failed",
        userName: userName,
        messageLines: [
            "We were unable to process your payment for the following invoice.",
            "<strong>⚠️ Your premium access has been temporarily paused.</strong>"
        ],
        boxContent: {
            title: "Action Required",
            type: "critical",
            lines: [
                `<strong>Invoice Number:</strong> ${invoiceNumber}`,
                `<strong>Amount Due:</strong> $${amount}`,
                `<strong>Status:</strong> Payment Failed`
            ]
        },
        mainButton: {
            text: "Update Payment Method",
            url: invoiceUrl
        },
        secondaryButton: {
            text: "Resubscribe",
            url: `${APP_URL}/subscription`
        },
        footerText: "Please update your payment method to restore access."
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
                apiVersion: "2025-11-17.clover",
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
