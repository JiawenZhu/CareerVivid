import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Layers, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CourseWidgetProps } from './types';

/**
 * Monotonic-stack animation — walks the classic array, popping everything
 * smaller-or-equal before each push so the stack stays increasing bottom→top.
 * Mirrors the hand-drawn walkthrough: current element, pops, resulting stack.
 * Completes after stepping through the whole array.
 */

const NUMS = [2, 1, 5, 3, 6, 2, 3];

interface StackStep {
  index: number;          // element being processed
  popped: number[];       // values popped this step
  stackAfter: number[];   // stack content bottom→top after the push
}

const buildSteps = (): StackStep[] => {
  const steps: StackStep[] = [];
  const stack: number[] = [];
  for (let index = 0; index < NUMS.length; index += 1) {
    const value = NUMS[index];
    const popped: number[] = [];
    while (stack.length && stack[stack.length - 1] >= value) {
      popped.push(stack.pop() as number);
    }
    stack.push(value);
    steps.push({ index, popped, stackAfter: [...stack] });
  }
  return steps;
};

const STEPS = buildSteps();

const MonotonicStackViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [reachedEnd, setReachedEnd] = useState(false);
  const current = STEPS[step];

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(STEPS.length - 1, next));
    setStep(clamped);
    if (clamped === STEPS.length - 1 && !reachedEnd) {
      setReachedEnd(true);
      if (!completed) onComplete();
    }
  };

  const stackCells = useMemo(() => [...current.stackAfter].reverse(), [current]); // render top-first

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">
          <Layers size={13} /> Monotonic stack · keep it increasing, bottom → top
        </p>
        <span className="text-[11px] font-bold tabular-nums text-[var(--cv-text-muted)]">
          {t('courses.step_counter', { index: step + 1, total: STEPS.length, defaultValue: 'Step {{index}} / {{total}}' })}
        </span>
      </div>

      {/* Array traversal */}
      <div className="mt-5 flex justify-center gap-1.5">
        {NUMS.map((value, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <span className={`text-[10px] font-extrabold ${index === current.index ? 'text-[var(--cv-action-primary)]' : 'text-transparent'}`}>
              {index === current.index ? '▼ current' : '.'}
            </span>
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-lg border-2 font-mono text-base font-bold transition-colors ${index === current.index
                ? 'border-[#5f8fd9] bg-[#ecf4fd] text-[#1861a8] dark:border-[#33517c] dark:bg-[#1c2a3a] dark:text-[#8fc4f0]'
                : index < current.index
                  ? 'border-[var(--cv-border-warm)] text-[var(--cv-text-muted)] opacity-50'
                  : 'border-[var(--cv-border-warm)] text-[var(--cv-text-heading)]'}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
        {/* Pops this step */}
        <div className="rounded-xl bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.04))] p-3 text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cv-text-muted)]">This step</p>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 text-sm font-bold text-[var(--cv-text-heading)]">
              {current.popped.length > 0 ? (
                <span>
                  {current.popped.map((v) => (
                    <span key={v} className="mx-0.5 inline-block rounded-md bg-[#fdeef1] px-2 py-0.5 font-mono text-[#b03a54] line-through dark:bg-[#3c2229] dark:text-[#f4a5b8]">
                      pop {v}
                    </span>
                  ))}
                  then push <span className="font-mono text-[#15803d]">{NUMS[current.index]}</span>
                </span>
              ) : (
                <span>
                  stack top &lt; <span className="font-mono">{NUMS[current.index]}</span> — just push it
                </span>
              )}
            </motion.div>
          </AnimatePresence>
          <p className="mt-2 text-[11px] font-medium leading-5 text-[var(--cv-text-muted)]">
            Pop while top ≥ current. Every element is pushed once and popped at most once → O(n) total.
          </p>
        </div>

        {/* Stack visual */}
        <div className="mx-auto flex w-24 flex-col items-center">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cv-text-muted)]">Stack</p>
          <div className="mt-1.5 flex min-h-[176px] w-full flex-col justify-end gap-1 rounded-xl border-2 border-[var(--cv-border-warm)] border-t-transparent p-1.5">
            <AnimatePresence>
              {stackCells.map((value, i) => (
                <motion.div
                  key={`${value}-${stackCells.length - i}`}
                  layout
                  initial={{ opacity: 0, y: -16, scale: 0.7 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 24 }}
                  className="flex h-9 items-center justify-center rounded-md border border-[#b9e3c8] bg-[#eef9f2] font-mono text-sm font-bold text-[#15803d] dark:border-[#336044] dark:bg-[#1d3226] dark:text-[#86e0a8]"
                >
                  {value}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <p className="mt-1 text-[9px] font-bold uppercase text-[var(--cv-text-muted)]">bottom → top ↑</p>
        </div>

        {/* Legend */}
        <div className="rounded-xl bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.04))] p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cv-text-muted)]">Legend</p>
          <ul className="mt-1.5 space-y-1.5 text-[11px] font-semibold text-[var(--cv-text-body)]">
            <li><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#5f8fd9] bg-[#ecf4fd] align-middle" /> current element</li>
            <li><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#b9e3c8] bg-[#eef9f2] align-middle" /> in the stack (increasing)</li>
            <li><span className="mr-1.5 inline-block h-3 w-3 rounded-sm bg-[#fdeef1] align-middle" /> popped (top ≥ current)</li>
          </ul>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--cv-border-warm)] px-3 text-xs font-bold text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)] disabled:opacity-40">
          <ChevronLeft size={14} /> {t('courses.prev_step', 'Prev')}
        </button>
        <button type="button" onClick={() => go(step + 1)} disabled={step === STEPS.length - 1} className="cv-design-button-primary inline-flex h-9 items-center gap-1 rounded-lg px-4 text-xs disabled:opacity-40">
          {t('courses.viz.next_element', 'Next element')} <ChevronRight size={14} />
        </button>
        <button type="button" onClick={() => setStep(0)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--cv-border-warm)] px-3 text-xs font-bold text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)]">
          <RotateCcw size={13} /> {t('courses.reset', 'Reset')}
        </button>
      </div>

      <p className="mt-3 text-center text-[11px] font-medium text-[var(--cv-text-muted)]">
        {reachedEnd || completed
          ? '✓ Lesson complete! This exact walk solves Next Greater Element, Daily Temperatures, and Largest Rectangle in Histogram.'
          : 'Step through all 7 elements to complete this lesson. Predict the pops before you click.'}
      </p>
    </div>
  );
};

export default MonotonicStackViz;
