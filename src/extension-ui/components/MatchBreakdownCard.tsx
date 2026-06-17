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
import { ResumeMatchAnalysis, GranularMatchCategory } from '../../types';

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
}

const actionLabels: Record<string, string> = {
    apply_now: 'Apply now',
    tailor_first: 'Tailor first',
    network_first: 'Network first',
    skip_for_now: 'Skip for now',
};

const getScoreTone = (score: number | null) => {
    if (score === null) {
        return {
            label: 'Ready',
            chip: 'bg-[#f4f5f8] text-slate-600 border-[#e8e9ef]',
            accent: 'text-[#625bd5]',
            ring: 'border-[#d9d7fb] bg-[#f3f2ff]',
        };
    }

    if (score >= 75) {
        return {
            label: 'Strong fit',
            chip: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            accent: 'text-emerald-700',
            ring: 'border-emerald-200 bg-emerald-50',
        };
    }

    if (score >= 50) {
        return {
            label: 'Good fit',
            chip: 'bg-amber-50 text-amber-700 border-amber-100',
            accent: 'text-amber-700',
            ring: 'border-amber-200 bg-amber-50',
        };
    }

    return {
        label: 'Needs tailoring',
        chip: 'bg-rose-50 text-rose-700 border-rose-100',
        accent: 'text-rose-700',
        ring: 'border-rose-200 bg-rose-50',
    };
};

const getCategoryTone = (category?: GranularMatchCategory) => {
    const rating = (category?.rating || '').toLowerCase();

    if (rating.includes('great') || rating.includes('excellent') || rating.includes('good')) {
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }

    if (rating.includes('missing') || rating.includes('weak')) {
        return 'bg-rose-50 text-rose-700 border-rose-100';
    }

    return 'bg-amber-50 text-amber-700 border-amber-100';
};

const truncate = (text: string, maxLength = 142) => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}...`;
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
    selectedResumeTitle
}) => {
    const isOutOfCredits = aiUsage ? aiUsage.count >= aiUsage.limit : false;
    const hasJobMetadata = Boolean(scrapedJob?.title || scrapedJob?.company);
    const hasJobDescription = Boolean(scrapedJob?.description?.trim());
    const saveButtonLabel = hasJobDescription ? 'Save + analyze fit' : 'Save to tracker';
    const [showStagePicker, setShowStagePicker] = useState(false);
    const [selectedStage, setSelectedStage] = useState<StageId>('wishlist');
    const [openInsights, setOpenInsights] = useState<Record<string, boolean>>({
        description: true,
        strengths: true,
        gaps: true,
        keywords: true,
        qualifications: true,
        responsibilities: true,
    });

    const scoreTone = getScoreTone(matchScore);
    const activeResumeLabel = selectedResumeTitle || 'selected resume';

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
            key: 'description',
            label: 'Job description',
            icon: FileText,
            items: descriptionHighlights,
            empty: 'Job description highlights will appear after the page finishes syncing.',
        },
        {
            key: 'strengths',
            label: 'Strong matches',
            icon: CheckCircle2,
            items: matchAnalysis?.strongMatches?.slice(0, 4) || [],
            empty: 'Strong resume matches will appear after analysis finishes.',
        },
        {
            key: 'gaps',
            label: 'Gaps to tailor',
            icon: Target,
            items: matchAnalysis?.experienceGaps?.slice(0, 4) || [],
            empty: 'Tailoring gaps will appear after analysis finishes.',
        },
    ];

    const recommendedAction = matchAnalysis?.recommendedAction
        ? actionLabels[matchAnalysis.recommendedAction] || matchAnalysis.recommendedAction.replace(/_/g, ' ')
        : null;

    const summaryText = matchAnalysis?.verdict || matchAnalysis?.summary || (
        hasJobDescription
            ? `Ready to compare this role against ${activeResumeLabel}.`
            : 'Open a job page or refresh after the posting finishes loading.'
    );

    const renderRefreshPanel = () => (
        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
            <div className="flex items-start gap-2">
                <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-amber-900 leading-tight">
                        {hasJobMetadata ? 'Job found. Description still syncing.' : 'Scanning job page'}
                    </h4>
                    <p className="text-[10px] text-amber-700 mt-0.5 leading-normal">
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
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 px-3 rounded-xl text-xs transition-colors shadow-sm"
            >
                <RefreshCw size={12} />
                Refresh details
            </button>
        </div>
    );

    return (
        <div className="bg-white rounded-[22px] p-3.5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] border border-[#ececf4]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-1.5 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f4f5f8] text-slate-600 text-[10px] font-semibold border border-[#e8e9ef]">
                            <span className={`h-1.5 w-1.5 rounded-full ${hasJobMetadata ? 'bg-[#3b82f6]' : isJobSite ? 'bg-[#f2b705]' : 'bg-slate-400'}`} />
                            {hasJobMetadata ? 'Job detected' : isJobSite ? 'Scanning page' : 'No job detected'}
                        </span>
                        {isCalculatingScore && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#eef5ff] text-[#4f75c8] text-[10px] font-semibold border border-[#dfeaff]">
                                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Analyzing
                            </span>
                        )}
                        {matchScore !== null && !isCalculatingScore && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${scoreTone.chip}`}>
                                <Sparkles size={10} />
                                {scoreTone.label}
                            </span>
                        )}
                    </div>
                    <h2 className="text-[15px] font-semibold text-slate-950 leading-tight line-clamp-2">
                        {scrapedJob ? scrapedJob.title : isJobSite ? 'Scanning for job details' : 'No job detected'}
                    </h2>
                    {isJobSite && scrapedJob && (
                        <div className="flex items-center flex-wrap gap-2 mt-0.5">
                            <p className="text-xs text-gray-500 truncate">{scrapedJob.company || 'Company detected'}</p>
                            {scrapedJob.salary && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-emerald-100 bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                                    <DollarSign size={9} />
                                    {scrapedJob.salary}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {isJobSite && (
                    <div className="h-9 w-9 rounded-2xl bg-[#eef0ff] flex items-center justify-center text-[#625bd5] flex-shrink-0 border border-[#e2e4ff]">
                        <Briefcase size={15} />
                    </div>
                )}
            </div>

            {isOutOfCredits && matchScore === null && !isCalculatingScore && isJobSite && (
                <div className="mt-3 rounded-2xl border border-dashed border-[#d9d7fb] bg-[#f5f4ff] p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#625bd5] shadow-sm flex-shrink-0">
                            <Zap size={13} className="text-white fill-current" />
                        </div>
                        <p className="text-[11px] font-semibold text-[#4f4a9f] leading-tight">Monthly AI limit reached</p>
                    </div>
                    <p className="text-[10px] text-[#625f95] leading-relaxed mb-3">
                        You've used <span className="font-bold">{aiUsage?.count}/{aiUsage?.limit}</span> AI credits this month. Upgrade to keep running resume-fit analysis and tailoring.
                    </p>
                    <button
                        onClick={() => window.open('https://careervivid.app/subscription', '_blank')}
                        className="w-full rounded-xl bg-[#625bd5] px-3 py-2.5 text-xs font-semibold text-white shadow-[0_10px_20px_rgba(98,91,213,0.18)] transition-all hover:bg-[#5851c8] hover:scale-[1.01] active:scale-[0.99]"
                    >
                        Upgrade to CareerVivid Pro
                    </button>
                </div>
            )}

            {isJobSite && (!scrapedJob || !hasJobDescription) && renderRefreshPanel()}

            {(isJobSite || matchScore !== null) && (
                <div className="mt-3 rounded-2xl border border-[#ececf4] bg-[#f8f8fb] p-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#625bd5]">
                                <Sparkles size={13} />
                                AI match breakdown
                            </div>
                            <p className="mt-1 text-[10px] text-slate-500 leading-snug truncate">
                                Against {activeResumeLabel}
                            </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-semibold ${scoreTone.chip}`}>
                            {isCalculatingScore ? (
                                <>
                                    <Loader2 size={10} className="animate-spin" />
                                    Matching
                                </>
                            ) : matchScore !== null ? (
                                `${matchScore}% match`
                            ) : (
                                scoreTone.label
                            )}
                        </span>
                    </div>

                    <div className="mt-3 rounded-2xl bg-white border border-[#ececf4] p-3">
                        {isCalculatingScore ? (
                            <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-2xl bg-[#f3f2ff] border border-[#d9d7fb] flex items-center justify-center text-[#625bd5] flex-shrink-0">
                                    <Loader2 size={18} className="animate-spin" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-950">Analyzing resume fit</p>
                                    <p className="text-[11px] text-slate-500 leading-snug">Checking the job against {activeResumeLabel}.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3">
                                <div className={`h-12 w-12 rounded-2xl border ${scoreTone.ring} flex flex-col items-center justify-center flex-shrink-0`}>
                                    {matchScore !== null ? (
                                        <>
                                            <span className={`text-base font-bold leading-none ${scoreTone.accent}`}>{matchScore}</span>
                                            <span className="text-[8px] font-semibold text-slate-400 leading-none mt-0.5">FIT</span>
                                        </>
                                    ) : (
                                        <Search size={17} className={scoreTone.accent} />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center flex-wrap gap-1.5">
                                        <p className="text-sm font-semibold text-slate-950">{scoreTone.label}</p>
                                        {recommendedAction && (
                                            <span className="rounded-full border border-[#e6dac8] bg-[#fffaf1] px-2 py-0.5 text-[9px] font-semibold text-[#7c5b2c] capitalize">
                                                {recommendedAction}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-600 leading-snug">{truncate(summaryText, 180)}</p>
                                    {matchAnalysis?.suggestedResumeAngle && (
                                        <p className="mt-2 rounded-xl border border-[#e6dac8] bg-[#fffaf1] px-2.5 py-2 text-[10px] leading-snug text-[#665a4a]">
                                            <span className="font-semibold text-[#211b16]">Resume angle: </span>
                                            {truncate(matchAnalysis.suggestedResumeAngle, 150)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {matchScore !== null && (
                        <div className="mt-2.5 grid grid-cols-1 gap-1.5">
                            {categoryRows.map(row => {
                                const RowIcon = row.icon;
                                const category = row.category;
                                const score = typeof category?.score === 'number' ? category.score : null;
                                const rating = category?.rating || 'Review';

                                return (
                                    <div key={row.key} className="rounded-xl border border-[#ececf4] bg-white px-2.5 py-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <RowIcon size={12} className="text-[#7b75df] flex-shrink-0" />
                                                <span className="text-[11px] font-semibold text-slate-800 truncate">{row.label}</span>
                                            </div>
                                            <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${getCategoryTone(category)}`}>
                                                {rating}{score !== null ? ` ${score}` : ''}
                                            </span>
                                        </div>
                                        {category?.details?.[0] && (
                                            <p className="mt-1 text-[10px] leading-snug text-slate-500">{truncate(category.details[0], 120)}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {((matchAnalysis?.matchedKeywords && matchAnalysis.matchedKeywords.length > 0) ||
                      (matchAnalysis?.missingKeywords && matchAnalysis.missingKeywords.length > 0)) && (
                        <div className="mt-3 rounded-2xl border border-[#ececf4] bg-white p-2.5 space-y-2.5">
                            {matchAnalysis?.matchedKeywords?.length ? (
                                <div>
                                    <span className="text-[9px] font-semibold text-emerald-700">Matched keywords</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {matchAnalysis.matchedKeywords.slice(0, 8).map(keyword => (
                                            <span key={keyword} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-semibold rounded">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {matchAnalysis?.missingKeywords?.length ? (
                                <div>
                                    <span className="text-[9px] font-semibold text-rose-600">Missing keywords</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {matchAnalysis.missingKeywords.slice(0, 8).map(keyword => (
                                            <span key={keyword} className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-semibold rounded">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    <div className="mt-3 space-y-1.5">
                        {analysisSections.map(section => {
                            const isOpen = !!openInsights[section.key];
                            const SectionIcon = section.icon;

                            return (
                                <div key={section.key} className="rounded-xl border border-[#ececf4] bg-white overflow-hidden">
                                    <button
                                        onClick={() => setOpenInsights(prev => ({ ...prev, [section.key]: !isOpen }))}
                                        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-left hover:bg-[#f4f3ff] transition-colors"
                                    >
                                        <span className="flex items-center gap-2 min-w-0">
                                            <SectionIcon size={12} className="text-[#7b75df] flex-shrink-0" />
                                            <span className="text-[11px] font-semibold text-slate-800 truncate">{section.label}</span>
                                        </span>
                                        {isOpen ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
                                    </button>
                                    {isOpen && (
                                        <div className="px-2.5 pb-2 space-y-1.5">
                                            {section.items.length > 0 ? section.items.map((item, index) => (
                                                <div key={`${section.key}-${index}`} className="flex items-start gap-1.5 text-[10px] leading-snug text-slate-600">
                                                    <span className="mt-1 h-1 w-1 rounded-full bg-[#aaa6ee] flex-shrink-0" />
                                                    <span>{truncate(item, 150)}</span>
                                                </div>
                                            )) : (
                                                <p className="text-[10px] leading-snug text-slate-400">{section.empty}</p>
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
                        <div className="mt-3 rounded-2xl border border-[#d9d7fb] bg-[#f5f4ff] p-3 animate-in slide-in-from-bottom-2 duration-200">
                            <div className="flex items-center justify-between mb-2.5">
                                <p className="text-[11px] font-semibold text-[#4f4a9f]">Where are you in the process?</p>
                                <button onClick={() => setShowStagePicker(false)} className="text-[#8d88e6] hover:text-[#625bd5] transition-colors">
                                    <X size={13} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {STAGES.map(stage => (
                                    <button
                                        key={stage.id}
                                        onClick={() => setSelectedStage(stage.id)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                                            selectedStage === stage.id
                                                ? 'bg-[#625bd5] text-white border-[#625bd5] shadow-sm'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-[#c8c7f4] hover:text-[#625bd5]'
                                        }`}
                                    >
                                        {stage.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => { onSaveJob(selectedStage); setShowStagePicker(false); }}
                                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-950 text-white py-2 rounded-xl font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-slate-200"
                            >
                                <Plus size={14} />
                                {saveButtonLabel}
                            </button>
                        </div>
                    )}

                    {!showStagePicker && (
                        <button
                            onClick={() => setShowStagePicker(true)}
                            className="mt-3 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-950 text-white py-2.5 rounded-xl font-semibold shadow-lg shadow-slate-200 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm"
                        >
                            <Plus size={16} />
                            <span>{saveButtonLabel}</span>
                        </button>
                    )}
                </>
            ) : (
                <button
                    onClick={onNewResume}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-[#625bd5] hover:bg-[#5851c8] text-white py-2.5 rounded-xl font-semibold shadow-[0_10px_20px_rgba(98,91,213,0.18)] transition-all hover:scale-[1.01] active:scale-[0.99] text-sm"
                >
                    <Plus size={16} />
                    <span>Create resume</span>
                </button>
            )}
        </div>
    );
};
