import React from 'react';
import { Clock3 } from 'lucide-react';
import { formatMinutesSaved } from '../utils/timeSaved';

interface TimeSavedBadgeProps {
  minutes: number;
  /** Display style: `pill` for inline cards, `hero` for big metric panels. */
  variant?: 'pill' | 'hero';
  /** Optional supporting text, e.g. "across 8 candidates". */
  caption?: string;
}

/**
 * Compact pill used in candidate cards / drawers, or hero card used at the
 * top of the Pilot Metrics tab. Uses warm tinted backgrounds per the
 * CareerVivid design system — no saturated panels.
 */
const TimeSavedBadge: React.FC<TimeSavedBadgeProps> = ({ minutes, variant = 'pill', caption }) => {
  const display = formatMinutesSaved(minutes);

  if (variant === 'hero') {
    return (
      <div className="rounded-2xl border border-[#e4d3bc] bg-[#fdf5e8] p-5 dark:border-[#302e2a] dark:bg-[#262522]">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#8b5a16] dark:text-[#caa26c]">
          <Clock3 size={14} />
          Recruiter time saved
        </div>
        <p
          className="mt-2 text-3xl font-bold text-[#211b16] dark:text-[#f4f1e9]"
          title="Estimate based on average recruiter time per candidate (10 min per ready, 5 min per shared, 3 min per large score lift)."
        >
          {display}
        </p>
        {caption ? (
          <p className="mt-1 text-xs text-[#6b6358] dark:text-[#aaa39a]">{caption}</p>
        ) : null}
      </div>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-[#e4d3bc] bg-[#fdf5e8] px-2.5 py-1 text-[11px] font-semibold text-[#8b5a16] dark:border-[#302e2a] dark:bg-[#262522] dark:text-[#caa26c]"
      title="Estimate based on average recruiter time per candidate."
    >
      <Clock3 size={12} />
      {display} saved
    </span>
  );
};

export default TimeSavedBadge;
