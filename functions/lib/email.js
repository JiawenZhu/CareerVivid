"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onEmailRequestCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
const params_1 = require("firebase-functions/params");
const smtpEmail = (0, params_1.defineSecret)("SMTP_EMAIL");
const smtpPassword = (0, params_1.defineSecret)("SMTP_PASSWORD");
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
/**
 * Triggered when a document is created in the 'mail' collection.
 * Sends an email using Nodemailer and updates the document with the result.
 */
exports.onEmailRequestCreated = functions
    .region("us-west1")
    .runWith({
    secrets: [smtpEmail, smtpPassword],
    timeoutSeconds: 60,
    memory: "256MB",
})
    .firestore.document("mail/{mailId}")
    .onCreate(async (snapshot, context) => {
    const mailId = context.params.mailId;
    const data = snapshot.data();
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
    }
    catch (error) {
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
//# sourceMappingURL=email.js.map