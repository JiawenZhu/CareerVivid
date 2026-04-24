import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

/**
 * messagingTrigger
 * Firestore trigger that watches the 'messaging_queue' collection.
 * When a new document is added, it "sends" the message.
 * In production, you would use Twilio or WhatsApp Business API here.
 */
export const messagingTrigger = functions.firestore
    .document("messaging_queue/{messageId}")
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const messageId = context.params.messageId;

        console.log(`[Messaging] Processing message ${messageId}`, data);

        try {
            // Update status to 'processing'
            await snap.ref.update({ status: 'processing', startedAt: admin.firestore.FieldValue.serverTimestamp() });

            const { Novu } = await import('@novu/api');
            const novu = new Novu({
                // TODO: Move this to Firebase Secrets (functions.config() or Secret Manager)
                secretKey: 'a2dcd8d25123257f43964f4c268fbb83' 
            });

            console.log(`[Messaging] Dispatching via Novu to ${data.to}: ${data.body}`);
            
            // Map the generic marketing queue request to a Novu workflow
            // Note: Replace 'marketing-campaign-workflow' with your actual workflow ID in Novu if different
            const result = await novu.trigger({
                workflowId: 'onboarding-demo-workflow', 
                to: data.to, // Assuming data.to holds a subscriberId or email
                payload: {
                    message: data.body,
                    channel: data.channel
                }
            });

            // Update status to 'sent'
            await snap.ref.update({ 
                status: 'sent', 
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                providerResponse: { success: true, transactionId: (result as any).result?.transactionId }
            });

            console.log(`[Messaging] Message ${messageId} sent successfully.`);
        } catch (error: any) {
            console.error(`[Messaging] Error sending message ${messageId}:`, error);
            await snap.ref.update({ 
                status: 'failed', 
                error: error.message || 'Unknown error'
            });
        }
    });

/**
 * getMessagingStats
 * Callable function to get metrics for the Campaign Dashboard.
 */
export const getMessagingStats = functions.https.onCall(async (data, context) => {
    // Check if user is admin
    if (!context.auth || !context.auth.token.admin) {
        // throw new functions.https.HttpsError('permission-denied', 'Only admins can view stats.');
    }

    const snapshot = await admin.firestore().collection('messaging_queue').get();
    const stats = {
        total: snapshot.size,
        sent: 0,
        failed: 0,
        processing: 0,
        sms: 0,
        whatsapp: 0
    };

    snapshot.forEach(doc => {
        const d = doc.data();
        if (d.status === 'sent') stats.sent++;
        if (d.status === 'failed') stats.failed++;
        if (d.status === 'processing') stats.processing++;
        if (d.channel === 'sms') stats.sms++;
        if (d.channel === 'whatsapp') stats.whatsapp++;
    });

    return stats;
});
