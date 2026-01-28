import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { generateNeoBrutalistEmail } from "./emailTemplates";

export const sendTestEmails = functions.region('us-west1').https.onRequest(async (req, res) => {
    const targetEmail = "zhujiawen519@gmail.com";
    const userName = "Jiawen Zhu";
    const APP_URL = "https://careervivid.app";
    const user = { displayName: userName, email: targetEmail };

    try {
        const mailCollection = admin.firestore().collection("mail");
        const emails = [];

        // 1. Welcome Email
        const welcomeHtml = generateNeoBrutalistEmail({
            title: "Welcome to CareerVivid",
            userName: userName,
            messageLines: [
                "We're thrilled to have you on board! Get ready to supercharge your career journey.",
                "With CareerVivid, you can create stunning resumes, track your job applications, and prepare for interviews with AI."
            ],
            boxContent: {
                title: "Get Started",
                type: "success",
                lines: [
                    "<strong>Complete your profile</strong> to get personalized recommendations.",
                    "<strong>Upload your resume</strong> to kickstart the AI analysis.",
                    "Explore our premium templates to stand out."
                ]
            },
            mainButton: {
                text: "Go to Dashboard",
                url: `${APP_URL}/dashboard`
            },
            footerText: "Let's build your future together!"
        });
        emails.push({
            to: targetEmail,
            message: { subject: "[TEST] Welcome to CareerVivid! 🚀", html: welcomeHtml }
        });

        // 2. Upcoming Payment
        const upcomingHtml = generateNeoBrutalistEmail({
            title: "Upcoming Renewal",
            userName: userName,
            messageLines: [
                `Just a friendly reminder that your <strong>Pro Monthly</strong> subscription will automatically renew soon.`,
                `No action is needed – your subscription will continue seamlessly.`,
            ],
            boxContent: {
                title: "Renewal Details",
                type: "info",
                lines: [
                    `<strong>Renewal Date:</strong> Feb 15, 2026`,
                    `<strong>Amount:</strong> $29.00`,
                    `<strong>Plan:</strong> Pro Monthly`
                ]
            },
            mainButton: {
                text: "Manage Subscription",
                url: `${APP_URL}/profile`
            },
            footerText: "Thank you for being a valued member!"
        });
        emails.push({
            to: targetEmail,
            message: { subject: "[TEST] Your Pro Monthly subscription renews in 3 days", html: upcomingHtml }
        });

        // 3. Subscription Expiring
        const expiringHtml = generateNeoBrutalistEmail({
            title: "Access Ending Soon",
            userName: userName,
            messageLines: [
                `We noticed your <strong>Pro Monthly</strong> subscription is set to expire soon.`,
                `If you'd like to keep your premium access, you can resubscribe anytime before your access ends.`
            ],
            boxContent: {
                title: "Expiration Warning",
                type: "warning",
                lines: [
                    `<strong>Expiration Date:</strong> Feb 20, 2026`,
                    `<strong>Plan:</strong> Pro Monthly`,
                    `After this date, you'll lose access to premium features including unlimited resumes, AI credits, and PDF downloads.`
                ]
            },
            mainButton: {
                text: "Resubscribe Now",
                url: `${APP_URL}/subscription`
            },
            footerText: "We'd love to have you back!"
        });
        emails.push({
            to: targetEmail,
            message: { subject: "[TEST] ⚠️ Your Pro Monthly access ends in 3 days", html: expiringHtml }
        });

        // 4. Trial Ending
        const trialHtml = generateNeoBrutalistEmail({
            title: "Trial Ending Soon",
            userName: userName,
            messageLines: [
                `Your free trial of <strong>Pro Monthly</strong> is ending soon. Here's what you need to know:`,
                `If you're enjoying CareerVivid, no action is needed – your subscription will start automatically.`
            ],
            boxContent: {
                title: "Important Billing Notice",
                type: "critical",
                lines: [
                    `<strong>Trial ends on:</strong> Feb 18, 2026`,
                    `<strong>Your card will be charged:</strong> $29.00`,
                    `This charge will occur automatically unless you cancel before then.`
                ]
            },
            mainButton: {
                text: "Manage Subscription",
                url: `${APP_URL}/profile`
            },
            footerText: `You're receiving this because you signed up for a free trial on CareerVivid.`
        });
        emails.push({
            to: targetEmail,
            message: { subject: "[TEST] 🔔 Your free trial ends in 3 days – Action required", html: trialHtml }
        });

        // 5. Payment Failed
        const failedHtml = generateNeoBrutalistEmail({
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
                    `<strong>Invoice Number:</strong> INV-12345-TEST`,
                    `<strong>Amount Due:</strong> $29.00`,
                    `<strong>Status:</strong> Payment Failed`
                ]
            },
            mainButton: {
                text: "Update Payment Method",
                url: `${APP_URL}/billing/update`
            },
            secondaryButton: {
                text: "Resubscribe",
                url: `${APP_URL}/subscription`
            },
            footerText: "Please update your payment method to restore access."
        });
        emails.push({
            to: targetEmail,
            message: { subject: "[TEST] Payment Failed - Action Required", html: failedHtml }
        });

        // 6. Subscription Canceled
        const canceledHtml = generateNeoBrutalistEmail({
            title: "Subscription Canceled",
            userName: userName,
            messageLines: [
                "We're sorry to see you go. Your subscription cancellation has been confirmed."
            ],
            boxContent: {
                title: "Access Details",
                type: "warning",
                lines: [
                    "<strong>Your premium access will remain active until:</strong>",
                    `<span style="font-size: 18px; font-weight: bold;">Feb 28, 2026</span>`,
                    "After this date, your account will revert to the free plan."
                ]
            },
            mainButton: {
                text: "Resubscribe Now",
                url: `${APP_URL}/subscription`
            },
            footerText: "We'd love to have you back!"
        });
        emails.push({
            to: targetEmail,
            message: { subject: "[TEST] Your subscription has been canceled", html: canceledHtml }
        });

        // Batch write or simple loop
        const batch = admin.firestore().batch();
        emails.forEach(email => {
            const docRef = mailCollection.doc();
            batch.set(docRef, email);
        });
        await batch.commit();

        res.status(200).send(`Sent ${emails.length} test emails to ${targetEmail}`);
    } catch (error: any) {
        console.error("Error sending test emails:", error);
        res.status(500).send("Error: " + error.message);
    }
});
