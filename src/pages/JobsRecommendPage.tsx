import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    ArrowUpRight,
    BadgeCheck,
    Briefcase,
    Building2,
    CheckCircle2,
    Clock3,
    ExternalLink,
    FileText,
    Gauge,
    Heart,
    LayoutDashboard,
    MapPin,
    Search,
    ShieldCheck,
    Sparkles,
    Target,
    XCircle,
} from 'lucide-react';
import AppLayout from '../components/Layout/AppLayout';
import { useJobTracker } from '../hooks/useJobTracker';
import { usePortfolios } from '../hooks/usePortfolios';
import { useResumes } from '../hooks/useResumes';
import { ApplicationStatus, JobApplicationData, JobLinkValidationStatus, NO_NEXT_ACTION, ResumeMatchAnalysis, WorkModel } from '../types';
import { navigate } from '../utils/navigation';
import { getRecommendedScrapedJobs, ScrapedRecommendedJob, validateRecommendedJobOpen } from '../services/scrapedJobsService';
import { isConfirmedBrokenJobLinkError } from '../utils/verifiedJobLink';
import {
    buildRecommendedJobCollections,
    filterVisibleRecommendedJobs,
    getRecommendedJobIdentityKeys,
    hasExternalJobUrl,
    type RecommendationSource,
    type RecommendationTab,
} from '../utils/recommendedJobs';
import { extractRecommendationProfileKeywords, getProfileKeywordFit } from '../utils/recommendationProfile';

type RecommendedJob = {
    id: string;
    title: string;
    company: string;
    location: string;
    workModel: WorkModel;
    salary: string;
    jobType: string;
    seniority: string;
    postedAt: string;
    source: RecommendationSource;
    sourceLabel: string;
    applyUrl: string;
    description: string;
    matchScore: number;
    matchLabel: 'Strong match' | 'Good match' | 'Partial match';
    matchReasons: string[];
    missingKeywords: string[];
    matchedKeywords: string[];
    signals: string[];
    sourceListingId?: string;
    validationStatus?: ScrapedRecommendedJob['validationStatus'];
    validatedAt?: number | null;
    finalUrl?: string;
    validationReason?: string;
};

type RecommendationPrepFields = Pick<JobApplicationData,
    | 'matchAnalyses'
    | 'nextAction'
    | 'nextActionDueDate'
    | 'notes'
    | 'prep_RoleOverview'
    | 'prep_MyStory'
    | 'prep_InterviewPrep'
    | 'prep_QuestionsForInterviewer'
>;

type ApplyLinkMessage = {
    tone: 'success' | 'error';
    text: string;
};

type ApplyValidationError = {
    message: string;
    shouldHideJob: boolean;
    status?: JobLinkValidationStatus;
};

const scoreTone = (score: number) => {
    if (score >= 88) return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200';
    if (score >= 75) return 'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-200';
    return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200';
};

const sourceLabel = (source: RecommendationSource) => {
    if (source === 'extension') return 'Saved from extension';
    if (source === 'partner') return 'Partner job';
    return 'Scraped job feed';
};

const getApplyValidationError = (error: unknown, source?: RecommendationSource): ApplyValidationError => {
    if (!error || typeof error !== 'object') {
        return {
            message: 'CareerVivid could not re-check this apply link.',
            shouldHideJob: false,
        };
    }

    const candidate = error as {
        code?: string;
        message?: string;
        details?: {
            validationStatus?: ScrapedRecommendedJob['validationStatus'];
            validationReason?: string;
        };
        customData?: {
            validationStatus?: ScrapedRecommendedJob['validationStatus'];
            validationReason?: string;
        };
    };
    const status = candidate.details?.validationStatus || candidate.customData?.validationStatus;
    const isClosed = status === 'expired' || status === 'stale' || status === 'unknown';
    const isTemporarilyBlocked = status === 'blocked';
    const failedPrecondition = candidate.code?.includes('failed-precondition') || candidate.code === 'functions/failed-precondition';
    const missingScrapedJob = source === 'scraped' && (candidate.code === 'functions/not-found' || candidate.code === 'not-found');

    return {
        message: candidate.details?.validationReason
            || candidate.customData?.validationReason
            || candidate.message
            || 'This job link could not be verified.',
        shouldHideJob: isClosed || missingScrapedJob || isConfirmedBrokenJobLinkError(error) || (source === 'scraped' && failedPrecondition && Boolean(status) && !isTemporarilyBlocked),
        status,
    };
};

const compactList = (items: string[], fallback: string): string => {
    const values = items.map((item) => item.trim()).filter(Boolean);
    return values.length ? values.join(', ') : fallback;
};

const buildRecommendationPrepFields = (job: RecommendedJob): RecommendationPrepFields => {
    const matched = compactList(job.matchedKeywords.slice(0, 6), 'general software delivery');
    const gaps = compactList(job.missingKeywords.slice(0, 6), 'no major gaps listed');
    const proof = compactList(job.matchReasons.slice(0, 3), 'CareerVivid profile and tracker signals match this role');
    const nextAction = job.missingKeywords.length || job.matchScore < 88
        ? `Tailor resume for ${job.missingKeywords.slice(0, 2).join(', ') || job.title}`
        : 'Verify apply link and send tailored application';
    const suggestedResumeAngle = `Position the resume around ${matched}, then address ${gaps}.`;
    const dueTomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
        nextAction,
        nextActionDueDate: dueTomorrow,
        notes: [
            'Recommendation packet',
            `Source: ${sourceLabel(job.source)}`,
            `Match score: ${job.matchScore}% (${job.matchLabel})`,
            `Resume angle: ${suggestedResumeAngle}`,
            `Missing keywords: ${gaps}`,
            hasExternalJobUrl(job.applyUrl) ? `Verified apply URL candidate: ${job.applyUrl}` : 'Apply URL needs review before submission.',
        ].join('\n'),
        prep_RoleOverview: [
            `Recommendation role brief for ${job.title} at ${job.company}.`,
            `Location/work model: ${job.location} / ${job.workModel}.`,
            `Seniority/type: ${job.seniority} / ${job.jobType}.`,
            `Compensation: ${job.salary || 'Not listed'}.`,
            `Why it is relevant: ${proof}.`,
            `Short description: ${job.description || 'No description listed.'}`,
        ].join('\n\n'),
        prep_MyStory: [
            `Lead with ${matched}.`,
            `Connect prior project ownership to ${job.company}'s ${job.title} scope.`,
            `Use proof points from the resume that show delivery, collaboration, and production-quality execution.`,
            `Do not claim direct experience with ${gaps} unless it is already supported by the resume.`,
        ].join('\n'),
        prep_InterviewPrep: [
            `Be ready to explain how your background maps to: ${matched}.`,
            `Prepare a short gap plan for: ${gaps}.`,
            `Review the job description for systems, product, and team signals before applying.`,
            'If the apply link fails verification, skip this job instead of searching manually.',
        ].join('\n'),
        prep_QuestionsForInterviewer: [
            `How does ${job.company} define success for this ${job.title} in the first 90 days?`,
            'Which parts of the stack or product surface need the most immediate ownership?',
            'What collaboration patterns exist between product, design, and engineering for this role?',
        ].join('\n'),
        matchAnalyses: {
            recommended: {
                totalKeywords: job.matchedKeywords.length + job.missingKeywords.length,
                matchedKeywords: job.matchedKeywords,
                missingKeywords: job.missingKeywords,
                matchPercentage: job.matchScore,
                summary: `${proof}. ${suggestedResumeAngle}`,
                verdict: job.matchLabel,
                strongMatches: job.matchReasons,
                experienceGaps: job.missingKeywords.map((keyword) => `Address ${keyword} with supported resume evidence or a concrete learning plan.`),
                suggestedResumeAngle,
                recommendedAction: job.matchScore >= 88 && !job.missingKeywords.length ? 'apply_now' : 'tailor_first',
            },
        },
    };
};

const mergeRecommendationPrepFields = (
    existingJob: JobApplicationData,
    recommendationFields: RecommendationPrepFields
): Partial<JobApplicationData> => {
    const patch: Partial<JobApplicationData> = {
        matchAnalyses: {
            ...(existingJob.matchAnalyses || {}),
            ...(recommendationFields.matchAnalyses || {}),
        },
    };

    if (!existingJob.nextAction || existingJob.nextAction === NO_NEXT_ACTION) {
        patch.nextAction = recommendationFields.nextAction;
    }
    if (!existingJob.nextActionDueDate) {
        patch.nextActionDueDate = recommendationFields.nextActionDueDate;
    }
    if (!existingJob.prep_RoleOverview?.trim()) {
        patch.prep_RoleOverview = recommendationFields.prep_RoleOverview;
    }
    if (!existingJob.prep_MyStory?.trim()) {
        patch.prep_MyStory = recommendationFields.prep_MyStory;
    }
    if (!existingJob.prep_InterviewPrep?.trim()) {
        patch.prep_InterviewPrep = recommendationFields.prep_InterviewPrep;
    }
    if (!existingJob.prep_QuestionsForInterviewer?.trim()) {
        patch.prep_QuestionsForInterviewer = recommendationFields.prep_QuestionsForInterviewer;
    }

    const existingNotes = existingJob.notes?.trim() || '';
    if (!existingNotes) {
        patch.notes = recommendationFields.notes;
    } else if (!existingNotes.includes('Recommendation packet')) {
        patch.notes = `${existingNotes}\n\n${recommendationFields.notes}`;
    }

    return patch;
};

const summarizeDescription = (value: string | undefined, fallback: string): string => {
    const normalized = (value || fallback)
        .replace(/Job Summary\s*/i, '')
        .replace(/Duties\s*&\s*Responsibilities[\s\S]*/i, '')
        .replace(/[•●▪]/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!normalized) return fallback;

    const firstSentences = normalized
        .split(/(?<=[.!?])\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .join(' ');
    const summary = firstSentences || normalized;

    if (summary.length <= 260) return summary;

    const clipped = summary.slice(0, 260);
    return `${clipped.slice(0, Math.max(0, clipped.lastIndexOf(' '))).trim()}...`;
};

const formatPostedAt = (value: string | number | null | undefined): string => {
    if (!value) return 'Recently';
    if (typeof value === 'string' && !value.includes('T')) return value;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recently';

    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 14) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const scoreScrapedJob = (
    job: ScrapedRecommendedJob,
    profileMatchedKeywords: string[],
    profileKeywordCount: number,
    profileMissingKeywords: string[]
): number => {
    const keywordScore = Math.min(46, profileMatchedKeywords.length * 8);
    const sourceScore = job.applyUrl ? 18 : 0;
    const freshnessScore = job.fetchedAt && Date.now() - job.fetchedAt < 7 * 24 * 60 * 60 * 1000 ? 12 : 6;
    const profileScore = profileKeywordCount
        ? Math.min(10, Math.round((profileMatchedKeywords.length / profileKeywordCount) * 10))
        : 0;
    const remoteScore = job.workModel === 'Remote' ? 8 : job.workModel === 'Hybrid' ? 5 : 3;
    const gapPenalty = Math.min(18, profileMissingKeywords.length * 4);
    return Math.max(35, Math.min(97, keywordScore + sourceScore + freshnessScore + profileScore + remoteScore - gapPenalty));
};

const scrapedJobToRecommended = (job: ScrapedRecommendedJob, profileKeywords: string[]): RecommendedJob => {
    const jobText = `${job.title} ${job.company} ${job.description} ${(job.matchedKeywords || []).join(' ')} ${(job.signals || []).join(' ')}`;
    const profileFit = getProfileKeywordFit(
        jobText,
        profileKeywords,
        [
            ...(job.matchedKeywords || []),
            ...(job.missingKeywords || []),
        ]
    );
    const matchedKeywords = profileFit.matchedKeywords.slice(0, 10);
    const missingKeywords = profileFit.missingKeywords.slice(0, 6);
    const score = scoreScrapedJob(job, matchedKeywords, profileKeywords.length, missingKeywords);
    return {
        id: `scraped-${job.id}`,
        title: job.title,
        company: job.company,
        location: job.location,
        workModel: job.workModel,
        salary: job.salary || 'Not listed',
        jobType: job.jobType || 'Full-time',
        seniority: job.seniority || 'Review fit',
        postedAt: formatPostedAt(job.fetchedAt || job.postedAt),
        source: 'scraped',
        sourceLabel: job.sourceLabel || 'Scraped job feed',
        applyUrl: job.finalUrl || job.applyUrl,
        description: summarizeDescription(job.description, 'Verified job listing from a public company career source.'),
        matchScore: score,
        matchLabel: score >= 88 ? 'Strong match' : score >= 75 ? 'Good match' : 'Partial match',
        matchReasons: [
            `${profileFit.matchedKeywords.length} profile signals found`,
            job.provider ? `${job.provider} career board verified` : 'Career source verified',
            job.workModel,
        ],
        missingKeywords,
        matchedKeywords,
        signals: job.signals?.length ? ['Link validated', ...job.signals].slice(0, 4) : [job.workModel, 'Scraped source', 'Link validated'],
        sourceListingId: job.id,
        validationStatus: job.validationStatus,
        validatedAt: job.validatedAt,
        finalUrl: job.finalUrl,
        validationReason: job.validationReason,
    };
};

const getAnalysisForJob = (job: JobApplicationData): ResumeMatchAnalysis | undefined => {
    const analyses = Object.values(job.matchAnalyses || {});
    return analyses[0];
};

const trackerJobToRecommended = (job: JobApplicationData): RecommendedJob => {
    const analysis = getAnalysisForJob(job);
    const score = Math.max(0, Math.min(100, Math.round(analysis?.matchPercentage || 72)));
    const workModel = job.workModel || (job.location?.toLowerCase().includes('remote') ? 'Remote' : 'On-site');

    return {
        id: `tracker-${job.id}`,
        title: job.jobTitle || 'Saved job',
        company: job.companyName || 'Unknown company',
        location: job.location || 'Location not listed',
        workModel,
        salary: job.salaryRange || 'Not listed',
        jobType: 'Tracked',
        seniority: job.interviewStage || 'Review fit',
        postedAt: 'Saved',
        source: 'extension',
        sourceLabel: 'CareerVivid tracker',
        applyUrl: job.applicationURL || job.jobPostURL || '/job-tracker',
        description: summarizeDescription(job.jobDescription || job.notes, 'Saved from your CareerVivid workspace.'),
        matchScore: score,
        matchLabel: score >= 88 ? 'Strong match' : score >= 75 ? 'Good match' : 'Partial match',
        matchReasons: analysis?.strongMatches?.slice(0, 3) || ['Already in your CareerVivid pipeline', 'Ready for resume tailoring'],
        missingKeywords: analysis?.missingKeywords?.slice(0, 6) || [],
        matchedKeywords: analysis?.matchedKeywords?.slice(0, 6) || [],
        signals: [job.applicationStatus || 'Tracked', workModel, job.priority ? `${job.priority} priority` : 'Application workspace ready'],
        validationStatus: job.externalLinkValidationStatus,
        validationReason: job.externalLinkValidationReason,
        validatedAt: job.externalLinkValidatedAt,
    };
};

const JobsRecommendPage: React.FC = () => {
    const { jobApplications, addJobApplication, updateJobApplication } = useJobTracker();
    const { resumes } = useResumes();
    const { portfolios } = usePortfolios();
    const [activeTab, setActiveTab] = useState<RecommendationTab>('recommended');
    const [searchQuery, setSearchQuery] = useState('');
    const [savingJobId, setSavingJobId] = useState<string | null>(null);
    const [savedSeedJobIds, setSavedSeedJobIds] = useState<Set<string>>(new Set());
    const [savedJobTrackerIds, setSavedJobTrackerIds] = useState<Record<string, string>>({});
    const [tailoringJobId, setTailoringJobId] = useState<string | null>(null);
    const [openingJobId, setOpeningJobId] = useState<string | null>(null);
    const [hiddenJobIds, setHiddenJobIds] = useState<Set<string>>(new Set());
    const [applyLinkMessage, setApplyLinkMessage] = useState<ApplyLinkMessage | null>(null);
    const [scrapedJobs, setScrapedJobs] = useState<ScrapedRecommendedJob[]>([]);
    const [isLoadingScrapedJobs, setIsLoadingScrapedJobs] = useState(true);
    const [scrapedJobsError, setScrapedJobsError] = useState('');

    const profileKeywords = useMemo(
        () => extractRecommendationProfileKeywords({ resumes, portfolios }),
        [portfolios, resumes]
    );
    const profileAssetCount = resumes.length + portfolios.length;
    const profileSignalCount = profileKeywords.length;
    const profileKeywordRequestKey = useMemo(
        () => profileKeywords.slice(0, 40).join('|'),
        [profileKeywords]
    );

    const trackerJobs = useMemo(() => jobApplications.map(trackerJobToRecommended), [jobApplications]);
    const scrapedRecommendedJobs = useMemo(
        () => scrapedJobs.map((job) => scrapedJobToRecommended(job, profileKeywords)),
        [profileKeywords, scrapedJobs]
    );
    const jobCollections = useMemo(
        () => buildRecommendedJobCollections({
            scrapedJobs: scrapedRecommendedJobs,
            trackerJobs,
            hiddenJobIds,
            isAppliedTrackerJob: (job) => {
                const trackerId = job.id.replace('tracker-', '');
                return jobApplications.some((application) => (
                    application.id === trackerId && application.applicationStatus === 'Applied'
                ));
            },
        }),
        [hiddenJobIds, jobApplications, scrapedRecommendedJobs, trackerJobs]
    );

    const {
        recommendedFeedJobs,
        trackerDisplayJobs,
        appliedTrackerJobs,
        externalTrackerJobs,
    } = jobCollections;

    const savedSeedPendingCount = useMemo(
        () => recommendedFeedJobs.filter(
            (job) => savedSeedJobIds.has(job.id)
        ).length,
        [recommendedFeedJobs, savedSeedJobIds]
    );

    useEffect(() => {
        let isMounted = true;

        const loadScrapedJobs = async () => {
            setIsLoadingScrapedJobs(true);
            setScrapedJobsError('');
            try {
                const jobs = await getRecommendedScrapedJobs(120, profileKeywords);
                if (isMounted) setScrapedJobs(jobs);
            } catch (error) {
                console.error('[JobsRecommendPage] Unable to load scraped jobs:', error);
                if (isMounted) setScrapedJobsError('The verified job feed is unavailable, so unverified jobs are hidden for now.');
            } finally {
                if (isMounted) setIsLoadingScrapedJobs(false);
            }
        };

        loadScrapedJobs();

        return () => {
            isMounted = false;
        };
    }, [profileKeywordRequestKey, profileKeywords]);

    const visibleJobs = useMemo(
        () => filterVisibleRecommendedJobs({
            activeTab,
            searchQuery,
            savedSeedJobIds,
            collections: jobCollections,
        }),
        [activeTab, jobCollections, savedSeedJobIds, searchQuery]
    );

    const getTrackedJob = (job: RecommendedJob): JobApplicationData | null => {
        if (job.source === 'extension' && job.id.startsWith('tracker-')) {
            const trackerId = job.id.replace(/^tracker-/, '');
            return jobApplications.find((application) => application.id === trackerId) || null;
        }

        if (savedJobTrackerIds[job.id]) {
            return jobApplications.find((application) => application.id === savedJobTrackerIds[job.id]) || null;
        }

        const identityKeys = getRecommendedJobIdentityKeys(job);
        return jobApplications.find((application) => {
            const applicationKeys = getRecommendedJobIdentityKeys({
                title: application.jobTitle || '',
                company: application.companyName || '',
                applyUrl: application.applicationURL || application.jobPostURL || '',
            });
            return applicationKeys.some((key) => identityKeys.includes(key));
        }) || null;
    };

    const updateValidatedScrapedJob = (sourceListingId: string, validation: Awaited<ReturnType<typeof validateRecommendedJobOpen>>) => {
        setScrapedJobs((currentJobs) => currentJobs.map((scrapedJob) => (
            scrapedJob.id === sourceListingId
                ? {
                    ...scrapedJob,
                    finalUrl: validation.finalUrl,
                    validationStatus: validation.validationStatus,
                    validationReason: validation.validationReason,
                    validatedAt: validation.validatedAt,
                }
                : scrapedJob
        )));
    };

    const verifyJobBeforePipeline = async (job: RecommendedJob): Promise<RecommendedJob | null> => {
        if (job.source !== 'scraped' || !job.sourceListingId || !hasExternalJobUrl(job.applyUrl)) {
            return job;
        }

        try {
            const validation = await validateRecommendedJobOpen(job.sourceListingId);
            updateValidatedScrapedJob(job.sourceListingId, validation);
            return {
                ...job,
                applyUrl: validation.finalUrl,
                finalUrl: validation.finalUrl,
                validationStatus: validation.validationStatus,
                validationReason: validation.validationReason,
                validatedAt: validation.validatedAt,
                signals: ['Checked now', ...job.signals.filter((signal) => signal !== 'Checked now')].slice(0, 4),
            };
        } catch (error) {
            const validationError = getApplyValidationError(error, job.source);
            if (validationError.shouldHideJob) {
                setHiddenJobIds((current) => new Set(current).add(job.id));
                setApplyLinkMessage({
                    tone: 'error',
                    text: `Removed ${job.company}'s stale listing. ${validationError.message}`,
                });
            } else {
                setApplyLinkMessage({
                    tone: 'error',
                    text: `${job.company}'s apply link could not be verified yet, so CareerVivid did not save it.`,
                });
            }
            window.setTimeout(() => setApplyLinkMessage(null), 7000);
            return null;
        }
    };

    const saveSeedJob = async (job: RecommendedJob): Promise<string | null> => {
        const cachedTrackerId = savedJobTrackerIds[job.id];
        const trackedJob = getTrackedJob(job);
        if (trackedJob) {
            const recommendationFields = buildRecommendationPrepFields(job);
            const patch = mergeRecommendationPrepFields(trackedJob, recommendationFields);
            if (Object.keys(patch).length) {
                await updateJobApplication(trackedJob.id, patch);
            }
            setSavedSeedJobIds((current) => new Set(current).add(job.id));
            setSavedJobTrackerIds((current) => ({ ...current, [job.id]: trackedJob.id }));
            return trackedJob.id;
        }
        if (cachedTrackerId) {
            setSavedSeedJobIds((current) => new Set(current).add(job.id));
            return cachedTrackerId;
        }

        setSavingJobId(job.id);
        try {
            const verifiedJob = await verifyJobBeforePipeline(job);
            if (!verifiedJob) return null;
            const recommendationFields = buildRecommendationPrepFields(verifiedJob);

            const newJobId = await addJobApplication({
                jobTitle: verifiedJob.title,
                companyName: verifiedJob.company,
                location: verifiedJob.location,
                jobPostURL: verifiedJob.applyUrl,
                applicationURL: verifiedJob.applyUrl,
                jobDescription: verifiedJob.description,
                applicationStatus: 'To Apply' as ApplicationStatus,
                workModel: verifiedJob.workModel,
                salaryRange: verifiedJob.salary,
                priority: verifiedJob.matchScore >= 88 ? 'High' : 'Medium',
                ...recommendationFields,
            });
            setSavedSeedJobIds((current) => new Set(current).add(job.id));
            if (newJobId) {
                setSavedJobTrackerIds((current) => ({ ...current, [job.id]: newJobId }));
            }
            return newJobId || null;
        } finally {
            setSavingJobId(null);
        }
    };

    const saveAndOpenTailorJob = async (job: RecommendedJob) => {
        setTailoringJobId(job.id);
        setApplyLinkMessage(null);

        try {
            const trackerId = await saveSeedJob(job);
            if (trackerId) {
                navigate(`/job-tracker?job=${encodeURIComponent(trackerId)}&action=tailor&q=${encodeURIComponent(job.company)}`);
                return;
            }
        } catch (error) {
            console.error('[JobsRecommendPage] Unable to open tailoring flow:', error);
            setApplyLinkMessage({
                tone: 'error',
                text: `Could not prepare ${job.company} for resume tailoring. Try saving the job first.`,
            });
        } finally {
            setTailoringJobId(null);
        }
    };

    const openApplyLink = async (job: RecommendedJob) => {
        if (!hasExternalJobUrl(job.applyUrl)) {
            navigate('/job-tracker');
            return;
        }

        setOpeningJobId(job.id);
        setApplyLinkMessage(null);

        try {
            const applyUrl = job.finalUrl || job.applyUrl;
            window.open(applyUrl, '_blank', 'noopener,noreferrer');

            setApplyLinkMessage({
                tone: 'success',
                text: `Opened ${job.company}'s apply page.`,
            });
        } catch (error) {
            console.error('[JobsRecommendPage] Unable to open apply link:', error);
            setApplyLinkMessage({
                tone: 'error',
                text: `Could not open ${job.company}'s apply page. Open the job tracker to review the saved URL.`,
            });
        } finally {
            setOpeningJobId(null);
            window.setTimeout(() => setApplyLinkMessage(null), 6000);
        }
    };

    const topScore = visibleJobs.length
        ? Math.max(...visibleJobs.map((job) => job.matchScore))
        : recommendedFeedJobs.length
            ? Math.max(...recommendedFeedJobs.map((job) => job.matchScore))
            : 0;
    const emptyStateCopy = activeTab === 'recommended'
        ? {
            title: 'No apply-ready jobs available',
            description: 'Recommended only shows listings whose external application page has been validated. Expired, broken, or generic careers links are removed before they reach the feed.',
        }
        : activeTab === 'saved'
            ? {
                title: 'No saved jobs in this tab',
                description: 'Save a recommended role or use the extension to add a job to your CareerVivid tracker.',
            }
            : activeTab === 'applied'
                ? {
                    title: 'No applied jobs yet',
                    description: 'Jobs you mark as Applied in the tracker will appear here.',
                }
                : {
                    title: 'No external apply links saved',
                    description: 'Saved tracker jobs with validated external application links will appear here.',
                };

    return (
        <AppLayout>
            <Helmet>
                <title>Recommended Jobs</title>
                <meta
                    name="description"
                    content="CareerVivid recommended jobs matched to your resume, portfolio, and saved application workspace."
                />
            </Helmet>

            <div className="min-h-screen bg-[#f7f1e7] text-[#211b16] dark:bg-[#1f1f1d] dark:text-[#f1eee7]">
                <header className="border-b border-stone-200/80 bg-[#fffaf1]/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#262522]/85">
                    <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                                    <Sparkles size={14} />
                                    {recommendedFeedJobs.length ? 'Apply-ready recommendations' : 'Recommended jobs'}
                                </div>
                                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                                    Jobs matched to your CareerVivid profile
                                </h1>
                                <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-stone-600 dark:text-slate-300">
                                    CareerVivid shows validated company and ATS jobs in Recommended, then keeps saved tracker roles in Saved and External.
                                </p>
                                {(isLoadingScrapedJobs || scrapedJobsError) && (
                                    <p className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-200">
                                        {isLoadingScrapedJobs ? 'Loading the latest scraped job feed...' : scrapedJobsError}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
                                <div className="rounded-2xl border border-stone-200 bg-white/75 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-500 dark:text-slate-400">Top match</div>
                                    <div className="mt-1 flex items-end gap-1 text-2xl font-black text-slate-950 dark:text-white">{topScore}<span className="pb-1 text-xs text-stone-500">%</span></div>
                                </div>
                                <div className="rounded-2xl border border-stone-200 bg-white/75 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-500 dark:text-slate-400">Profile assets</div>
                                    <div className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{profileAssetCount}</div>
                                </div>
                                <button
                                    onClick={() => navigate('/job-tracker')}
                                    className="rounded-2xl border border-indigo-200 bg-indigo-50 p-3 text-left shadow-sm transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70"
                                >
                                    <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-300">Pipeline</div>
                                    <div className="mt-1 flex items-center gap-1 text-sm font-black text-indigo-800 dark:text-indigo-100">
                                        Open <ArrowUpRight size={14} />
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap gap-2">
                                {[
                                    ['recommended', 'Recommended', recommendedFeedJobs.length],
                                    ['saved', 'Saved', trackerDisplayJobs.length + savedSeedPendingCount],
                                    ['applied', 'Applied', appliedTrackerJobs.length],
                                    ['external', 'External', externalTrackerJobs.length],
                                ].map(([id, label, count]) => (
                                    <button
                                        key={id}
                                        onClick={() => setActiveTab(id as typeof activeTab)}
                                        className={`rounded-full border px-4 py-2 text-xs font-extrabold transition ${activeTab === id
                                            ? 'border-slate-900 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                                            : 'border-stone-200 bg-white/70 text-stone-600 hover:border-stone-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white'
                                            }`}
                                    >
                                        {label} <span className="ml-1 opacity-70">{count}</span>
                                    </button>
                                ))}
                            </div>

                            <label className="relative block w-full lg:max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                                <input
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search roles, companies, skills..."
                                    className="h-11 w-full rounded-2xl border border-stone-200 bg-white/80 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-900/70 dark:text-white dark:focus:border-indigo-700 dark:focus:ring-indigo-950"
                                />
                            </label>
                        </div>
                    </div>
                </header>

                <main className="mx-auto grid max-w-[1480px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
                    <section className="space-y-4">
                        {applyLinkMessage && (
                            <div
                                role="status"
                                className={`rounded-2xl border px-4 py-3 text-sm font-bold leading-6 shadow-sm ${
                                    applyLinkMessage.tone === 'error'
                                        ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100'
                                        : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100'
                                }`}
                            >
                                {applyLinkMessage.text}
                            </div>
                        )}

                        {!isLoadingScrapedJobs && visibleJobs.length === 0 && (
                            <div className="rounded-3xl border border-stone-200/80 bg-white/80 p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-200">
                                    <ShieldCheck size={24} />
                                </div>
                                <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">{emptyStateCopy.title}</h2>
                                <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-stone-600 dark:text-slate-300">
                                    {emptyStateCopy.description}
                                </p>
                            </div>
                        )}
                        {visibleJobs.map((job) => {
                            const isSaved = job.source === 'extension' || savedSeedJobIds.has(job.id);
                            const hasExternalApplyUrl = hasExternalJobUrl(job.applyUrl);
                            return (
                                <article
                                    key={job.id}
                                    className="grid gap-4 rounded-3xl border border-stone-200/80 bg-white/80 p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-indigo-900/60 lg:grid-cols-[minmax(0,1fr)_150px]"
                                >
                                    <div className="min-w-0">
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{job.postedAt}</span>
                                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">{job.sourceLabel}</span>
                                            {job.signals.slice(0, 2).map((signal) => (
                                                <span key={signal} className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{signal}</span>
                                            ))}
                                        </div>

                                        <div className="flex gap-3">
                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-[#fffaf1] text-lg font-black text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                                                {job.company.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">{job.title}</h2>
                                                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-stone-600 dark:text-slate-300">
                                                    <Building2 size={15} /> {job.company}
                                                    <span className="hidden text-stone-300 sm:inline">/</span>
                                                    <span>{job.seniority}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-2 text-xs font-bold text-stone-600 dark:text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
                                            <div className="flex items-center gap-2"><MapPin size={15} /> {job.location}</div>
                                            <div className="flex items-center gap-2"><Briefcase size={15} /> {job.workModel}</div>
                                            <div className="flex items-center gap-2"><Clock3 size={15} /> {job.jobType}</div>
                                            <div className="flex items-center gap-2"><BadgeCheck size={15} /> {job.salary}</div>
                                        </div>

                                        <div className="mt-4 max-w-4xl rounded-2xl border border-stone-200/70 bg-[#fffaf1]/70 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/35">
                                            <div className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-stone-500 dark:text-slate-500">Summary</div>
                                            <p className="text-sm font-medium leading-6 text-stone-700 dark:text-slate-300">{job.description}</p>
                                        </div>

                                        <div className="mt-4 grid gap-3 xl:grid-cols-2">
                                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/25">
                                                <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-200">
                                                    <CheckCircle2 size={14} /> Match reasons
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {job.matchReasons.map((reason) => (
                                                        <span key={reason} className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:bg-slate-900/70 dark:text-emerald-100">{reason}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3 dark:border-rose-900/50 dark:bg-rose-950/20">
                                                <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-rose-700 dark:text-rose-200">
                                                    <XCircle size={14} /> Missing keywords
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(job.missingKeywords.length ? job.missingKeywords : ['No major gaps listed']).map((keyword) => (
                                                        <span key={keyword} className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-rose-800 dark:bg-slate-900/70 dark:text-rose-100">{keyword}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <aside className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-950 p-3 text-white shadow-sm dark:border-slate-700">
                                        <div className={`rounded-2xl border p-3 text-center ${scoreTone(job.matchScore)}`}>
                                            <Gauge className="mx-auto mb-2 h-5 w-5" />
                                            <div className="text-3xl font-black leading-none">{job.matchScore}<span className="text-sm">%</span></div>
                                            <div className="mt-1 text-[11px] font-black uppercase tracking-[0.12em]">{job.matchLabel}</div>
                                        </div>

                                        <button
                                            onClick={() => { void saveSeedJob(job); }}
                                            disabled={isSaved || savingJobId === job.id || tailoringJobId === job.id}
                                            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#7c6df2] px-3 py-2 text-xs font-black text-white transition hover:bg-[#6757dc] disabled:cursor-default disabled:bg-slate-700 disabled:text-slate-300"
                                        >
                                            <Heart size={15} />
                                            {isSaved ? 'Saved' : savingJobId === job.id ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { void saveAndOpenTailorJob(job); }}
                                            disabled={savingJobId === job.id || tailoringJobId === job.id}
                                            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/15 disabled:cursor-default disabled:opacity-55"
                                        >
                                            <FileText size={15} />
                                            {tailoringJobId === job.id ? 'Opening...' : 'Tailor resume'}
                                        </button>
                                        {hasExternalApplyUrl ? (
                                            <button
                                                type="button"
                                                onClick={() => { void openApplyLink(job); }}
                                                disabled={openingJobId === job.id}
                                                className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-300"
                                            >
                                                {openingJobId === job.id ? 'Opening...' : job.source === 'scraped' ? 'Apply now' : 'Open apply page'} <ExternalLink size={15} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => navigate('/job-tracker')}
                                                className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-300"
                                            >
                                                Open tracker <ExternalLink size={15} />
                                            </button>
                                        )}
                                    </aside>
                                </article>
                            );
                        })}
                    </section>

                    <aside className="space-y-4">
                        <section className="rounded-3xl border border-stone-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                            <div className="flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
                                <Target size={18} className="text-indigo-500" />
                                Saved filters
                            </div>
                            <div className="mt-4 space-y-2">
                                {['Full Stack + Frontend', 'Remote or hybrid', 'Mid level', 'Salary visible first'].map((filter) => (
                                    <div key={filter} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-[#fffaf1] px-3 py-2 text-xs font-bold text-stone-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
                                        {filter}
                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-3xl border border-stone-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                            <div className="flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
                                <ShieldCheck size={18} className="text-emerald-500" />
                                Feed policy
                            </div>
                            <p className="mt-3 text-sm font-medium leading-6 text-stone-600 dark:text-slate-300">
                                Recommended uses authenticated ATS and company-career ingestion. A job is visible only after its external apply page is validated; expired or broken links are removed.
                            </p>
                            <div className="mt-4 rounded-2xl bg-slate-950 p-3 text-xs font-bold leading-5 text-slate-200">
                                Backend source: scheduled ATS ingestion with direct apply-link validation before a job becomes visible.
                            </div>
                        </section>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm font-black text-stone-700 shadow-sm transition hover:border-stone-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-white"
                        >
                            <LayoutDashboard size={16} />
                            Dashboard
                        </button>
                    </aside>
                </main>
            </div>
        </AppLayout>
    );
};

export default JobsRecommendPage;
