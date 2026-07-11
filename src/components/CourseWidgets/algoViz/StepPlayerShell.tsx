import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Shared shell for algorithm step-player animations.
 *
 * Every algorithm in the Coding Interview Patterns course gets its own
 * animation; this shell provides the common chrome (header, step counter,
 * caption, legend, Prev/Next/Reset controls, completion footer) so each new
 * algorithm widget only has to supply its step data and visual.
 *
 * Usage:
 *   <StepPlayerShell icon={MoveHorizontal} title="…" totalSteps={N}
 *     captions={[…]} completed={completed} onComplete={onComplete}
 *     doneText="✓ …" todoText="Step through…">
 *     {(step) => <YourVisual step={step} />}
 *   </StepPlayerShell>
 */
export interface StepPlayerShellProps {
  icon: LucideIcon;
  title: string;
  totalSteps: number;
  /** Label on the advance button, e.g. "Slide right". Default "Next step". */
  nextLabel?: string;
  /** Optional caption per step, rendered under the visual. */
  captions?: string[];
  legend?: React.ReactNode;
  completed: boolean;
  onComplete: () => void;
  /** Footer text once the learner reaches the final step. */
  doneText: string;
  /** Footer text before completion. */
  todoText: string;
  children: (step: number) => React.ReactNode;
}

const StepPlayerShell: React.FC<StepPlayerShellProps> = ({
  icon: Icon,
  title,
  totalSteps,
  nextLabel = 'Next step',
  captions,
  legend,
  completed,
  onComplete,
  doneText,
  todoText,
  children,
}) => {
  const [step, setStep] = useState(0);
  const [reachedEnd, setReachedEnd] = useState(false);

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(totalSteps - 1, next));
    setStep(clamped);
    if (clamped === totalSteps - 1 && !reachedEnd) {
      setReachedEnd(true);
      if (!completed) onComplete();
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">
          <Icon size={13} /> {title}
        </p>
        <span className="text-[11px] font-bold tabular-nums text-[var(--cv-text-muted)]">
          Step {step + 1} / {totalSteps}
        </span>
      </div>

      <div className="mt-4">{children(step)}</div>

      {captions?.[step] && (
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-3 max-w-lg rounded-xl bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.04))] px-4 py-2.5 text-center text-sm font-semibold text-[var(--cv-text-heading)]"
        >
          {captions[step]}
        </motion.p>
      )}

      {legend && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold text-[var(--cv-text-body)]">
          {legend}
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => go(step - 1)}
          disabled={step === 0}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--cv-border-warm)] px-3 text-xs font-bold text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)] disabled:opacity-40"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <button
          type="button"
          onClick={() => go(step + 1)}
          disabled={step === totalSteps - 1}
          className="cv-design-button-primary inline-flex h-9 items-center gap-1 rounded-lg px-4 text-xs disabled:opacity-40"
        >
          {nextLabel} <ChevronRight size={14} />
        </button>
        <button
          type="button"
          onClick={() => setStep(0)}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--cv-border-warm)] px-3 text-xs font-bold text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)]"
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <p className="mt-3 text-center text-[11px] font-medium text-[var(--cv-text-muted)]">
        {reachedEnd || completed ? doneText : todoText}
      </p>
    </div>
  );
};

/** Shared color tokens so every algorithm animation speaks the same language. */
export const ALGO_COLORS = {
  activeCell: 'border-[#5f8fd9] bg-[#ecf4fd] text-[#1861a8] dark:border-[#33517c] dark:bg-[#1c2a3a] dark:text-[#8fc4f0]',
  goodCell: 'border-[#b9e3c8] bg-[#eef9f2] text-[#15803d] dark:border-[#336044] dark:bg-[#1d3226] dark:text-[#86e0a8]',
  resultCell: 'border-[#e8a33d] bg-[#fdf3d7] text-[#a35410] dark:border-[#8a642f] dark:bg-[#39332a] dark:text-[#f0c08a]',
  deadCell: 'border-[var(--cv-border-warm)] text-[var(--cv-text-muted)] opacity-40',
  idleCell: 'border-[var(--cv-border-warm)] text-[var(--cv-text-heading)]',
} as const;

export default StepPlayerShell;
