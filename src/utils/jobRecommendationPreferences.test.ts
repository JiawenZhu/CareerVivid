import { describe, expect, it } from 'vitest';
import { deriveJobRecommendationPreferences, getJobLocationFit } from './jobRecommendationPreferences';

describe('job recommendation preferences', () => {
    it('uses saved application preferences before resume contact details', () => {
        const preferences = deriveJobRecommendationPreferences({
            personalDetails: { city: 'Chicago', country: 'United States' },
        }, {
            identity: { city: 'Toronto', state: 'Ontario', country: 'Canada' },
            relocationRemote: { preferredLocations: ['Vancouver, Canada'], workModelPreference: 'hybrid' },
        });

        expect(preferences).toEqual({
            country: 'Canada',
            locations: ['Vancouver, Canada', 'Toronto, Ontario, Canada', 'Toronto'],
            workModelPreference: 'hybrid',
        });
    });

    it('prioritizes an exact preferred location ahead of a country-wide role', () => {
        const preferences = {
            country: 'United States',
            locations: ['Chicago, Illinois, United States'],
            workModelPreference: 'flexible' as const,
        };

        expect(getJobLocationFit({ location: 'Chicago, IL, United States', workModel: 'Hybrid' }, preferences).score)
            .toBeGreaterThan(getJobLocationFit({ location: 'New York, United States', workModel: 'On-site' }, preferences).score);
    });
});
