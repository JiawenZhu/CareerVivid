import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment, arrayUnion, Timestamp } from 'firebase/firestore';

const FUNCTIONS_URL = 'https://us-west1-jastalk-firebase.cloudfunctions.net';

/**
 * Generate a random 8-character alphanumeric referral code (Legacy - now handled by backend)
 */
function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Ensure unique referral code and create it in Firestore (Legacy - now handled by backend)
 */
export async function ensureUniqueReferralCode(userId: string): Promise<string> {
    let code = generateReferralCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const codeDoc = await getDoc(doc(db, 'referralCodes', code));
        if (!codeDoc.exists()) {
            // Code is unique, create it
            await setDoc(doc(db, 'referralCodes', code), {
                code,
                userId,
                createdAt: serverTimestamp(),
                usedCount: 0,
                maxUses: 5,
                referredUsers: []
            });

            // Update user profile with merge to create nested fields
            await setDoc(doc(db, 'users', userId), {
                referralCode: code,
                referralStats: {
                    totalReferred: 0,
                    maxReferrals: 5,
                    referredUsers: []
                }
            }, { merge: true });

            return code;
        }
        code = generateReferralCode();
        attempts++;
    }

    throw new Error('Failed to generate unique referral code');
}

/**
 * Get or create referral code for a user (via Backend API)
 */
export async function getUserReferralCode(userId: string): Promise<string> {
    // We now use the unified stats endpoint which handles lazy generation
    const stats = await getReferralStats(userId);
    return stats.code;
}

/**
 * Validate referral code and check capacity
 */
export async function validateReferralCode(code: string): Promise<{
    valid: boolean;
    error?: string;
    referrerId?: string;
}> {
    const codeDoc = await getDoc(doc(db, 'referralCodes', code));

    if (!codeDoc.exists()) {
        return { valid: false, error: 'Invalid referral code' };
    }

    const codeData = codeDoc.data();

    if (codeData.usedCount >= codeData.maxUses) {
        return { valid: false, error: 'Referral limit reached' };
    }

    return { valid: true, referrerId: codeData.userId };
}

/**
 * Apply referral rewards to both new user and referrer
 */
export async function applyReferralRewards(
    newUserId: string,
    newUserEmail: string,
    referralCode: string
): Promise<void> {
    // Validate code
    const validation = await validateReferralCode(referralCode);
    if (!validation.valid || !validation.referrerId) {
        throw new Error(validation.error || 'Invalid referral code');
    }

    const referrerId = validation.referrerId;

    // Prevent self-referral
    if (referrerId === newUserId) {
        throw new Error('Cannot refer yourself');
    }

    const now = Date.now();

    // Reward new user: 2 months Premium
    const newUserExpiry = new Date(now + 60 * 24 * 60 * 60 * 1000); // 60 days
    await updateDoc(doc(db, 'users', newUserId), {
        plan: 'pro_monthly',
        expiresAt: Timestamp.fromDate(newUserExpiry),
        referredBy: referralCode,
        referredByUid: referrerId
    });

    // Reward referrer: 1 month extension
    const referrerDoc = await getDoc(doc(db, 'users', referrerId));
    const referrerData = referrerDoc.data();

    // If referrer has existing expiry, extend it; otherwise start from now
    const currentExpiry = referrerData?.expiresAt?.toMillis() || now;
    const newExpiry = new Date(Math.max(currentExpiry, now) + 30 * 24 * 60 * 60 * 1000); // +30 days

    await updateDoc(doc(db, 'users', referrerId), {
        plan: 'pro_monthly', // Ensure they have a plan
        expiresAt: Timestamp.fromDate(newExpiry),
        'referralStats.totalReferred': increment(1),
        'referralStats.referredUsers': arrayUnion(newUserId)
    });

    // Update referral code tracking
    await updateDoc(doc(db, 'referralCodes', referralCode), {
        usedCount: increment(1),
        referredUsers: arrayUnion({
            uid: newUserId,
            email: newUserEmail,
            signupDate: serverTimestamp()
        })
    });
}

/**
 * Get referral stats for a user via Backend Cloud Function
 */
export async function getReferralStats(userId: string): Promise<{
    code: string;
    totalReferred: number;
    maxReferrals: number;
    referredUsers: Array<{ uid: string; email: string; signupDate: any }>;
}> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }

    try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${FUNCTIONS_URL}/cliReferralStats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[referralService] Error fetching stats from API:', error);
        // Fallback to empty stats if API fails, but usually we want to know why it failed
        throw error;
    }
}
