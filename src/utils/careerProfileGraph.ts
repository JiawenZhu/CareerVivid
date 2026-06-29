import { NO_NEXT_ACTION, type ApplicationStatus, type JobApplicationData, type PracticeHistoryEntry, type ResumeData } from '../types';
import type { PortfolioData } from '../features/portfolio/types/portfolio';
import { extractRecommendationProfileKeywords } from './recommendationProfile';

export type CareerProfileGraphNodeId =
    | 'resume'
    | 'skills'
    | 'goals'
    | 'targetRoles'
    | 'proof'
    | 'interview'
    | 'jobHistory';

export type CareerProfileGraphTone =
    | 'blue'
    | 'emerald'
    | 'amber'
    | 'violet'
    | 'pink'
    | 'slate'
    | 'indigo';

export interface CareerProfileGraphNode {
    id: CareerProfileGraphNodeId;
    label: string;
    value: string;
    detail: string;
    progress: number;
    tags: string[];
    actionLabel: string;
    actionPath: string;
    tone: CareerProfileGraphTone;
}

export type CareerProfileGoalStepId = 'target' | 'resumeMatch' | 'interviewScore' | 'applicationPlan';
export type CareerProfileGoalStepStatus = 'ready' | 'building' | 'start';

export interface CareerProfileGoalStep {
    id: CareerProfileGoalStepId;
    label: string;
    detail: string;
    score: number;
    targetScore?: number;
    status: CareerProfileGoalStepStatus;
    actionLabel: string;
    actionPath: string;
}

export interface CareerProfileRoleGoal {
    title: string;
    subtitle: string;
    role: string;
    company?: string;
    readinessScore: number;
    readinessLabel: string;
    targetScore: number;
    nextStep: CareerProfileGoalStep;
    steps: CareerProfileGoalStep[];
}

export type LearningToolId = 'chatgpt' | 'gemini' | 'claudeCode' | 'proof';

export interface SkillGapLearningStep {
    tool: LearningToolId;
    label: string;
    instruction: string;
}

export interface SkillGapLearningMission {
    id: string;
    skill: string;
    reason: string;
    targetRole: string;
    demandCount: number;
    proofOutcome: string;
    prompt: string;
    steps: SkillGapLearningStep[];
}

export interface CareerProfileGraphSummary {
    completionScore: number;
    signalCount: number;
    topSkills: string[];
    targetRoles: string[];
    proofProjects: string[];
    activeGoals: string[];
    statusBreakdown: Array<{ label: string; count: number }>;
    strongestSignal: string;
    nextBestStep: CareerProfileGraphNode;
    roleGoal: CareerProfileRoleGoal;
    learningMissions: SkillGapLearningMission[];
    nodes: CareerProfileGraphNode[];
}

interface CareerProfileGraphInput {
    resumes: ResumeData[];
    portfolios: PortfolioData[];
    practiceHistory: PracticeHistoryEntry[];
    jobApplications: JobApplicationData[];
}

const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, Math.round(value)));

const pluralize = (count: number, singular: string, plural = `${singular}s`): string => (
    `${count} ${count === 1 ? singular : plural}`
);

const normalizeText = (value: string): string => value.trim().replace(/\s+/g, ' ');

const compactUnique = (values: Array<string | undefined | null>, limit: number): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];

    values.forEach((value) => {
        if (!value) return;
        const cleaned = normalizeText(value);
        const key = cleaned.toLowerCase();
        if (!cleaned || seen.has(key)) return;
        seen.add(key);
        result.push(cleaned);
    });

    return result.slice(0, limit);
};

const toMillis = (value: any): number => {
    if (!value) return 0;
    if (typeof value?.toMillis === 'function') return value.toMillis();
    if (typeof value === 'number') return value;
    const parsed = Date.parse(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
};

const topByFrequency = (values: Array<string | undefined | null>, limit: number): string[] => {
    const counts = new Map<string, { label: string; count: number }>();

    values.forEach((value) => {
        if (!value) return;
        const label = normalizeText(value);
        if (!label) return;
        const key = label.toLowerCase();
        counts.set(key, {
            label,
            count: (counts.get(key)?.count || 0) + 1,
        });
    });

    return Array.from(counts.values())
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
        .slice(0, limit)
        .map((item) => item.label);
};

const getResumeReadiness = (resume?: ResumeData): number => {
    if (!resume) return 0;

    const checks = [
        Boolean(resume.personalDetails?.jobTitle?.trim()),
        Boolean(resume.professionalSummary?.trim()),
        (resume.skills || []).length >= 5,
        (resume.employmentHistory || []).length > 0,
        (resume.websites || []).length > 0,
    ];

    return clamp((checks.filter(Boolean).length / checks.length) * 100);
};

const getInterviewReadiness = (practiceHistory: PracticeHistoryEntry[]): number => {
    const analyses = practiceHistory.flatMap((entry) => entry.interviewHistory || []);
    if (analyses.length > 0) {
        const average = analyses.reduce((sum, analysis) => sum + (Number(analysis.overallScore) || 0), 0) / analyses.length;
        return clamp(average);
    }

    return clamp(practiceHistory.length * 20, 0, 80);
};

const getProofProjects = (portfolios: PortfolioData[]): string[] => compactUnique(
    portfolios.flatMap((portfolio) => [
        ...(portfolio.projects || []).map((project) => project.title),
        portfolio.title,
    ]),
    5
);

const getSkillSignals = (resumes: ResumeData[], portfolios: PortfolioData[]): string[] => compactUnique([
    ...resumes.flatMap((resume) => (resume.skills || []).map((skill) => skill.name)),
    ...portfolios.flatMap((portfolio) => [
        ...(portfolio.techStack || []).map((skill) => skill.name),
        ...(portfolio.projects || []).flatMap((project) => project.tags || []),
    ]),
    ...extractRecommendationProfileKeywords({ resumes, portfolios }),
], 8);

const getTargetRoles = (
    resumes: ResumeData[],
    jobApplications: JobApplicationData[],
    practiceHistory: PracticeHistoryEntry[]
): string[] => topByFrequency([
    ...jobApplications
        .filter((job) => job.applicationStatus !== 'Rejected')
        .map((job) => job.jobTitle),
    ...resumes.map((resume) => resume.personalDetails?.jobTitle),
    ...practiceHistory.map((entry) => entry.job?.title),
], 5);

const getActiveGoals = (jobApplications: JobApplicationData[]): string[] => (
    compactUnique(
        jobApplications
            .filter((job) => job.applicationStatus !== 'Rejected')
            .map((job) => job.nextAction)
            .filter((action) => action && action !== NO_NEXT_ACTION),
        4
    )
);

const getStatusBreakdown = (jobApplications: JobApplicationData[]): Array<{ label: string; count: number }> => {
    const statuses = ['To Apply', 'Applied', 'Interviewing', 'Offered', 'Rejected'];
    return statuses
        .map((status) => ({
            label: status,
            count: jobApplications.filter((job) => job.applicationStatus === status).length,
        }))
        .filter((item) => item.count > 0);
};

const getNextBestStep = (nodes: CareerProfileGraphNode[]): CareerProfileGraphNode => (
    [...nodes].sort((a, b) => a.progress - b.progress)[0] || nodes[0]
);

const getBestResumeMatchScore = (job?: JobApplicationData): number | null => {
    const scores = Object.values(job?.matchAnalyses || {})
        .map((analysis) => Number(analysis?.matchPercentage))
        .filter((score) => Number.isFinite(score));

    if (scores.length === 0) return null;
    return clamp(Math.max(...scores));
};

const normalizeComparable = (value?: string): string => (
    (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
);

const textMatches = (a?: string, b?: string): boolean => {
    const first = normalizeComparable(a);
    const second = normalizeComparable(b);
    if (!first || !second) return false;
    return first === second || first.includes(second) || second.includes(first);
};

const practiceMatchesJob = (entry: PracticeHistoryEntry, job: JobApplicationData): boolean => (
    textMatches(entry.job?.title, job.jobTitle) || textMatches(entry.job?.company, job.companyName)
);

const getBestInterviewScoreForJob = (
    practiceHistory: PracticeHistoryEntry[],
    job?: JobApplicationData
): number | null => {
    if (!job) return null;

    const scores = practiceHistory
        .filter((entry) => practiceMatchesJob(entry, job))
        .flatMap((entry) => entry.interviewHistory || [])
        .map((analysis) => Number(analysis.overallScore))
        .filter((score) => Number.isFinite(score));

    if (scores.length === 0) return null;
    return clamp(Math.max(...scores));
};

const statusGoalScores: Record<ApplicationStatus, number> = {
    'To Apply': 25,
    Applied: 65,
    Interviewing: 80,
    Offered: 100,
    Rejected: 0,
};

const statusPriority: Record<ApplicationStatus, number> = {
    Offered: 5,
    Interviewing: 4,
    Applied: 3,
    'To Apply': 2,
    Rejected: 0,
};

const getGoalStatus = (score: number, targetScore = 85): CareerProfileGoalStepStatus => {
    if (score >= targetScore) return 'ready';
    if (score > 0) return 'building';
    return 'start';
};

const selectGoalJob = (jobApplications: JobApplicationData[]): JobApplicationData | undefined => (
    jobApplications
        .filter((job) => job.applicationStatus !== 'Rejected')
        .sort((a, b) => {
            const matchDelta = (getBestResumeMatchScore(b) || 0) - (getBestResumeMatchScore(a) || 0);
            if (matchDelta !== 0) return matchDelta;
            const statusDelta = statusPriority[b.applicationStatus] - statusPriority[a.applicationStatus];
            if (statusDelta !== 0) return statusDelta;
            return toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt);
        })[0]
);

const buildRoleGoal = (
    resumes: ResumeData[],
    practiceHistory: PracticeHistoryEntry[],
    jobApplications: JobApplicationData[],
    targetRoles: string[],
    resumeReadiness: number
): CareerProfileRoleGoal => {
    const goalJob = selectGoalJob(jobApplications);
    const role = goalJob?.jobTitle || targetRoles[0] || resumes[0]?.personalDetails?.jobTitle || 'Target role';
    const company = goalJob?.companyName;
    const title = goalJob ? `${company ? `${company} ` : ''}${role}` : 'Choose a target role';
    const matchScore = getBestResumeMatchScore(goalJob);
    const interviewScore = getBestInterviewScoreForJob(practiceHistory, goalJob);
    const hasNextAction = Boolean(goalJob?.nextAction && goalJob.nextAction !== NO_NEXT_ACTION);
    const applicationScore = goalJob
        ? Math.max(statusGoalScores[goalJob.applicationStatus] || 0, hasNextAction ? 45 : 0)
        : 0;
    const resumeGoalScore = goalJob
        ? matchScore ?? (resumes.length ? Math.min(resumeReadiness, 60) : 0)
        : 0;
    const interviewGoalScore = interviewScore ?? 0;

    const steps: CareerProfileGoalStep[] = [
        {
            id: 'target',
            label: 'Target role',
            detail: goalJob ? `${role}${company ? ` at ${company}` : ''}` : 'Save a job you want to win.',
            score: goalJob ? 100 : 0,
            targetScore: 100,
            status: goalJob ? 'ready' : 'start',
            actionLabel: goalJob ? 'Open job' : 'Save target job',
            actionPath: goalJob ? '/job-tracker' : '/jobs/recommend',
        },
        {
            id: 'resumeMatch',
            label: 'Resume match',
            detail: goalJob
                ? matchScore != null
                    ? `${matchScore}% match against this role.`
                    : 'Run a resume match for this saved job.'
                : 'Match a resume after saving a target job.',
            score: resumeGoalScore,
            targetScore: 90,
            status: getGoalStatus(resumeGoalScore, 90),
            actionLabel: matchScore != null ? 'Improve resume' : 'Run match',
            actionPath: goalJob?.resumeId ? `/edit/${goalJob.resumeId}` : '/newresume',
        },
        {
            id: 'interviewScore',
            label: 'Mock interview',
            detail: goalJob
                ? interviewScore != null
                    ? `${interviewScore}% best practice score for this role.`
                    : 'Practice this role until the score is interview-ready.'
                : 'Practice after choosing a target role.',
            score: interviewGoalScore,
            targetScore: 85,
            status: getGoalStatus(interviewGoalScore, 85),
            actionLabel: interviewScore != null ? 'Practice again' : 'Start practice',
            actionPath: '/interview-studio',
        },
        {
            id: 'applicationPlan',
            label: 'Application plan',
            detail: goalJob
                ? goalJob.applicationStatus === 'Offered'
                    ? 'Offer stage reached.'
                    : hasNextAction
                        ? `Next: ${goalJob.nextAction}`
                        : 'Set the next action for this target role.'
                : 'Save a job to create the application plan.',
            score: applicationScore,
            targetScore: 85,
            status: goalJob?.applicationStatus === 'Offered' ? 'ready' : getGoalStatus(applicationScore, 85),
            actionLabel: hasNextAction ? 'Open plan' : 'Set next action',
            actionPath: '/job-tracker',
        },
    ];

    const readinessScore = goalJob
        ? clamp((steps[0].score * 0.15) + (resumeGoalScore * 0.35) + (interviewGoalScore * 0.35) + (applicationScore * 0.15))
        : 0;
    const nextStep = steps.find((step) => step.status !== 'ready') || steps[steps.length - 1];
    const readinessLabel = nextStep.status === 'ready' && readinessScore >= 90
        ? 'Goal ready'
        : readinessScore >= 70
            ? 'Close'
            : readinessScore > 0
                ? 'Building'
                : 'Not started';

    return {
        title,
        subtitle: goalJob
            ? 'Win this role by raising resume match, mock interview score, and next-step readiness.'
            : 'Pick a real saved job, then CareerVivid can track resume fit, interview practice, and next action.',
        role,
        company,
        readinessScore,
        readinessLabel,
        targetScore: 90,
        nextStep,
        steps,
    };
};

const isKnownSkill = (skill: string, topSkills: string[]): boolean => {
    const normalizedSkill = skill.toLowerCase();
    return topSkills.some((known) => {
        const normalizedKnown = known.toLowerCase();
        return normalizedKnown === normalizedSkill
            || normalizedKnown.includes(normalizedSkill)
            || normalizedSkill.includes(normalizedKnown);
    });
};

const getAnalysisMissingKeywords = (job: JobApplicationData): string[] => {
    const analysisGaps = Object.values(job.matchAnalyses || {})
        .flatMap((analysis) => analysis?.missingKeywords || []);
    const aiKeywordGaps = (job.aiEvaluation?.atsKeywords || [])
        .filter((keyword) => !job.jobDescription?.toLowerCase().includes(keyword.toLowerCase()));

    return compactUnique([...analysisGaps, ...aiKeywordGaps], 12);
};

const inferFallbackSkillGaps = (targetRoles: string[], topSkills: string[]): string[] => {
    const roleText = targetRoles.join(' ').toLowerCase();
    const aiFallbacks = [
        'AI workflow automation',
        'Prompt engineering',
        'Claude Code',
        'Gemini research',
        'ChatGPT interviewing',
    ];
    const engineeringFallbacks = roleText.includes('frontend') || roleText.includes('full stack') || roleText.includes('software')
        ? ['System design', 'TypeScript testing', 'Cloud deployment']
        : ['Client diagnosis', 'Case analysis', 'Stakeholder communication'];

    return [...aiFallbacks, ...engineeringFallbacks]
        .filter((gap) => !isKnownSkill(gap, topSkills))
        .slice(0, 4);
};

const makeLearningMission = (
    skill: string,
    targetRole: string,
    demandCount: number
): SkillGapLearningMission => {
    const safeRole = targetRole || 'your target role';
    const proofOutcome = `A small ${skill} proof project plus one resume bullet and one portfolio note.`;
    const prompt = [
        `I am preparing for ${safeRole} roles and need to close my ${skill} skill gap.`,
        'Teach me the concept in practical terms, give me a 30-minute exercise, quiz me, then help me turn the result into job-ready proof for my resume and portfolio.',
    ].join(' ');

    return {
        id: skill.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'skill-gap',
        skill,
        reason: demandCount > 1
            ? `${demandCount} saved or matched roles are asking for this signal.`
            : `This is a likely gap for ${safeRole} roles.`,
        targetRole: safeRole,
        demandCount,
        proofOutcome,
        prompt,
        steps: [
            {
                tool: 'chatgpt',
                label: 'Learn',
                instruction: `Use ChatGPT to explain ${skill}, quiz you, and turn weak answers into stronger mental models.`,
            },
            {
                tool: 'gemini',
                label: 'Research',
                instruction: `Use Gemini to compare ${safeRole} job posts and collect the exact phrases employers use for ${skill}.`,
            },
            {
                tool: 'claudeCode',
                label: 'Build',
                instruction: `Use Claude Code to build or refactor a small project that proves ${skill} in a real workflow.`,
            },
            {
                tool: 'proof',
                label: 'Package',
                instruction: 'Save the result as a resume bullet, interview story, and portfolio proof item.',
            },
        ],
    };
};

const getSkillGapLearningMissions = (
    jobApplications: JobApplicationData[],
    targetRoles: string[],
    topSkills: string[]
): SkillGapLearningMission[] => {
    const gapCounts = new Map<string, { skill: string; count: number; role: string }>();

    jobApplications
        .filter((job) => job.applicationStatus !== 'Rejected')
        .forEach((job) => {
            getAnalysisMissingKeywords(job).forEach((gap) => {
                if (isKnownSkill(gap, topSkills)) return;
                const key = gap.toLowerCase();
                const existing = gapCounts.get(key);
                gapCounts.set(key, {
                    skill: existing?.skill || gap,
                    count: (existing?.count || 0) + 1,
                    role: existing?.role || job.jobTitle,
                });
            });
        });

    const rankedGaps = Array.from(gapCounts.values())
        .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
        .slice(0, 3);

    const fallbackGaps = rankedGaps.length >= 3
        ? []
        : inferFallbackSkillGaps(targetRoles, topSkills)
            .filter((gap) => !rankedGaps.some((ranked) => ranked.skill.toLowerCase() === gap.toLowerCase()))
            .slice(0, 3 - rankedGaps.length)
            .map((gap) => ({
                skill: gap,
                count: 1,
                role: targetRoles[0] || 'your target role',
            }));

    return [...rankedGaps, ...fallbackGaps]
        .slice(0, 3)
        .map((gap) => makeLearningMission(gap.skill, gap.role, gap.count));
};

export const buildCareerProfileGraph = ({
    resumes,
    portfolios,
    practiceHistory,
    jobApplications,
}: CareerProfileGraphInput): CareerProfileGraphSummary => {
    const primaryResume = resumes.find((resume) => resume.isDefault) || resumes[0];
    const resumeReadiness = getResumeReadiness(primaryResume);
    const topSkills = getSkillSignals(resumes, portfolios);
    const targetRoles = getTargetRoles(resumes, jobApplications, practiceHistory);
    const proofProjects = getProofProjects(portfolios);
    const activeGoals = getActiveGoals(jobApplications);
    const interviewReadiness = getInterviewReadiness(practiceHistory);
    const statusBreakdown = getStatusBreakdown(jobApplications);
    const activeJobs = jobApplications.filter((job) => job.applicationStatus !== 'Rejected').length;
    const roleGoal = buildRoleGoal(resumes, practiceHistory, jobApplications, targetRoles, resumeReadiness);
    const learningMissions = getSkillGapLearningMissions(jobApplications, targetRoles, topSkills);

    const nodes: CareerProfileGraphNode[] = [
        {
            id: 'resume',
            label: 'Resume base',
            value: resumes.length ? pluralize(resumes.length, 'resume') : 'No resume',
            detail: primaryResume?.title || 'Create or import a base resume first.',
            progress: resumeReadiness,
            tags: compactUnique([
                primaryResume?.personalDetails?.jobTitle,
                primaryResume?.professionalSummary ? 'Summary ready' : undefined,
                primaryResume?.employmentHistory?.length ? 'Experience added' : undefined,
            ], 3),
            actionLabel: resumes.length ? 'Open resumes' : 'Create resume',
            actionPath: '/newresume',
            tone: 'blue',
        },
        {
            id: 'skills',
            label: 'Skills',
            value: topSkills.length ? pluralize(topSkills.length, 'skill') : 'No skills',
            detail: topSkills.length ? topSkills.slice(0, 4).join(', ') : 'Add skills to a resume or portfolio.',
            progress: clamp((topSkills.length / 8) * 100),
            tags: topSkills.slice(0, 3),
            actionLabel: topSkills.length ? 'Review skills' : 'Add skills',
            actionPath: '/newresume',
            tone: 'emerald',
        },
        {
            id: 'goals',
            label: 'Goal progress',
            value: activeJobs ? `${roleGoal.readinessScore}% ready` : 'No goal',
            detail: activeJobs
                ? `${roleGoal.nextStep.label}: ${roleGoal.nextStep.detail}`
                : 'Save a target job to start tracking goal progress.',
            progress: roleGoal.readinessScore,
            tags: roleGoal.steps
                .filter((step) => step.status === 'ready')
                .map((step) => step.label)
                .slice(0, 3),
            actionLabel: activeJobs ? roleGoal.nextStep.actionLabel : 'Save target job',
            actionPath: activeJobs ? roleGoal.nextStep.actionPath : '/jobs/recommend',
            tone: 'amber',
        },
        {
            id: 'targetRoles',
            label: 'Target roles',
            value: targetRoles.length ? pluralize(targetRoles.length, 'role') : 'No roles',
            detail: targetRoles.length ? targetRoles.slice(0, 3).join(', ') : 'Use recommended jobs to define target roles.',
            progress: clamp((targetRoles.length / 3) * 100),
            tags: targetRoles.slice(0, 3),
            actionLabel: targetRoles.length ? 'Review roles' : 'Find target roles',
            actionPath: '/jobs/recommend',
            tone: 'violet',
        },
        {
            id: 'proof',
            label: 'Proof projects',
            value: proofProjects.length ? pluralize(proofProjects.length, 'proof item') : 'No proof',
            detail: proofProjects[0] || 'Add portfolio projects that prove your strongest skills.',
            progress: clamp((proofProjects.length / 3) * 100),
            tags: proofProjects.slice(0, 3),
            actionLabel: proofProjects.length ? 'Open portfolio' : 'Add proof',
            actionPath: '/portfolio',
            tone: 'pink',
        },
        {
            id: 'interview',
            label: 'Interview readiness',
            value: `${interviewReadiness}% ready`,
            detail: practiceHistory.length ? `${pluralize(practiceHistory.length, 'practice session')} tracked.` : 'Practice against a target role to build readiness.',
            progress: interviewReadiness,
            tags: compactUnique([
                practiceHistory[0]?.job?.title,
                practiceHistory.length ? 'Practice history' : undefined,
            ], 3),
            actionLabel: practiceHistory.length ? 'Practice again' : 'Start practice',
            actionPath: '/interview-studio',
            tone: 'indigo',
        },
        {
            id: 'jobHistory',
            label: 'Job history',
            value: jobApplications.length ? pluralize(jobApplications.length, 'job') : 'No jobs',
            detail: activeJobs ? `${pluralize(activeJobs, 'active role')} in your pipeline.` : 'Save jobs to build a useful history.',
            progress: clamp(jobApplications.length ? 45 + Math.min(activeJobs, 5) * 10 : 0),
            tags: statusBreakdown.slice(0, 3).map((item) => `${item.label}: ${item.count}`),
            actionLabel: jobApplications.length ? 'Open pipeline' : 'Save a job',
            actionPath: '/job-tracker',
            tone: 'slate',
        },
    ];

    const completionScore = clamp(nodes.reduce((sum, node) => sum + node.progress, 0) / nodes.length);
    const signalCount = resumes.length + topSkills.length + targetRoles.length + proofProjects.length + practiceHistory.length + jobApplications.length;
    const strongestSignal = [...nodes].sort((a, b) => b.progress - a.progress)[0]?.label || 'Resume base';
    const nextBestStep = getNextBestStep(nodes);

    return {
        completionScore,
        signalCount,
        topSkills,
        targetRoles,
        proofProjects,
        activeGoals,
        statusBreakdown,
        strongestSignal,
        nextBestStep,
        roleGoal,
        learningMissions,
        nodes,
    };
};
