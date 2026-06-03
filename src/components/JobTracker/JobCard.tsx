import React, { useState, useRef, useEffect } from 'react';
import { JobApplicationData, JobPriority, WorkModel, WORK_MODELS, NO_NEXT_ACTION } from '../../types';
import { AlertCircle, ArrowUpRight, Briefcase, CalendarClock, CheckCircle2, ClipboardList, DollarSign, MapPin, UserRound } from 'lucide-react';

interface JobCardProps {
  job: JobApplicationData;
  onClick: () => void;
  onUpdate: (id: string, data: Partial<JobApplicationData>) => void;
}

const InlineSelect: React.FC<{
    value: string;
    options: readonly string[];
    onSave: (newValue: string) => void;
    placeholder: string;
    className: string;
}> = ({ value, options, onSave, placeholder, className }) => {
    const [isEditing, setIsEditing] = useState(false);
    const selectRef = useRef<HTMLSelectElement>(null);

    useEffect(() => {
        if (isEditing) {
            selectRef.current?.focus();
        }
    }, [isEditing]);
    
    if (isEditing) {
        return (
            <select
                ref={selectRef}
                value={value || ''}
                onChange={(e) => {
                    onSave(e.target.value);
                    setIsEditing(false);
                }}
                onBlur={() => setIsEditing(false)}
                className={`${className} cursor-pointer`}
            >
                <option value="" disabled>{placeholder}</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        );
    }

    return (
        <span onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className={`${className} cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600`}>
            {value || placeholder}
        </span>
    );
};

const toDate = (value: any): Date | null => {
    if (!value) return null;
    if (value.toDate && typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'object' && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatShortDate = (value: any) => {
    const date = toDate(value);
    if (!date) return '';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getPrepCompletion = (job: JobApplicationData) => {
    const fields = [job.prep_RoleOverview, job.prep_MyStory, job.prep_InterviewPrep, job.prep_QuestionsForInterviewer, job.notes];
    return fields.filter(Boolean).length;
};

const getLatestMatchScore = (job: JobApplicationData) => {
    const analyses = Object.values(job.matchAnalyses || {});
    if (analyses.length === 0) return null;
    return Math.round(analyses[0].matchPercentage);
};

const priorityStyles: Record<JobPriority, string> = {
    High: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300',
    Medium: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
    Low: 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300',
};

const JobCard: React.FC<JobCardProps> = ({ job, onClick, onUpdate }) => {
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('application/job-id', job.id);
        e.stopPropagation(); // Prevent card click from firing
    };
    
    const priority = job.priority || 'Medium';
    const dueDate = formatShortDate(job.nextActionDueDate);
    const prepDone = getPrepCompletion(job);
    const matchScore = getLatestMatchScore(job);
    const hasNextAction = Boolean(job.nextAction && job.nextAction !== NO_NEXT_ACTION);
    const hasJobDescription = Boolean(job.jobDescription?.trim());

    const openJobUrl = (event: React.MouseEvent) => {
        event.stopPropagation();
        const url = job.applicationURL || job.jobPostURL;
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div 
            draggable 
            onDragStart={handleDragStart}
            onClick={onClick}
            className="bg-white dark:bg-gray-950 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 hover:border-primary-400 dark:hover:border-primary-500 transition-all cursor-pointer"
        >
            <div className="flex items-start gap-2.5">
                 <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                    <Briefcase size={18} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div className="min-w-0 flex-grow">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="line-clamp-2 font-bold text-sm leading-snug text-gray-950 dark:text-gray-100">{job.jobTitle}</h4>
                        {(job.applicationURL || job.jobPostURL) && (
                            <button
                                type="button"
                                onClick={openJobUrl}
                                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-800 dark:hover:text-primary-300"
                                aria-label={`Open ${job.jobTitle} URL`}
                            >
                                <ArrowUpRight size={14} />
                            </button>
                        )}
                    </div>
                    <p className="mt-0.5 truncate text-xs font-semibold text-gray-600 dark:text-gray-400">{job.companyName}</p>
                </div>
            </div>
             <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                <span className={`rounded-md border px-2 py-1 font-bold ${priorityStyles[priority]}`}>{priority}</span>
                {!hasJobDescription && (
                    <span
                        className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
                        title="Job description is empty"
                        aria-label="Job description is empty"
                    >
                        <AlertCircle size={12} />
                        No description
                    </span>
                )}
                <InlineSelect 
                    value={job.workModel || ''}
                    options={WORK_MODELS}
                    onSave={(newValue) => onUpdate(job.id, { workModel: newValue as WorkModel })}
                    placeholder="Work Model"
                    className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-1 rounded-md font-bold"
                />
                 <InlineSelect 
                    value={job.interviewStage || ''}
                    options={['Screening Call', 'Hiring Manager', 'Technical Round', 'Final Round']}
                    onSave={(newValue) => onUpdate(job.id, { interviewStage: newValue })}
                    placeholder="Interview Stage"
                    className="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 px-2 py-1 rounded-md font-bold"
                />
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                {hasNextAction && (
                    <div className="flex items-center gap-1.5">
                        <ClipboardList size={13} className="text-gray-400" />
                        <span className="min-w-0 truncate font-medium">{job.nextAction}</span>
                        {dueDate && <span className="ml-auto whitespace-nowrap font-bold text-gray-800 dark:text-gray-200">{dueDate}</span>}
                    </div>
                )}
                {(job.location || job.salaryRange) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {job.location && <span className="flex min-w-0 items-center gap-1"><MapPin size={13} className="text-gray-400" /><span className="truncate">{job.location}</span></span>}
                        {job.salaryRange && <span className="flex items-center gap-1"><DollarSign size={13} className="text-gray-400" />{job.salaryRange}</span>}
                    </div>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold">
                    {job.contactName && <span className="flex items-center gap-1"><UserRound size={12} className="text-gray-400" />{job.contactName}</span>}
                    {matchScore !== null && <span className="flex items-center gap-1 text-blue-600 dark:text-blue-300"><CheckCircle2 size={12} />{matchScore}% match</span>}
                    <span className="flex items-center gap-1"><CalendarClock size={12} className="text-gray-400" />Prep {prepDone}/5</span>
                </div>
            </div>
        </div>
    );
};

export default JobCard;
