import React, { useState } from 'react';
import { Briefcase, Wand2, ChevronUp, ChevronDown, PlusCircle, Pencil, Trash2, Loader2, Sparkles } from 'lucide-react';
import { ResumeData } from '../../types';
import AIImprovementPanel from '../AIImprovementPanel';
import AutoResizeTextarea from '../AutoResizeTextarea';
import { getChunkFieldId, joinResumeTextChunks, splitResumeTextChunks } from '../../utils/resumeTextChunks';
import { improveSection } from '../../services/geminiService';

interface ProfessionalSummarySectionProps {
    t: any;
    resume: ResumeData;
    isReadOnly?: boolean;
    handleChange: (field: any, value: any, parentField?: any) => void;
    activeImprovementId: string | null;
    toggleImprovement: (id: string) => void;
    currentUser: any;
    setAlertState: (state: any) => void;
}

const FormSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/50">
        <div className="mb-4 flex items-center">
            {icon}
            <h2 className="ml-3 text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
        </div>
        {children}
    </div>
);

const microTextareaClass = 'w-full resize-none overflow-hidden rounded-md border border-gray-200 bg-white px-4 py-3 text-base leading-relaxed text-gray-800 shadow-none transition-all hover:border-primary-200 hover:shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/15 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-900';

const ProfessionalSummarySection: React.FC<ProfessionalSummarySectionProps> = ({
    t,
    resume,
    isReadOnly,
    handleChange,
    activeImprovementId,
    toggleImprovement,
    currentUser,
    setAlertState
}) => {
    const summaryChunks = splitResumeTextChunks(resume.professionalSummary, { splitSentences: true });
    
    // AI Rephrasing States
    const [aiRewritingIndex, setAiRewritingIndex] = useState<number | null>(null);
    const [aiSuggestion, setAiSuggestion] = useState<{ index: number; text: string } | null>(null);

    const updateSummaryChunk = (chunkIndex: number, value: string) => {
        const chunks = splitResumeTextChunks(resume.professionalSummary, { splitSentences: true });
        chunks[chunkIndex] = { ...chunks[chunkIndex], text: value };
        handleChange('professionalSummary', joinResumeTextChunks(chunks, { separator: ' ' }));
    };

    const addSummaryChunk = () => {
        const chunks = splitResumeTextChunks(resume.professionalSummary, { splitSentences: true }).filter((chunk) => chunk.text.trim());
        chunks.push({ text: 'New summary point.', hadBullet: false });
        handleChange('professionalSummary', joinResumeTextChunks(chunks, { separator: ' ' }));
    };

    const deleteSummaryChunk = (chunkIndex: number) => {
        const chunks = splitResumeTextChunks(resume.professionalSummary, { splitSentences: true });
        chunks.splice(chunkIndex, 1);
        handleChange('professionalSummary', joinResumeTextChunks(chunks, { separator: ' ' }));
        if (aiSuggestion && aiSuggestion.index === chunkIndex) {
            setAiSuggestion(null);
        }
    };

    const handleAiRephrase = async (chunkIndex: number, text: string) => {
        if (!text.trim()) {
            setAlertState({
                isOpen: true,
                title: 'Empty Content',
                message: 'Cannot rephrase an empty text block.'
            });
            return;
        }
        setAiRewritingIndex(chunkIndex);
        try {
            const result = await improveSection(
                currentUser?.uid || 'guest_user',
                'Professional Summary Sentence',
                text,
                'Rewrite this sentence to be highly professional, impactful, action-oriented, and tailored for a modern resume.',
                resume.language || 'English'
            );
            setAiSuggestion({ index: chunkIndex, text: result.improvedContent });
        } catch (error) {
            console.error('Error rephrasing sentence:', error);
            setAlertState({
                isOpen: true,
                title: 'AI Rephrase Failed',
                message: 'Failed to rephrase the sentence. Please check your network or try again.'
            });
        } finally {
            setAiRewritingIndex(null);
        }
    };

    return (
        <FormSection title={t('resume_form.professional_summary')} icon={<Briefcase className="text-primary-500" />}>
            <div id="container-professionalSummary" className="space-y-1">
                <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('resume_form.summary')}</label>
                </div>

                {summaryChunks.map((chunk, index) => {
                    const chunkId = getChunkFieldId('professionalSummary', index);
                    return (
                        <div key={`summary-chunk-${index}`} className="relative group/summary-chunk w-full pb-1">
                            {/* Native interactive contextual hover toolbar */}
                            {!isReadOnly && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 opacity-0 group-hover/summary-chunk:opacity-100 focus-within:opacity-100 transition-all duration-150 z-30 flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const textarea = document.getElementById(chunkId) as HTMLTextAreaElement | null;
                                            if (textarea) {
                                                textarea.focus();
                                                const len = textarea.value.length;
                                                textarea.setSelectionRange(len, len);
                                            }
                                        }}
                                        className="p-0.5 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        title="Edit Text"
                                    >
                                        <Pencil size={11} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleAiRephrase(index, chunk.text)}
                                        disabled={aiRewritingIndex !== null}
                                        className="p-0.5 text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                        title="AI Refinement"
                                    >
                                        {aiRewritingIndex === index ? (
                                            <Loader2 size={11} className="animate-spin" />
                                        ) : (
                                            <Sparkles size={11} />
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => deleteSummaryChunk(index)}
                                        className="p-0.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        title="Delete Block"
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            )}

                            <AutoResizeTextarea
                                id={chunkId}
                                value={chunk.text}
                                onChange={(event) => updateSummaryChunk(index, event.target.value)}
                                disabled={isReadOnly}
                                placeholder="Write one concise summary sentence..."
                                minHeight={44}
                                rows={1}
                                className={`${microTextareaClass} group-hover/summary-chunk:border-gray-300 dark:group-hover/summary-chunk:border-gray-600`}
                            />

                            {/* Comparison and Acceptance Popover for Gemini Suggestions */}
                            {aiSuggestion && aiSuggestion.index === index && (
                                <div className="mt-1 p-2.5 bg-primary-50/90 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/40 rounded-md text-xs space-y-2 animate-fade-in z-20 relative">
                                    <div className="flex items-center gap-1 font-semibold text-primary-700 dark:text-primary-400">
                                        <Sparkles size={12} /> AI Suggestions
                                    </div>
                                    <div className="text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-900/60 p-2 rounded border border-gray-100 dark:border-gray-800 italic leading-relaxed">
                                        "{aiSuggestion.text}"
                                    </div>
                                    <div className="flex justify-end gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setAiSuggestion(null)}
                                            className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors font-semibold"
                                        >
                                            Dismiss
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                updateSummaryChunk(index, aiSuggestion.text);
                                                setAiSuggestion(null);
                                            }}
                                            className="px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition-all shadow-sm font-semibold flex items-center gap-1"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                        type="button"
                        onClick={addSummaryChunk}
                        disabled={isReadOnly}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                        <PlusCircle size={15} /> Summary point
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleImprovement('summary')}
                        disabled={isReadOnly}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-primary-200 bg-primary-50 px-3 text-xs font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-300"
                    >
                        <Wand2 size={16} /> {t('resume_form.improve_ai')}
                        {activeImprovementId === 'summary' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            {activeImprovementId === 'summary' && currentUser && (
                <AIImprovementPanel
                    userId={currentUser.uid}
                    sectionName="Professional Summary"
                    currentText={resume.professionalSummary}
                    language={resume.language}
                    onAccept={(text) => {
                        handleChange('professionalSummary', text);
                        toggleImprovement('summary');
                    }}
                    onClose={() => toggleImprovement('summary')}
                    onError={(title, message) => setAlertState({ isOpen: true, title, message })}
                />
            )}
        </FormSection>
    );
};

export default ProfessionalSummarySection;
