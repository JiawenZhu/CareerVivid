import React, { useState } from 'react';
import { 
    Info, 
    X as XIcon, 
    CheckCircle, 
    XCircle, 
    ChevronDown, 
    ChevronUp, 
    Sparkles, 
    Wand2, 
    Award, 
    Briefcase, 
    Key, 
    UserCheck,
    Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Draggable from 'react-draggable';
import { ResumeMatchAnalysis } from '../../../types';

interface OptimizationJob {
    title: string;
    description: string;
    analysis?: ResumeMatchAnalysis;
}

interface OptimizationPanelProps {
    job: OptimizationJob | null;
    onClear: () => void;
}

const OptimizationPanel: React.FC<OptimizationPanelProps> = ({ job, onClear }) => {
    const { t } = useTranslation();
    const nodeRef = React.useRef(null);
    const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);
    const [isKeywordsExpanded, setIsKeywordsExpanded] = useState(false);
    
    const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({
        qualifications: false,
        responsibilities: false,
        keywords: false,
        jobTitle: false
    });

    if (!job) return null;

    const { analysis } = job;
    const matchPercentage = analysis ? Math.round(analysis.matchPercentage) : 0;

    const toggleAccordion = (key: string) => {
        setExpandedAccordions(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleRunTailor = () => {
        const event = new CustomEvent('open-ai-tailor', {
            detail: { jobDescription: job.description }
        });
        window.dispatchEvent(event);
    };

    // 5 rating category definition mapping
    const getVerdictCategory = (score: number) => {
        if (score >= 80) return { label: 'Great', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50' };
        if (score >= 60) return { label: 'Excellent', color: 'text-sky-700 bg-sky-50 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50' };
        if (score >= 40) return { label: 'Good', color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50' };
        if (score >= 20) return { label: 'Fair', color: 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50' };
        return { label: 'Poor', color: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50' };
    };

    const segments = [
        { label: 'Poor', min: 0, max: 20, activeBg: 'bg-rose-500', defaultBg: 'bg-rose-100 dark:bg-rose-950/20' },
        { label: 'Fair', min: 21, max: 40, activeBg: 'bg-orange-500', defaultBg: 'bg-orange-100 dark:bg-orange-950/20' },
        { label: 'Good', min: 41, max: 60, activeBg: 'bg-amber-500', defaultBg: 'bg-amber-100 dark:bg-amber-950/20' },
        { label: 'Excellent', min: 61, max: 80, activeBg: 'bg-sky-500', defaultBg: 'bg-sky-100 dark:bg-sky-950/20' },
        { label: 'Great', min: 81, max: 100, activeBg: 'bg-emerald-500', defaultBg: 'bg-emerald-100 dark:bg-emerald-950/20' },
    ];

    const verdictInfo = getVerdictCategory(matchPercentage);

    // Secure details for collapsible accordions (incorporates database schema fallback seamlessly)
    const getCategoryDetails = (key: string) => {
        const customDetails = analysis?.[key as keyof ResumeMatchAnalysis] as any;
        if (customDetails) return customDetails;

        // Local dynamic fallbacks if schema wasn't fully filled from legacy matches
        if (key === 'qualifications') {
            return {
                score: Math.round(matchPercentage * 0.95),
                rating: matchPercentage >= 80 ? 'Great' : matchPercentage >= 50 ? 'Good' : 'Fair',
                impact: 'High Impact',
                details: [
                    'Explicitly highlight your degrees and educational certifications at the top.',
                    'Check for any required licenses mentioned in target requirements.'
                ]
            };
        } else if (key === 'responsibilities') {
            return {
                score: Math.round(matchPercentage * 0.9),
                rating: matchPercentage >= 70 ? 'Good' : 'Fair',
                impact: 'High Impact',
                details: [
                    'Structure bullet points to emphasize project ownership and leadership.',
                    'Align past experience directly with the expected day-to-day role responsibilities.'
                ]
            };
        } else if (key === 'keywords') {
            const total = analysis?.totalKeywords || 10;
            const matched = analysis?.matchedKeywords?.length || 0;
            const score = total > 0 ? Math.round((matched / total) * 100) : matchPercentage;
            return {
                score,
                rating: score >= 80 ? 'Great' : score >= 50 ? 'Good' : 'Fair',
                impact: 'Medium Impact',
                details: [
                    `Successfully matched ${matched} out of ${total} key skills.`,
                    `Integrate missing items like: ${analysis?.missingKeywords?.slice(0, 3).join(', ') || 'industry terminology'} to raise visibility.`
                ]
            };
        } else {
            return {
                score: Math.round(matchPercentage * 0.85),
                rating: matchPercentage >= 80 ? 'Great' : 'Fair',
                impact: 'Low Impact',
                details: [
                    `Aligning details directly for target job title: "${job.title}".`,
                    'Ensure that resume title lines map closely with standard seniority keywords.'
                ]
            };
        }
    };

    const getRatingStyle = (rating: string) => {
        const cleanRating = (rating || '').toLowerCase();
        if (cleanRating.includes('great') || cleanRating.includes('excellent')) {
            return 'text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40';
        }
        if (cleanRating.includes('good') || cleanRating.includes('fair')) {
            return 'text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40';
        }
        return 'text-gray-500 bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    };

    const accordionsConfig = [
        { key: 'qualifications', label: 'Qualifications Match', icon: Award },
        { key: 'responsibilities', label: 'Responsibilities Match', icon: Briefcase },
        { key: 'keywords', label: 'Keyword Match', icon: Key },
        { key: 'jobTitle', label: 'Job Title Match', icon: UserCheck }
    ];

    return (
        <Draggable nodeRef={nodeRef} handle=".drag-handle">
            <div 
                ref={nodeRef} 
                className="fixed top-24 right-4 z-[30] bg-white dark:bg-gray-900 shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm flex flex-col max-h-[85vh] overflow-hidden transition-all duration-200"
            >
                {/* Header */}
                <div className="drag-handle cursor-move p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center flex-shrink-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur rounded-t-2xl select-none">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-primary-50 dark:bg-primary-950/30 rounded-lg text-primary-500">
                            <Sparkles size={16} />
                        </div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">AI Job Match Analyzer</h3>
                    </div>
                    <button 
                        onClick={onClear} 
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <XIcon size={16} />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {analysis && (
                        <div className="space-y-4">
                            {/* Score & Segmented Bar */}
                            <div className="bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                            {matchPercentage}
                                        </span>
                                        <span className="text-xs font-bold text-gray-400">%</span>
                                    </div>
                                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${verdictInfo.color}`}>
                                        {verdictInfo.label}
                                    </span>
                                </div>

                                {/* Segmented color track bar */}
                                <div className="grid grid-cols-5 gap-1.5 my-3">
                                    {segments.map((seg) => {
                                        const isActive = matchPercentage >= seg.min;
                                        const isCurrent = matchPercentage >= seg.min && matchPercentage <= seg.max;
                                        return (
                                            <div key={seg.label} className="flex flex-col items-center">
                                                <div 
                                                    className={`w-full h-1.5 rounded-full transition-all duration-500 ${
                                                        isActive ? seg.activeBg : seg.defaultBg
                                                    }`} 
                                                />
                                                <span className={`text-[8px] mt-1 font-bold tracking-wider uppercase transition-colors duration-200 ${
                                                    isCurrent 
                                                        ? 'text-gray-950 dark:text-gray-100 font-extrabold' 
                                                        : 'text-gray-400 dark:text-gray-600'
                                                }`}>
                                                    {seg.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* AI Verdict Card */}
                            <div className="bg-gradient-to-br from-primary-500/[0.04] to-indigo-500/[0.04] dark:from-primary-500/[0.08] dark:to-indigo-500/[0.08] p-4 rounded-xl border border-primary-500/[0.08] dark:border-primary-500/[0.15]">
                                <div className="flex items-center gap-1.5 mb-2 text-primary-600 dark:text-primary-400 font-bold text-xs">
                                    <Sparkles size={14} />
                                    <span>AI MATCH VERDICT</span>
                                </div>
                                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                    {analysis.verdict || analysis.summary}
                                </p>
                            </div>

                            {/* 4 Accordions Section */}
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Match Breakdown</h4>
                                {accordionsConfig.map(acc => {
                                    const details = getCategoryDetails(acc.key);
                                    const isExpanded = expandedAccordions[acc.key];
                                    const ratingStyle = getRatingStyle(details.rating);
                                    const Icon = acc.icon;

                                    return (
                                        <div 
                                            key={acc.key} 
                                            className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 transition-all duration-200"
                                        >
                                            <button
                                                onClick={() => toggleAccordion(acc.key)}
                                                className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg">
                                                        <Icon size={14} />
                                                    </div>
                                                    <div>
                                                        <h5 className="text-xs font-bold text-gray-900 dark:text-white leading-none mb-1">
                                                            {acc.label}
                                                        </h5>
                                                        <span className="text-[9px] text-gray-400 font-medium">
                                                            {details.impact}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ratingStyle}`}>
                                                        {details.rating} {details.score}
                                                    </span>
                                                    {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="px-4 pb-4 pt-1 bg-gray-50/30 dark:bg-gray-900/20 border-t border-gray-50 dark:border-gray-800/50 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <ul className="space-y-2">
                                                        {details.details?.map((pt: string, idx: number) => (
                                                            <li key={idx} className="flex gap-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                                                <Check size={12} className="text-emerald-500 flex-shrink-0 mt-1" />
                                                                <span>{pt}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Keywords Toggle (Kept from original design) */}
                            <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                                <button
                                    onClick={() => setIsKeywordsExpanded(!isKeywordsExpanded)}
                                    className="text-xs font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1.5"
                                >
                                    {isKeywordsExpanded ? 'Hide Keywords' : 'Show Keyword details'}
                                    {isKeywordsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>

                                {isKeywordsExpanded && (
                                    <div className="mt-3 space-y-3 animate-in fade-in duration-200">
                                        <div>
                                            <h5 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                                                <CheckCircle size={12} /> MATCHED ({analysis.matchedKeywords.length})
                                            </h5>
                                            <div className="flex flex-wrap gap-1">
                                                {analysis.matchedKeywords.length > 0 ? (
                                                    analysis.matchedKeywords.map(k => (
                                                        <span key={k} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-[10px] rounded-lg border border-emerald-100 dark:border-emerald-900/30 font-medium">
                                                            {k}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] text-gray-400">None</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-1">
                                                <XCircle size={12} /> MISSING ({analysis.missingKeywords.length})
                                            </h5>
                                            <div className="flex flex-wrap gap-1">
                                                {analysis.missingKeywords.length > 0 ? (
                                                    analysis.missingKeywords.map(k => (
                                                        <span key={k} className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-[10px] rounded-lg border border-rose-100 dark:border-rose-900/30 font-medium">
                                                            {k}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] text-gray-400">None</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Job Details */}
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                        <h4 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">Job Description</h4>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">{job.title}</h3>
                        <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto custom-scrollbar border border-gray-50 dark:border-gray-800/50 p-2.5 rounded-lg bg-gray-50/30 dark:bg-gray-900/20">
                            {job.description}
                        </div>
                    </div>

                    {/* Premium AI Tailoring Action Banner */}
                    <div className="p-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/30 flex flex-col gap-3">
                        <div className="flex items-start gap-2.5">
                            <div className="p-1.5 bg-purple-500 text-white rounded-lg flex-shrink-0 mt-0.5 shadow-md shadow-purple-500/20">
                                <Wand2 size={14} />
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                Tired of manual job tailoring? Run <strong className="text-purple-600 dark:text-purple-400">AI Tailor</strong> for a fully automated tailoring of your resume to the job.
                            </p>
                        </div>
                        <button
                            onClick={handleRunTailor}
                            className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-200 text-xs tracking-wide flex items-center justify-center gap-1.5 uppercase"
                        >
                            ✨ Run AI Tailor
                        </button>
                    </div>
                </div>
            </div>
        </Draggable>
    );
};

export default OptimizationPanel;
