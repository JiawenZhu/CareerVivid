import React, { useEffect, useRef, useState } from 'react';
import { 
    Briefcase, Sparkles, ChevronDown, ChevronUp, Plus, Loader2, Award, Key, UserCheck, AlertCircle, RefreshCw 
} from 'lucide-react';
import { ResumeMatchAnalysis } from '../../types';

interface MatchBreakdownCardProps {
    matchScore: number | null;
    matchAnalysis: ResumeMatchAnalysis | null;
    isCalculatingScore: boolean;
    isJobSite: boolean;
    scrapedJob: { title: string; company: string; description?: string } | null;
    onSaveJob: () => void;
    onNewResume: () => void;
}

export const MatchBreakdownCard: React.FC<MatchBreakdownCardProps> = ({
    matchScore,
    matchAnalysis,
    isCalculatingScore,
    isJobSite,
    scrapedJob,
    onSaveJob,
    onNewResume
}) => {
    const [showMatchDetails, setShowMatchDetails] = useState(matchScore !== null);
    const previousMatchScore = useRef<number | null>(matchScore);

    useEffect(() => {
        if (previousMatchScore.current === null && matchScore !== null) {
            setShowMatchDetails(true);
        }
        previousMatchScore.current = matchScore;
    }, [matchScore]);

    return (
        <div className="bg-white rounded-[20px] p-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] border border-gray-100">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-1.5 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider border border-gray-200/70">
                            {isJobSite ? 'Job Detected' : 'Ready to Apply'}
                        </span>
                        {isCalculatingScore && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Matching...
                            </span>
                        )}
                        {matchScore !== null && !isCalculatingScore && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                matchScore >= 70 ? 'bg-green-50 text-green-600 border-green-100' :
                                matchScore >= 40 ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                'bg-red-50 text-red-600 border-red-100'
                            }`}>
                                <Sparkles size={10} className={matchScore >= 70 ? 'text-green-500' : ''} />
                                {matchScore}% Match
                            </span>
                        )}
                    </div>
                    <h2 className="text-[15px] font-extrabold text-gray-950 leading-tight line-clamp-2">
                        {isJobSite && scrapedJob ? scrapedJob.title : 'Supercharge Your Job Hunt'}
                    </h2>
                    {isJobSite && scrapedJob && (
                        <p className="text-xs text-gray-500 mt-0.5">{scrapedJob.company}</p>
                    )}
                </div>
                {isJobSite && (
                    <div className="h-9 w-9 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0 border border-blue-100">
                        <Briefcase size={15} />
                    </div>
                )}
            </div>

            {/* Reload Webpage Fallback if Job detected but empty description */}
            {isJobSite && (!scrapedJob || !scrapedJob.description) && (
                <div className="mt-3 p-3 bg-amber-50/60 border border-amber-100 dark:border-amber-900/30 rounded-xl flex flex-col gap-2.5">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-xs font-bold text-amber-800 leading-tight">No job details loaded</h4>
                            <p className="text-[10px] text-amber-700 mt-0.5 leading-normal">
                                The webpage might not have fully loaded dynamic contents yet. Click below to reload and sync the job details.
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
                        className="w-full flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-colors shadow-sm"
                    >
                        <RefreshCw size={12} className="animate-pulse" />
                        Reload Webpage
                    </button>
                </div>
            )}

            {/* DYNAMIC COLLAPSIBLE MATCH BREAKDOWN */}
            {matchScore !== null && !isCalculatingScore && (
                <div className="mt-3 bg-slate-50/80 rounded-2xl p-3 border border-gray-100/80">
                    <button
                        onClick={() => setShowMatchDetails(!showMatchDetails)}
                        className="w-full flex items-center justify-between text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                    >
                        <span>AI Match Breakdown</span>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-400 font-medium">{showMatchDetails ? 'Hide' : 'View details'}</span>
                            {showMatchDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </div>
                    </button>

                    {showMatchDetails && (
                        <div className="mt-3.5 space-y-2 border-t border-gray-100/80 pt-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
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
                                            <span className="font-semibold">{cat.label}</span>
                                        </div>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${catRatingStyle}`}>
                                            {rating} {score}
                                        </span>
                                    </div>
                                );
                            })}

                            {/* KEYWORDS SCORECARD DISPLAY */}
                            {((matchAnalysis?.matchedKeywords && matchAnalysis.matchedKeywords.length > 0) || 
                              (matchAnalysis?.missingKeywords && matchAnalysis.missingKeywords.length > 0)) && (
                                <div className="mt-3.5 border-t border-gray-100/80 pt-2.5 space-y-2.5">
                                    {matchAnalysis.matchedKeywords && matchAnalysis.matchedKeywords.length > 0 && (
                                        <div>
                                            <span className="text-[9px] font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">Matched Keywords</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {matchAnalysis.matchedKeywords.map(k => (
                                                    <span key={k} className="px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-100 text-[9px] font-bold rounded">
                                                        {k}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {matchAnalysis.missingKeywords && matchAnalysis.missingKeywords.length > 0 && (
                                        <div>
                                            <span className="text-[9px] font-extrabold tracking-wider text-rose-500/80 uppercase">Missing Keywords</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {matchAnalysis.missingKeywords.map(k => (
                                                    <span key={k} className="px-1.5 py-0.5 bg-rose-50/60 text-rose-600 border border-rose-100 text-[9px] font-bold rounded">
                                                        {k}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {isJobSite ? (
                <button
                    onClick={onSaveJob}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-950 hover:bg-black text-white py-2.5 rounded-xl font-semibold shadow-lg shadow-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                >
                    <Plus size={16} />
                    <span>Save Job to Tracker</span>
                </button>
            ) : (
                <button
                    onClick={onNewResume}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                >
                    <Plus size={16} />
                    <span>Create AI Resume</span>
                </button>
            )}
        </div>
    );
};
