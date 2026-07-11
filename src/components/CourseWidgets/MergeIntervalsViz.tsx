import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StretchHorizontal } from 'lucide-react';
import type { CourseWidgetProps } from './types';
import StepPlayerShell from './algoViz/StepPlayerShell';

/**
 * Merge-intervals animation — sorted interval bars on a timeline collapsing
 * into merged blocks: overlap → extend, gap → start a new block.
 */

const INTERVALS: [number, number][] = [[1, 3], [2, 6], [8, 10], [9, 12], [15, 18]];
const T_MAX = 19;

interface Step { taken: number; merged: [number, number][]; verdict: string }

const buildSteps = (): Step[] => {
  const steps: Step[] = [{ taken: 0, merged: [], verdict: 'Intervals are already sorted by start — that\'s always step one. Now sweep left to right.' }];
  const merged: [number, number][] = [];
  INTERVALS.forEach(([s, e], i) => {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) {
      const verdict = `[${s}, ${e}] starts at ${s} ≤ current end ${last[1]} — OVERLAP. Extend the block to [${last[0]}, ${Math.max(last[1], e)}].`;
      last[1] = Math.max(last[1], e);
      steps.push({ taken: i + 1, merged: merged.map((m) => [...m] as [number, number]), verdict });
    } else {
      merged.push([s, e]);
      steps.push({
        taken: i + 1,
        merged: merged.map((m) => [...m] as [number, number]),
        verdict: last
          ? `[${s}, ${e}] starts at ${s} > current end ${last[1]} — GAP. Close the block and start a new one.`
          : `Take [${s}, ${e}] as the first merged block.`,
      });
    }
  });
  return steps;
};

const STEPS = buildSteps();
const x = (t: number) => (t / T_MAX) * 100;

const Bar: React.FC<{ s: number; e: number; cls: string; label?: boolean }> = ({ s, e, cls, label = true }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scaleX: 0.6 }}
    animate={{ opacity: 1, scaleX: 1 }}
    className={`absolute flex h-6 items-center justify-center rounded-md border-2 font-mono text-[10px] font-bold ${cls}`}
    style={{ left: `${x(s)}%`, width: `${x(e) - x(s)}%` }}
  >
    {label && `${s}–${e}`}
  </motion.div>
);

const MergeIntervalsViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={StretchHorizontal}
    title="Merge intervals · sort, then sweep"
    totalSteps={STEPS.length}
    nextLabel="Take next interval"
    captions={STEPS.map((s) => s.verdict)}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Lesson complete! Sort by start, then one comparison per interval: overlap → extend, gap → new block. Same sweep powers Insert Interval, Meeting Rooms, and calendar problems."
    todoText="Sweep through all 5 intervals and watch them collapse into 3 merged blocks."
    legend={
      <>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#5f8fd9] bg-[#ecf4fd] align-middle" /> interval being processed</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#b9e3c8] bg-[#eef9f2] align-middle" /> merged result</span>
      </>
    }
  >
    {(step) => {
      const { taken, merged } = STEPS[step];
      return (
        <div className="mx-auto max-w-lg">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cv-text-muted)]">Input (sorted by start)</p>
          <div className="relative mt-1 h-6">
            {INTERVALS.map(([s, e], i) => (
              <Bar
                key={i}
                s={s}
                e={e}
                cls={i === taken - 1
                  ? 'border-[#5f8fd9] bg-[#ecf4fd] text-[#1861a8] dark:bg-[#1c2a3a] dark:text-[#8fc4f0]'
                  : i < taken
                    ? 'border-[var(--cv-border-warm)] text-[var(--cv-text-muted)] opacity-35'
                    : 'border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] text-[var(--cv-text-heading)]'}
              />
            ))}
          </div>

          {/* Axis */}
          <div className="relative mt-2 h-4 border-t border-[var(--cv-border-warm)]">
            {[0, 5, 10, 15].map((t) => (
              <span key={t} className="absolute -top-0.5 text-[9px] font-bold text-[var(--cv-text-muted)]" style={{ left: `${x(t)}%` }}>
                |{t}
              </span>
            ))}
          </div>

          <p className="mt-2 text-[10px] font-extrabold uppercase tracking-wide text-[var(--cv-text-muted)]">Merged result</p>
          <div className="relative mt-1 h-6">
            <AnimatePresence>
              {merged.map(([s, e], i) => (
                <Bar
                  key={`${i}-${s}`}
                  s={s}
                  e={e}
                  cls="border-[#b9e3c8] bg-[#eef9f2] text-[#15803d] dark:border-[#336044] dark:bg-[#1d3226] dark:text-[#86e0a8]"
                />
              ))}
            </AnimatePresence>
            {merged.length === 0 && <span className="text-[11px] font-semibold text-[var(--cv-text-muted)]">— empty —</span>}
          </div>
        </div>
      );
    }}
  </StepPlayerShell>
);

export default MergeIntervalsViz;
