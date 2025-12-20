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

/**
 * Trigger: On Partner Application Updated
 * Logic:
 * 1. Listen for status change to 'approved'.
 * 2. If 'business' type and approved:
 * 3. Check if user exists.
 * 4. If NEW: Create user (pwd: careervivid123456) + assign role.
 * 5. If EXISTING: Update role.
 */
export const onPartnerApplicationUpdated = functions.region('us-west1').firestore
    .document('partner_applications/{appId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();

        // Only run if status changed to 'approved'
        if (newData.status === 'approved' && oldData.status !== 'approved') {
            const { email, name, type, organization } = newData;
            console.log(`Processing approval for ${type} partner: ${email}`);

            if (type !== 'business') {
                console.log('Not a business partner. Skipping auto-creation.');
                // Note: Academic partners might need manual role assignment or different logic
                return null;
            }

            try {
                // Check if user exists
                let userRecord;
                try {
                    userRecord = await admin.auth().getUserByEmail(email);
                    console.log(`User ${email} found with UID: ${userRecord.uid}`);
                } catch (e: any) {
                    if (e.code === 'auth/user-not-found') {
                        // Create NEW User
                        console.log(`User ${email} not found. Creating new account...`);
                        userRecord = await admin.auth().createUser({
                            email: email,
                            emailVerified: true,
                            password: 'careervivid123456',
                            displayName: name,
                            disabled: false
                        });
                        console.log(`Created new user: ${userRecord.uid}`);
                    } else {
                        throw e;
                    }
                }

                // Prepare role update
                const uid = userRecord.uid;
                const userRef = admin.firestore().collection('users').doc(uid);
                const userSnap = await userRef.get();

                if (!userSnap.exists) {
                    // Create Firestore doc for new user
                    await userRef.set({
                        email: email,
                        displayName: name,
                        photoURL: userRecord.photoURL || null,
                        role: 'business_partner',
                        roles: ['business_partner'],
                        plan: 'free', // Default plan, maybe upgrade later?
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        organization: organization || ''
                    });
                    console.log(`Created Firestore profile for ${uid}`);

                    // Update application with account creation success
                    await admin.firestore().collection('partner_applications').doc(context.params.appId).update({
                        accountCreated: true,
                        accountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        createdUserId: uid,
                        accountCreationMessage: 'Account created successfully'
                    });
                } else {
                    // Update existing user
                    const userData = userSnap.data();
                    let currentRoles = userData?.roles || [];

                    // Migration support
                    if (userData?.role && !currentRoles.includes(userData.role)) {
                        currentRoles.push(userData.role);
                    }

                    if (!currentRoles.includes('business_partner')) {
                        currentRoles.push('business_partner');
                        await userRef.update({
                            roles: currentRoles,
                            role: 'business_partner', // Update legacy field too for safety
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        console.log(`Updated existing user ${uid} with business_partner role`);

                        // Update application with role assignment success
                        await admin.firestore().collection('partner_applications').doc(context.params.appId).update({
                            accountCreated: true,
                            accountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            createdUserId: uid,
                            accountCreationMessage: 'Role added to existing account'
                        });
                    } else {
                        console.log(`User ${uid} already has business_partner role`);

                        // Update application noting role already exists
                        await admin.firestore().collection('partner_applications').doc(context.params.appId).update({
                            accountCreated: true,
                            accountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            createdUserId: uid,
                            accountCreationMessage: 'User already has business_partner role'
                        });
                    }
                }

            } catch (error) {
                console.error("Error in onPartnerApplicationUpdated:", error);

                // Update application with error status
                try {
                    await admin.firestore().collection('partner_applications').doc(context.params.appId).update({
                        accountCreated: false,
                        accountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        accountCreationMessage: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    });
                } catch (updateError) {
                    console.error("Failed to update application with error status:", updateError);
                }
            }
        }
        return null;
    });
