import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, GraduationCap, XCircle } from 'lucide-react';
import type { CourseWidgetProps } from './types';

/**
 * Few-shot trainer — the learner adds example pairs to a classification
 * prompt and watches accuracy on live test cases climb… unless they add the
 * mislabeled example, which visibly hurts. Completes at 6/6 accuracy.
 */

type Label = 'refund' | 'bug' | 'sales';

interface ExampleCard {
  id: string;
  text: string;
  label: Label;
  mislabeled?: boolean;
}

const EXAMPLES: ExampleCard[] = [
  { id: 'ex-refund', text: '"I was charged twice last month, please fix this." → refund', label: 'refund' },
  { id: 'ex-bug', text: '"The export button crashes the app every time." → bug', label: 'bug' },
  { id: 'ex-sales', text: '"Do you offer team plans for 50 people?" → sales', label: 'sales' },
  { id: 'ex-bad', text: '"My payment failed at checkout." → sales', label: 'sales', mislabeled: true },
];

interface TestCase {
  id: string;
  text: string;
  truth: Label;
  /** Correct once this example id is added (null = correct from zero-shot). */
  needs: string | null;
  /** Becomes wrong while the mislabeled example is in the prompt. */
  brokenByBad?: boolean;
}

const TESTS: TestCase[] = [
  { id: 't1', text: 'I want my money back for this order.', truth: 'refund', needs: null },
  { id: 't2', text: 'App shows a white screen after login.', truth: 'bug', needs: null },
  { id: 't3', text: 'Please refund the duplicate charge from Tuesday.', truth: 'refund', needs: 'ex-refund', brokenByBad: true },
  { id: 't4', text: 'Uploading a photo makes it freeze — twice today.', truth: 'bug', needs: 'ex-bug' },
  { id: 't5', text: 'What is the price for an enterprise license?', truth: 'sales', needs: 'ex-sales' },
  { id: 't6', text: 'Charged but the order never appeared. Money back please.', truth: 'refund', needs: 'ex-refund', brokenByBad: true },
];

const wrongLabel = (truth: Label): Label => (truth === 'refund' ? 'sales' : truth === 'bug' ? 'refund' : 'bug');

const FewShotWidget: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => {
  const [added, setAdded] = useState<string[]>([]);

  const hasBad = added.includes('ex-bad');
  const results = useMemo(
    () => TESTS.map((t) => {
      const gotExample = t.needs === null || added.includes(t.needs);
      const broken = hasBad && t.brokenByBad;
      const correct = gotExample && !broken;
      return { ...t, correct, predicted: correct ? t.truth : broken ? 'sales' as Label : wrongLabel(t.truth) };
    }),
    [added, hasBad],
  );
  const score = results.filter((r) => r.correct).length;

  useEffect(() => {
    if (score === TESTS.length && !completed) onComplete();
  }, [score, completed, onComplete]);

  const toggle = (id: string) => {
    setAdded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">
          <GraduationCap size={13} /> Few-shot trainer
        </p>
        <motion.span
          key={score}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold tabular-nums ${score === TESTS.length
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
            : 'bg-[var(--cv-action-soft-bg,rgba(99,91,213,0.1))] text-[var(--cv-action-primary)]'}`}
        >
          Accuracy {score}/{TESTS.length}
        </motion.span>
      </div>

      <p className="mt-2 text-[11px] font-medium text-[var(--cv-text-muted)]">
        Task: classify support emails as <b>refund</b>, <b>bug</b>, or <b>sales</b>. Add examples to the prompt and watch the test set below.
      </p>

      {/* Example bank */}
      <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {EXAMPLES.map((example) => {
          const on = added.includes(example.id);
          return (
            <button
              key={example.id}
              onClick={() => toggle(example.id)}
              className={`rounded-xl border p-2.5 text-left font-mono text-[11px] leading-relaxed transition-all hover:-translate-y-0.5 ${on
                ? example.mislabeled
                  ? 'border-rose-400 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'border-[var(--cv-action-border)] bg-[var(--cv-action-soft-bg,rgba(99,91,213,0.08))] text-[var(--cv-text-heading)]'
                : 'border-dashed border-[var(--cv-border-warm)] text-[var(--cv-text-body)] opacity-80'}`}
            >
              <span className="font-sans text-[10px] font-extrabold uppercase tracking-wide">
                {on ? '✓ In prompt' : '+ Add example'}
              </span>
              <br />
              {example.text}
            </button>
          );
        })}
      </div>

      {/* Test set */}
      <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-[var(--cv-text-muted)]">Live test set</p>
      <div className="mt-1.5 grid gap-1">
        {results.map((r) => (
          <motion.div
            key={r.id}
            layout
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium ${r.correct
              ? 'border-emerald-300/50 bg-emerald-50/60 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'border-rose-300/50 bg-rose-50/60 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300'}`}
          >
            {r.correct ? <CheckCircle2 size={13} className="shrink-0" /> : <XCircle size={13} className="shrink-0" />}
            <span className="min-w-0 flex-1 truncate">"{r.text}"</span>
            <AnimatePresence mode="wait">
              <motion.code key={r.predicted} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="shrink-0 font-bold">
                → {r.predicted}
              </motion.code>
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <p className="mt-3 text-[11px] font-medium text-[var(--cv-text-muted)]">
        {score === TESTS.length || completed
          ? '✓ Lesson complete! Good examples teach the pattern; one mislabeled example poisons it. Real few-shot prompting is exactly this sensitive — curate your examples like test data.'
          : hasBad
            ? 'Accuracy dropped! One of your examples is mislabeled — a payment failure is a refund issue, not sales. Remove it.'
            : 'Add the three good examples to hit 6/6 — and try the fourth one to see what a bad example does.'}
      </p>
    </div>
  );
};

export default FewShotWidget;
