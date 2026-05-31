import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, FileText, Search, User } from 'lucide-react';
import { DEFAULT_PIPELINE_STAGES, JobApplication, JobApplicationStatus, PipelineStage } from '../../types';
import CandidateCard from './CandidateCard';

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
    return date ? date.getTime() : 0;
};

const formatShortDate = (value: any) => {
    const date = toDate(value);
    if (!date) return 'No date';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getMatchScore = (application: JobApplication) => {
    const score = application.matchAnalysis?.matchPercentage;
    return typeof score === 'number' ? Math.round(score) : null;
};

const getStageColor = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; header: string; count: string }> = {
        blue: {
            bg: 'bg-[#fbfcfe] dark:bg-gray-900',
            border: 'border-[#d9e2ec] dark:border-gray-800',
            text: 'text-[#344256] dark:text-gray-200',
            header: 'bg-[#eef4fb] dark:bg-gray-800/80 border-b border-[#d9e2ec] dark:border-gray-700',
            count: 'bg-white/80 text-[#52637a] ring-1 ring-[#d9e2ec] dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700',
        },
        purple: {
            bg: 'bg-[#fbfbfe] dark:bg-gray-900',
            border: 'border-[#e0dced] dark:border-gray-800',
            text: 'text-[#4d445f] dark:text-gray-200',
            header: 'bg-[#f3f0fb] dark:bg-gray-800/80 border-b border-[#e0dced] dark:border-gray-700',
            count: 'bg-white/80 text-[#655879] ring-1 ring-[#e0dced] dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700',
        },
        indigo: {
            bg: 'bg-[#fbfcfe] dark:bg-gray-900',
            border: 'border-[#dde1ee] dark:border-gray-800',
            text: 'text-[#454c63] dark:text-gray-200',
            header: 'bg-[#f0f3fb] dark:bg-gray-800/80 border-b border-[#dde1ee] dark:border-gray-700',
            count: 'bg-white/80 text-[#5c647b] ring-1 ring-[#dde1ee] dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700',
        },
        orange: {
            bg: 'bg-[#fffdf9] dark:bg-gray-900',
            border: 'border-[#eadfce] dark:border-gray-800',
            text: 'text-[#65513a] dark:text-gray-200',
            header: 'bg-[#fbf3ea] dark:bg-gray-800/80 border-b border-[#eadfce] dark:border-gray-700',
            count: 'bg-white/80 text-[#80694c] ring-1 ring-[#eadfce] dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700',
        },
        pink: {
            bg: 'bg-[#fffafa] dark:bg-gray-900',
            border: 'border-[#ecd9de] dark:border-gray-800',
            text: 'text-[#684653] dark:text-gray-200',
            header: 'bg-[#fbedf3] dark:bg-gray-800/80 border-b border-[#ecd9de] dark:border-gray-700',
            count: 'bg-white/80 text-[#7d5c67] ring-1 ring-[#ecd9de] dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700',
        },
        emerald: {
            bg: 'bg-[#fbfdfb] dark:bg-gray-900',
            border: 'border-[#d8e7dd] dark:border-gray-800',
            text: 'text-[#3d5c49] dark:text-gray-200',
            header: 'bg-[#edf8f2] dark:bg-gray-800/80 border-b border-[#d8e7dd] dark:border-gray-700',
            count: 'bg-white/80 text-[#54715e] ring-1 ring-[#d8e7dd] dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700',
        },
        green: {
            bg: 'bg-[#fbfdfb] dark:bg-gray-900',
            border: 'border-[#d8e7dd] dark:border-gray-800',
            text: 'text-[#3d5c49] dark:text-gray-200',
            header: 'bg-[#edf8f2] dark:bg-gray-800/80 border-b border-[#d8e7dd] dark:border-gray-700',
            count: 'bg-white/80 text-[#54715e] ring-1 ring-[#d8e7dd] dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700',
        },
        red: {
            bg: 'bg-[#fffafa] dark:bg-gray-900',
            border: 'border-[#eddad6] dark:border-gray-800',
            text: 'text-[#674a42] dark:text-gray-200',
            header: 'bg-[#fbefed] dark:bg-gray-800/80 border-b border-[#eddad6] dark:border-gray-700',
            count: 'bg-white/80 text-[#7d625a] ring-1 ring-[#eddad6] dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700',
        },
    };
    return colors[color] || colors.blue;
};

const CompactCandidateRow: React.FC<{
    application: JobApplication;
    candidateName: string;
    candidateEmail?: string;
    onViewResume: () => void;
    onDragStart: (event: React.DragEvent) => void;
}> = ({ application, candidateName, candidateEmail, onViewResume, onDragStart }) => {
    const initials = candidateName
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'CV';
    const matchScore = getMatchScore(application);

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onClick={onViewResume}
            className="group rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-gray-300 hover:bg-[#fbfaf8] dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700 dark:hover:bg-gray-900"
        >
            <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f1eef6] text-xs font-black text-[#61556f] ring-1 ring-[#e0dced] dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
                    {initials}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                            <h4 className="truncate text-[13px] font-bold leading-5 text-gray-950 dark:text-gray-100">{candidateName}</h4>
                            <p className="truncate text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                {candidateEmail || application.resumeId || 'Resume attached'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                onViewResume();
                            }}
                            className="rounded p-1 text-gray-400 transition hover:bg-white hover:text-[#5f6f89] dark:hover:bg-gray-800 dark:hover:text-gray-200"
                            aria-label={`Open ${candidateName}'s resume`}
                        >
                            <FileText size={13} />
                        </button>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                        {matchScore !== null && (
                            <span className="flex items-center gap-1 text-[#526b59] dark:text-gray-300">
                                <CheckCircle2 size={11} />
                                {matchScore}% match
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <CalendarClock size={11} />
                            {formatShortDate(application.appliedAt)}
                        </span>
                        {application.resumeId && (
                            <code className="ml-auto max-w-[92px] truncate rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                {application.resumeId}
                            </code>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface CandidatePipelineColumnProps {
    stage: PipelineStage;
    applications: JobApplication[];
    candidateNames: Record<string, string>;
    candidateEmails: Record<string, string>;
    onViewResume: (app: JobApplication) => void;
    onUpdateStatus: (appId: string, newStatus: JobApplicationStatus) => void;
    onDragOver: (event: React.DragEvent) => void;
    onDrop: (event: React.DragEvent, stageId: string) => void;
    isDropTarget: boolean;
    transparency: number;
    onEmailAction: (app: JobApplication) => void;
    onScheduleAction: (app: JobApplication) => void;
}

const CandidatePipelineColumn: React.FC<CandidatePipelineColumnProps> = ({
    stage,
    applications,
    candidateNames,
    candidateEmails,
    onViewResume,
    onUpdateStatus,
    onDragOver,
    onDrop,
    isDropTarget,
    transparency,
    onEmailAction,
    onScheduleAction,
}) => {
    const isLongColumn = applications.length > LONG_COLUMN_THRESHOLD;
    const [query, setQuery] = useState('');
    const [sortMode, setSortMode] = useState<'applied' | 'match' | 'name'>('applied');
    const [page, setPage] = useState(0);
    const colorScheme = getStageColor(stage.color);

    const managedApplications = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return applications
            .filter(app => {
                if (!normalizedQuery) return true;
                const candidateName = candidateNames[app.applicantUserId] || '';
                const candidateEmail = candidateEmails[app.applicantUserId] || '';
                return [
                    candidateName,
                    candidateEmail,
                    app.resumeId,
                    app.applicantUserId,
                    app.coverLetter,
                    app.status,
                ].some(value => (value || '').toLowerCase().includes(normalizedQuery));
            })
            .sort((a, b) => {
                if (sortMode === 'match') return (getMatchScore(b) || -1) - (getMatchScore(a) || -1);
                if (sortMode === 'name') {
                    const nameA = candidateNames[a.applicantUserId] || '';
                    const nameB = candidateNames[b.applicantUserId] || '';
                    return nameA.localeCompare(nameB);
                }
                return toTime(b.appliedAt) - toTime(a.appliedAt);
            });
    }, [applications, candidateEmails, candidateNames, query, sortMode]);

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

    const handleQuickAction = (app: JobApplication, action: 'advance' | 'reject' | 'email' | 'schedule') => {
        if (action === 'advance') {
            const nextStage = DEFAULT_PIPELINE_STAGES.find(s => s.order === stage.order + 1);
            if (nextStage) onUpdateStatus(app.id, nextStage.id as JobApplicationStatus);
        } else if (action === 'reject') {
            onUpdateStatus(app.id, 'rejected');
        } else if (action === 'email') {
            onEmailAction(app);
        } else if (action === 'schedule') {
            onScheduleAction(app);
        }
    };

    return (
        <div
            className={`flex flex-col flex-1 min-w-[280px] max-w-[320px] overflow-hidden rounded-xl border transition-all ${colorScheme.border} ${isDropTarget ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
            onDragOver={onDragOver}
            onDrop={(event) => onDrop(event, stage.id)}
        >
            <div className={`${colorScheme.header} px-4 py-3`}>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${colorScheme.text}`}>{stage.name}</h3>
                        <span className={`${colorScheme.count} rounded-full px-2 py-0.5 text-xs`}>
                            {applications.length}
                        </span>
                    </div>
                    {isLongColumn && (
                        <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-gray-500 ring-1 ring-black/5 dark:bg-gray-900 dark:text-gray-300 dark:ring-white/10">
                            {rangeStart}-{rangeEnd} of {managedApplications.length}
                        </span>
                    )}
                </div>
                {isLongColumn && (
                    <div className="mt-3 space-y-2 rounded-lg border border-gray-200 bg-white/80 p-2 dark:border-gray-700 dark:bg-gray-900/80">
                        <label className="relative block">
                            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder={`Find ${stage.name.toLowerCase()} candidates`}
                                className="h-8 w-full rounded-md border border-gray-200 bg-[#fbfaf8] pl-7 pr-2 text-xs font-semibold text-gray-900 outline-none transition focus:border-[#b8aa95] focus:bg-white dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-500"
                            />
                        </label>
                        <select
                            value={sortMode}
                            onChange={(event) => setSortMode(event.target.value as 'applied' | 'match' | 'name')}
                            className="h-8 w-full rounded-md border border-gray-200 bg-[#fbfaf8] px-2 text-xs font-bold text-gray-700 outline-none focus:border-[#b8aa95] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:focus:border-gray-500"
                        >
                            <option value="applied">Recently applied</option>
                            <option value="match">Best match score</option>
                            <option value="name">Candidate name</option>
                        </select>
                    </div>
                )}
            </div>

            <div
                className={`${colorScheme.bg} flex-1 space-y-3 overflow-y-auto p-3 dark:bg-gray-900`}
                style={{
                    backgroundColor: transparency > 0 ? `rgba(255, 255, 255, ${1 - (transparency / 100)})` : undefined,
                    backdropFilter: transparency > 20 ? 'blur(10px)' : undefined,
                }}
            >
                {applications.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 dark:text-gray-600">
                        <User size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No candidates</p>
                    </div>
                ) : (
                    <>
                        {visibleApplications.map(app => {
                            const candidateName = candidateNames[app.applicantUserId] || 'Unknown';
                            const candidateEmail = candidateEmails[app.applicantUserId];
                            const handleDragStart = (event: React.DragEvent) => {
                                event.dataTransfer.setData('application/json', JSON.stringify({ appId: app.id, fromStage: stage.id }));
                            };

                            return isLongColumn ? (
                                <CompactCandidateRow
                                    key={app.id}
                                    application={app}
                                    candidateName={candidateName}
                                    candidateEmail={candidateEmail}
                                    onViewResume={() => onViewResume(app)}
                                    onDragStart={handleDragStart}
                                />
                            ) : (
                                <CandidateCard
                                    key={app.id}
                                    application={app}
                                    candidateName={candidateName}
                                    candidateEmail={candidateEmail}
                                    onViewResume={() => onViewResume(app)}
                                    onQuickAction={(action) => handleQuickAction(app, action)}
                                    onDragStart={handleDragStart}
                                    matchScore={app.matchAnalysis?.matchPercentage}
                                />
                            );
                        })}
                        {isLongColumn && managedApplications.length === 0 && (
                            <div className="rounded-lg border border-dashed border-gray-300 bg-white/60 p-4 text-center text-xs font-semibold text-gray-400 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-500">
                                No candidates match this column search.
                            </div>
                        )}
                        {isLongColumn && managedApplications.length > LONG_COLUMN_PAGE_SIZE && (
                            <div className="sticky bottom-0 flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white/95 px-2 py-2 text-xs font-bold text-gray-600 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 dark:text-gray-300">
                                <button type="button" onClick={() => setPage(current => Math.max(0, current - 1))} disabled={page === 0} className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800">
                                    <ChevronLeft size={13} />Prev
                                </button>
                                <span>{page + 1} / {pageCount}</span>
                                <button type="button" onClick={() => setPage(current => Math.min(pageCount - 1, current + 1))} disabled={page >= pageCount - 1} className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800">
                                    Next<ChevronRight size={13} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CandidatePipelineColumn;
