import React, { useState } from 'react';
import { 
    CheckCircle2, 
    XCircle, 
    ChevronDown, 
    ChevronUp, 
    Plus, 
    Minus,
    HelpCircle,
    Check,
    AlertTriangle,
    Sparkles
} from 'lucide-react';
import { ResumeData } from '../../../types';
import { calculateResumeScore, ScoreItem } from '../../../utils/resumeScoreUtils';
import { useTranslation } from 'react-i18next';
import AIOptimizerPanel from './AIOptimizerPanel';

interface ResumeScoreTabProps {
    resume: ResumeData;
    currentUserUid: string;
    onUpdate: (updates: Partial<ResumeData>) => void;
}

const ResumeScoreTab: React.FC<ResumeScoreTabProps> = ({ 
    resume, 
    currentUserUid, 
    onUpdate 
}) => {
    const { t } = useTranslation();
    const [focusedRule, setFocusedRule] = useState<'actionVerbs' | 'quantifiableMetrics' | 'similarBullets' | 'bulletDensity' | null>(null);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        completion: true,
        quality: false,
        length: false
    });

    const toggleSection = (key: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const scoreData = calculateResumeScore(resume);
    const { overallScore, completionScore, completionItems, qualityScore, qualityItems, lengthScore, lengthItems } = scoreData;

    // Render focused AI Optimizer screen if selected
    if (focusedRule) {
        return (
            <AIOptimizerPanel
                ruleId={focusedRule}
                resume={resume}
                currentUserUid={currentUserUid}
                onUpdate={onUpdate}
                onBack={() => setFocusedRule(null)}
            />
        );
    }

    // Determine circular gauge color dynamically based on score tier
    const getScoreTier = (score: number) => {
        if (score >= 80) return { color: '#84cc16', bg: 'text-lime-500', name: 'Great' }; 
        if (score >= 60) return { color: '#0ea5e9', bg: 'text-sky-500', name: 'Good' };
        if (score >= 40) return { color: '#f59e0b', bg: 'text-amber-500', name: 'Fair' };
        return { color: '#f43f5e', bg: 'text-rose-500', name: 'Poor' };
    };

    const tier = getScoreTier(overallScore);

    // SVG semi-circular gauge calculations (Radius = 70, Circumference = pi * r = 219.9)
    const radius = 70;
    const strokeWidth = 12;
    const circumference = Math.PI * radius; 
    const strokeDashoffset = circumference - (circumference * overallScore) / 100;

    // Helper to group completion items by section
    const personalItems = completionItems.filter(item => item.category === 'personal');
    const workItems = completionItems.filter(item => item.category === 'experience');
    const eduItems = completionItems.filter(item => item.category === 'education');
    const sumItems = completionItems.filter(item => item.category === 'summary');
    const skillItems = completionItems.filter(item => item.category === 'skills');

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            {/* Header description */}
            <div className="text-center mt-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Resume Optimizer</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Get instant analysis and direct feedback to perfect your resume score.</p>
            </div>

            {/* SVG Circular Half-Gauge Score Meter */}
            <div className="flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                <div className="relative w-48 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -scale-x-100" viewBox="0 0 160 100">
                        {/* Background Arc */}
                        <path
                            d="M 15 90 A 65 65 0 0 1 145 90"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            className="dark:stroke-gray-800"
                        />
                        {/* Active Arc (Colored dynamically with transition) */}
                        <path
                            d="M 15 90 A 65 65 0 0 1 145 90"
                            fill="none"
                            stroke={tier.color}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    
                    {/* Inner score label */}
                    <div className="absolute bottom-1 text-center flex flex-col items-center">
                        <span className="text-5xl font-black tracking-tighter text-gray-900 dark:text-white leading-none">
                            {overallScore}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-gray-500 mt-1">
                            resume score
                        </span>
                    </div>
                </div>
            </div>

            {/* Collapsible Accordion Sections */}
            <div className="space-y-3">

                {/* 1. SECTION COMPLETION ACCORDION */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800/40 shadow-sm transition-all">
                    <button
                        onClick={() => toggleSection('completion')}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            {expandedSections.completion ? (
                                <Minus size={18} className="text-gray-400" />
                            ) : (
                                <Plus size={18} className="text-gray-400" />
                            )}
                            <span className="font-bold text-sm text-gray-900 dark:text-white">Section Completion</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                            completionScore >= 80 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                : 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                        }`}>
                            {completionScore}
                        </span>
                    </button>

                    {expandedSections.completion && (
                        <div className="px-4 pb-4 pt-1 bg-gray-50/10 dark:bg-gray-950/10 border-t border-gray-100 dark:border-gray-700/50 space-y-4 animate-in fade-in duration-200">
                            
                            {/* Personal Info Checklist Group */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Personal Info Section</h4>
                                <div className="space-y-2">
                                    {personalItems.map(item => (
                                        <div key={item.id} className="flex items-center justify-between py-1 border-b border-gray-100/50 dark:border-gray-800/50 last:border-0">
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{item.label}</span>
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                                item.isOk 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20' 
                                                    : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/20'
                                            }`}>
                                                {item.isOk ? <Check size={10} className="stroke-[3]" /> : null}
                                                {item.isOk ? 'Ok' : 'Missing'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Resume Sections Checklist Group */}
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resume Content Sections</h4>
                                <div className="space-y-3">
                                    {[...workItems, ...eduItems, ...sumItems, ...skillItems].map(item => (
                                        <div key={item.id} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                                    {item.label}
                                                    {item.id !== 'summary' && (
                                                        <span title={`Essential section: ${item.label}`} className="cursor-help inline-flex items-center">
                                                            <HelpCircle size={12} className="text-gray-400" />
                                                        </span>
                                                    )}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                                    item.isOk 
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20' 
                                                        : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/20'
                                                }`}>
                                                    {item.isOk ? <Check size={10} className="stroke-[3]" /> : null}
                                                    {item.isOk ? 'Ok' : 'Missing'}
                                                </span>
                                            </div>
                                            {!item.isOk && (
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                                                    {item.feedback}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* 2. CONTENT QUALITY ACCORDION */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800/40 shadow-sm transition-all">
                    <button
                        onClick={() => toggleSection('quality')}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            {expandedSections.quality ? (
                                <Minus size={18} className="text-gray-400" />
                            ) : (
                                <Plus size={18} className="text-gray-400" />
                            )}
                            <span className="font-bold text-sm text-gray-900 dark:text-white">Content Quality</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                            qualityScore >= 75 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                : 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                        }`}>
                            {qualityScore}
                        </span>
                    </button>

                    {expandedSections.quality && (
                        <div className="px-4 pb-4 pt-1 bg-gray-50/10 dark:bg-gray-950/10 border-t border-gray-100 dark:border-gray-700/50 space-y-4 animate-in fade-in duration-200">
                            
                            <div className="space-y-4 pt-2">
                                {qualityItems.map(item => {
                                    const isAiActionable = item.id === 'actionVerbs' || item.id === 'quantifiableMetrics' || item.id === 'similarBullets' || item.id === 'bulletDensity';
                                    
                                    return (
                                        <div key={item.id} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{item.label}</span>
                                                <div className="flex items-center gap-1.5">
                                                    {isAiActionable && !item.isOk && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFocusedRule(item.id as any);
                                                            }}
                                                            className="inline-flex items-center gap-0.5 bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/20 dark:hover:bg-primary-950/30 text-primary-600 dark:text-primary-400 font-bold px-2 py-0.5 rounded-lg text-[9px] border border-primary-200/20 shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
                                                        >
                                                            <Sparkles size={10} className="text-primary-500" />
                                                            <span>Improve</span>
                                                        </button>
                                                    )}
                                                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                                        item.isOk 
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20' 
                                                            : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/20'
                                                    }`}>
                                                        {item.isOk ? <Check size={10} className="stroke-[3]" /> : null}
                                                        {item.isOk ? 'Great' : 'Needs Work'}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                                                {item.feedback}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    )}
                </div>

                {/* 3. CONTENT LENGTH & PAGE FULLNESS ACCORDION */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800/40 shadow-sm transition-all">
                    <button
                        onClick={() => toggleSection('length')}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            {expandedSections.length ? (
                                <Minus size={18} className="text-gray-400" />
                            ) : (
                                <Plus size={18} className="text-gray-400" />
                            )}
                            <span className="font-bold text-sm text-gray-900 dark:text-white">Content Length</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                            lengthScore >= 75 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                : 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                        }`}>
                            {lengthScore}
                        </span>
                    </button>

                    {expandedSections.length && (
                        <div className="px-4 pb-4 pt-1 bg-gray-50/10 dark:bg-gray-950/10 border-t border-gray-100 dark:border-gray-700/50 space-y-4 animate-in fade-in duration-200">
                            
                            <div className="space-y-4 pt-3">
                                {lengthItems.map(item => {
                                    const isPageSpacing = item.id === 'pageFullness';
                                    const isWarning = !item.isOk && item.feedback.includes('Too much') || item.feedback.includes('overflow');
                                    
                                    return (
                                        <div key={item.id} className="space-y-2">
                                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</h5>
                                            
                                            {/* Beautiful Huntr-Inspired Contextual Alert Cards */}
                                            {item.isOk ? (
                                                <div className="bg-green-50/70 border border-green-200 dark:bg-green-950/20 dark:border-green-900/30 rounded-xl p-3.5 flex items-start gap-2.5">
                                                    <CheckCircle2 size={16} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                                    <p className="text-xs text-green-800 dark:text-green-300 leading-normal font-medium">
                                                        {item.feedback}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className={`border rounded-xl p-3.5 flex items-start gap-2.5 ${
                                                    isWarning 
                                                        ? 'bg-orange-50/70 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/30'
                                                        : 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30'
                                                }`}>
                                                    <AlertTriangle size={16} className={`flex-shrink-0 mt-0.5 ${
                                                        isWarning ? 'text-orange-600 dark:text-orange-400' : 'text-rose-600 dark:text-rose-400'
                                                    }`} />
                                                    <div>
                                                        <p className={`text-xs leading-normal font-medium ${
                                                            isWarning ? 'text-orange-850 dark:text-orange-300' : 'text-rose-850 dark:text-rose-300'
                                                        }`}>
                                                            {item.feedback}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ResumeScoreTab;
