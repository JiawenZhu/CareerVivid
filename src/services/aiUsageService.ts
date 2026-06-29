import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FREE_PLAN_CREDIT_LIMIT, PRO_PLAN_CREDIT_LIMIT, PRO_MAX_PLAN_CREDIT_LIMIT, ENTERPRISE_PLAN_CREDIT_LIMIT, ENTERPRISE_MINIMUM_SEATS } from '../config/creditCosts';

export interface AIUsageData {
    count: number;
    lastResetDate: Timestamp;
    monthlyLimit: number;
}

const getExpectedLimit = (userData: any): number => {
    let expectedLimit = FREE_PLAN_CREDIT_LIMIT;
    const plan = userData.plan || 'free';

    if (plan === 'pro' || plan === 'premium' || plan === 'pro_monthly' || plan === 'pro_sprint') expectedLimit = PRO_PLAN_CREDIT_LIMIT;
    else if (plan === 'max' || plan === 'pro_max') expectedLimit = PRO_MAX_PLAN_CREDIT_LIMIT;
    else if (plan === 'enterprise') expectedLimit = Math.max(ENTERPRISE_MINIMUM_SEATS, userData.seats || 1) * ENTERPRISE_PLAN_CREDIT_LIMIT;

    const tokenCredits = userData.promotions?.tokenCredits || 0;
    return expectedLimit + tokenCredits;
};

/**
 * Get current AI usage for a user, automatically resetting if a month has passed
 */
export const getAIUsage = async (userId: string): Promise<AIUsageData> => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        throw new Error('User not found');
    }

    const userData = userSnap.data();
    const aiUsage = userData.aiUsage;
    const expectedLimit = getExpectedLimit(userData);

    if (!aiUsage) {
        return {
            count: 0,
            lastResetDate: Timestamp.now(),
            monthlyLimit: expectedLimit
        };
    }

    // Check if month has passed, reset if needed
    const now = new Date();
    const lastReset = aiUsage.lastResetDate?.toDate ? aiUsage.lastResetDate.toDate() : new Date();
    const monthsPassed = (now.getFullYear() - lastReset.getFullYear()) * 12 +
        (now.getMonth() - lastReset.getMonth());

    return {
        count: monthsPassed >= 1 ? 0 : Number(aiUsage.count || 0),
        lastResetDate: monthsPassed >= 1 ? Timestamp.now() : (aiUsage.lastResetDate || Timestamp.now()),
        monthlyLimit: expectedLimit
    };
};

/**
 * Increment AI usage count for a user
 * Throws error if limit is reached
 */
export const incrementAIUsage = async (userId: string, amount: number = 1): Promise<void> => {
    const usage = await getAIUsage(userId);

    if (usage.count + amount > usage.monthlyLimit) {
        throw new Error('Monthly AI usage limit reached');
    }

    // Credit counters are server-authoritative. Client writes to aiUsage/creditsUsed
    // are blocked by Firestore rules so users cannot grant themselves credits.
};

/**
 * Check if user can use AI features
 */
export const canUseAI = async (userId: string): Promise<boolean> => {
    const usage = await getAIUsage(userId);
    return usage.count < usage.monthlyLimit;
};

/**
 * Update monthly limit based on user's plan
 */
export const updateAILimit = async (userId: string, plan: string): Promise<void> => {
    void userId;
    void plan;
    // Credit limits are derived from the plan on read and enforced by backend functions.
};
