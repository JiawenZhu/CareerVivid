import React, { useState } from 'react';
import { 
    ArrowLeft, 
    Sparkles, 
    Loader2, 
    Check, 
    BookOpen,
    Shuffle
} from 'lucide-react';
import { ResumeData } from '../../../types';
import { calculateResumeScore, parseBulletPoints } from '../../../utils/resumeScoreUtils';
import { improveSection } from '../../../services/geminiService';

interface AIOptimizerPanelProps {
    ruleId: 'actionVerbs' | 'quantifiableMetrics' | 'similarBullets';
    resume: ResumeData;
    currentUserUid: string;
    onUpdate: (updates: Partial<ResumeData>) => void;
    onBack: () => void;
}

interface RewriteState {
    bulletIndex: number;
    jobId: string;
    improvedText: string; // The original AI response
    editedText: string;   // Current text, editable by the user
    explanation: string;
}

const AIOptimizerPanel: React.FC<AIOptimizerPanelProps> = ({
    ruleId,
    resume,
    currentUserUid,
    onUpdate,
    onBack
}) => {
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [rewrites, setRewrites] = useState<Record<string, RewriteState>>({});
    const [selectedVerb, setSelectedVerb] = useState<string>('');
    const [refinePrompts, setRefinePrompts] = useState<Record<string, string>>({});
    const [refiningMap, setRefiningMap] = useState<Record<string, boolean>>({});

    const scoreData = calculateResumeScore(resume);
    const { repeatedVerbs, nonQuantifiableBullets, similarBulletPairs } = scoreData;

    // A. Coaching Details Config
    const getCoachingDetails = () => {
        switch (ruleId) {
            case 'actionVerbs':
                return {
                    title: 'Action Verb Repetition',
                    themeClass: 'from-purple-500/10 to-pink-500/10 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200/50 dark:border-purple-800/30',
                    iconClass: 'bg-purple-500 text-white shadow-md shadow-purple-500/20',
                    highlightColor: 'text-purple-600 dark:text-purple-400',
                    whyTitle: 'Why start sentences with active verbs?',
                    explanation: 'Repetitive verbs make your resume seem monotonous. Using a rich variety of active verbs keeps the hiring manager engaged and demonstrates a wider degree of communication skills and leadership abilities.'
                };
            case 'quantifiableMetrics':
                return {
                    title: 'Metrics and Numbers',
                    themeClass: 'from-indigo-500/10 to-blue-500/10 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200/50 dark:border-indigo-800/30',
                    iconClass: 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20',
                    highlightColor: 'text-indigo-600 dark:text-indigo-400',
                    whyTitle: 'Why include quantifiable numbers?',
                    explanation: 'A great achievement bullet point should include specific, measurable outcomes such as percentages, time savings, team sizes, or revenue targets. Numbers show the direct scope, impact, and scale of your professional contributions.'
                };
            case 'similarBullets':
                return {
                    title: 'Distinct Achievements',
                    themeClass: 'from-blue-500/10 to-sky-500/10 dark:from-blue-900/20 dark:to-sky-900/20 border-blue-200/50 dark:border-blue-800/30',
                    iconClass: 'bg-blue-500 text-white shadow-md shadow-blue-500/20',
                    highlightColor: 'text-blue-600 dark:text-blue-400',
                    whyTitle: 'Why vary achievement focus areas?',
                    explanation: 'Every achievement in your resume should highlight a different skill or accomplishment. Having identical or highly similar bullet points across different jobs limits the breadth of your represented abilities.'
                };
        }
    };

    const coach = getCoachingDetails();

    // B. Trigger AI Rewrite via Gemini API
    const handleAiRewrite = async (
        jobId: string,
        bulletIndex: number,
        currentText: string
    ) => {
        const loadingKey = `${jobId}-${bulletIndex}`;
        setLoadingMap(prev => ({ ...prev, [loadingKey]: true }));

        let instruction = '';
        if (ruleId === 'actionVerbs') {
            const verb = selectedVerb || repeatedVerbs[0]?.verb || 'repeated verb';
            instruction = `Vary the action verbs in this resume achievement to replace the word "${verb}" with a fresh, strong alternative action verb. Keep the content and accomplishments identical but improve word choice.`;
        } else if (ruleId === 'quantifiableMetrics') {
            instruction = 'Rewrite this resume achievement to integrate quantifiable metrics, percentages, dollar amounts, or business outcome numbers. If actual numbers are unknown, simulate a highly realistic, professional estimation to show how it would look.';
        } else if (ruleId === 'similarBullets') {
            instruction = 'Rewrite this resume achievement to focus on a completely different skill or professional outcome. Make it professional, highly impactful, and distinct.';
        }

        try {
            const result = await improveSection(
                currentUserUid,
                "Work Experience Achievement",
                currentText,
                instruction,
                resume.language || 'English',
                "resume"
            );

            setRewrites(prev => ({
                ...prev,
                [loadingKey]: {
                    bulletIndex,
                    jobId,
                    improvedText: result.improvedContent,
                    editedText: result.improvedContent, // Initialize both identically
                    explanation: result.explanation
                }
            }));
        } catch (error) {
            console.error("AI Rewrite failed:", error);
        } finally {
            setLoadingMap(prev => ({ ...prev, [loadingKey]: false }));
        }
    };

    // C. Trigger Conversational/Iterative AI Adjustments
    const handleRefine = async (
        jobId: string,
        bulletIndex: number,
        currentText: string,
        userPrompt: string
    ) => {
        if (!userPrompt.trim()) return;
        const loadingKey = `${jobId}-${bulletIndex}`;
        
        // Show inline card spinner for refinement
        setRefiningMap(prev => ({ ...prev, [loadingKey]: true }));

        try {
            const result = await improveSection(
                currentUserUid,
                "Work Experience Achievement Adjustment",
                currentText,
                `Adjust and rewrite this achievement based on this request: "${userPrompt}". Keep it professional, highly impactful, and context-appropriate.`,
                resume.language || 'English',
                "resume"
            );

            // Update the rewrite suggestion card inline
            setRewrites(prev => {
                const item = prev[loadingKey];
                if (!item) return prev;
                return {
                    ...prev,
                    [loadingKey]: {
                        ...item,
                        improvedText: result.improvedContent,
                        editedText: result.improvedContent, // Load refined text
                        explanation: result.explanation
                    }
                };
            });

            // Clear the refinement input text
            setRefinePrompts(prev => ({ ...prev, [loadingKey]: '' }));
        } catch (error) {
            console.error("AI Refinement failed:", error);
        } finally {
            setRefiningMap(prev => ({ ...prev, [loadingKey]: false }));
        }
    };

    // D. Local edits handler
    const handleTextareaChange = (loadingKey: string, val: string) => {
        setRewrites(prev => {
            const item = prev[loadingKey];
            if (!item) return prev;
            return {
                ...prev,
                [loadingKey]: {
                    ...item,
                    editedText: val
                }
            };
        });
    };

    // E. Atomic Update to specific job description bullet line
    const handleApplyChange = (
        jobId: string,
        bulletIndex: number,
        newText: string
    ) => {
        if (!resume.employmentHistory) return;

        const updatedHistory = resume.employmentHistory.map(job => {
            if (job.id !== jobId) return job;

            // Split current description into bullet lines
            const bullets = parseBulletPoints(job.description || '');
            if (bulletIndex >= 0 && bulletIndex < bullets.length) {
                bullets[bulletIndex] = newText;
            }

            // Reconstruct with markdown bullet markers
            const newDescription = bullets.map(b => `- ${b}`).join('\n');
            return {
                ...job,
                description: newDescription
            };
        });

        onUpdate({ employmentHistory: updatedHistory });
        
        // Clean up rewrite state for this card
        const loadingKey = `${jobId}-${bulletIndex}`;
        setRewrites(prev => {
            const copy = { ...prev };
            delete copy[loadingKey];
            return copy;
        });
    };

    // F. Reusable Suggestion Card with textarea and refinement prompt input
    const renderSuggestionCard = (
        jobId: string,
        bulletIndex: number,
        rewrite: RewriteState,
        loadingKey: string,
        themeColorClass: string, // 'purple' | 'indigo' | 'blue'
        headerText: string
    ) => {
        const isRefining = !!refiningMap[loadingKey];
        const userPrompt = refinePrompts[loadingKey] || '';

        return (
            <div className={`border rounded-xl p-3.5 space-y-3.5 animate-in fade-in duration-200 ${
                themeColorClass === 'purple' 
                    ? 'bg-purple-500/[0.03] border-purple-500/10 dark:border-purple-500/20' 
                    : themeColorClass === 'indigo'
                        ? 'bg-indigo-500/[0.03] border-indigo-500/10 dark:border-indigo-500/20'
                        : 'bg-blue-500/[0.03] border-blue-500/10 dark:border-blue-500/20'
            }`}>
                {/* Header */}
                <div className={`flex items-center gap-1.5 text-[10px] font-bold ${
                    themeColorClass === 'purple' 
                        ? 'text-purple-600 dark:text-purple-400' 
                        : themeColorClass === 'indigo'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-blue-600 dark:text-blue-400'
                }`}>
                    {isRefining ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                    <span>{isRefining ? 'ADJUSTING WITH AI...' : headerText}</span>
                </div>

                {/* Editable Text Area Editor */}
                <div className="space-y-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                        Edit suggested text (adjust numbers or achievements inline):
                    </span>
                    <textarea
                        value={rewrite.editedText}
                        onChange={(e) => handleTextareaChange(loadingKey, e.target.value)}
                        disabled={isRefining}
                        className="w-full text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg p-2.5 min-h-[90px] leading-relaxed resize-y focus:outline-none transition-all duration-150 disabled:opacity-50"
                        placeholder="Suggested rewrite text..."
                    />
                </div>

                {/* AI coaching explanation */}
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal italic">
                    "{rewrite.explanation}"
                </p>

                {/* Iterative AI refinement input */}
                <div className="pt-1.5 border-t border-gray-100 dark:border-gray-800/80 space-y-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                        Ask AI to adjust this rewrite:
                    </span>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="e.g., 'Make it shorter', 'Focus on leadership', 'Tweak numbers'"
                            value={userPrompt}
                            onChange={(e) => setRefinePrompts(prev => ({ ...prev, [loadingKey]: e.target.value }))}
                            disabled={isRefining}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && userPrompt.trim()) {
                                    handleRefine(jobId, bulletIndex, rewrite.editedText, userPrompt);
                                }
                            }}
                            className="flex-grow text-[11px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-medium focus:outline-none dark:text-white"
                        />
                        <button
                            onClick={() => handleRefine(jobId, bulletIndex, rewrite.editedText, userPrompt)}
                            disabled={!userPrompt.trim() || isRefining}
                            className="bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/20 dark:hover:bg-primary-950/30 text-primary-600 dark:text-primary-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center min-w-[64px]"
                        >
                            {isRefining ? <Loader2 className="animate-spin" size={12} /> : 'Adjust'}
                        </button>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-800/80">
                    <button
                        onClick={() => handleApplyChange(jobId, bulletIndex, rewrite.editedText)}
                        disabled={isRefining}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors active:scale-95 flex items-center gap-1 shadow-sm disabled:opacity-50"
                    >
                        <Check size={12} className="stroke-[2.5]" />
                        <span>Apply Rewrite</span>
                    </button>
                    <button
                        onClick={() => {
                            setRewrites(prev => {
                                const copy = { ...prev };
                                delete copy[loadingKey];
                                return copy;
                            });
                        }}
                        disabled={isRefining}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    };

    // Helper vars
    const allJobs = resume.employmentHistory || [];
    const activeVerb = selectedVerb || repeatedVerbs[0]?.verb || '';
    const shownNonQuantifiable = nonQuantifiableBullets;

    return (
        <div className="space-y-5 animate-in slide-in-from-right duration-200">
            {/* Header / Back Link */}
            <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary-600 transition-colors uppercase tracking-wider"
            >
                <ArrowLeft size={14} /> Back to Score list
            </button>

            {/* Coach Description Panel */}
            <div className={`p-4 rounded-2xl border bg-gradient-to-br ${coach.themeClass}`}>
                <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${coach.iconClass}`}>
                        <BookOpen size={16} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                            {coach.title}
                        </h3>
                        <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider pt-1">
                            {coach.whyTitle}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed pt-1">
                            {coach.explanation}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content List rendering based on target check rule */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    Achievements to Improve
                </h4>

                {/* 1. REPETITIVE ACTION VERBS UI */}
                {ruleId === 'actionVerbs' && (
                    <div className="space-y-4">
                        {repeatedVerbs.length > 0 ? (
                            <>
                                {/* Verb Swatches selectors */}
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-xs font-semibold text-gray-500">Select Verb:</span>
                                    {repeatedVerbs.map(v => (
                                        <button
                                            key={v.verb}
                                            onClick={() => setSelectedVerb(v.verb)}
                                            className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${
                                                activeVerb === v.verb
                                                    ? 'bg-purple-600 border-purple-600 text-white shadow'
                                                    : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {v.verb} <span className="text-[10px] opacity-80">(Used {v.count}x)</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Filtered items containing that active verb */}
                                <div className="space-y-3">
                                    {allJobs.map(job => {
                                        const bullets = parseBulletPoints(job.description || '');
                                        return bullets.map((bullet, idx) => {
                                            const hasVerb = new RegExp(`\\b${activeVerb}`, 'i').test(bullet);
                                            if (!hasVerb) return null;

                                            const loadingKey = `${job.id}-${idx}`;
                                            const isLoading = !!loadingMap[loadingKey];
                                            const rewrite = rewrites[loadingKey];

                                            return (
                                                <div key={`${job.id}-${idx}`} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-3.5 shadow-sm">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                                                            {job.employer} — {job.jobTitle}
                                                        </span>
                                                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium mt-1">
                                                            {bullet}
                                                        </p>
                                                    </div>

                                                    {/* AI rewrite button */}
                                                    {!rewrite && (
                                                        <button
                                                            onClick={() => handleAiRewrite(job.id, idx, bullet)}
                                                            disabled={isLoading}
                                                            className="flex items-center justify-center gap-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400 font-semibold py-2 px-3 rounded-lg text-xs transition-colors active:scale-95 disabled:opacity-50"
                                                        >
                                                            {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                                            <span>{isLoading ? 'Rewriting with AI...' : '✨ AI Rewrite'}</span>
                                                        </button>
                                                    )}

                                                    {/* Custom Refinement suggestion card */}
                                                    {rewrite && renderSuggestionCard(job.id, idx, rewrite, loadingKey, 'purple', 'SUGGESTED REWRITE')}
                                                </div>
                                            );
                                        });
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="p-8 text-center bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-gray-400">
                                No repetitive verbs found on your resume! Great job.
                            </div>
                        )}
                    </div>
                )}

                {/* 2. QUANTIFIABLE METRICS / NUMBERS UI */}
                {ruleId === 'quantifiableMetrics' && (
                    <div className="space-y-3">
                        {shownNonQuantifiable.length > 0 ? (
                            shownNonQuantifiable.map(item => {
                                const loadingKey = `${item.experienceId}-${item.bulletIndex}`;
                                const isLoading = !!loadingMap[loadingKey];
                                const rewrite = rewrites[loadingKey];

                                return (
                                    <div key={loadingKey} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-3.5 shadow-sm">
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                                                {item.company} — {item.jobTitle}
                                            </span>
                                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium mt-1">
                                                {item.text}
                                            </p>
                                        </div>

                                        {/* AI rewrite button */}
                                        {!rewrite && (
                                            <button
                                                onClick={() => handleAiRewrite(item.experienceId, item.bulletIndex, item.text)}
                                                disabled={isLoading}
                                                className="flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-semibold py-2 px-3 rounded-lg text-xs transition-colors active:scale-95 disabled:opacity-50"
                                            >
                                                {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                                <span>{isLoading ? 'Injecting Metrics...' : '✨ AI Rewrite'}</span>
                                            </button>
                                        )}

                                        {/* Custom Refinement suggestion card */}
                                        {rewrite && renderSuggestionCard(item.experienceId, item.bulletIndex, rewrite, loadingKey, 'indigo', 'SUGGESTED REWRITE WITH METRICS')}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-gray-400">
                                All your resume achievements contain quantifiable metrics! Outstanding job.
                            </div>
                        )}
                    </div>
                )}

                {/* 3. REPETITIVE BULLET POINTS UI */}
                {ruleId === 'similarBullets' && (
                    <div className="space-y-4">
                        {similarBulletPairs.length > 0 ? (
                            similarBulletPairs.map((pair, index) => {
                                const loadingKeyA = `${pair.experienceIdA}-${pair.bulletIndexA}`;
                                const isLoadingA = !!loadingMap[loadingKeyA];
                                const rewriteA = rewrites[loadingKeyA];

                                return (
                                    <div key={index} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-3.5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                Overlapping Achievements ({Math.round(pair.similarity * 100)}% Match)
                                            </span>
                                        </div>

                                        {/* Card A */}
                                        <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100/50 dark:border-gray-800/50">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">
                                                {pair.companyA} — {pair.jobTitleA}
                                            </span>
                                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium mt-1">
                                                {pair.textA}
                                            </p>
                                        </div>

                                        {/* Swap representation / Connection Icon */}
                                        <div className="flex justify-center -my-2 relative z-10">
                                            <div className="bg-blue-50 text-blue-500 dark:bg-blue-950/40 p-1 rounded-full border border-blue-100 dark:border-blue-900">
                                                <Shuffle size={12} className="transform rotate-90" />
                                            </div>
                                        </div>

                                        {/* Card B */}
                                        <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100/50 dark:border-gray-800/50">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">
                                                {pair.companyB} — {pair.jobTitleB}
                                            </span>
                                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium mt-1">
                                                {pair.textB}
                                            </p>
                                        </div>

                                        {/* AI rewrite action for Card A */}
                                        {!rewriteA && (
                                            <button
                                                onClick={() => handleAiRewrite(pair.experienceIdA, pair.bulletIndexA, pair.textA)}
                                                disabled={isLoadingA}
                                                className="w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-semibold py-2 px-3 rounded-lg text-xs transition-colors active:scale-95 disabled:opacity-50 shadow-sm"
                                            >
                                                {isLoadingA ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                                <span>{isLoadingA ? 'Differentiating Bullet A...' : '✨ Vary Achievement A'}</span>
                                            </button>
                                        )}

                                        {/* Custom Refinement suggestion card */}
                                        {rewriteA && renderSuggestionCard(pair.experienceIdA, pair.bulletIndexA, rewriteA, loadingKeyA, 'blue', 'SUGGESTED REWRITE TO VARY THE ACHIEVEMENT')}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-gray-400">
                                All your resume achievements are fully distinct and varied. Excellent job!
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIOptimizerPanel;
