import React, { useState } from 'react';
import { ArrowLeft, Loader2, Shuffle, Sparkles } from 'lucide-react';
import { ResumeData } from '../../../types';
import { calculateResumeScore, parseBulletPoints } from '../../../utils/resumeScoreUtils';
import { improveSection } from '../../../services/geminiService';
import AIRewriteSuggestionCard from './AIRewriteSuggestionCard';
import AIOptimizerCoachPanel from './AIOptimizerCoachPanel';
import { buildRewriteInstruction, getCoachingDetails } from './AIOptimizerPanelConfig';
import type { AIOptimizerRuleId, RewriteState } from './AIOptimizerPanelTypes';

interface AIOptimizerPanelProps {
    ruleId: AIOptimizerRuleId;
    resume: ResumeData;
    currentUserUid: string;
    onUpdate: (updates: Partial<ResumeData>) => void;
    onBack: () => void;
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
    const { repeatedVerbs, nonQuantifiableBullets, similarBulletPairs, bulletDensityIssues } = scoreData;

    const coach = getCoachingDetails(ruleId);

    const handleAiRewrite = async (
        jobId: string,
        bulletIndex: number,
        currentText: string,
        issueType?: 'too_few' | 'too_many' | 'paragraph'
    ) => {
        const loadingKey = `${jobId}-${bulletIndex}`;
        setLoadingMap(prev => ({ ...prev, [loadingKey]: true }));

        const instruction = buildRewriteInstruction(ruleId, selectedVerb || repeatedVerbs[0]?.verb || '', issueType);

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
                    editedText: result.improvedContent,
                    explanation: result.explanation
                }
            }));
        } catch (error) {
            console.error("AI Rewrite failed:", error);
        } finally {
            setLoadingMap(prev => ({ ...prev, [loadingKey]: false }));
        }
    };

    const handleRefine = async (
        jobId: string,
        bulletIndex: number,
        currentText: string,
        userPrompt: string
    ) => {
        if (!userPrompt.trim()) return;
        const loadingKey = `${jobId}-${bulletIndex}`;
        
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

            setRewrites(prev => {
                const item = prev[loadingKey];
                if (!item) return prev;
                return {
                    ...prev,
                    [loadingKey]: {
                        ...item,
                        improvedText: result.improvedContent,
                        editedText: result.improvedContent,
                        explanation: result.explanation
                    }
                };
            });

            setRefinePrompts(prev => ({ ...prev, [loadingKey]: '' }));
        } catch (error) {
            console.error("AI Refinement failed:", error);
        } finally {
            setRefiningMap(prev => ({ ...prev, [loadingKey]: false }));
        }
    };

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

    const handleApplyChange = (
        jobId: string,
        bulletIndex: number,
        newText: string
    ) => {
        if (!resume.employmentHistory) return;

        const updatedHistory = resume.employmentHistory.map(job => {
            if (job.id !== jobId) return job;

            let newDescription = '';
            if (ruleId === 'bulletDensity') {
                const items = parseBulletPoints(newText);
                newDescription = items.map(b => `- ${b}`).join('\n');
            } else {
                const bullets = parseBulletPoints(job.description || '');
                if (bulletIndex >= 0 && bulletIndex < bullets.length) {
                    bullets[bulletIndex] = newText;
                }
                newDescription = bullets.map(b => `- ${b}`).join('\n');
            }

            return {
                ...job,
                description: newDescription
            };
        });

        onUpdate({ employmentHistory: updatedHistory });
        
        const loadingKey = `${jobId}-${bulletIndex}`;
        setRewrites(prev => {
            const copy = { ...prev };
            delete copy[loadingKey];
            return copy;
        });
    };

    const handleCancelRewrite = (loadingKey: string) => {
        setRewrites(prev => {
            const copy = { ...prev };
            delete copy[loadingKey];
            return copy;
        });
    };

    const renderSuggestionCard = (
        jobId: string,
        bulletIndex: number,
        rewrite: RewriteState,
        loadingKey: string,
        themeColorClass: string, // 'purple' | 'indigo' | 'blue'
        headerText: string
    ) => {
        return (
            <AIRewriteSuggestionCard
                jobId={jobId}
                bulletIndex={bulletIndex}
                rewrite={rewrite}
                loadingKey={loadingKey}
                themeColorClass={themeColorClass}
                headerText={headerText}
                isRefining={!!refiningMap[loadingKey]}
                userPrompt={refinePrompts[loadingKey] || ''}
                onTextareaChange={handleTextareaChange}
                onPromptChange={(key, value) => setRefinePrompts(prev => ({ ...prev, [key]: value }))}
                onRefine={handleRefine}
                onApply={handleApplyChange}
                onCancel={handleCancelRewrite}
            />
        );
    };

    const allJobs = resume.employmentHistory || [];
    const activeVerb = selectedVerb || repeatedVerbs[0]?.verb || '';
    const shownNonQuantifiable = nonQuantifiableBullets;
    const EmptyState = ({ children }: { children: React.ReactNode }) => (
        <div className="p-8 text-center bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-gray-400">
            {children}
        </div>
    );

    return (
        <div className="space-y-5 animate-in slide-in-from-right duration-200">
            <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary-600 transition-colors uppercase tracking-wider"
            >
                <ArrowLeft size={14} /> Back to Score list
            </button>

            <AIOptimizerCoachPanel coach={coach} />

            <div className="space-y-4">
                <h4 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    Achievements to Improve
                </h4>

                {ruleId === 'actionVerbs' && (
                    <div className="space-y-4">
                        {repeatedVerbs.length > 0 ? (
                            <>
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

                                                    {rewrite && renderSuggestionCard(job.id, idx, rewrite, loadingKey, 'purple', 'SUGGESTED REWRITE')}
                                                </div>
                                            );
                                        });
                                    })}
                                </div>
                            </>
                        ) : (
                            <EmptyState>No repetitive verbs found on your resume! Great job.</EmptyState>
                        )}
                    </div>
                )}

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

                                        {rewrite && renderSuggestionCard(item.experienceId, item.bulletIndex, rewrite, loadingKey, 'indigo', 'SUGGESTED REWRITE WITH METRICS')}
                                    </div>
                                );
                            })
                        ) : (
                            <EmptyState>All your resume achievements contain quantifiable metrics! Outstanding job.</EmptyState>
                        )}
                    </div>
                )}

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

                                        <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100/50 dark:border-gray-800/50">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">
                                                {pair.companyA} — {pair.jobTitleA}
                                            </span>
                                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium mt-1">
                                                {pair.textA}
                                            </p>
                                        </div>

                                        <div className="flex justify-center -my-2 relative z-10">
                                            <div className="bg-blue-50 text-blue-500 dark:bg-blue-950/40 p-1 rounded-full border border-blue-100 dark:border-blue-900">
                                                <Shuffle size={12} className="transform rotate-90" />
                                            </div>
                                        </div>

                                        <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100/50 dark:border-gray-800/50">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">
                                                {pair.companyB} — {pair.jobTitleB}
                                            </span>
                                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium mt-1">
                                                {pair.textB}
                                            </p>
                                        </div>

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

                                        {rewriteA && renderSuggestionCard(pair.experienceIdA, pair.bulletIndexA, rewriteA, loadingKeyA, 'blue', 'SUGGESTED REWRITE TO VARY THE ACHIEVEMENT')}
                                    </div>
                                );
                            })
                        ) : (
                            <EmptyState>All your resume achievements are fully distinct and varied. Excellent job!</EmptyState>
                        )}
                    </div>
                )}

                {ruleId === 'bulletDensity' && (
                    <div className="space-y-3">
                        {bulletDensityIssues.length > 0 ? (
                            bulletDensityIssues.map(item => {
                                const loadingKey = `${item.experienceId}-0`; // unified index 0 for full description
                                const isLoading = !!loadingMap[loadingKey];
                                const rewrite = rewrites[loadingKey];

                                let buttonText = '✨ Optimize Density';
                                let tagText = 'Needs Work';
                                let tagClass = 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/20';
                                
                                if (item.issueType === 'paragraph') {
                                    buttonText = '✨ Format as Bullets';
                                    tagText = 'Paragraph Format';
                                    tagClass = 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/20';
                                } else if (item.issueType === 'too_few') {
                                    buttonText = '✨ Suggest Achievements';
                                    tagText = 'Too Few Bullets';
                                    tagClass = 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/20';
                                } else if (item.issueType === 'too_many') {
                                    buttonText = '✨ Consolidate Bullets';
                                    tagText = 'Too Many Bullets';
                                    tagClass = 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/20';
                                }

                                return (
                                    <div key={item.experienceId} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-3.5 shadow-sm">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                                                    {item.company} — {item.jobTitle}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tagClass}`}>
                                                {tagText}
                                            </span>
                                        </div>

                                        <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100/50 dark:border-gray-800/50">
                                            {item.issueType === 'paragraph' ? (
                                                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                                    {item.text}
                                                </p>
                                            ) : (
                                                <ul className="list-disc list-inside space-y-1.5">
                                                    {parseBulletPoints(item.text).map((bullet, bIdx) => (
                                                        <li key={bIdx} className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                                            {bullet}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        {!rewrite && (
                                            <button
                                                onClick={() => handleAiRewrite(item.experienceId, 0, item.text, item.issueType)}
                                                disabled={isLoading}
                                                className="flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-semibold py-2 px-3 rounded-lg text-xs transition-colors active:scale-95 disabled:opacity-50 shadow-sm"
                                            >
                                                {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                                <span>{isLoading ? 'Processing with AI...' : buttonText}</span>
                                            </button>
                                        )}

                                        {rewrite && renderSuggestionCard(item.experienceId, 0, rewrite, loadingKey, 'amber', 'SUGGESTED REWRITE DESCRIPTION')}
                                    </div>
                                );
                            })
                        ) : (
                            <EmptyState>All your resume experiences have perfect bullet point density. Excellent job!</EmptyState>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIOptimizerPanel;
