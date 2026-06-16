import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { WorkModel } from '../types';

export type ScrapedRecommendedJob = {
    id: string;
    title: string;
    company: string;
    location: string;
    workModel: WorkModel;
    salary: string;
    jobType: string;
    seniority: string;
    postedAt: string | number | null;
    source: 'scraped';
    sourceLabel: string;
    applyUrl: string;
    description: string;
    matchedKeywords: string[];
    missingKeywords: string[];
    signals: string[];
    provider?: 'greenhouse' | 'lever' | 'ashby';
    sourceKey?: string;
    sourceJobId?: string;
    validationStatus?: 'valid' | 'stale' | 'expired' | 'blocked' | 'unknown';
    validatedAt?: number | null;
    finalUrl?: string;
    validationReason?: string;
    fetchedAt?: number | null;
    updatedAt?: number | null;
};

export type ValidatedJobOpenResult = {
    jobId: string;
    finalUrl: string;
    validationStatus: 'valid';
    validationReason: string;
    validatedAt: number;
};

export type ValidatedExternalJobLinkResult = {
    finalUrl: string;
    validationStatus: 'valid';
    validationReason: string;
    validatedAt: number;
};

export const getRecommendedScrapedJobs = async (
    limit = 40,
    profileKeywords: string[] = []
): Promise<ScrapedRecommendedJob[]> => {
    const callable = httpsCallable<{ limit: number; profileKeywords?: string[] }, { jobs: ScrapedRecommendedJob[] }>(
        functions,
        'getRecommendedScrapedJobs'
    );

    const result = await callable({ limit, profileKeywords: profileKeywords.slice(0, 40) });
    return result.data.jobs || [];
};

export const validateRecommendedJobOpen = async (jobId: string): Promise<ValidatedJobOpenResult> => {
    const callable = httpsCallable<{ jobId: string }, ValidatedJobOpenResult>(
        functions,
        'validateRecommendedJobOpen'
    );

    const result = await callable({ jobId });
    return result.data;
};

export const validateExternalJobLink = async (input: {
    url: string;
    title: string;
    company?: string;
}): Promise<ValidatedExternalJobLinkResult> => {
    const callable = httpsCallable<typeof input, ValidatedExternalJobLinkResult>(
        functions,
        'validateExternalJobLink'
    );

    const result = await callable(input);
    return result.data;
};
