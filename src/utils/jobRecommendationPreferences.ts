import type { ResumeData } from '../types';

export type WorkModelPreference = 'remote' | 'hybrid' | 'onsite' | 'flexible';

export type JobRecommendationPreferences = {
    country: string;
    locations: string[];
    workModelPreference: WorkModelPreference;
};

type SavedApplicationProfile = {
    identity?: {
        city?: string;
        state?: string;
        country?: string;
    };
    relocationRemote?: {
        preferredLocations?: string[];
        workModelPreference?: WorkModelPreference;
    };
};

const clean = (value: string | undefined): string => value?.trim() || '';

const unique = (values: string[]): string[] => Array.from(new Set(values.map(clean).filter(Boolean)));

export const deriveJobRecommendationPreferences = (
    resume: Partial<ResumeData> | null,
    profile: SavedApplicationProfile | null
): JobRecommendationPreferences => {
    const profileIdentity = profile?.identity;
    const resumeIdentity = resume?.personalDetails;
    const country = clean(profileIdentity?.country) || clean(resumeIdentity?.country);
    const city = clean(profileIdentity?.city) || clean(resumeIdentity?.city);
    const state = clean(profileIdentity?.state);
    const preferredLocations = profile?.relocationRemote?.preferredLocations || [];
    const locations = unique([
        ...preferredLocations,
        [city, state, country].filter(Boolean).join(', '),
        city,
    ]);

    return {
        country,
        locations,
        workModelPreference: profile?.relocationRemote?.workModelPreference || 'flexible',
    };
};

const normalize = (value: string): string => value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const countryAliases = (country: string): string[] => {
    const normalized = normalize(country);
    if (['united states', 'usa', 'us'].includes(normalized)) return ['united states', 'usa', 'us'];
    if (['united kingdom', 'uk', 'great britain'].includes(normalized)) return ['united kingdom', 'uk', 'great britain'];
    return normalized ? [normalized] : [];
};

const includesLocation = (jobLocation: string, location: string): boolean => {
    const normalizedLocation = normalize(location);
    if (!normalizedLocation) return false;
    if (jobLocation.includes(normalizedLocation)) return true;

    const tokens = normalizedLocation.split(' ').filter((token) => token.length > 2);
    if (tokens.length > 0 && tokens.every((token) => jobLocation.includes(token))) return true;

    // Job boards frequently abbreviate state and province names. A saved
    // city preference is still a stronger signal than a country-wide match.
    return tokens.length > 1 && jobLocation.includes(tokens[0]);
};

export const getJobLocationFit = (
    job: { location: string; workModel: string },
    preferences: JobRecommendationPreferences
): { score: number; label: string | null } => {
    const jobLocation = normalize(`${job.location} ${job.workModel}`);
    const matchingLocation = preferences.locations.find((location) => includesLocation(jobLocation, location));
    const isRemote = job.workModel === 'Remote' || jobLocation.includes('remote');
    const countryMatch = countryAliases(preferences.country).some((country) => includesLocation(jobLocation, country));

    if (matchingLocation) return { score: 34, label: matchingLocation };
    if (countryMatch) return { score: 22, label: preferences.country };
    if (isRemote && preferences.workModelPreference === 'remote') return { score: 18, label: 'Remote' };
    if (isRemote && preferences.workModelPreference === 'flexible') return { score: 8, label: 'Remote' };
    if (job.workModel === 'Hybrid' && preferences.workModelPreference === 'hybrid') return { score: 12, label: 'Hybrid' };
    if (job.workModel === 'On-site' && preferences.workModelPreference === 'onsite') return { score: 12, label: 'On-site' };
    return { score: 0, label: null };
};

export const describeJobRecommendationPreferences = (preferences: JobRecommendationPreferences): string => {
    const location = preferences.locations[0] || preferences.country;
    const workModel = preferences.workModelPreference === 'flexible'
        ? ''
        : preferences.workModelPreference === 'onsite'
            ? 'On-site'
            : `${preferences.workModelPreference.charAt(0).toUpperCase()}${preferences.workModelPreference.slice(1)}`;
    return [location, workModel].filter(Boolean).join(' · ') || 'your resume';
};
