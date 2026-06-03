import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { AgencyPrepSession } from '../types';
import { getStaleBreakdown } from '../utils/staleCandidateUtils';

interface StaleCandidateAlertProps {
  sessions: AgencyPrepSession[];
  onViewStale: () => void;
  renderNudgeButton?: React.ReactNode;
}

const StaleCandidateAlert: React.FC<StaleCandidateAlertProps> = ({
  sessions,
  onViewStale,
  renderNudgeButton,
}) => {
  const { staleCount, oldestStaleDays } = getStaleBreakdown(sessions);

  if (staleCount === 0) return null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-[#fffbeb] p-4 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-amber-100 p-1.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <AlertTriangle size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold flex items-center gap-1.5">
            <span>Inactivity warning</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
              {staleCount} candidate{staleCount === 1 ? '' : 's'} stale
            </span>
          </h4>
          <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
            {staleCount} candidate{staleCount === 1 ? ' has' : 's have'} had no preparation activity for over 3 days. 
            The oldest inactive candidate has been quiet for {oldestStaleDays} days.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onViewStale}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#e4d3bc] bg-white px-3 py-2 text-xs font-bold text-[#211b16] shadow-sm transition hover:bg-[#fdf5e8] dark:border-[#302e2a] dark:bg-[#262522] dark:text-[#f4f1e9] dark:hover:bg-[#1f1f1d]"
        >
          <Clock size={14} className="text-[#8b5a16] dark:text-[#caa26c]" />
          Filter inactive candidates
        </button>
        {renderNudgeButton}
      </div>
    </div>
  );
};

export default StaleCandidateAlert;
