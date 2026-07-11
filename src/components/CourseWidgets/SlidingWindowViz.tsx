import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MoveHorizontal, RotateCcw } from 'lucide-react';
import type { CourseWidgetProps } from './types';

/**
 * Sliding-window animation — the classic "maximum in every window of size k"
 * walkthrough. The learner steps the window across the array and watches the
 * left/right pointers, the current window, and the max-sequence build up.
 * Completes after stepping through every window position.
 */

const NUMS = [1, 3, -1, -3, 5, 3, 6, 7];
const K = 3;
const TOTAL_STEPS = NUMS.length - K + 1; // window positions

const SlidingWindowViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => {
  const [step, setStep] = useState(0);
  const [reachedEnd, setReachedEnd] = useState(false);

  const left = step;
  const right = step + K - 1;
  const windowMax = useMemo(() => Math.max(...NUMS.slice(left, right + 1)), [left, right]);
  const maxSequence = useMemo(
    () => Array.from({ length: step + 1 }, (_, i) => Math.max(...NUMS.slice(i, i + K))),
    [step],
  );

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_STEPS - 1, next));
    setStep(clamped);
    if (clamped === TOTAL_STEPS - 1 && !reachedEnd) {
      setReachedEnd(true);
      if (!completed) onComplete();
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">
          <MoveHorizontal size={13} /> Sliding window · max of every window (k = {K})
        </p>
        <span className="text-[11px] font-bold tabular-nums text-[var(--cv-text-muted)]">
          Window {step + 1} / {TOTAL_STEPS}
        </span>
      </div>

      {/* Array with window highlight */}
      <div className="mt-5 flex justify-center gap-1.5">
        {NUMS.map((value, index) => {
          const inWindow = index >= left && index <= right;
          const isMax = inWindow && value === windowMax;
          return (
            <motion.div
              key={index}
              layout
              animate={{
                scale: inWindow ? 1.05 : 1,
                opacity: inWindow ? 1 : 0.45,
              }}
              className={`relative flex h-12 w-11 items-center justify-center rounded-lg border-2 font-mono text-base font-bold transition-colors ${isMax
                ? 'border-[#e8a33d] bg-[#fdf3d7] text-[#a35410] dark:border-[#8a642f] dark:bg-[#39332a] dark:text-[#f0c08a]'
                : inWindow
                  ? 'border-[var(--cv-action-primary)] bg-[var(--cv-action-soft-bg,rgba(99,91,213,0.08))] text-[var(--cv-text-heading)]'
                  : 'border-[var(--cv-border-warm)] text-[var(--cv-text-muted)]'}`}
            >
              {value}
              {index === left && (
                <span className="absolute -bottom-6 text-[10px] font-extrabold text-[#15803d]">↑ L={left}</span>
              )}
              {index === right && (
                <span className="absolute -bottom-6 text-[10px] font-extrabold text-[#15803d]">↑ R={right}</span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Current window summary */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm">
        <span className="font-bold text-[var(--cv-text-body)]">Current window [{left}, {right}]</span>
        <span className="rounded-lg border border-[#e8a33d]/50 bg-[#fdf3d7] px-3 py-1 font-mono font-black text-[#a35410] dark:bg-[#39332a] dark:text-[#f0c08a]">
          max = {windowMax}
        </span>
      </div>

      {/* Max sequence trail */}
      <div className="mt-4 rounded-xl bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.04))] p-3">
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cv-text-muted)]">Max sequence so far</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <AnimatePresence>
            {maxSequence.map((value, index) => (
              <React.Fragment key={index}>
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-md border border-[#e8a33d]/50 bg-[#fdf3d7] px-2 py-0.5 font-mono text-sm font-bold text-[#a35410] dark:bg-[#39332a] dark:text-[#f0c08a]"
                >
                  {value}
                </motion.span>
                {index < maxSequence.length - 1 && <span className="text-[var(--cv-text-muted)]">→</span>}
              </React.Fragment>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--cv-border-warm)] px-3 text-xs font-bold text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)] disabled:opacity-40">
          <ChevronLeft size={14} /> Prev
        </button>
        <button type="button" onClick={() => go(step + 1)} disabled={step === TOTAL_STEPS - 1} className="cv-design-button-primary inline-flex h-9 items-center gap-1 rounded-lg px-4 text-xs disabled:opacity-40">
          Slide right <ChevronRight size={14} />
        </button>
        <button type="button" onClick={() => { setStep(0); }} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--cv-border-warm)] px-3 text-xs font-bold text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)]">
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <p className="mt-3 text-center text-[11px] font-medium text-[var(--cv-text-muted)]">
        {reachedEnd || completed
          ? '✓ Lesson complete! One pass, window size fixed at k — that\'s O(n) instead of recomputing every window at O(n·k).'
          : 'Slide the window all the way to the right to complete this lesson. Watch how only the entering/leaving elements matter.'}
      </p>
    </div>
  );
};

export default SlidingWindowViz;
