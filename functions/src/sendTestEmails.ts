import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { generateCareerVividEmail } from "./emailTemplates";

export const sendTestEmails = functions.region('us-west1').https.onRequest(async (req, res) => {
    const targetEmail = "zhujiawen519@gmail.com";
    const userName = "Jiawen Zhu";
    const APP_URL = "https://careervivid.app";

    try {
        const mailCollection = admin.firestore().collection("mail");
        const emails = [];

        const welcomeHtml = generateCareerVividEmail({
            title: "Start your job search workspace",
            userName,
            eyebrow: "Welcome to CareerVivid",
            preheader: "Create your base resume, save one role, and tailor your application materials.",
            messageLines: [
                "Your workspace is ready. The fastest path is to create one base resume, save one target job, then tailor your materials against that role.",
                "CareerVivid keeps the job search pieces together: resumes, job tracking, AI review, interview prep, and application support."
            ],
            boxContent: {
                title: "Your first 10 minutes",
                type: "success",
                lines: [
                    "<strong>Build or import a base resume.</strong>",
                    "<strong>Save one role you want to pursue.</strong>",
                    "<strong>Tailor and review your resume before applying.</strong>"
                ]
            },
            mainButton: {
                text: "Build first resume",
                url: `${APP_URL}/newresume?scrollTo=create-section`
            },
            secondaryButton: {
                text: "Open dashboard",
                url: `${APP_URL}/dashboard`
            }
        });
        emails.push({
            to: targetEmail,
            message: {
                subject: "[TEST] Welcome to CareerVivid - build your first resume",
                html: welcomeHtml,
                text: "Welcome to CareerVivid. Start by building or importing a base resume, saving one target role, and tailoring your materials before applying."
            }
        });

        const firstResumeHtml = generateCareerVividEmail({
            title: "Tailor your resume to one role",
            userName,
            eyebrow: "First resume completed",
            preheader: "Your base resume is ready. The next step is matching it to a target job.",
            messageLines: [
                "You have a base resume in CareerVivid. That gives you a reusable starting point for every application.",
                "The next high-value step is to attach one job description and tune the resume for the exact role, skills, and responsibilities the employer is asking for."
            ],
            boxContent: {
                title: "What tailoring helps with",
                type: "info",
                lines: [
                    "<strong>Keyword fit:</strong> see which role-specific skills are already covered.",
                    "<strong>Responsibility focus:</strong> clarify bullets that should map more directly to the job.",
                    "<strong>Application confidence:</strong> review what changed before you send it."
                ]
            },
            mainButton: {
                text: "Tailor to a job",
                url: `${APP_URL}/job-tracker?source=email_first_resume`
            },
            secondaryButton: {
                text: "Open resume builder",
                url: `${APP_URL}/newresume`
            }
        });
        emails.push({
            to: targetEmail,
            message: {
                subject: "[TEST] Your resume is ready for a target job",
                html: firstResumeHtml,
                text: "Your base resume is ready. Save a target job, then tailor your resume against the role before applying."
            }
        });

        const reviewCompleteHtml = generateCareerVividEmail({
            title: "Your resume review is ready",
            userName,
            eyebrow: "Review completed",
            preheader: "Open your score and suggestions while the role is still fresh.",
            messageLines: [
                "CareerVivid finished reviewing your resume. The review is most useful while the role, resume version, and next application step are still fresh.",
                "Open the review to check the score, read the suggestions, and decide which edits are worth making before you apply."
            ],
            boxContent: {
                title: "Review summary",
                type: "success",
                lines: [
                    "<strong>Resume:</strong> Software Engineer Resume - Mid Level",
                    "<strong>Next step:</strong> apply the highest-impact suggestions first.",
                    "<strong>Tip:</strong> keep one clean base resume and create tailored versions for specific roles."
                ]
            },
            mainButton: {
                text: "View review",
                url: `${APP_URL}/resume-review?source=email_review_ready`
            }
        });
        emails.push({
            to: targetEmail,
            message: {
                subject: "[TEST] Your CareerVivid resume review is ready",
                html: reviewCompleteHtml,
                text: "Your CareerVivid resume review is ready. Open it to check the score and suggestions before applying."
            }
        });

        const jobsSavedHtml = generateCareerVividEmail({
            title: "Turn saved jobs into application packets",
            userName,
            eyebrow: "Jobs saved",
            preheader: "Use your saved roles to create tailored materials and prepare the next application.",
            messageLines: [
                "You have saved jobs in CareerVivid. That is the point where the workspace becomes more useful than a list of links.",
                "For each role, you can prepare a tailored resume, draft a cover letter, keep notes, and move the application through your tracker."
            ],
            boxContent: {
                title: "Recommended next action",
                type: "info",
                lines: [
                    "<strong>Pick one saved job.</strong>",
                    "<strong>Generate a first cover letter draft.</strong>",
                    "<strong>Edit it so it sounds like you before sending.</strong>"
                ]
            },
            mainButton: {
                text: "Prepare an application",
                url: `${APP_URL}/job-tracker?source=email_jobs_saved`
            },
            secondaryButton: {
                text: "Open resume builder",
                url: `${APP_URL}/newresume`
            }
        });
        emails.push({
            to: targetEmail,
            message: {
                subject: "[TEST] Prepare your next saved job in CareerVivid",
                html: jobsSavedHtml,
                text: "You have saved jobs in CareerVivid. Pick one role and prepare a tailored resume, cover letter, and application notes."
            }
        });

        const feedbackHtml = generateCareerVividEmail({
            title: "Could you share what worked?",
            userName,
            eyebrow: "A quick note from CareerVivid",
            preheader: "If CareerVivid helped with your job search, a short note helps us improve.",
            messageLines: [
                "You have used CareerVivid to organize parts of your job search. If it has helped, a short note about what worked would be useful for the product team.",
                "We read feedback directly. One or two sentences about the resume builder, job tracker, extension workflow, or application prep is enough."
            ],
            boxContent: {
                title: "Good feedback answers",
                type: "info",
                lines: [
                    "<strong>What saved you time?</strong>",
                    "<strong>What felt confusing?</strong>",
                    "<strong>What should CareerVivid improve before you recommend it?</strong>"
                ]
            },
            mainButton: {
                text: "Share feedback",
                url: `mailto:support@careervivid.app?subject=${encodeURIComponent("CareerVivid feedback")}`
            },
            footerText: "This note is sent after meaningful product activity, not immediately after signup."
        });
        emails.push({
            to: targetEmail,
            message: {
                subject: "[TEST] Could you share what worked in CareerVivid?",
                html: feedbackHtml,
                text: "If CareerVivid has helped with your job search, a short note about what worked or what felt confusing would help the product team."
            }
        });

        const renewalHtml = generateCareerVividEmail({
            title: "Your subscription renews soon",
            userName,
            eyebrow: "Billing notice",
            preheader: "Your Pro Monthly subscription is scheduled to renew in 3 days.",
            messageLines: [
                "Your <strong>Pro Monthly</strong> subscription is scheduled to renew soon.",
                "No action is needed if you want to keep your current access. You can review or change your subscription from your profile."
            ],
            boxContent: {
                title: "Renewal details",
                type: "info",
                lines: [
                    "<strong>Renewal date:</strong> Feb 15, 2026",
                    "<strong>Amount:</strong> $29.00",
                    "<strong>Plan:</strong> Pro Monthly"
                ]
            },
            mainButton: {
                text: "Manage subscription",
                url: `${APP_URL}/profile`
            },
            footerText: "You are receiving this billing notice because you have an active CareerVivid subscription."
        });
        emails.push({
            to: targetEmail,
            message: {
                subject: "[TEST] Your Pro Monthly subscription renews in 3 days",
                html: renewalHtml,
                text: "Your Pro Monthly subscription renews on Feb 15, 2026 for $29.00. Manage your subscription from your CareerVivid profile."
            }
        });

        const trialHtml = generateCareerVividEmail({
            title: "Your free trial ends soon",
            userName,
            eyebrow: "Billing notice",
            preheader: "Your free trial ends in 3 days. Review the date and amount before billing begins.",
            messageLines: [
                "Your free trial of <strong>Pro Monthly</strong> ends soon.",
                "If you want to continue, no action is needed. If you do not want to be charged, manage your subscription before the trial end date."
            ],
            boxContent: {
                title: "Important billing details",
                type: "critical",
                lines: [
                    "<strong>Trial ends on:</strong> Feb 18, 2026",
                    "<strong>Your card will be charged:</strong> $29.00",
                    "This charge happens automatically unless you cancel before then."
                ]
            },
            mainButton: {
                text: "Manage subscription",
                url: `${APP_URL}/profile`
            },
            footerText: "You are receiving this because you started a CareerVivid free trial."
        });
        emails.push({
            to: targetEmail,
            message: {
                subject: "[TEST] Your free trial ends in 3 days",
                html: trialHtml,
                text: "Your Pro Monthly free trial ends on Feb 18, 2026. Your card will be charged $29.00 unless you cancel before then."
            }
        });

        const paymentFailedHtml = generateCareerVividEmail({
            title: "Payment needs attention",
            userName,
            eyebrow: "Billing issue",
            preheader: "We could not process your recent CareerVivid payment.",
            messageLines: [
                "We could not process the payment for your recent invoice.",
                "<strong>Your premium access is paused until the payment method is updated.</strong>"
            ],
            boxContent: {
                title: "Invoice details",
                type: "critical",
                lines: [
                    "<strong>Invoice number:</strong> INV-12345-TEST",
                    "<strong>Amount due:</strong> $29.00",
                    "<strong>Status:</strong> Payment failed"
                ]
            },
            mainButton: {
                text: "Update payment method",
                url: `${APP_URL}/billing/update`
            },
            secondaryButton: {
                text: "View plans",
                url: `${APP_URL}/subscription`
            },
            footerText: "Contact support@careervivid.app if you believe this notice is incorrect."
        });
        emails.push({
            to: targetEmail,
            message: {
                subject: "[TEST] Payment failed - update your payment method",
                html: paymentFailedHtml,
                text: "We could not process your recent CareerVivid payment. Update your payment method to restore premium access."
            }
        });

        const batch = admin.firestore().batch();
        emails.forEach(email => {
            const docRef = mailCollection.doc();
            batch.set(docRef, email);
        });
        await batch.commit();

        res.status(200).send(`Sent ${emails.length} redesigned test emails to ${targetEmail}`);
    } catch (error: any) {
        console.error("Error sending test emails:", error);
        res.status(500).send("Error: " + error.message);
    }
});
