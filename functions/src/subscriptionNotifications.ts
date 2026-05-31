/**
 * Subscription Lifecycle Notification System
 * 
 * Daily cron job that sends proactive emails for:
 * - Scenario A: Upcoming Payment (active, auto-renewing)
 * - Scenario B: Subscription Expiring (active, canceling)
 * - Scenario C: Trial Ending (trialing) - Visa/Mastercard Compliance
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import Stripe from "stripe";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const db = admin.firestore();

// Constants
const DAYS_BEFORE_NOTIFICATION = 3;
const APP_URL = "https://careervivid.app";

/**
 * Daily scheduled function to send subscription lifecycle emails
 * Runs at 09:00 UTC every day
 */
export const sendSubscriptionNotifications = onSchedule({
    schedule: "0 9 * * *", // 09:00 UTC daily
    timeZone: "UTC",
    secrets: [stripeSecretKey],
    timeoutSeconds: 540,
    memory: "512MiB",
    region: "us-west1"
}, async (event) => {
    console.log("[SubscriptionNotifications] Starting daily subscription check...");

    const stripe = new Stripe(stripeSecretKey.value(), {
        apiVersion: "2026-02-25.clover",
    });

    try {
        // Query users with active Stripe subscriptions
        const usersSnapshot = await db.collection("users")
            .where("stripeSubscriptionId", "!=", null)
            .get();

        console.log(`[SubscriptionNotifications] Found ${usersSnapshot.size} users with subscriptions`);

        let emailsSent = { upcomingPayment: 0, expiring: 0, trialEnding: 0 };

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const subscriptionId = userData.stripeSubscriptionId;

            if (!subscriptionId) continue;

            try {
                // Fetch live subscription data from Stripe
                // Cast to any due to Stripe SDK v20 type misalignment - API properties exist at runtime
                const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

                // Skip if not active or trialing
                if (!["active", "trialing"].includes(subscription.status)) {
                    continue;
                }

                // Determine which date to check
                const dateToCheck = subscription.status === "trialing"
                    ? subscription.trial_end
                    : subscription.current_period_end;

                if (!dateToCheck) continue;

                // Check if date is 3 days away
                if (!isThreeDaysAway(dateToCheck)) continue;

                // Get plan details
                const planName = getPlanName(subscription);
                const amount = getSubscriptionAmount(subscription);
                const endDate = formatDate(dateToCheck);

                // Determine scenario and send appropriate email
                if (subscription.status === "trialing") {
                    // Scenario C: Trial Ending (Compliance Critical)
                    await sendTrialEndingEmail(userData, endDate, amount, planName);
                    emailsSent.trialEnding++;
                    console.log(`[SubscriptionNotifications] Trial ending email sent to ${userDoc.id}`);

                } else if (subscription.cancel_at_period_end) {
                    // Scenario B: Subscription Expiring
                    await sendSubscriptionExpiringEmail(userData, endDate, planName);
                    emailsSent.expiring++;
                    console.log(`[SubscriptionNotifications] Expiring email sent to ${userDoc.id}`);

                } else {
                    // Scenario A: Upcoming Payment
                    await sendUpcomingPaymentEmail(userData, endDate, amount, planName);
                    emailsSent.upcomingPayment++;
                    console.log(`[SubscriptionNotifications] Upcoming payment email sent to ${userDoc.id}`);
                }

            } catch (stripeError: any) {
                // Handle subscription not found in Stripe (deleted externally)
                if (stripeError.code === "resource_missing") {
                    console.warn(`[SubscriptionNotifications] Subscription ${subscriptionId} not found in Stripe for user ${userDoc.id}`);
                } else {
                    console.error(`[SubscriptionNotifications] Stripe error for user ${userDoc.id}:`, stripeError.message);
                }
            }
        }

        console.log(`[SubscriptionNotifications] Complete. Emails sent:`, emailsSent);

    } catch (error) {
        console.error("[SubscriptionNotifications] Fatal error:", error);
    }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a Unix timestamp is exactly 3 days from now
 */
function isThreeDaysAway(unixTimestamp: number): boolean {
    const targetDate = new Date(unixTimestamp * 1000);
    targetDate.setHours(0, 0, 0, 0);

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + DAYS_BEFORE_NOTIFICATION);
    threeDaysFromNow.setHours(0, 0, 0, 0);

    return targetDate.getTime() === threeDaysFromNow.getTime();
}

/**
 * Format Unix timestamp to readable date
 */
function formatDate(unixTimestamp: number): string {
    return new Date(unixTimestamp * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

/**
 * Get plan name from subscription
 */
function getPlanName(subscription: Stripe.Subscription): string {
    const item = subscription.items.data[0];
    return item?.price?.nickname || item?.plan?.nickname || "Premium Plan";
}

/**
 * Get subscription amount in dollars
 */
function getSubscriptionAmount(subscription: Stripe.Subscription): string {
    const item = subscription.items.data[0];
    const amount = item?.price?.unit_amount || 0;
    return (amount / 100).toFixed(2);
}

// ============================================================================
// EMAIL SENDERS
// ============================================================================

/**
 * Scenario A: Upcoming Payment Email
 * For active subscriptions that will auto-renew
 */
import { generateCareerVividEmail } from "./emailTemplates";

/**
 * Scenario A: Upcoming Payment Email
 * For active subscriptions that will auto-renew
 */
async function sendUpcomingPaymentEmail(
    userData: FirebaseFirestore.DocumentData,
    renewalDate: string,
    amount: string,
    planName: string
): Promise<void> {
    const userName = userData.displayName || userData.personalDetails?.firstName || "there";
    const userEmail = userData.email;
    const APP_URL = "https://careervivid.app";

    const emailHtml = generateCareerVividEmail({
        title: "Your subscription renews soon",
        userName: userName,
        eyebrow: "Billing notice",
        preheader: `Your ${planName} subscription is scheduled to renew in 3 days.`,
        messageLines: [
            `Your <strong>${planName}</strong> subscription is scheduled to renew soon.`,
            `No action is needed if you want to keep your current access. You can review or change your subscription from your profile.`,
        ],
        boxContent: {
            title: "Renewal details",
            type: "info",
            lines: [
                `<strong>Renewal date:</strong> ${renewalDate}`,
                `<strong>Amount:</strong> $${amount}`,
                `<strong>Plan:</strong> ${planName}`
            ]
        },
        mainButton: {
            text: "Manage subscription",
            url: `${APP_URL}/profile`
        },
        footerText: "You are receiving this billing notice because you have an active CareerVivid subscription."
    });

    await db.collection("mail").add({
        to: userEmail,
        message: {
            subject: `Your ${planName} subscription renews in 3 days`,
            html: emailHtml,
            text: `Hi ${userName},\n\nYour ${planName} subscription will renew on ${renewalDate} for $${amount}.\n\nNo action needed. Manage your subscription at ${APP_URL}/profile\n\nThank you!\nThe CareerVivid Team`
        }
    });
}

/**
 * Scenario B: Subscription Expiring Email
 * For active subscriptions that will NOT renew (cancel_at_period_end = true)
 */
async function sendSubscriptionExpiringEmail(
    userData: FirebaseFirestore.DocumentData,
    expirationDate: string,
    planName: string
): Promise<void> {
    const userName = userData.displayName || userData.personalDetails?.firstName || "there";
    const userEmail = userData.email;
    const APP_URL = "https://careervivid.app";

    const emailHtml = generateCareerVividEmail({
        title: "Your access ends soon",
        userName: userName,
        eyebrow: "Subscription notice",
        preheader: `Your ${planName} access is scheduled to end in 3 days.`,
        messageLines: [
            `Your <strong>${planName}</strong> subscription is set to expire soon because renewal is turned off.`,
            `If you want to keep premium access, you can resubscribe before the access end date.`
        ],
        boxContent: {
            title: "Access details",
            type: "warning",
            lines: [
                `<strong>Expiration date:</strong> ${expirationDate}`,
                `<strong>Plan:</strong> ${planName}`,
                `After this date, your account will move back to the free plan.`
            ]
        },
        mainButton: {
            text: "Resubscribe",
            url: `${APP_URL}/subscription`
        },
        footerText: "You can keep using CareerVivid on the free plan if you choose not to renew."
    });

    await db.collection("mail").add({
        to: userEmail,
        message: {
            subject: `Your ${planName} access ends in 3 days`,
            html: emailHtml,
            text: `Hi ${userName},\n\nYour ${planName} access ends on ${expirationDate}.\n\nResubscribe to keep your premium features: ${APP_URL}/subscription\n\nThank you!\nThe CareerVivid Team`
        }
    });
}

/**
 * Scenario C: Trial Ending Email (COMPLIANCE CRITICAL)
 * For trialing subscriptions - Visa/Mastercard Compliance Required
 * 
 * MUST include:
 * - Exact trial end date
 * - Exact charge amount
 * - Direct link to cancel
 */
async function sendTrialEndingEmail(
    userData: FirebaseFirestore.DocumentData,
    trialEndDate: string,
    amount: string,
    planName: string
): Promise<void> {
    const userName = userData.displayName || userData.personalDetails?.firstName || "there";
    const userEmail = userData.email;
    const APP_URL = "https://careervivid.app";

    const emailHtml = generateCareerVividEmail({
        title: "Your free trial ends soon",
        userName: userName,
        eyebrow: "Billing notice",
        preheader: `Your free trial of ${planName} ends in 3 days.`,
        messageLines: [
            `Your free trial of <strong>${planName}</strong> is ending soon.`,
            `If you want to continue, no action is needed. If you do not want to be charged, manage your subscription before the trial end date.`
        ],
        boxContent: {
            title: "Important billing details",
            type: "critical",
            lines: [
                `<strong>Trial ends on:</strong> ${trialEndDate}`,
                `<strong>Your card will be charged:</strong> $${amount}`,
                `This charge happens automatically unless you cancel before then.`
            ]
        },
        mainButton: {
            text: "Manage subscription",
            url: `${APP_URL}/profile`
        },
        footerText: `You are receiving this because you started a CareerVivid free trial.`
    });

    await db.collection("mail").add({
        to: userEmail,
        message: {
            subject: `Your free trial ends in 3 days`,
            html: emailHtml,
            text: `Hi ${userName},\n\nIMPORTANT: Your free trial of ${planName} ends on ${trialEndDate}.\n\nYour card will be charged $${amount} automatically on ${trialEndDate} unless you cancel before then.\n\nTo cancel or manage your subscription: ${APP_URL}/profile\n\nThank you!\nThe CareerVivid Team`
        }
    });
}
