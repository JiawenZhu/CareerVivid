import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, ExternalLink, Loader2, Moon, RefreshCw, ShieldCheck } from 'lucide-react';
import type { ApplicationQueueItem, JobApplicationData, ResumeData } from '../../types';
import { useApplicationProfile } from '../../hooks/useApplicationProfile';
import { useApplicationQueue } from '../../hooks/useApplicationQueue';
import { prepareApplicationQueueItem } from '../../services/applyAgentService';
import { navigate } from '../../utils/navigation';
import { getJobLinkValidationErrorMessage, openVerifiedExternalJobLink } from '../../utils/verifiedJobLink';

interface ApplyAgentPanelProps {
  applications: JobApplicationData[];
  resumes: ResumeData[];
  onJobSelect: (job: JobApplicationData) => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  preparing: 'Preparing',
  ready: 'Packet ready',
  approved: 'Approved',
  running: 'Applying now',
  needs_user: 'Needs review',
  submitted: 'Submitted',
  failed: 'Failed',
  skipped: 'Skipped',
};

const STATUS_HELP: Record<string, string> = {
  draft: 'Saved but not ready yet.',
  preparing: 'Building the application packet.',
  ready: 'Saved in the queue. Nothing has been submitted yet.',
  approved: 'Approved and waiting for an executor.',
  running: 'The browser runner is working on this application.',
  needs_user: 'Review the items below, then re-check.',
  submitted: 'Submitted and waiting for receipt details.',
  failed: 'Stopped after an error.',
  skipped: 'Filtered out by your rules.',
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  preparing: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  ready: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  approved: 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300',
  running: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  needs_user: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  submitted: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  failed: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  skipped: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

const toMatchScore = (job: JobApplicationData): number | null => {
  if (typeof job.aiEvaluation?.score === 'number') return Math.round(job.aiEvaluation.score * 20);
  const analyses = Object.values(job.matchAnalyses || {});
  if (analyses.length > 0) return Math.round(analyses[0].matchPercentage);
  return null;
};

const getApplyUrl = (job: JobApplicationData): string => job.applicationURL || job.jobPostURL || '';

const normalize = (value?: string) => (value || '').trim().toLowerCase();

const getSkippedReason = (job: JobApplicationData, minimumScore: number, excludedCompanies: string[], excludedTitles: string[]): string | null => {
  const score = toMatchScore(job);
  if (!getApplyUrl(job)) return 'Missing apply URL';
  if (score !== null && score < minimumScore) return `Below ${minimumScore}% match`;
  if (excludedCompanies.some(company => normalize(job.companyName).includes(normalize(company)))) return 'Company excluded';
  if (excludedTitles.some(title => normalize(job.jobTitle).includes(normalize(title)))) return 'Title excluded';
  return null;
};

const QueueRow: React.FC<{
  item: ApplicationQueueItem;
  job?: JobApplicationData;
  isRefreshing: boolean;
  onReview: () => void;
  onRefresh: () => void;
}> = ({ item, job, isRefreshing, onReview, onRefresh }) => {
  const [isOpening, setIsOpening] = useState(false);
  const [linkError, setLinkError] = useState('');

  const openApplyUrl = async () => {
    if (!item.applyUrl || isOpening) return;
    setIsOpening(true);
    setLinkError('');
    try {
      const result = await openVerifiedExternalJobLink({
        url: item.applyUrl,
        title: item.jobTitle || job?.jobTitle || 'Untitled job',
        company: item.companyName || job?.companyName || '',
      });
      if (!result.verified) {
        setLinkError(`Opened saved link without verification. ${result.validationReason || 'CareerVivid could not complete the live check.'}`);
      }
    } catch (error) {
      setLinkError(getJobLinkValidationErrorMessage(error));
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-bold text-gray-950 dark:text-gray-100">{item.jobTitle || 'Untitled job'}</h4>
          <p className="truncate text-xs font-semibold text-gray-500 dark:text-gray-400">{item.companyName || 'Unknown company'}</p>
        </div>
        <span className={`flex-shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${STATUS_STYLES[item.status] || STATUS_STYLES.draft}`}>
          {STATUS_LABELS[item.status] || item.status}
        </span>
      </div>
      <p className="mt-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
        {STATUS_HELP[item.status] || 'Saved in the application queue.'}
      </p>
      {item.riskFlags.length > 0 && (
        <ul className="mt-2 space-y-1">
          {item.riskFlags.slice(0, 3).map(flag => (
            <li key={flag} className="flex items-start gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-300">
              <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
              <span>{flag}</span>
            </li>
          ))}
          {item.riskFlags.length > 3 && (
            <li className="text-[11px] font-bold text-amber-600 dark:text-amber-300">
              +{item.riskFlags.length - 3} more item(s)
            </li>
          )}
        </ul>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400">
        {typeof item.matchScore === 'number' && <span>{item.matchScore}% match</span>}
        {item.atsPlatform && <span>{item.atsPlatform}</span>}
        <button
          type="button"
          onClick={onReview}
          className="ml-auto inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-300"
        >
          Review job
        </button>
        {job && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-primary-300"
          >
            {isRefreshing ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            Re-check
          </button>
        )}
        {item.applyUrl && (
          <button
            type="button"
            onClick={openApplyUrl}
            disabled={isOpening}
            className="ml-auto inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-primary-300"
          >
            {isOpening ? 'Checking' : 'Verify'} <ExternalLink size={11} />
          </button>
        )}
      </div>
      {linkError && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          {linkError}
        </p>
      )}
    </div>
  );
};

export const ApplyAgentPanel: React.FC<ApplyAgentPanelProps> = ({ applications, resumes, onJobSelect }) => {
  const { profileWithDefaults, completionPercent } = useApplicationProfile();
  const { items, isLoading, error } = useApplicationQueue();
  const [preparingJobId, setPreparingJobId] = useState<string | null>(null);
  const [prepareError, setPrepareError] = useState('');

  const jobsById = useMemo(() => new Map(applications.map(job => [job.id, job])), [applications]);
  const queuedJobIds = useMemo(() => new Set(items.map(item => item.jobId)), [items]);
  const suggestedJobs = useMemo(() => {
    const rules = profileWithDefaults.autoApplyRules;
    return applications
      .filter(job => job.applicationStatus === 'To Apply' && !queuedJobIds.has(job.id))
      .map(job => ({
        job,
        score: toMatchScore(job),
        skippedReason: getSkippedReason(job, rules.minimumMatchScore, rules.excludedCompanies, rules.excludedJobTitles),
      }))
      .slice(0, 6);
  }, [applications, profileWithDefaults.autoApplyRules, queuedJobIds]);

  const counts = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);

  const prepareJob = async (job: JobApplicationData) => {
    setPreparingJobId(job.id);
    setPrepareError('');
    try {
      await prepareApplicationQueueItem({ job, resumeId: job.resumeId || resumes[0]?.id });
    } catch (err: any) {
      setPrepareError(err.message || 'Failed to prepare application queue item.');
    } finally {
      setPreparingJobId(null);
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950" aria-label="Apply Agent">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
            <Bot size={20} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-gray-950 dark:text-gray-100">Apply Agent</h2>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${profileWithDefaults.completion.requiredReady ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                {completionPercent}% profile ready
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-sm font-medium text-gray-500 dark:text-gray-400">
              Prepare saved application packets from real resume data. Nothing is submitted until an executor starts.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/profile#application-profile')}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-primary-200 hover:text-primary-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-primary-700"
          >
            <ShieldCheck size={14} /> Application Profile
          </button>
          <div className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 dark:bg-gray-900 dark:text-gray-300">
            <Moon size={14} /> Night cap {profileWithDefaults.autoApplyRules.maxApplicationsPerNight}
          </div>
        </div>
      </div>

      {!profileWithDefaults.completion.requiredReady && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>
            Complete Application Profile and consent before unattended auto-apply can run. Missing: {profileWithDefaults.completion.missingRequiredFields.slice(0, 4).join(', ')}
            {profileWithDefaults.completion.missingRequiredFields.length > 4 ? '...' : ''}
          </span>
        </div>
      )}

      {(error || prepareError) && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error || prepareError}
        </div>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-950 dark:text-gray-100">Queue</h3>
            <div className="flex gap-1 text-[10px] font-bold text-gray-500 dark:text-gray-400">
              <span>Ready {counts.ready || 0}</span>
              <span>Applying {counts.running || 0}</span>
              <span>Review {counts.needs_user || 0}</span>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1">
            {isLoading ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-semibold text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">Loading queue...</div>
            ) : items.length > 0 ? (
              items.slice(0, 4).map(item => {
                const job = jobsById.get(item.jobId);
                return (
                  <QueueRow
                    key={item.id}
                    item={item}
                    job={job}
                    isRefreshing={preparingJobId === item.jobId}
                    onReview={() => job ? onJobSelect(job) : undefined}
                    onRefresh={() => job && prepareJob(job)}
                  />
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm font-semibold text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                No queued applications yet.
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-950 dark:text-gray-100">Suggested packets</h3>
            <span className="text-[10px] font-bold text-gray-400">From To Apply jobs</span>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {suggestedJobs.length > 0 ? suggestedJobs.map(({ job, score, skippedReason }) => (
              <div key={job.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => onJobSelect(job)} className="min-w-0 text-left">
                    <h4 className="truncate text-sm font-bold text-gray-950 dark:text-gray-100">{job.jobTitle || 'Untitled job'}</h4>
                    <p className="truncate text-xs font-semibold text-gray-500 dark:text-gray-400">{job.companyName || 'Unknown company'}</p>
                  </button>
                  {score !== null && <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{score}%</span>}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  {skippedReason ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-300">
                      <AlertTriangle size={12} /> {skippedReason}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
                      <CheckCircle2 size={12} /> Eligible
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => prepareJob(job)}
                    disabled={Boolean(skippedReason) || preparingJobId === job.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {preparingJobId === job.id && <Loader2 size={12} className="animate-spin" />}
                    {preparingJobId === job.id ? 'Queueing' : 'Prepare'}
                  </button>
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm font-semibold text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                All eligible To Apply jobs are queued or filtered by rules.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ApplyAgentPanel;
