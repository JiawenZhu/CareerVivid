export interface ReferralUser {
    uid: string;
    email: string;
    signupDate: unknown;
}

export interface ReferralStats {
    code: string;
    totalReferred: number;
    maxReferrals: number;
    referredUsers: ReferralUser[];
}

export interface ReferralCacheEntry {
    code: string;
    stats: ReferralStats;
    cachedAt: number;
}

export const REFERRAL_CACHE_TTL_MS = 5 * 60 * 1000;
export const PERSONAL_REFERRAL_LIMIT = 15;

const getCacheKey = (userId: string) => `careervivid:referrals:${userId}`;

export const readReferralCache = (userId: string): ReferralCacheEntry | null => {
    if (typeof window === 'undefined') return null;

    try {
        const rawValue = window.localStorage.getItem(getCacheKey(userId));
        if (!rawValue) return null;

        const cached = JSON.parse(rawValue) as ReferralCacheEntry;
        if (
            typeof cached.code !== 'string' ||
            typeof cached.cachedAt !== 'number' ||
            typeof cached.stats?.totalReferred !== 'number' ||
            typeof cached.stats?.maxReferrals !== 'number' ||
            !Array.isArray(cached.stats?.referredUsers)
        ) {
            window.localStorage.removeItem(getCacheKey(userId));
            return null;
        }

        if (cached.stats.maxReferrals < PERSONAL_REFERRAL_LIMIT) {
            cached.stats = { ...cached.stats, maxReferrals: PERSONAL_REFERRAL_LIMIT };
            window.localStorage.setItem(getCacheKey(userId), JSON.stringify(cached));
        }

        return cached;
    } catch {
        return null;
    }
};

export const writeReferralCache = (userId: string, stats: ReferralStats): ReferralCacheEntry => {
    const cacheEntry: ReferralCacheEntry = {
        code: stats.code,
        stats,
        cachedAt: Date.now(),
    };

    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(getCacheKey(userId), JSON.stringify(cacheEntry));
        } catch {
            // Private browsing or storage limits should not block referral access.
        }
    }

    return cacheEntry;
};

export const isReferralCacheFresh = (
    cached: ReferralCacheEntry,
    now = Date.now(),
    ttlMs = REFERRAL_CACHE_TTL_MS,
) => now - cached.cachedAt < ttlMs;
