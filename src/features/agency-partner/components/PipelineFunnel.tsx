import React from 'react';
import type { PilotFunnelStats } from '../types';

interface PipelineFunnelProps {
  stats: PilotFunnelStats;
}

const STAGES: Array<{ key: keyof Omit<PilotFunnelStats, 'startRate' | 'readyRate' | 'shareRate'>; label: string; tint: string; dark: string }> = [
  { key: 'invited', label: 'Invited', tint: 'bg-[#fdf5e8]', dark: 'dark:bg-[#262522]' },
  { key: 'started', label: 'Started', tint: 'bg-[#fbe7c8]', dark: 'dark:bg-[#3a2f26]' },
  { key: 'reviewed', label: 'Reviewed', tint: 'bg-amber-100', dark: 'dark:bg-amber-950/40' },
  { key: 'ready', label: 'Ready', tint: 'bg-emerald-100', dark: 'dark:bg-emerald-950/40' },
  { key: 'shared', label: 'Shared', tint: 'bg-emerald-200', dark: 'dark:bg-emerald-900/40' },
];

const formatRate = (rate: number | null): string => (rate === null ? '—' : `${rate}%`);

const PipelineFunnel: React.FC<PipelineFunnelProps> = ({ stats }) => {
  const maxValue = Math.max(stats.invited, stats.started, stats.reviewed, stats.ready, stats.shared, 1);

  return (
    <section className="rounded-2xl border border-[#e4d3bc] bg-white p-5 dark:border-[#302e2a] dark:bg-[#1f1f1d]">
      <header className="mb-4">
        <h3 className="text-sm font-bold text-[#211b16] dark:text-[#f4f1e9]">Pipeline funnel</h3>
        <p className="mt-0.5 text-xs text-[#6b6358] dark:text-[#aaa39a]">
          Conversion at each stage of the prep journey.
        </p>
      </header>

      <ol className="space-y-2.5">
        {STAGES.map((stage, index) => {
          const value = stats[stage.key];
          const width = Math.max(8, Math.round((value / maxValue) * 100));
          // Conversion rate from the PREVIOUS stage to this one.
          let rate: number | null = null;
          if (index === 1) rate = stats.startRate;
          if (index === 3) rate = stats.readyRate;
          if (index === 4) rate = stats.shareRate;

          return (
            <li key={stage.key} className="flex items-center gap-3">
              <div className="w-20 shrink-0 text-xs font-semibold text-[#6b6358] dark:text-[#aaa39a]">
                {stage.label}
              </div>
              <div className="relative flex-1 rounded-lg border border-[#e4d3bc] bg-[#fffaf1] dark:border-[#302e2a] dark:bg-[#262522]">
                <div
                  className={`h-7 rounded-lg ${stage.tint} ${stage.dark}`}
                  style={{ width: `${width}%` }}
                />
                <span className="absolute inset-y-0 left-3 flex items-center text-[12px] font-bold text-[#211b16] dark:text-[#f4f1e9]">
                  {value}
                </span>
              </div>
              <div className="w-16 shrink-0 text-right text-[11px] font-semibold text-[#6b6358] dark:text-[#aaa39a]">
                {rate !== null ? `→ ${formatRate(rate)}` : ''}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default PipelineFunnel;
