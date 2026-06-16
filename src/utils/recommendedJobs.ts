export type RecommendationSource = 'scraped' | 'extension' | 'partner';

export type RecommendationTab = 'recommended' | 'saved' | 'applied' | 'external';

export type RecommendedJobForFiltering = {
    id: string;
    title: string;
    company: string;
    location?: string;
    applyUrl: string;
    source: RecommendationSource;
    description?: string;
    matchedKeywords?: string[];
    missingKeywords?: string[];
    matchScore?: number;
    validationStatus?: 'valid' | 'stale' | 'expired' | 'blocked' | 'unknown';
};

export type RecommendedJobCollections<T extends RecommendedJobForFiltering> = {
    recommendedFeedJobs: T[];
    trackerDisplayJobs: T[];
    appliedTrackerJobs: T[];
    externalTrackerJobs: T[];
};

export const hasExternalJobUrl = (value: string): boolean => /^https?:\/\//i.test(value.trim());

export const isApplyReadyRecommendedJob = (job: RecommendedJobForFiltering): boolean => (
    job.source === 'scraped'
    && job.validationStatus === 'valid'
    && hasExternalJobUrl(job.applyUrl)
);

export const isBrokenJobLinkStatus = (status?: RecommendedJobForFiltering['validationStatus']): boolean => (
    status === 'expired' || status === 'stale' || status === 'unknown'
);

export const normalizeComparableText = (value: string): string => (
    value
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ')
);

export const normalizeApplyUrlKey = (value: string): string => {
    if (!hasExternalJobUrl(value)) return '';

    try {
        const url = new URL(value.trim());
        const path = url.pathname.replace(/\/+$/, '');
        if (!path || path === '/') return '';
        return `url:${url.hostname.replace(/^www\./, '').toLowerCase()}${path.toLowerCase()}`;
    } catch {
        return '';
    }
};

export const getRecommendedJobIdentityKeys = (
    job: Pick<RecommendedJobForFiltering, 'title' | 'company' | 'applyUrl'>
): string[] => {
    const keys = new Set<string>();
    const urlKey = normalizeApplyUrlKey(job.applyUrl);
    if (urlKey) keys.add(urlKey);

    const titleKey = normalizeComparableText(job.title);
    const companyKey = normalizeComparableText(job.company);
    if (titleKey && companyKey) keys.add(`role:${companyKey}:${titleKey}`);

    return [...keys];
};

export const buildRecommendedJobCollections = <T extends RecommendedJobForFiltering>({
    scrapedJobs,
    trackerJobs,
    hiddenJobIds,
    isAppliedTrackerJob,
}: {
    scrapedJobs: T[];
    trackerJobs: T[];
    hiddenJobIds: Set<string>;
    isAppliedTrackerJob: (job: T) => boolean;
}): RecommendedJobCollections<T> => {
    const trackerDisplayJobs = trackerJobs.filter((job) => (
        !hiddenJobIds.has(job.id)
        && !isBrokenJobLinkStatus(job.validationStatus)
    ));
    const trackerIdentityKeys = new Set(trackerDisplayJobs.flatMap((job) => getRecommendedJobIdentityKeys(job)));
    const recommendedFeedJobs = scrapedJobs.filter(
        (job) => isApplyReadyRecommendedJob(job)
            && !hiddenJobIds.has(job.id)
            && !getRecommendedJobIdentityKeys(job).some((key) => trackerIdentityKeys.has(key))
    );

    return {
        recommendedFeedJobs,
        trackerDisplayJobs,
        appliedTrackerJobs: trackerDisplayJobs.filter(isAppliedTrackerJob),
        externalTrackerJobs: trackerDisplayJobs.filter((job) => hasExternalJobUrl(job.applyUrl)),
    };
};

export const filterVisibleRecommendedJobs = <T extends RecommendedJobForFiltering>({
    activeTab,
    searchQuery,
    savedSeedJobIds,
    collections,
}: {
    activeTab: RecommendationTab;
    searchQuery: string;
    savedSeedJobIds: Set<string>;
    collections: RecommendedJobCollections<T>;
}): T[] => {
    const pendingSavedJobs = collections.recommendedFeedJobs.filter((job) => savedSeedJobIds.has(job.id));
    const tabJobs = activeTab === 'saved'
        ? [...collections.trackerDisplayJobs, ...pendingSavedJobs]
        : activeTab === 'applied'
            ? collections.appliedTrackerJobs
            : activeTab === 'external'
                ? collections.externalTrackerJobs
                : collections.recommendedFeedJobs;
    const query = searchQuery.trim().toLowerCase();

    return tabJobs
        .filter((job) => {
            if (!query) return true;
            return [
                job.title,
                job.company,
                job.location || '',
                job.description || '',
                ...(job.matchedKeywords || []),
                ...(job.missingKeywords || []),
            ].some((value) => value.toLowerCase().includes(query));
        })
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
};
