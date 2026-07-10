import { describe, expect, it } from 'vitest';
import {
    isReferralCacheFresh,
    PERSONAL_REFERRAL_LIMIT,
    readReferralCache,
    writeReferralCache,
    type ReferralStats,
} from './referralCache';

const stats: ReferralStats = {
    code: 'CV-1234',
    totalReferred: 2,
    maxReferrals: 15,
    referredUsers: [],
};

describe('referralCache', () => {
    it('stores and retrieves referral data for the signed-in user only', () => {
        const cached = writeReferralCache('user-one', stats);

        expect(readReferralCache('user-one')).toEqual(cached);
        expect(readReferralCache('user-two')).toBeNull();
    });

    it('marks expired records as stale without discarding the last visible data', () => {
        const cached = writeReferralCache('user-one', stats);

        expect(isReferralCacheFresh(cached, cached.cachedAt + 1)).toBe(true);
        expect(isReferralCacheFresh(cached, cached.cachedAt + 5 * 60 * 1000)).toBe(false);
    });

    it('upgrades cached five-referral records without waiting for a network refresh', () => {
        window.localStorage.setItem('careervivid:referrals:user-one', JSON.stringify({
            code: 'CV-1234',
            cachedAt: Date.now(),
            stats: { ...stats, maxReferrals: 5 },
        }));

        expect(readReferralCache('user-one')?.stats.maxReferrals).toBe(PERSONAL_REFERRAL_LIMIT);
    });
});
