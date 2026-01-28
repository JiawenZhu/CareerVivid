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

/**
 * Triggered when a document is created in the 'contact_messages' collection.
 * Converts the contact message into an email to support.
 */
export const onContactMessageCreated = functions
    .region("us-west1")
    .runWith({
        secrets: [smtpEmail, smtpPassword],
        timeoutSeconds: 60,
        memory: "256MB",
    })
    .firestore.document("contact_messages/{messageId}")
    .onCreate(async (snapshot, context) => {
        const messageId = context.params.messageId;
        const data = snapshot.data();

        if (!data || !data.email || !data.message) {
            console.error(`Invalid contact message ${messageId}: Missing fields.`);
            return;
        }

        const subject = data.subject ? `[Contact Form] ${data.subject}` : `[Contact Form] New Message from ${data.name}`;

        // Neo-Brutalist HTML style for internal notification
        const htmlContent = `
            <div style="font-family: sans-serif; padding: 20px; border: 4px solid black; background-color: #f0f0f0;">
                <h2 style="background-color: black; color: white; padding: 10px; display: inline-block;">New Contact Message</h2>
                <div style="margin-top: 20px; background-color: white; border: 2px solid black; padding: 20px; box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);">
                    <p><strong>From:</strong> ${data.name} (${data.email})</p>
                    <p><strong>Subject:</strong> ${data.subject || 'No Subject'}</p>
                    <hr style="border-top: 2px solid #ddd;"/>
                    <p style="white-space: pre-wrap;">${data.message}</p>
                </div>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">Sent from CareerVivid Contact Form • ID: ${messageId}</p>
            </div>
        `;

        const mailOptions = {
            from: `"CareerVivid Contact" <${smtpEmail.value()}>`,
            to: "support@careervivid.app", // Send to admin/support
            replyTo: data.email, // Allow replying directly to user
            subject: subject,
            text: `Name: ${data.name}\nEmail: ${data.email}\nSubject: ${data.subject}\n\nMessage:\n${data.message}`,
            html: htmlContent,
        };

        try {
            const transporter = getTransporter();
            const info = await transporter.sendMail(mailOptions);

            console.log(`Contact email sent for ${messageId}: ${info.messageId}`);

            // Mark as forwarded
            await snapshot.ref.update({
                status: 'forwarded',
                emailMessageId: info.messageId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

        } catch (error: any) {
            console.error(`Failed to forward contact email ${messageId}:`, error);
            await snapshot.ref.update({
                status: 'error',
                error: error.message || "Unknown error"
            });
        }
    });
