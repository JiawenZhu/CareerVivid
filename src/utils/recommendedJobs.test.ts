import { describe, expect, it } from 'vitest';
import {
    buildRecommendedJobCollections,
    filterVisibleRecommendedJobs,
    getRecommendedJobIdentityKeys,
    hasExternalJobUrl,
    normalizeApplyUrlKey,
    type RecommendedJobForFiltering,
} from './recommendedJobs';

type TestJob = RecommendedJobForFiltering & {
    applicationStatus?: 'To Apply' | 'Applied';
};

const job = (overrides: Partial<TestJob> = {}): TestJob => ({
    id: 'job-1',
    title: 'Frontend Engineer',
    company: 'Acme',
    location: 'Remote',
    applyUrl: 'https://jobs.example.com/acme/frontend-engineer',
    source: 'scraped',
    description: 'Build React and TypeScript product surfaces.',
    matchedKeywords: ['React', 'TypeScript'],
    missingKeywords: ['GraphQL'],
    matchScore: 91,
    validationStatus: 'valid',
    ...overrides,
});

describe('recommended job filtering', () => {
    it('only shows apply-ready scraped jobs in the recommended feed', () => {
        const scrapedJobs = [
            job({ id: 'valid', matchScore: 85 }),
            job({ id: 'expired', validationStatus: 'expired', applyUrl: 'https://jobs.example.com/acme/expired' }),
            job({ id: 'stale', validationStatus: 'stale', applyUrl: 'https://jobs.example.com/acme/stale' }),
            job({ id: 'unknown', validationStatus: 'unknown', applyUrl: 'https://jobs.example.com/acme/unknown' }),
            job({ id: 'blocked', validationStatus: 'blocked', applyUrl: 'https://jobs.example.com/acme/blocked' }),
            job({ id: 'missing-url', applyUrl: '/job-tracker' }),
            job({ id: 'not-yet-validated', validationStatus: undefined, applyUrl: 'https://jobs.example.com/acme/unvalidated' }),
        ];

        const collections = buildRecommendedJobCollections({
            scrapedJobs,
            trackerJobs: [],
            hiddenJobIds: new Set(),
            isAppliedTrackerJob: () => false,
        });

        expect(collections.recommendedFeedJobs.map((item) => item.id)).toEqual(['valid']);
    });

    it('deduplicates recommendations against tracker jobs by URL and company/title', () => {
        const trackerJobs = [
            job({
                id: 'tracker-same-url',
                source: 'extension',
                applyUrl: ' https://jobs.example.com/acme/frontend-engineer ',
                validationStatus: undefined,
            }),
            job({
                id: 'tracker-same-role',
                title: 'Full Stack Engineer',
                company: 'Example & Co',
                source: 'extension',
                applyUrl: '/job-tracker',
                validationStatus: undefined,
            }),
        ];
        const scrapedJobs = [
            job({ id: 'same-url' }),
            job({
                id: 'same-role',
                title: 'Full Stack Engineer',
                company: 'Example and Co',
                applyUrl: 'https://jobs.example.com/example/full-stack',
            }),
            job({
                id: 'unique',
                title: 'Platform Engineer',
                company: 'OtherCo',
                applyUrl: 'https://jobs.example.com/other/platform',
            }),
        ];

        const collections = buildRecommendedJobCollections({
            scrapedJobs,
            trackerJobs,
            hiddenJobIds: new Set(['hidden']),
            isAppliedTrackerJob: () => false,
        });

        expect(collections.recommendedFeedJobs.map((item) => item.id)).toEqual(['unique']);
    });

    it('builds saved, applied, and external tracker collections separately from recommendations', () => {
        const trackerJobs = [
            job({
                id: 'tracker-applied',
                title: 'Applied Engineer',
                company: 'AppliedCo',
                source: 'extension',
                applyUrl: 'https://jobs.example.com/applied/engineer',
                applicationStatus: 'Applied',
                validationStatus: undefined,
            }),
            job({
                id: 'tracker-internal',
                title: 'Internal Job',
                company: 'InternalCo',
                source: 'extension',
                applyUrl: '/job-tracker',
                validationStatus: undefined,
            }),
            job({
                id: 'tracker-hidden',
                title: 'Hidden Job',
                company: 'HiddenCo',
                source: 'extension',
                applyUrl: 'https://jobs.example.com/hidden/job',
                validationStatus: undefined,
            }),
            job({
                id: 'tracker-stale-link',
                title: 'Stale Job',
                company: 'StaleCo',
                source: 'extension',
                applyUrl: 'https://jobs.example.com/stale/job',
                validationStatus: 'unknown',
            }),
        ];

        const collections = buildRecommendedJobCollections({
            scrapedJobs: [job({
                id: 'scraped-valid',
                title: 'New Platform Role',
                company: 'NewCo',
                applyUrl: 'https://jobs.example.com/new/role',
            }), job({
                id: 'fresh-version-of-stale-tracker-job',
                title: 'Stale Job',
                company: 'StaleCo',
                applyUrl: 'https://jobs.example.com/stale/job',
            })],
            trackerJobs,
            hiddenJobIds: new Set(['tracker-hidden']),
            isAppliedTrackerJob: (item) => item.applicationStatus === 'Applied',
        });

        expect(collections.trackerDisplayJobs.map((item) => item.id)).toEqual(['tracker-applied', 'tracker-internal']);
        expect(collections.appliedTrackerJobs.map((item) => item.id)).toEqual(['tracker-applied']);
        expect(collections.externalTrackerJobs.map((item) => item.id)).toEqual(['tracker-applied']);
        expect(collections.recommendedFeedJobs.map((item) => item.id)).toEqual(['scraped-valid', 'fresh-version-of-stale-tracker-job']);
    });

    it('filters tabs by search and keeps saved pending recommendations visible', () => {
        const scrapedJobs = [
            job({ id: 'scraped-a', company: 'Acme', matchScore: 88, missingKeywords: ['GraphQL'] }),
            job({
                id: 'scraped-b',
                company: 'Beta',
                title: 'Backend Engineer',
                applyUrl: 'https://jobs.example.com/beta/backend',
                missingKeywords: ['Go'],
                matchScore: 95,
            }),
        ];
        const trackerJobs = [
            job({
                id: 'tracker-saved',
                source: 'extension',
                company: 'SavedCo',
                applyUrl: '/job-tracker',
                matchScore: 70,
                validationStatus: undefined,
            }),
        ];
        const collections = buildRecommendedJobCollections({
            scrapedJobs,
            trackerJobs,
            hiddenJobIds: new Set(),
            isAppliedTrackerJob: () => false,
        });

        expect(filterVisibleRecommendedJobs({
            activeTab: 'recommended',
            searchQuery: '',
            savedSeedJobIds: new Set(),
            collections,
        }).map((item) => item.id)).toEqual(['scraped-b', 'scraped-a']);

        expect(filterVisibleRecommendedJobs({
            activeTab: 'recommended',
            searchQuery: 'graphql',
            savedSeedJobIds: new Set(),
            collections,
        }).map((item) => item.id)).toEqual(['scraped-a']);

        expect(filterVisibleRecommendedJobs({
            activeTab: 'saved',
            searchQuery: '',
            savedSeedJobIds: new Set(['scraped-a']),
            collections,
        }).map((item) => item.id)).toEqual(['scraped-a', 'tracker-saved']);
    });

    it('normalizes external apply links and role identities for duplicate checks', () => {
        expect(hasExternalJobUrl(' https://boards.greenhouse.io/acme/jobs/123 ')).toBe(true);
        expect(hasExternalJobUrl('/job-tracker')).toBe(false);
        expect(normalizeApplyUrlKey(' https://www.greenhouse.io/acme/jobs/123/?utm_source=test ')).toBe('url:greenhouse.io/acme/jobs/123');
        expect(getRecommendedJobIdentityKeys(job({ title: 'Full-Stack Engineer', company: 'A & B' }))).toContain('role:a and b:full stack engineer');
    });
});
