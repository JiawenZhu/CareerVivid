import { doc, getDoc, updateDoc, Timestamp, increment } from 'firebase/firestore';
import { db } from '../firebase';

export interface AIUsageData {
    count: number;
    lastResetDate: Timestamp;
    monthlyLimit: number;
}

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

    // Initialize if doesn't exist
    if (!aiUsage) {
        const defaultUsage: AIUsageData = {
            count: 0,
            lastResetDate: Timestamp.now(),
            monthlyLimit: 10 // Default for free users
        };

        await updateDoc(userRef, { aiUsage: defaultUsage });
        return defaultUsage;
    }

    // Check if month has passed, reset if needed
    const now = new Date();
    const lastReset = aiUsage.lastResetDate.toDate();
    const monthsPassed = (now.getFullYear() - lastReset.getFullYear()) * 12 +
        (now.getMonth() - lastReset.getMonth());

    // Determine correct limit based on plan
    let expectedLimit = 10;
    const plan = userData.plan || 'free';
    if (plan === 'pro_sprint') expectedLimit = 100;
    else if (plan === 'pro_monthly') expectedLimit = 300;

    // Self-healing: If limit is incorrect (e.g. user upgraded but DB didn't sync), fix it.
    // Also reset if month passed.
    if (monthsPassed >= 1 || aiUsage.monthlyLimit !== expectedLimit) {
        const resetUsage: AIUsageData = {
            count: monthsPassed >= 1 ? 0 : aiUsage.count, // Reset count only if month passed
            lastResetDate: monthsPassed >= 1 ? Timestamp.now() : aiUsage.lastResetDate,
            monthlyLimit: expectedLimit
        };

        await updateDoc(userRef, { aiUsage: resetUsage });
        return resetUsage;
    }

    return aiUsage as AIUsageData;
};

/**
 * Increment AI usage count for a user
 * Throws error if limit is reached
 */
export const incrementAIUsage = async (userId: string): Promise<void> => {
    const usage = await getAIUsage(userId);

    if (usage.count >= usage.monthlyLimit) {
        throw new Error('Monthly AI usage limit reached');
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        'aiUsage.count': increment(1)
    });
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
export const updateAILimit = async (userId: string, plan: 'free' | 'pro_sprint' | 'pro_monthly'): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    let limit = 10; // Default for free

    if (plan === 'pro_sprint') {
        limit = 100;
    } else if (plan === 'pro_monthly') {
        limit = 300;
    }

    await updateDoc(userRef, {
        'aiUsage.monthlyLimit': limit
    });
};
