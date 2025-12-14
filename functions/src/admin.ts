import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { nanoid } from "nanoid";

/**
 * Promoting a user to "Academic Partner".
 * - Sets role to 'academic_partner'
 * - Generates a unique referral code
 * - Grants 12 months of Premium access
 */
export const grantAcademicPartnerRole = functions.region('us-west1').https.onCall(async (data, context) => {
    // 1. Verify Caller is Admin
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'must be logged in');
    }

    // Check if caller is an admin
    const callerDoc = await admin.firestore().collection('admins').doc(context.auth.uid).get();
    // Safety check: Hardcoded admins bypass DB check locally, but for cloud functions we enforce DB or Claims.
    // Assuming 'admins' collection is the source of truth.
    if (!callerDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'must be an admin');
    }

    const { targetUserId, durationInMonths = 12 } = data;
    if (!targetUserId) {
        throw new functions.https.HttpsError('invalid-argument', 'targetUserId is required');
    }

    try {
        const userRef = admin.firestore().collection('users').doc(targetUserId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Target user not found');
        }

        // Generate a simple 8-char referral code
        // Ensure uniqueness could be done, but collision probability is low for this scale.
        const referralCode = nanoid(8);

        // Calculate expiration based on durationInMonths
        // user might already have an expiry, but we are overwriting/extending logic could be complex.
        // For simplicity, we set it to Now + Duration.
        const months = typeof durationInMonths === 'number' && durationInMonths > 0 ? durationInMonths : 12;
        const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000)); // Approx 30 days/month

        await userRef.update({
            role: 'academic_partner',
            referralCode: referralCode,
            plan: 'pro_monthly', // Give them full access
            stripeSubscriptionStatus: 'active', // Bypass Stripe check
            expiresAt: expiresAt,
            promotions: {
                isPremium: true
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, referralCode };

    } catch (error: any) {
        console.error("Error granting academic partner role:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
