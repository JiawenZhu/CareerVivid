import React, { useEffect, useRef, useState } from 'react';
import {
    Briefcase, Sparkles, ChevronDown, ChevronUp, Plus, Loader2, Award, Key, UserCheck, AlertCircle, RefreshCw, FileText, Zap, DollarSign, X
} from 'lucide-react';
import { ResumeMatchAnalysis } from '../../types';

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
}

export const MatchBreakdownCard: React.FC<MatchBreakdownCardProps> = ({
    matchScore,
    matchAnalysis,
    isCalculatingScore,
    isJobSite,
    scrapedJob,
    onSaveJob,
    onNewResume,
    aiUsage
}) => {
    const isOutOfCredits = aiUsage ? aiUsage.count >= aiUsage.limit : false;
    const hasJobMetadata = Boolean(scrapedJob?.title || scrapedJob?.company);
    const hasJobDescription = Boolean(scrapedJob?.description?.trim());
    const saveButtonLabel = hasJobDescription ? 'Save + analyze fit' : 'Save to tracker';
    const [showStagePicker, setShowStagePicker] = useState(false);
    const [selectedStage, setSelectedStage] = useState<StageId>('wishlist');
    const [showMatchDetails, setShowMatchDetails] = useState(matchScore !== null);
    const [openInsights, setOpenInsights] = useState<Record<string, boolean>>({
        qualifications: true
    });
    const previousMatchScore = useRef<number | null>(matchScore);

    useEffect(() => {
        if (previousMatchScore.current === null && matchScore !== null) {
            setShowMatchDetails(true);
        }
        previousMatchScore.current = matchScore;
    }, [matchScore]);

    const descriptionHighlights = (scrapedJob?.description || '')
        .split(/\n|•|-/)
        .map(item => item.trim())
        .filter(item => item.length > 24)
        .slice(0, 4);

    const insightSections = [
        {
            key: 'description',
            label: 'Tagged Description',
            icon: FileText,
            items: descriptionHighlights,
            empty: 'No job description highlights loaded yet.'
        },
        {
            key: 'keywords',
            label: 'Keywords',
            icon: Key,
            items: [
                ...(matchAnalysis?.matchedKeywords || []).map(keyword => `Matched: ${keyword}`),
                ...(matchAnalysis?.missingKeywords || []).map(keyword => `Missing: ${keyword}`)
            ].slice(0, 10),
            empty: 'Keyword analysis will appear after matching finishes.'
        },
        {
            key: 'qualifications',
            label: 'Qualifications',
            icon: Award,
            items: matchAnalysis?.qualifications?.details?.slice(0, 5) || [],
            empty: 'Qualification signals will appear after matching finishes.'
        },
        {
            key: 'responsibilities',
            label: 'Responsibilities',
            icon: Briefcase,
            items: matchAnalysis?.responsibilities?.details?.slice(0, 5) || [],
            empty: 'Responsibility signals will appear after matching finishes.'
        }
    ];

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
                                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Matching
                            </span>
                        )}
                        {matchScore !== null && !isCalculatingScore && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                                matchScore >= 70 ? 'bg-green-50 text-green-600 border-green-100' :
                                matchScore >= 40 ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                'bg-red-50 text-red-600 border-red-100'
                            }`}>
                                <Sparkles size={10} className={matchScore >= 70 ? 'text-green-500' : ''} />
                                {matchScore}% match
                            </span>
                        )}
                    </div>
                    <h2 className="text-[15px] font-semibold text-slate-950 leading-tight line-clamp-2">
                        {scrapedJob ? scrapedJob.title : isJobSite ? 'Scanning for job details' : 'No job detected'}
                    </h2>
                    {isJobSite && scrapedJob && (
                        <div className="flex items-center flex-wrap gap-2 mt-0.5">
                            <p className="text-xs text-gray-500">{scrapedJob.company}</p>
                            {scrapedJob.salary && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-emerald-100 bg-emerald-50 text-[10px] font-bold text-emerald-700">
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

            {/* ── Out-of-Credits Premium Banner ── */}
            {isOutOfCredits && matchScore === null && !isCalculatingScore && isJobSite && (
                <div className="mt-3 rounded-2xl border border-dashed border-[#d9d7fb] bg-[#f5f4ff] p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#6a63d9] shadow-sm flex-shrink-0">
                            <Zap size={13} className="text-white fill-current" />
                        </div>
                        <p className="text-[11px] font-semibold text-[#4f4a9f] leading-tight">Monthly AI limit reached</p>
                    </div>
                    <p className="text-[10px] text-[#625f95] leading-relaxed mb-3">
                        You've used <span className="font-bold">{aiUsage?.count}/{aiUsage?.limit}</span> AI credits this month. Upgrade to Pro for unlimited resume matching, smart fill answers, and AI tailoring.
                    </p>
                    <button
                        onClick={() => window.open('https://careervivid.app/subscription', '_blank')}
                        className="w-full relative overflow-hidden rounded-xl bg-[#625bd5] px-3 py-2.5 text-xs font-semibold text-white shadow-[0_10px_20px_rgba(98,91,213,0.18)] transition-all hover:bg-[#5851c8] hover:scale-[1.01] active:scale-[0.99]"
                    >
                        <span className="relative z-10">Upgrade to CareerVivid Pro</span>
                        <span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </button>
                </div>
            )}

            {/* Refresh fallback if job description content is still syncing */}
            {isJobSite && (!scrapedJob || !hasJobDescription) && (
                <div className="mt-3 p-3 bg-amber-50/60 border border-amber-100 dark:border-amber-900/30 rounded-xl flex flex-col gap-2.5">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-xs font-semibold text-amber-800 leading-tight">
                                {hasJobMetadata ? 'Job found. Description still syncing.' : 'Scanning job page'}
                            </h4>
                            <p className="text-[10px] text-amber-700 mt-0.5 leading-normal">
                                {hasJobMetadata
                                    ? 'You can save the job now, or refresh details before match analysis.'
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
                        className="w-full flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-3 rounded-xl text-xs transition-colors shadow-sm"
                    >
                        <RefreshCw size={12} className="animate-pulse" />
                        Refresh details
                    </button>
                </div>
            )}

            {/* DYNAMIC COLLAPSIBLE MATCH BREAKDOWN */}
            {(isJobSite || matchScore !== null) && !isCalculatingScore && (
                <div className="mt-3 bg-[#f8f8fb] rounded-2xl p-3 border border-[#ececf4]">
                    <button
                        onClick={() => setShowMatchDetails(!showMatchDetails)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                    >
                        <span>AI match breakdown</span>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-400 font-medium">{showMatchDetails ? 'Hide' : 'View details'}</span>
                            {showMatchDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </div>
                    </button>

                    {showMatchDetails && (
                        <div className="mt-3.5 space-y-2 border-t border-gray-100/80 pt-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#625bd5]">
                                    <Sparkles size={13} />
                                    Job insights
                                </div>
                                {matchScore !== null && (
                                    <span className="text-[10px] font-semibold text-slate-400">{matchScore}% fit</span>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                {insightSections.map(section => {
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
                                                            <span>{item}</span>
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

                            {matchScore !== null && (
                                <>
                                    {[
                                        { key: 'qualifications', label: 'Qualifications', icon: Award },
                                        { key: 'responsibilities', label: 'Responsibilities', icon: Briefcase },
                                        { key: 'keywords', label: 'Keywords', icon: Key },
                                        { key: 'jobTitle', label: 'Job Title', icon: UserCheck }
                                    ].map(cat => {
                                        const val = matchAnalysis?.[cat.key as keyof ResumeMatchAnalysis] as any;
                                        const rating = val?.rating || (matchScore >= 70 ? 'Good' : 'Fair');
                                        const score = typeof val?.score === 'number' ? val.score : Math.round(matchScore * (cat.key === 'jobTitle' ? 0.85 : 0.95));

                                        const catRatingStyle =
                                            (rating.toLowerCase().includes('great') || rating.toLowerCase().includes('excellent') || rating.toLowerCase().includes('good'))
                                                ? 'text-green-600 bg-green-50/60 border-green-100 dark:bg-green-950/20'
                                                : 'text-amber-600 bg-amber-50/60 border-amber-100 dark:bg-amber-950/20';

                                        const CatIcon = cat.icon;

                                        return (
                                            <div key={cat.key} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <CatIcon size={12} className="text-gray-400" />
                                                    <span className="font-medium">{cat.label}</span>
                                                </div>
                                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${catRatingStyle}`}>
                                                    {rating} {score}
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {((matchAnalysis?.matchedKeywords && matchAnalysis.matchedKeywords.length > 0) ||
                                      (matchAnalysis?.missingKeywords && matchAnalysis.missingKeywords.length > 0)) && (
                                        <div className="mt-3.5 border-t border-gray-100/80 pt-2.5 space-y-2.5">
                                            {matchAnalysis.matchedKeywords && matchAnalysis.matchedKeywords.length > 0 && (
                                                <div>
                                                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">Matched keywords</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {matchAnalysis.matchedKeywords.map(k => (
                                                            <span key={k} className="px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-100 text-[9px] font-semibold rounded">
                                                                {k}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {matchAnalysis.missingKeywords && matchAnalysis.missingKeywords.length > 0 && (
                                                <div>
                                                    <span className="text-[9px] font-semibold text-rose-500/80">Missing keywords</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {matchAnalysis.missingKeywords.map(k => (
                                                            <span key={k} className="px-1.5 py-0.5 bg-rose-50/60 text-rose-600 border border-rose-100 text-[9px] font-semibold rounded">
                                                                {k}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {isJobSite ? (
                <>
                    {/* Stage picker panel — slides in on first click */}
                    {showStagePicker && (
                        <div className="mt-3 rounded-2xl border border-[#d9d7fb] bg-[#f5f4ff] p-3 animate-in slide-in-from-bottom-2 duration-200">
                            <div className="flex items-center justify-between mb-2.5">
                                <p className="text-[11px] font-semibold text-[#4f4a9f]">Where are you in the process?</p>
                                <button onClick={() => setShowStagePicker(false)} className="text-[#8d88e6] hover:text-[#625bd5] transition-colors">
                                    <X size={13} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {STAGES.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelectedStage(s.id)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                                            selectedStage === s.id
                                                ? 'bg-[#625bd5] text-white border-[#625bd5] shadow-sm'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-[#c8c7f4] hover:text-[#625bd5]'
                                        }`}
                                    >
                                        {s.label}
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
