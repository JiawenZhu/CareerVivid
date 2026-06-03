import React, { useMemo } from 'react';
import { ArrowRight, CalendarClock, CheckCircle2, ClipboardList, Sparkles, Target } from 'lucide-react';
import { ApplicationStatus, JobApplicationData, NO_NEXT_ACTION } from '../../types';

interface TodayJobSearchPlanProps {
    applications: JobApplicationData[];
    onJobSelect: (job: JobApplicationData) => void;
}

const toTime = (value: any): number => {
    if (!value) return Number.MAX_SAFE_INTEGER;
    if (value.toDate && typeof value.toDate === 'function') return value.toDate().getTime();
    if (typeof value === 'object' && typeof value.seconds === 'number') return value.seconds * 1000;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
};

const formatShortDate = (value: any): string => {
    const time = toTime(value);
    if (time === Number.MAX_SAFE_INTEGER) return '';
    return new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getLatestMatchScore = (job: JobApplicationData): number | null => {
    const analyses = Object.values(job.matchAnalyses || {});
    if (!analyses.length) return null;
    return Math.round(analyses[0].matchPercentage);
};

const getPrepCompletion = (job: JobApplicationData): number => {
    const fields = [job.prep_RoleOverview, job.prep_MyStory, job.prep_InterviewPrep, job.prep_QuestionsForInterviewer, job.notes];
    return fields.filter(Boolean).length;
};

const hasAction = (job: JobApplicationData): boolean => Boolean(job.nextAction && job.nextAction !== NO_NEXT_ACTION);

const TodayJobSearchPlan: React.FC<TodayJobSearchPlanProps> = ({ applications, onJobSelect }) => {
    const todayPlan = useMemo(() => {
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        const terminalStatuses: ApplicationStatus[] = ['Offered', 'Rejected'];
        const activeJobs = applications.filter(job => !terminalStatuses.includes(job.applicationStatus));

        const dueFollowUps = activeJobs
            .filter(job => hasAction(job) && toTime(job.nextActionDueDate) <= endOfToday.getTime())
            .sort((a, b) => toTime(a.nextActionDueDate) - toTime(b.nextActionDueDate));

        const plannedNextActions = activeJobs
            .filter(job => hasAction(job) && toTime(job.nextActionDueDate) > endOfToday.getTime())
            .sort((a, b) => toTime(a.nextActionDueDate) - toTime(b.nextActionDueDate) || toTime(b.updatedAt) - toTime(a.updatedAt));

        const highFitToApply = activeJobs
            .map(job => ({ job, score: getLatestMatchScore(job) }))
            .filter(({ job, score }) => job.applicationStatus === 'To Apply' && (score || 0) >= 75)
            .sort((a, b) => (b.score || 0) - (a.score || 0));

        const missingNextAction = activeJobs
            .filter(job => !hasAction(job))
            .sort((a, b) => toTime(b.updatedAt) - toTime(a.updatedAt));

        const interviewPrep = activeJobs
            .filter(job => job.applicationStatus === 'Interviewing' && getPrepCompletion(job) < 5)
            .sort((a, b) => getPrepCompletion(a) - getPrepCompletion(b));

        return {
            dueFollowUps,
            plannedNextActions,
            highFitToApply,
            missingNextAction,
            interviewPrep,
            items: [
                ...dueFollowUps.slice(0, 2).map(job => ({
                    id: `due-${job.id}`,
                    job,
                    eyebrow: formatShortDate(job.nextActionDueDate) || 'Due now',
                    title: job.nextAction || 'Follow up',
                    detail: `${job.jobTitle} at ${job.companyName}`,
                    tone: 'amber' as const,
                    icon: <CalendarClock size={15} />,
                })),
                ...plannedNextActions.slice(0, 2).map(job => ({
                    id: `next-${job.id}`,
                    job,
                    eyebrow: 'Next',
                    title: job.nextAction || 'Next action',
                    detail: `${job.jobTitle} at ${job.companyName}`,
                    tone: 'amber' as const,
                    icon: <ClipboardList size={15} />,
                })),
                ...highFitToApply.slice(0, 2).map(({ job, score }) => ({
                    id: `fit-${job.id}`,
                    job,
                    eyebrow: `${score}% match`,
                    title: 'Apply or tailor this role',
                    detail: `${job.jobTitle} at ${job.companyName}`,
                    tone: 'emerald' as const,
                    icon: <Target size={15} />,
                })),
                ...interviewPrep.slice(0, 1).map(job => ({
                    id: `prep-${job.id}`,
                    job,
                    eyebrow: `Prep ${getPrepCompletion(job)}/5`,
                    title: 'Finish interview prep',
                    detail: `${job.jobTitle} at ${job.companyName}`,
                    tone: 'blue' as const,
                    icon: <Sparkles size={15} />,
                })),
                ...missingNextAction.slice(0, 2).map(job => ({
                    id: `action-${job.id}`,
                    job,
                    eyebrow: job.applicationStatus,
                    title: 'Choose the next action',
                    detail: `${job.jobTitle} at ${job.companyName}`,
                    tone: 'slate' as const,
                    icon: <ClipboardList size={15} />,
                })),
            ].slice(0, 5),
        };
    }, [applications]);

    return (
        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-4" aria-label="Today job search plan">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        <Sparkles size={16} />
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-base font-bold text-gray-950 dark:text-gray-100">Today&apos;s job-search plan</h2>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Focus on due work, planned next actions, high-fit roles, and jobs missing a clear next step.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-gray-600 dark:text-gray-300 sm:grid-cols-5">
                    <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">{todayPlan.dueFollowUps.length} due</span>
                    <span className="rounded-md bg-[#fff7ed] px-2 py-1 text-[#a97935] dark:bg-amber-950/30 dark:text-amber-200">{todayPlan.plannedNextActions.length} next</span>
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{todayPlan.highFitToApply.length} high fit</span>
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{todayPlan.interviewPrep.length} prep</span>
                    <span className="rounded-md bg-gray-100 px-2 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{todayPlan.missingNextAction.length} no action</span>
                </div>
            </div>

            {todayPlan.items.length ? (
                <div className="mt-3 grid gap-2 lg:grid-cols-5">
                    {todayPlan.items.map(item => {
                        const toneClass = item.tone === 'amber'
                            ? 'border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200'
                            : item.tone === 'emerald'
                                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200'
                                : item.tone === 'blue'
                                    ? 'border-blue-200 bg-blue-50/70 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200'
                                    : 'border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200';
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onJobSelect(item.job)}
                                className={`group min-w-0 rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${toneClass}`}
                            >
                                <div className="flex items-center gap-2 text-[11px] font-bold">
                                    {item.icon}
                                    <span className="min-w-0 truncate">{item.eyebrow}</span>
                                    <ArrowRight size={13} className="ml-auto opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-90" />
                                </div>
                                <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug">{item.title}</p>
                                <p className="mt-1 truncate text-xs font-medium opacity-75">{item.detail}</p>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="mt-3 flex flex-col gap-2 rounded-lg border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200 sm:flex-row sm:items-center">
                    <CheckCircle2 size={18} className="shrink-0" />
                    <span className="font-semibold">Your active pipeline is clear. Save a role, add a follow-up, or prepare for the next interview.</span>
                </div>
            )}
        </section>
    );
};

export default TodayJobSearchPlan;
