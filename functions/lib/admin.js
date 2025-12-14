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
exports.grantAcademicPartnerRole = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const nanoid_1 = require("nanoid");
/**
 * Promoting a user to "Academic Partner".
 * - Sets role to 'academic_partner'
 * - Generates a unique referral code
 * - Grants 12 months of Premium access
 */
exports.grantAcademicPartnerRole = functions.region('us-west1').https.onCall(async (data, context) => {
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
        const referralCode = (0, nanoid_1.nanoid)(8);
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
    }
    catch (error) {
        console.error("Error granting academic partner role:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=admin.js.map