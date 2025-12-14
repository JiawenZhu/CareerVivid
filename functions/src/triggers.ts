import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Trigger: On User Created
 * Logic:
 * 1. Check if user has `referredBy` code.
 * 2. If yes, find the Academic Partner who owns that code.
 * 3. Verify Partner exists.
 * 4. Grant Student 30-day Premium Trial.
 * 5. Link Student to Partner via `academicPartnerId`.
 */
export const onUserCreated = functions.region('us-west1').firestore
    .document('users/{userId}')
    .onCreate(async (snap, context) => {
        const newUser = snap.data();
        const userId = context.params.userId;

        if (!newUser || !newUser.referredBy) {
            console.log(`User ${userId} created without referral.`);
            return null;
        }

        const referralCode = newUser.referredBy;
        console.log(`Processing referral ${referralCode} for user ${userId}`);

        try {
            // Find Academic Partner with this code
            const partnersSnapshot = await admin.firestore()
                .collection('users')
                .where('role', '==', 'academic_partner')
                .where('referralCode', '==', referralCode)
                .limit(1)
                .get();

            if (partnersSnapshot.empty) {
                console.warn(`Referral code ${referralCode} not found or invalid.`);
                return null;
            }

            const partnerDoc = partnersSnapshot.docs[0];
            const partnerId = partnerDoc.id;

            console.log(`Referral valid! Partner: ${partnerId}`);

            // Grant 30 Days Premium
            const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

            await admin.firestore().collection('users').doc(userId).update({
                plan: 'pro_monthly', // Give them full access (trial)
                stripeSubscriptionStatus: 'trialing', // Mark as trialing
                expiresAt: expiresAt,
                academicPartnerId: partnerId,
                promotions: {
                    isPremium: true,
                    trialSource: 'academic_referral'
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`User ${userId} granted Academic access via Partner ${partnerId}`);

        } catch (error) {
            console.error("Error processing referral trigger:", error);
        }

        return null; // Function must return null or promise
    });
