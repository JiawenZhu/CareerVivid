import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import { defineSecret } from "firebase-functions/params";

const smtpEmail = defineSecret("SMTP_EMAIL");
const smtpPassword = defineSecret("SMTP_PASSWORD");

// Initialize Transporter
const getTransporter = () => {
    const user = smtpEmail.value().trim();
    const pass = smtpPassword.value().replace(/\s+/g, '');

    console.log(`Initializing transporter with user: '${user}' (length: ${user.length})`);

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: user,
            pass: pass,
        },
    });
};

interface EmailRequest {
    to: string | string[];
    message: {
        subject: string;
        text?: string;
        html?: string;
    };
}

/**
 * Triggered when a document is created in the 'mail' collection.
 * Sends an email using Nodemailer and updates the document with the result.
 */
export const onEmailRequestCreated = functions
    .region("us-west1")
    .runWith({
        secrets: [smtpEmail, smtpPassword],
        timeoutSeconds: 60,
        memory: "256MB",
    })
    .firestore.document("mail/{mailId}")
    .onCreate(async (snapshot, context) => {
        const mailId = context.params.mailId;
        const data = snapshot.data() as EmailRequest;

        if (!data.to || !data.message) {
            console.error(`Invalid email request ${mailId}: Missing 'to' or 'message' fields.`);
            await snapshot.ref.update({
                delivery: {
                    state: "ERROR",
                    error: "Missing 'to' or 'message' fields.",
                    endTime: admin.firestore.FieldValue.serverTimestamp(),
                },
            });
            return;
        }

        const mailOptions = {
            from: `"CareerVivid Support" <${smtpEmail.value()}>`,
            to: data.to,
            subject: data.message.subject,
            text: data.message.text,
            html: data.message.html,
        };

        try {
            const transporter = getTransporter();
            const info = await transporter.sendMail(mailOptions);

            console.log(`Email sent for request ${mailId}: ${info.messageId}`);

            await snapshot.ref.update({
                delivery: {
                    state: "SUCCESS",
                    messageId: info.messageId,
                    endTime: admin.firestore.FieldValue.serverTimestamp(),
                },
            });
        } catch (error: any) {
            console.error(`Failed to send email for request ${mailId}:`, error);

            await snapshot.ref.update({
                delivery: {
                    state: "ERROR",
                    error: error.message || "Unknown error",
                    endTime: admin.firestore.FieldValue.serverTimestamp(),
                },
            });
        }
    });
