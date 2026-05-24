import React, { useState } from 'react';
import { Briefcase, GripVertical, Trash2, Wand2, ChevronUp, ChevronDown, PlusCircle, Pencil, Loader2, Sparkles } from 'lucide-react';
import { ResumeData, EmploymentHistory } from '../../types';
import MonthYearPicker from '../MonthYearPicker';
import AIImprovementPanel from '../AIImprovementPanel';
import AutoResizeTextarea from '../AutoResizeTextarea';
import { generateSafeUUID } from '../../constants';
import { getChunkFieldId, joinResumeTextChunks, splitResumeTextChunks } from '../../utils/resumeTextChunks';
import { improveSection } from '../../services/geminiService';

interface ExperienceSectionProps {
    t: any;
    resume: ResumeData;
    isReadOnly?: boolean;
    handleDragStart: (e: React.DragEvent, index: number, type: keyof ResumeData) => void;
    handleDragOver: (e: React.DragEvent, index: number) => void;
    handleDrop: (e: React.DragEvent, dropIndex: number, type: keyof ResumeData) => void;
    handleArrayChange: <T,>(arrayName: keyof ResumeData, index: number, field: keyof T, value: any) => void;
    addArrayItem: (arrayName: keyof ResumeData, newItem: any) => void;
    removeArrayItem: (arrayName: keyof ResumeData, index: number) => void;
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

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div id={id ? `container-${id}` : undefined}>
        <label htmlFor={id} className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</label>
        <input id={id} {...props} className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm shadow-sm transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-900" />
    </div>
);

const microTextareaClass = 'w-full resize-none overflow-hidden rounded-md border border-gray-200 bg-white px-4 py-3 text-base leading-relaxed text-gray-800 shadow-none transition-all hover:border-primary-200 hover:shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/15 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-900';

const ExperienceSection: React.FC<ExperienceSectionProps> = ({
    t,
    resume,
    isReadOnly,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleArrayChange,
    addArrayItem,
    removeArrayItem,
    activeImprovementId,
    toggleImprovement,
    currentUser,
    setAlertState
}) => {
    // AI Rephrasing States
    const [aiRewritingKey, setAiRewritingKey] = useState<string | null>(null);
    const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});

    const updateAchievement = (jobIndex: number, chunkIndex: number, value: string) => {
        const job = resume.employmentHistory[jobIndex];
        const chunks = splitResumeTextChunks(job.description);
        chunks[chunkIndex] = { ...chunks[chunkIndex], text: value };
        handleArrayChange<EmploymentHistory>('employmentHistory', jobIndex, 'description', joinResumeTextChunks(chunks, { forceBullets: true }));
    };

    const addAchievement = (jobIndex: number) => {
        const job = resume.employmentHistory[jobIndex];
        const chunks = splitResumeTextChunks(job.description).filter((chunk) => chunk.text.trim());
        chunks.push({ text: 'New achievement', hadBullet: true });
        handleArrayChange<EmploymentHistory>('employmentHistory', jobIndex, 'description', joinResumeTextChunks(chunks, { forceBullets: true }));
    };

    const deleteAchievement = (jobIndex: number, chunkIndex: number) => {
        const job = resume.employmentHistory[jobIndex];
        const chunks = splitResumeTextChunks(job.description);
        chunks.splice(chunkIndex, 1);
        handleArrayChange<EmploymentHistory>('employmentHistory', jobIndex, 'description', joinResumeTextChunks(chunks, { forceBullets: true }));
        
        const key = `${jobIndex}-${chunkIndex}`;
        if (aiSuggestions[key]) {
            const newSuggestions = { ...aiSuggestions };
            delete newSuggestions[key];
            setAiSuggestions(newSuggestions);
        }
    };

    const handleAiRephrase = async (jobIndex: number, chunkIndex: number, text: string) => {
        if (!text.trim()) {
            setAlertState({
                isOpen: true,
                title: 'Empty Bullet',
                message: 'Cannot rephrase an empty achievement bullet point.'
            });
            return;
        }
        const key = `${jobIndex}-${chunkIndex}`;
        setAiRewritingKey(key);
        try {
            const result = await improveSection(
                currentUser?.uid || 'guest_user',
                'Job Description Achievement Bullet',
                text,
                'Rewrite this resume achievement bullet point to be highly professional, action-oriented, quantifiable, and highlight clear business outcomes.',
                resume.language || 'English'
            );
            setAiSuggestions(prev => ({ ...prev, [key]: result.improvedContent }));
        } catch (error) {
            console.error('Error rephrasing achievement:', error);
            setAlertState({
                isOpen: true,
                title: 'AI Rephrase Failed',
                message: 'Failed to rephrase the achievement bullet point. Please try again.'
            });
        } finally {
            setAiRewritingKey(null);
        }
    };

    return (
        <FormSection title={t('resume_form.employment_history')} icon={<Briefcase className="text-primary-500" />}>
            {resume.employmentHistory.map((job, index) => (
                <div
                    key={job.id || `job-${index}`}
                    draggable={!isReadOnly}
                    onDragStart={(e) => handleDragStart(e, index, 'employmentHistory')}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index, 'employmentHistory')}
                    className="relative mb-5 rounded-lg border border-gray-200 bg-gray-50/60 p-3 transition-shadow hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/30"
                >
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing">
                        <GripVertical size={20} />
                    </div>
                    <div className="absolute top-4 right-4">
                        <button onClick={() => removeArrayItem('employmentHistory', index)} disabled={isReadOnly} className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Delete Entry">
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 pl-6 pr-8 md:grid-cols-2">
                        <Input id={`employmentHistory[${index}].jobTitle`} label={t('resume_form.job_title')} value={job.jobTitle} onChange={e => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'jobTitle', e.target.value)} disabled={isReadOnly} />
                        <Input id={`employmentHistory[${index}].employer`} label={t('resume_form.employer')} value={job.employer} onChange={e => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'employer', e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 pl-6 pr-8 md:grid-cols-3">
                        <Input id={`employmentHistory[${index}].city`} label={t('resume_form.city')} value={job.city} onChange={e => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'city', e.target.value)} disabled={isReadOnly} />
                        <MonthYearPicker id={`employmentHistory[${index}].startDate`} label={t('resume_form.start_date')} value={job.startDate} onChange={v => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'startDate', v)} disabled={isReadOnly} />
                        <MonthYearPicker id={`employmentHistory[${index}].endDate`} label={t('resume_form.end_date')} value={job.endDate} onChange={v => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'endDate', v)} disabled={isReadOnly} />
                    </div>

                    <div className="mt-4 pl-6 pr-8">
                        <div id={`container-employmentHistory[${index}].description`} className="mb-3">
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Achievements
                                </label>
                            </div>
                            <div className="space-y-1 border-l border-primary-100 pl-3 dark:border-primary-900/50">
                                {splitResumeTextChunks(job.description).map((chunk, chunkIndex) => {
                                    const chunkId = getChunkFieldId(`employmentHistory[${index}].description`, chunkIndex);
                                    const key = `${index}-${chunkIndex}`;
                                    const hasSuggestion = aiSuggestions[key] !== undefined;

                                    return (
                                        <div key={`${job.id || index}-achievement-${chunkIndex}`} className="relative group/achieve-chunk w-full pb-1">
                                            {/* Absolute positioned top-center contextual hover toolbar */}
                                            {!isReadOnly && (
                                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 opacity-0 group-hover/achieve-chunk:opacity-100 focus-within:opacity-100 transition-all duration-150 z-30 flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full shadow-sm">
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
                                                        onClick={() => handleAiRephrase(index, chunkIndex, chunk.text)}
                                                        disabled={aiRewritingKey !== null}
                                                        className="p-0.5 text-primary-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                                        title="AI Refinement"
                                                    >
                                                        {aiRewritingKey === key ? (
                                                            <Loader2 size={11} className="animate-spin" />
                                                        ) : (
                                                            <Sparkles size={11} />
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => deleteAchievement(index, chunkIndex)}
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
                                                onChange={(event) => updateAchievement(index, chunkIndex, event.target.value)}
                                                disabled={isReadOnly}
                                                placeholder="Write one achievement..."
                                                minHeight={44}
                                                rows={1}
                                                className={`${microTextareaClass} group-hover/achieve-chunk:border-gray-300 dark:group-hover/achieve-chunk:border-gray-600`}
                                            />

                                            {/* AI Suggestion Acceptance Popover */}
                                            {hasSuggestion && (
                                                <div className="mt-1 p-2.5 bg-primary-50/90 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/40 rounded-md text-xs space-y-2 animate-fade-in z-20 relative">
                                                    <div className="flex items-center gap-1 font-semibold text-primary-700 dark:text-primary-400">
                                                        <Sparkles size={12} /> AI Suggestions
                                                    </div>
                                                    <div className="text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-900/60 p-2 rounded border border-gray-100 dark:border-gray-800 italic leading-relaxed">
                                                        "{aiSuggestions[key]}"
                                                    </div>
                                                    <div className="flex justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const copy = { ...aiSuggestions };
                                                                delete copy[key];
                                                                setAiSuggestions(copy);
                                                            }}
                                                            className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors font-semibold"
                                                        >
                                                            Dismiss
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                updateAchievement(index, chunkIndex, aiSuggestions[key]);
                                                                const copy = { ...aiSuggestions };
                                                                delete copy[key];
                                                                setAiSuggestions(copy);
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
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => addAchievement(index)}
                                disabled={isReadOnly}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                            >
                                <PlusCircle size={15} /> Achievement
                            </button>
                            <button
                                onClick={() => toggleImprovement(`job-${job.id}`)}
                                disabled={isReadOnly}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-primary-200 bg-primary-50 px-3 text-xs font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-300"
                            >
                                <Wand2 size={16} /> {t('resume_form.improve_desc')}
                                {activeImprovementId === `job-${job.id}` ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>
                        <div className="mt-3">
                            {activeImprovementId === `job-${job.id}` && currentUser && (
                                <AIImprovementPanel
                                    userId={currentUser.uid}
                                    sectionName="Job Description"
                                    currentText={job.description}
                                    language={resume.language}
                                    onAccept={(text) => {
                                        handleArrayChange<EmploymentHistory>('employmentHistory', index, 'description', text);
                                        toggleImprovement(`job-${job.id}`);
                                    }}
                                    onClose={() => toggleImprovement(`job-${job.id}`)}
                                    onError={(title, message) => setAlertState({ isOpen: true, title, message })}
                                />
                            )}
                        </div>
                    </div>
                </div>
            ))}
            <button onClick={() => addArrayItem('employmentHistory', { id: generateSafeUUID(), jobTitle: '', employer: '', city: '', startDate: '', endDate: '', description: '' })} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"><PlusCircle size={16} /> {t('resume_form.add_employment')}</button>
        </FormSection>
    );
};

export default ExperienceSection;
