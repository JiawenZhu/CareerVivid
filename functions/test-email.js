// Test script to add email to Firestore mail collection
// Uses Application Default Credentials (gcloud auth application-default login)
const admin = require('firebase-admin');

admin.initializeApp({
    projectId: 'jastalk-firebase',
});

const db = admin.firestore();

async function sendTestEmail() {
    const mailDoc = {
        to: 'zhujiawen519@gmail.com',
        message: {
            subject: '🔔 Test: Your free trial ends in 3 days',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1;">🔔 Test Email - Subscription Notification</h1>
          <p>Hi there,</p>
          <p>This is a <strong>test email</strong> from the Subscription Lifecycle Notification System.</p>
          <div style="background: #fef2f2; border: 2px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="color: #dc2626; margin: 0 0 12px 0;">⚠️ Important Billing Notice</h3>
            <p><strong>Your trial ends on:</strong> January 21, 2026</p>
            <p><strong>Your card will be charged:</strong> $4.99</p>
          </div>
          <p>If you received this email, the notification system is working correctly!</p>
          <p>Best,<br><strong>The CareerVivid Team</strong></p>
        </div>
      `,
            text: 'Test email from CareerVivid Subscription Notification System. Your trial ends on January 21, 2026. Your card will be charged $4.99.'
        }
    };

    try {
        const docRef = await db.collection('mail').add(mailDoc);
        console.log('✅ Test email document added with ID:', docRef.id);
        console.log('The email trigger should send this email shortly.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding email document:', error);
        process.exit(1);
    }
}

sendTestEmail();
