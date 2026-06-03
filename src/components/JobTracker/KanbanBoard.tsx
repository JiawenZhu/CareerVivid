import React, { useEffect, useMemo, useState } from 'react';
import { JobApplicationData, ApplicationStatus, APPLICATION_STATUSES } from '../../types';
import JobCard from './JobCard';
import { AlertCircle, ArrowUpRight, Briefcase, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface KanbanBoardProps {
    applications: JobApplicationData[];
    onCardClick: (job: JobApplicationData) => void;
    onUpdateApplication: (id: string, data: Partial<JobApplicationData>) => void;
    focusedStatus?: ApplicationStatus | null;
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
    'To Apply': 'bg-gray-500',
    'Applied': 'bg-blue-500',
    'Interviewing': 'bg-yellow-500',
    'Offered': 'bg-green-500',
    'Rejected': 'bg-red-500',
};

const LONG_COLUMN_THRESHOLD = 8;
const LONG_COLUMN_PAGE_SIZE = 8;

const toDate = (value: any): Date | null => {
    if (!value) return null;
    if (value.toDate && typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'object' && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const toTime = (value: any): number => {
    const date = toDate(value);
    return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
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

const openJobUrl = (event: React.MouseEvent, job: JobApplicationData) => {
    event.stopPropagation();
    const url = job.applicationURL || job.jobPostURL;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
};

const CompactJobRow: React.FC<{
    job: JobApplicationData;
    onClick: () => void;
}> = ({ job, onClick }) => {
    const priority = job.priority || 'Medium';
    const dueDate = formatShortDate(job.nextActionDueDate);
    const matchScore = getLatestMatchScore(job);
    const prepDone = getPrepCompletion(job);
    const hasJobDescription = Boolean(job.jobDescription?.trim());

    return (
        <div
            draggable
            onDragStart={(event) => {
                event.dataTransfer.setData('application/job-id', job.id);
                event.stopPropagation();
            }}
            onClick={onClick}
            className="group rounded-md border border-gray-200 bg-white px-2.5 py-2 shadow-sm transition hover:border-primary-300 hover:bg-primary-50/40 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-primary-700 dark:hover:bg-primary-950/20"
        >
            <div className="flex items-start gap-2">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <Briefcase size={15} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                            <h4 className="truncate text-[13px] font-bold leading-5 text-gray-950 dark:text-gray-100">{job.jobTitle || 'Untitled Job'}</h4>
                            <p className="truncate text-[11px] font-semibold text-gray-500 dark:text-gray-400">{job.companyName || 'Unknown company'}</p>
                        </div>
                        {(job.applicationURL || job.jobPostURL) && (
                            <button
                                type="button"
                                onClick={(event) => openJobUrl(event, job)}
                                className="rounded p-1 text-gray-400 opacity-70 transition hover:bg-white hover:text-primary-600 group-hover:opacity-100 dark:hover:bg-gray-800 dark:hover:text-primary-300"
                                aria-label={`Open ${job.jobTitle || 'job'} URL`}
                            >
                                <ArrowUpRight size={13} />
                            </button>
                        )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                        <span className={`rounded px-1.5 py-0.5 ${priority === 'High'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                            : priority === 'Low'
                                ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}
                        >
                            {priority}
                        </span>
                        {!hasJobDescription && (
                            <span
                                className="flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                title="Job description is empty"
                                aria-label="Job description is empty"
                            >
                                <AlertCircle size={11} />No description
                            </span>
                        )}
                        {matchScore !== null && (
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-300">
                                <CheckCircle2 size={11} />{matchScore}%
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <CalendarClock size={11} />Prep {prepDone}/5
                        </span>
                        {dueDate && <span className="ml-auto text-gray-700 dark:text-gray-200">{dueDate}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const KanbanColumn: React.FC<{
    status: ApplicationStatus;
    applications: JobApplicationData[];
    onCardClick: (job: JobApplicationData) => void;
    onUpdateApplication: (id: string, data: Partial<JobApplicationData>) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    isDragOver: boolean;
}> = ({ status, applications, onCardClick, onUpdateApplication, onDragOver, onDrop, onDragLeave, isDragOver }) => {
    const isLongColumn = applications.length > LONG_COLUMN_THRESHOLD;
    const [query, setQuery] = useState('');
    const [sortMode, setSortMode] = useState<'updated' | 'due' | 'match'>('updated');
    const [page, setPage] = useState(0);

    const managedApplications = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return applications
            .filter(job => {
                if (!normalizedQuery) return true;
                return [
                    job.jobTitle,
                    job.companyName,
                    job.location,
                    job.interviewStage,
                    job.nextAction,
                    job.contactName,
                ].some(value => (value || '').toLowerCase().includes(normalizedQuery));
            })
            .sort((a, b) => {
                if (sortMode === 'due') return toTime(a.nextActionDueDate) - toTime(b.nextActionDueDate);
                if (sortMode === 'match') return (getLatestMatchScore(b) || -1) - (getLatestMatchScore(a) || -1);
                return toTime(b.updatedAt) - toTime(a.updatedAt);
            });
    }, [applications, query, sortMode]);

    const pageCount = Math.max(1, Math.ceil(managedApplications.length / LONG_COLUMN_PAGE_SIZE));
    const visibleApplications = isLongColumn
        ? managedApplications.slice(page * LONG_COLUMN_PAGE_SIZE, (page + 1) * LONG_COLUMN_PAGE_SIZE)
        : applications;
    const rangeStart = managedApplications.length === 0 ? 0 : page * LONG_COLUMN_PAGE_SIZE + 1;
    const rangeEnd = Math.min((page + 1) * LONG_COLUMN_PAGE_SIZE, managedApplications.length);

    useEffect(() => {
        setPage(0);
    }, [query, sortMode, applications.length]);

    useEffect(() => {
        if (page > pageCount - 1) setPage(pageCount - 1);
    }, [page, pageCount]);

    return (
        <div
            className={`flex-1 min-w-[244px] bg-gray-50/80 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 transition-colors ${isDragOver ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/20 shadow-lg' : ''}`}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragLeave={onDragLeave}
        >
            <div className="sticky top-0 z-10 mb-2 rounded-md bg-gray-50/95 px-1 py-1.5 backdrop-blur dark:bg-gray-950/95">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status]}`}></div>
                    <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">{status}</h3>
                    <span className="ml-auto text-xs font-bold bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 border border-gray-200 dark:border-gray-700">{applications.length}</span>
                </div>
                {isLongColumn && (
                    <div className="mt-2 space-y-2 rounded-md border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary-700 dark:text-primary-300">
                            <span>Queue manager</span>
                            <span className="ml-auto rounded bg-primary-50 px-1.5 py-0.5 text-[10px] dark:bg-primary-950/40">
                                {rangeStart}-{rangeEnd} of {managedApplications.length}
                            </span>
                        </div>
                        <label className="relative block">
                            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder={`Find ${status.toLowerCase()} jobs`}
                                className="h-8 w-full rounded-md border border-gray-200 bg-gray-50 pl-7 pr-2 text-xs font-semibold text-gray-900 outline-none transition focus:border-primary-400 focus:bg-white dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-primary-500"
                            />
                        </label>
                        <select
                            value={sortMode}
                            onChange={(event) => setSortMode(event.target.value as 'updated' | 'due' | 'match')}
                            className="h-8 w-full rounded-md border border-gray-200 bg-gray-50 px-2 text-xs font-bold text-gray-700 outline-none focus:border-primary-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:focus:border-primary-500"
                        >
                            <option value="updated">Recently updated</option>
                            <option value="due">Next action due</option>
                            <option value="match">Best match score</option>
                        </select>
                    </div>
                )}
            </div>
            <div className="space-y-2">
                {visibleApplications.map(app => (
                    isLongColumn ? (
                        <CompactJobRow
                            key={app.id}
                            job={app}
                            onClick={() => onCardClick(app)}
                        />
                    ) : (
                        <JobCard
                            key={app.id}
                            job={app}
                            onClick={() => onCardClick(app)}
                            onUpdate={(id, data) => onUpdateApplication(id, data)}
                        />
                    )
                ))}
                {applications.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white/60 p-4 text-center text-xs font-semibold text-gray-400 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-500">
                        Drop jobs here
                    </div>
                )}
                {isLongColumn && managedApplications.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white/60 p-4 text-center text-xs font-semibold text-gray-400 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-500">
                        No jobs match this column search.
                    </div>
                )}
                {isLongColumn && managedApplications.length > LONG_COLUMN_PAGE_SIZE && (
                    <div className="sticky bottom-0 flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white/95 px-2 py-2 text-xs font-bold text-gray-600 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 dark:text-gray-300">
                        <button
                            type="button"
                            onClick={() => setPage(current => Math.max(0, current - 1))}
                            disabled={page === 0}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800"
                        >
                            <ChevronLeft size={13} />Prev
                        </button>
                        <span>{page + 1} / {pageCount}</span>
                        <button
                            type="button"
                            onClick={() => setPage(current => Math.min(pageCount - 1, current + 1))}
                            disabled={page >= pageCount - 1}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800"
                        >
                            Next<ChevronRight size={13} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


const KanbanBoard: React.FC<KanbanBoardProps> = ({ applications, onCardClick, onUpdateApplication, focusedStatus = null }) => {
    const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);
    const visibleStatuses = focusedStatus ? [focusedStatus] : APPLICATION_STATUSES;

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, job: JobApplicationData) => {
        e.dataTransfer.setData('application/job-id', job.id);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: ApplicationStatus) => {
        e.preventDefault();
        const jobId = e.dataTransfer.getData('application/job-id');
        if (jobId) {
            onUpdateApplication(jobId, { applicationStatus: status });
        }
        setDragOverColumn(null);
    };

    return (
        <div className={focusedStatus ? 'grid max-w-2xl grid-cols-1 gap-3 pb-4' : 'flex gap-3 overflow-x-auto pb-4'}>
            {visibleStatuses.map(status => (
                <KanbanColumn
                    key={status}
                    status={status}
                    applications={applications.filter(app => app.applicationStatus === status)}
                    onCardClick={onCardClick}
                    onUpdateApplication={onUpdateApplication}
                    onDragOver={(e) => { e.preventDefault(); setDragOverColumn(status); }}
                    onDrop={(e) => handleDrop(e, status)}
                    onDragLeave={() => setDragOverColumn(null)}
                    isDragOver={dragOverColumn === status}
                />
            ))}
        </div>
    );
};

export default KanbanBoard;
