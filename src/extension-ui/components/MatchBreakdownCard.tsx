import React, { useMemo, useState } from 'react';
import {
    AlertCircle,
    Award,
    Briefcase,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    DollarSign,
    FileText,
    Key,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
    Target,
    UserCheck,
    X,
    Zap
} from 'lucide-react';
import { GranularMatchCategory, ResumeMatchAnalysis } from '../../types';

const STAGES = [
    { id: 'wishlist',     label: 'To apply' },
    { id: 'applying',     label: 'Applying' },
    { id: 'applied',      label: 'Applied' },
    { id: 'interviewing', label: 'Interviewing' },
    { id: 'offer',        label: 'Offer' },
    { id: 'rejected',     label: 'Rejected' },
] as const;

type StageId = typeof STAGES[number]['id'];

interface MatchBreakdownCardProps {
    matchScore: number | null;
    matchAnalysis: ResumeMatchAnalysis | null;
    isCalculatingScore: boolean;
    isJobSite: boolean;
    scrapedJob: { title: string; company: string; description?: string; salary?: string } | null;
    onSaveJob: (stage: StageId) => void;
    onNewResume: () => void;
    aiUsage?: { count: number; limit: number };
    selectedResumeTitle?: string | null;
    hasResumeContext?: boolean;
    analysisError?: string | null;
    onRetryAnalysis?: () => void;
}

const actionLabels: Record<string, string> = {
    apply_now: 'Apply now',
    tailor_first: 'Tailor first',
    network_first: 'Network first',
    skip_for_now: 'Skip for now',
};

const truncate = (text: string, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}...`;
};

const getFitTone = (score: number | null) => {
    if (score === null) {
        return {
            label: 'Waiting for Gemini',
            chip: 'border-[#e6dac8] bg-[#fffaf1] text-[#665a4a] dark:border-[#4a4035] dark:bg-[#302e2a] dark:text-[#d8c7a8]',
            icon: 'border-[#d9d7fb] bg-[#f3f2ff] text-[#625bd5] dark:border-[#4d4a73] dark:bg-[#302f49] dark:text-[#b8b3ff]',
        };
    }

    if (score >= 75) {
        return {
            label: 'Strong fit',
            chip: 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
            icon: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
        };
    }

    if (score >= 50) {
        return {
            label: 'Good fit',
            chip: 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300',
            icon: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300',
        };
    }

    return {
        label: 'Needs tailoring',
        chip: 'border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300',
        icon: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300',
    };
};

const getCategoryTone = (category?: GranularMatchCategory) => {
    const rating = (category?.rating || '').toLowerCase();

    if (rating.includes('great') || rating.includes('excellent') || rating.includes('good')) {
        return 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300';
    }

    if (rating.includes('missing') || rating.includes('weak')) {
        return 'border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300';
    }

    return 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300';
};

export const MatchBreakdownCard: React.FC<MatchBreakdownCardProps> = ({
    matchScore,
    matchAnalysis,
    isCalculatingScore,
    isJobSite,
    scrapedJob,
    onSaveJob,
    onNewResume,
    aiUsage,
    selectedResumeTitle,
    hasResumeContext = false,
    analysisError,
    onRetryAnalysis,
}) => {
    const isOutOfCredits = aiUsage ? aiUsage.count >= aiUsage.limit : false;
    const hasJobMetadata = Boolean(scrapedJob?.title || scrapedJob?.company);
    const hasJobDescription = Boolean(scrapedJob?.description?.trim());
    const hasRealAnalysis = Boolean(matchAnalysis && matchScore !== null);
    const saveButtonLabel = hasJobDescription ? 'Save + analyze fit' : 'Save to tracker';
    const activeResumeLabel = selectedResumeTitle || 'selected resume';
    const fitTone = getFitTone(matchScore);
    const [showStagePicker, setShowStagePicker] = useState(false);
    const [selectedStage, setSelectedStage] = useState<StageId>('wishlist');
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        strengths: true,
        gaps: true,
        context: false,
    });

    const descriptionHighlights = useMemo(() => {
        const description = scrapedJob?.description?.trim() || '';
        if (!description) return [];

        const bulletItems = description
            .split(/\n|•|·|●/)
            .map(item => item.trim())
            .filter(item => item.length > 32)
            .slice(0, 4);

        if (bulletItems.length >= 2) return bulletItems;

        return (description.match(/[^.!?]+[.!?]+/g) || [description])
            .map(item => item.trim())
            .filter(Boolean)
            .slice(0, 4);
    }, [scrapedJob?.description]);

    const categoryRows = [
        { key: 'qualifications', label: 'Qualifications', icon: Award, category: matchAnalysis?.qualifications },
        { key: 'responsibilities', label: 'Responsibilities', icon: Briefcase, category: matchAnalysis?.responsibilities },
        { key: 'keywords', label: 'Keywords', icon: Key, category: matchAnalysis?.keywords },
        { key: 'jobTitle', label: 'Role alignment', icon: UserCheck, category: matchAnalysis?.jobTitle },
    ];

    const analysisSections = [
        {
            key: 'strengths',
            label: 'Strong matches',
            icon: CheckCircle2,
            items: matchAnalysis?.strongMatches?.slice(0, 4) || [],
            empty: 'Gemini will list resume proof points here after analysis finishes.',
        },
        {
            key: 'gaps',
            label: 'Gaps to tailor',
            icon: Target,
            items: matchAnalysis?.experienceGaps?.slice(0, 4) || [],
            empty: 'Gemini will list tailoring gaps here after analysis finishes.',
        },
        {
            key: 'context',
            label: 'Captured job context',
            icon: FileText,
            items: descriptionHighlights,
            empty: 'Job description highlights will appear after the page finishes syncing.',
        },
    ];

    const recommendedAction = matchAnalysis?.recommendedAction
        ? actionLabels[matchAnalysis.recommendedAction] || matchAnalysis.recommendedAction.replace(/_/g, ' ')
        : null;

    const summaryText = matchAnalysis?.verdict || matchAnalysis?.summary || '';

    const renderRefreshPanel = () => (
        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/80 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
            <div className="flex items-start gap-2">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-amber-700 dark:text-amber-300" />
                <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-amber-950 dark:text-amber-200">
                        {hasJobMetadata ? 'Job found. Description still syncing.' : 'Scanning job page'}
                    </h4>
                    <p className="mt-0.5 text-[10px] leading-normal text-amber-800 dark:text-amber-300/80">
                        {hasJobMetadata
                            ? 'You can save the job now, or refresh details before resume analysis.'
                            : 'Refresh once if the page finished loading but no role appears here.'}
                    </p>
                </div>
            </div>
            <button
                onClick={() => {
                    if (typeof chrome !== 'undefined' && chrome.tabs) {
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                            if (tabs[0]?.id) {
                                chrome.tabs.reload(tabs[0].id);
                            }
                        });
                    } else {
                        window.location.reload();
                    }
                }}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500"
            >
                <RefreshCw size={12} />
                Refresh details
            </button>
        </div>
    );

    const renderAnalysisState = () => {
        if (isCalculatingScore) {
            return (
                <div className="rounded-2xl border border-[#ececf4] bg-white p-3 dark:border-[#3a3834] dark:bg-[#262522]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[#d9d7fb] bg-[#f3f2ff] text-[#625bd5] dark:border-[#4d4a73] dark:bg-[#302f49] dark:text-[#b8b3ff]">
                            <Loader2 size={18} className="animate-spin" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-950 dark:text-[#f4f1e9]">Running Gemini analysis</p>
                            <p className="text-[11px] leading-snug text-slate-500 dark:text-[#aaa39a]">
                                Comparing this job against {activeResumeLabel}.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        if (analysisError) {
            return (
                <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-3 dark:border-rose-900/60 dark:bg-rose-950/25">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-rose-700 dark:text-rose-300" />
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-rose-900 dark:text-rose-200">Gemini analysis did not run</p>
                            <p className="mt-0.5 text-[10px] leading-snug text-rose-700 dark:text-rose-300/85">{analysisError}</p>
                        </div>
                    </div>
                    {onRetryAnalysis && (
                        <button
                            onClick={onRetryAnalysis}
                            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 dark:border-rose-900/70 dark:bg-[#262522] dark:text-rose-300 dark:hover:bg-rose-950/30"
                        >
                            <RefreshCw size={12} />
                            Try analysis again
                        </button>
                    )}
                </div>
            );
        }

        if (!hasRealAnalysis) {
            return (
                <div className="rounded-2xl border border-[#ececf4] bg-white p-3 dark:border-[#3a3834] dark:bg-[#262522]">
                    <div className="flex items-start gap-3">
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border ${fitTone.icon}`}>
                            <Search size={17} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-950 dark:text-[#f4f1e9]">
                                {hasResumeContext ? 'Ready for Gemini analysis' : 'Resume needed'}
                            </p>
                            <p className="mt-1 text-[11px] leading-snug text-slate-600 dark:text-[#aaa39a]">
                                {hasResumeContext
                                    ? 'The score and fit notes will appear here after the server-side Vertex call returns.'
                                    : 'Select a resume so CareerVivid can compare the job against your real profile.'}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-2.5">
                <div className="rounded-2xl border border-[#ececf4] bg-white p-3 dark:border-[#3a3834] dark:bg-[#262522]">
                    <div className="flex items-start gap-3">
                        <div className={`flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-2xl border ${fitTone.icon}`}>
                            <span className="text-lg font-bold leading-none">{matchScore}</span>
                            <span className="mt-0.5 text-[8px] font-semibold leading-none opacity-70">FIT</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <p className="text-sm font-semibold text-slate-950 dark:text-[#f4f1e9]">{fitTone.label}</p>
                                {recommendedAction && (
                                    <span className="rounded-full border border-[#e6dac8] bg-[#fffaf1] px-2 py-0.5 text-[9px] font-semibold capitalize text-[#7c5b2c] dark:border-[#4a4035] dark:bg-[#302e2a] dark:text-[#d8c7a8]">
                                        {recommendedAction}
                                    </span>
                                )}
                            </div>
                            {summaryText && (
                                <p className="mt-1 text-[11px] leading-snug text-slate-600 dark:text-[#c9c3ba]">{truncate(summaryText, 190)}</p>
                            )}
                            {matchAnalysis?.suggestedResumeAngle && (
                                <p className="mt-2 rounded-xl border border-[#e6dac8] bg-[#fffaf1] px-2.5 py-2 text-[10px] leading-snug text-[#665a4a] dark:border-[#4a4035] dark:bg-[#302e2a] dark:text-[#d8c7a8]">
                                    <span className="font-semibold text-[#211b16] dark:text-[#f4f1e9]">Resume angle: </span>
                                    {truncate(matchAnalysis.suggestedResumeAngle, 160)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-1.5">
                    {categoryRows.map(row => {
                        const RowIcon = row.icon;
                        const category = row.category;
                        const score = typeof category?.score === 'number' ? category.score : null;
                        const rating = category?.rating || 'Review';

                        return (
                            <div key={row.key} className="rounded-xl border border-[#ececf4] bg-white px-2.5 py-2 dark:border-[#3a3834] dark:bg-[#262522]">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <RowIcon size={12} className="flex-shrink-0 text-[#7b75df] dark:text-[#b8b3ff]" />
                                        <span className="truncate text-[11px] font-semibold text-slate-800 dark:text-[#f4f1e9]">{row.label}</span>
                                    </div>
                                    <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${getCategoryTone(category)}`}>
                                        {rating}{score !== null ? ` ${score}` : ''}
                                    </span>
                                </div>
                                {category?.details?.[0] && (
                                    <p className="mt-1 text-[10px] leading-snug text-slate-500 dark:text-[#aaa39a]">{truncate(category.details[0], 125)}</p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {((matchAnalysis?.matchedKeywords && matchAnalysis.matchedKeywords.length > 0) ||
                  (matchAnalysis?.missingKeywords && matchAnalysis.missingKeywords.length > 0)) && (
                    <div className="rounded-2xl border border-[#ececf4] bg-white p-2.5 dark:border-[#3a3834] dark:bg-[#262522]">
                        {matchAnalysis?.matchedKeywords?.length ? (
                            <div>
                                <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300">Matched keywords</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {matchAnalysis.matchedKeywords.slice(0, 8).map(keyword => (
                                        <span key={keyword} className="rounded border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                        {matchAnalysis?.missingKeywords?.length ? (
                            <div className={matchAnalysis?.matchedKeywords?.length ? 'mt-2.5' : ''}>
                                <span className="text-[9px] font-semibold text-rose-600 dark:text-rose-300">Missing keywords</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {matchAnalysis.missingKeywords.slice(0, 8).map(keyword => (
                                        <span key={keyword} className="rounded border border-rose-100 bg-rose-50 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="rounded-[22px] border border-[#ececf4] bg-white p-3.5 text-slate-950 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-[#3a3834] dark:bg-[#262522] dark:text-[#f4f1e9] dark:shadow-none">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e9ef] bg-[#f4f5f8] px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:border-[#3a3834] dark:bg-[#302e2a] dark:text-[#c9c3ba]">
                            <span className={`h-1.5 w-1.5 rounded-full ${hasJobMetadata ? 'bg-[#3b82f6]' : isJobSite ? 'bg-[#f2b705]' : 'bg-slate-400'}`} />
                            {hasJobMetadata ? 'Job detected' : isJobSite ? 'Scanning page' : 'No job detected'}
                        </span>
                        {isCalculatingScore && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#dfeaff] bg-[#eef5ff] px-2.5 py-1 text-[10px] font-semibold text-[#4f75c8] dark:border-[#35405f] dark:bg-[#1f2a44] dark:text-[#b7c8ff]">
                                <Loader2 className="h-2.5 w-2.5 animate-spin" /> Analyzing
                            </span>
                        )}
                        {hasRealAnalysis && (
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${fitTone.chip}`}>
                                <Sparkles size={10} />
                                {matchScore}% match
                            </span>
                        )}
                    </div>
                    <h2 className="line-clamp-2 text-[15px] font-semibold leading-tight text-slate-950 dark:text-[#f4f1e9]">
                        {scrapedJob ? scrapedJob.title : isJobSite ? 'Scanning for job details' : 'No job detected'}
                    </h2>
                    {isJobSite && scrapedJob && (
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <p className="truncate text-xs text-slate-500 dark:text-[#aaa39a]">{scrapedJob.company || 'Company detected'}</p>
                            {scrapedJob.salary && (
                                <span className="inline-flex items-center gap-1 rounded border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                                    <DollarSign size={9} />
                                    {scrapedJob.salary}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {isJobSite && (
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border border-[#e2e4ff] bg-[#eef0ff] text-[#625bd5] dark:border-[#4d4a73] dark:bg-[#302f49] dark:text-[#b8b3ff]">
                        <Briefcase size={15} />
                    </div>
                )}
            </div>

            {isOutOfCredits && matchScore === null && !isCalculatingScore && isJobSite && (
                <div className="mt-3 rounded-2xl border border-dashed border-[#d9d7fb] bg-[#f5f4ff] p-3.5 dark:border-[#4d4a73] dark:bg-[#302f49]">
                    <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-[#625bd5] shadow-sm">
                            <Zap size={13} className="fill-current text-white" />
                        </div>
                        <p className="text-[11px] font-semibold leading-tight text-[#4f4a9f] dark:text-[#d8d5ff]">Monthly AI limit reached</p>
                    </div>
                    <p className="mb-3 text-[10px] leading-relaxed text-[#625f95] dark:text-[#b8b3ff]">
                        You've used <span className="font-bold">{aiUsage?.count}/{aiUsage?.limit}</span> AI credits this month. Upgrade to keep running resume-fit analysis.
                    </p>
                    <button
                        onClick={() => window.open('https://careervivid.app/subscription', '_blank')}
                        className="w-full rounded-xl bg-[#625bd5] px-3 py-2.5 text-xs font-semibold text-white shadow-[0_10px_20px_rgba(98,91,213,0.18)] transition-all hover:bg-[#5851c8] active:scale-[0.99]"
                    >
                        Upgrade to CareerVivid Pro
                    </button>
                </div>
            )}

            {isJobSite && (!scrapedJob || !hasJobDescription) && renderRefreshPanel()}

            {(isJobSite || hasRealAnalysis) && (
                <div className="mt-3 rounded-2xl border border-[#ececf4] bg-[#f8f8fb] p-3 dark:border-[#3a3834] dark:bg-[#1f1f1d]">
                    <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#625bd5] dark:text-[#b8b3ff]">
                                <Sparkles size={13} />
                                Gemini resume analysis
                            </div>
                            <p className="mt-1 truncate text-[10px] leading-snug text-slate-500 dark:text-[#aaa39a]">
                                Against {activeResumeLabel}
                            </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${fitTone.chip}`}>
                            {isCalculatingScore ? (
                                <>
                                    <Loader2 size={10} className="animate-spin" />
                                    Running
                                </>
                            ) : hasRealAnalysis ? (
                                `${matchScore}% fit`
                            ) : (
                                fitTone.label
                            )}
                        </span>
                    </div>

                    {renderAnalysisState()}

                    <div className="mt-3 space-y-1.5">
                        {analysisSections
                            .filter(section => section.key === 'context' || hasRealAnalysis)
                            .map(section => {
                                const isOpen = !!openSections[section.key];
                                const SectionIcon = section.icon;

                                return (
                                    <div key={section.key} className="overflow-hidden rounded-xl border border-[#ececf4] bg-white dark:border-[#3a3834] dark:bg-[#262522]">
                                        <button
                                            onClick={() => setOpenSections(prev => ({ ...prev, [section.key]: !isOpen }))}
                                            className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left transition-colors hover:bg-[#f4f3ff] dark:hover:bg-[#302f49]"
                                        >
                                            <span className="flex min-w-0 items-center gap-2">
                                                <SectionIcon size={12} className="flex-shrink-0 text-[#7b75df] dark:text-[#b8b3ff]" />
                                                <span className="truncate text-[11px] font-semibold text-slate-800 dark:text-[#f4f1e9]">{section.label}</span>
                                            </span>
                                            {isOpen ? <ChevronUp size={12} className="text-slate-400 dark:text-[#aaa39a]" /> : <ChevronDown size={12} className="text-slate-400 dark:text-[#aaa39a]" />}
                                        </button>
                                        {isOpen && (
                                            <div className="space-y-1.5 px-2.5 pb-2">
                                                {section.items.length > 0 ? section.items.map((item, index) => (
                                                    <div key={`${section.key}-${index}`} className="flex items-start gap-1.5 text-[10px] leading-snug text-slate-600 dark:text-[#c9c3ba]">
                                                        <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-[#aaa6ee] dark:bg-[#b8b3ff]" />
                                                        <span>{truncate(item, 150)}</span>
                                                    </div>
                                                )) : (
                                                    <p className="text-[10px] leading-snug text-slate-400 dark:text-[#8e887f]">{section.empty}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {isJobSite ? (
                <>
                    {showStagePicker && (
                        <div className="mt-3 rounded-2xl border border-[#d9d7fb] bg-[#f5f4ff] p-3 dark:border-[#4d4a73] dark:bg-[#302f49]">
                            <div className="mb-2.5 flex items-center justify-between">
                                <p className="text-[11px] font-semibold text-[#4f4a9f] dark:text-[#d8d5ff]">Where are you in the process?</p>
                                <button onClick={() => setShowStagePicker(false)} className="text-[#8d88e6] transition-colors hover:text-[#625bd5] dark:text-[#b8b3ff]">
                                    <X size={13} />
                                </button>
                            </div>
                            <div className="mb-3 flex flex-wrap gap-1.5">
                                {STAGES.map(stage => (
                                    <button
                                        key={stage.id}
                                        onClick={() => setSelectedStage(stage.id)}
                                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                            selectedStage === stage.id
                                                ? 'border-[#625bd5] bg-[#625bd5] text-white shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-[#c8c7f4] hover:text-[#625bd5] dark:border-[#3a3834] dark:bg-[#262522] dark:text-[#c9c3ba] dark:hover:border-[#4d4a73] dark:hover:text-[#b8b3ff]'
                                        }`}
                                    >
                                        {stage.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => { onSaveJob(selectedStage); setShowStagePicker(false); }}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white shadow-md shadow-slate-200 transition-all hover:bg-slate-950 active:scale-[0.99] dark:bg-[#f4f1e9] dark:text-[#1f1f1d] dark:shadow-none dark:hover:bg-white"
                            >
                                <Plus size={14} />
                                {saveButtonLabel}
                            </button>
                        </div>
                    )}

                    {!showStagePicker && (
                        <button
                            onClick={() => setShowStagePicker(true)}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-950 active:scale-[0.99] dark:bg-[#f4f1e9] dark:text-[#1f1f1d] dark:shadow-none dark:hover:bg-white"
                        >
                            <Plus size={16} />
                            <span>{saveButtonLabel}</span>
                        </button>
                    )}
                </>
            ) : (
                <button
                    onClick={onNewResume}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#625bd5] py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(98,91,213,0.18)] transition-all hover:bg-[#5851c8] active:scale-[0.99]"
                >
                    <Plus size={16} />
                    <span>Create resume</span>
                </button>
            )}
        </div>
    );
};
