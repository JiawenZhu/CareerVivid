import { InterviewAnalysis, PracticeHistoryEntry, TranscriptEntry } from '../../types';

export type ReportTab = 'feedback' | 'transcript';

export type TranscriptFallback = {
    entries: TranscriptEntry[];
    sourceLabel: string;
};

export interface DashboardMetric {
    label: string;
    score: number;
    helper: string;
}

export interface DashboardData {
    summary: string;
    metrics: DashboardMetric[];
    strengths: string;
    practiceNext: string;
}

export interface InterviewReportExportOptions {
    jobTitle?: string;
    company?: string;
    transcriptEntries?: TranscriptEntry[];
    transcriptSourceLabel?: string;
    locale?: string;
    timeZone?: string;
}

export interface InterviewReportExportHelper {
    downloadInterviewReportTxt?: (analysis: InterviewAnalysis, options?: InterviewReportExportOptions) => void | Promise<void>;
    downloadInterviewReportPdf?: (analysis: InterviewAnalysis, options?: InterviewReportExportOptions) => void | Promise<void>;
}

export const emptyTranscriptMessage = 'No transcript was captured for this session.';

const interviewReportExportModules = import.meta.glob<InterviewReportExportHelper>('../../utils/interviewReportExport.ts');

export const stripMarkdown = (text = '') => text.replace(/\*\*/g, '').trim();

export const clampScore = (score: number) => {
    if (typeof score !== 'number' || Number.isNaN(score)) return 0;
    return Math.max(0, Math.min(100, score));
};

export const scoreBand = (score: number) => {
    const validScore = clampScore(score);
    if (validScore >= 75) return 'Strong';
    if (validScore >= 60) return 'Developing well';
    if (validScore >= 40) return 'Needs practice';
    return 'Priority focus';
};

const firstSentence = (text = '') => {
    const cleanText = stripMarkdown(text).replace(/\s+/g, ' ');
    if (!cleanText) return '';
    const match = cleanText.match(/^(.+?[.!?])(\s|$)/);
    return match?.[1] || cleanText;
};

export const deriveDashboardData = (analysis: InterviewAnalysis): DashboardData => {
    const strengths = analysis.strengths || 'No strengths summary was generated for this session.';
    const practiceNext = analysis.areasForImprovement || 'No practice recommendations were generated for this session.';
    const summarySource = firstSentence(strengths) || firstSentence(practiceNext);

    const hasV2 = analysis.problemSolvingScore != null && analysis.experienceScore != null && analysis.roleAlignmentScore != null;

    const metrics: DashboardMetric[] = hasV2
        ? [
            {
                label: 'Communication',
                score: analysis.communicationScore,
                helper: 'Clarity, structure, and ability to explain ideas effectively.',
            },
            {
                label: 'Problem Solving',
                score: analysis.problemSolvingScore!,
                helper: 'Analytical thinking, structured reasoning, and decision quality.',
            },
            {
                label: 'Experience & Impact',
                score: analysis.experienceScore!,
                helper: 'Relevant examples with concrete outcomes and learnings.',
            },
            {
                label: 'Role Alignment',
                score: analysis.roleAlignmentScore!,
                helper: 'How well your answers connect to this specific role.',
            },
            ...(analysis.leadershipScore != null
                ? [{
                    label: 'Leadership',
                    score: analysis.leadershipScore!,
                    helper: 'People management, collaboration, and organizational decision-making.',
                }]
                : []),
        ]
        : [
            {
                label: 'Communication',
                score: analysis.communicationScore,
                helper: 'Clarity, structure, and pacing of your answers.',
            },
            {
                label: 'Confidence',
                score: analysis.confidenceScore,
                helper: 'Presence, specificity, and consistency under pressure.',
            },
            {
                label: 'Answer Relevance',
                score: analysis.relevanceScore,
                helper: 'How directly your responses matched the prompt and role.',
            },
        ];

    return {
        summary: summarySource || 'Review the score breakdown and transcript to identify your strongest answers and next practice focus.',
        strengths,
        practiceNext,
        metrics,
    };
};

export const resolveTranscript = (analysis: InterviewAnalysis, jobHistoryEntry: PracticeHistoryEntry): TranscriptFallback => {
    if (analysis.transcript?.length) {
        return {
            entries: analysis.transcript,
            sourceLabel: 'Saved with this analysis',
        };
    }

    if (jobHistoryEntry.transcript?.length) {
        return {
            entries: jobHistoryEntry.transcript,
            sourceLabel: 'Recovered from the practice session',
        };
    }

    return {
        entries: [],
        sourceLabel: 'Transcript unavailable',
    };
};

export const loadInterviewReportExportHelper = async (): Promise<InterviewReportExportHelper | null> => {
    const loadHelper = interviewReportExportModules['../../utils/interviewReportExport.ts'];

    if (!loadHelper) {
        console.info('Interview report export helper is not available yet.');
        return null;
    }

    try {
        return await loadHelper();
    } catch (error) {
        console.info('Interview report export helper failed to load.', error);
        return null;
    }
};

export const getGoogleExportErrorMessage = (error: any) => {
    if (error?.code === 'auth/popup-closed-by-user') return '';

    const rawMessage = String(error?.message || '').trim();
    const normalizedMessage = rawMessage.toLowerCase();
    const rawCode = String(error?.code || '').toLowerCase();

    if (rawCode.includes('cancelled') || rawCode.includes('popup-closed-by-user')) return '';

    if (
        rawCode.includes('permission') ||
        rawCode.includes('unauthorized') ||
        normalizedMessage.includes('401') ||
        normalizedMessage.includes('403') ||
        normalizedMessage.includes('insufficient authentication scopes')
    ) {
        return 'Google Drive permission was denied or expired. Please try again and approve Drive access.';
    }

    if (
        normalizedMessage === 'internal' ||
        normalizedMessage.includes('exportinterviewreporttogoogledocs') ||
        normalizedMessage.includes('cors')
    ) {
        return 'Google Drive export could not start. Please refresh the page so the latest export code loads, then try again.';
    }

    if (normalizedMessage.includes('failed to fetch') || normalizedMessage.includes('networkerror')) {
        return 'Google Drive export could not reach Google Drive. Please check your connection and try again.';
    }

    return rawMessage || 'Could not export the report to Google Drive. Please try again.';
};
