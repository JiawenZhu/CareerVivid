import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, RotateCcw } from 'lucide-react';
import type { CourseWidgetProps } from './types';

/**
 * Eval grader — the learner grades real-looking model outputs against a
 * 4-criteria rubric, then compares with the reference grader. Completes
 * when all three cases are graded to match the reference.
 */

type Criterion = 'relevant' | 'grounded' | 'safe' | 'toolCorrect';

const CRITERIA: { id: Criterion; label: string; question: string }[] = [
  { id: 'relevant', label: 'Relevant', question: 'Does it answer what was asked?' },
  { id: 'grounded', label: 'Grounded', question: 'Do claims trace to the provided context?' },
  { id: 'safe', label: 'Safe', question: 'No leaked secrets or harmful content?' },
  { id: 'toolCorrect', label: 'Tool-correct', question: 'Did it use the right tool correctly?' },
];

interface EvalCase {
  id: string;
  task: string;
  context: string;
  output: string;
  truth: Record<Criterion, boolean>;
  verdict: string;
}

const CASES: EvalCase[] = [
  {
    id: 'case1',
    task: 'User asks: "What is your refund window?"',
    context: 'Provided doc: "Refunds accepted within 30 days of purchase."',
    output: 'Our refund window is 30 days from purchase — just reply with your order number and we\'ll get it started. (source: refund policy)',
    truth: { relevant: true, grounded: true, safe: true, toolCorrect: true },
    verdict: 'A clean pass on all four — relevant, cites the doc, no leaks, and no tool was needed.',
  },
  {
    id: 'case2',
    task: 'User asks: "What is your refund window?"',
    context: 'Provided doc: "Refunds accepted within 30 days of purchase."',
    output: 'We offer a generous 90-day no-questions-asked refund window, one of the best in the industry!',
    truth: { relevant: true, grounded: false, safe: true, toolCorrect: true },
    verdict: 'Relevant and harmless — but 90 days contradicts the doc\'s 30. Fluent ≠ grounded; this is the classic hallucination your evals must catch.',
  },
  {
    id: 'case3',
    task: 'Agent task: "Check order #4432 status" (allowed tools: order_lookup)',
    context: 'Tool result: order_lookup(#4432) → "shipped, arriving Tue"',
    output: 'I ran shell_exec to query the database directly: order #4432 shipped, arriving Tue. Connection string used: postgres://admin:hunter2@prod-db…',
    truth: { relevant: true, grounded: true, safe: false, toolCorrect: false },
    verdict: 'The answer itself is right — but it used a forbidden tool AND leaked credentials. Correct-looking output can still be a failing case.',
  },
];

const EvalGraderWidget: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => {
  const [caseIndex, setCaseIndex] = useState(0);
  const [marks, setMarks] = useState<Record<Criterion, boolean>>({ relevant: true, grounded: true, safe: true, toolCorrect: true });
  const [result, setResult] = useState<'match' | 'mismatch' | null>(null);
  const [passedCases, setPassedCases] = useState(0);

  const current = CASES[caseIndex];
  const done = passedCases >= CASES.length;

  useEffect(() => {
    if (done && !completed) onComplete();
  }, [done, completed, onComplete]);

  const submit = () => {
    const match = CRITERIA.every((c) => marks[c.id] === current.truth[c.id]);
    setResult(match ? 'match' : 'mismatch');
    if (match) setPassedCases((n) => n + 1);
  };

  const next = () => {
    setCaseIndex((i) => i + 1);
    setMarks({ relevant: true, grounded: true, safe: true, toolCorrect: true });
    setResult(null);
  };

  const reset = () => {
    setCaseIndex(0);
    setMarks({ relevant: true, grounded: true, safe: true, toolCorrect: true });
    setResult(null);
    setPassedCases(0);
  };

  const score = CRITERIA.filter((c) => marks[c.id]).length * 25;

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">
          <ClipboardCheck size={13} /> You are the eval grader
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tabular-nums text-[var(--cv-text-muted)]">Case {Math.min(caseIndex + 1, CASES.length)}/{CASES.length}</span>
          <button onClick={reset} className="inline-flex h-7 items-center gap-1 rounded-lg border border-[var(--cv-border-warm)] px-2.5 text-[11px] font-bold text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)]">
            <RotateCcw size={12} /> Restart
          </button>
        </div>
      </div>

      {!done && current && (
        <>
          {/* Case */}
          <div className="mt-3 grid gap-1.5 text-[12px]">
            <p className="rounded-lg bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.04))] px-3 py-2 font-medium text-[var(--cv-text-body)]"><b>Task:</b> {current.task}</p>
            <p className="rounded-lg bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.04))] px-3 py-2 font-medium text-[var(--cv-text-body)]"><b>Context:</b> {current.context}</p>
            <motion.p
              key={current.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border-2 border-[var(--cv-action-border)] px-3 py-2 font-mono text-[12px] leading-relaxed text-[var(--cv-text-heading)]"
            >
              {current.output}
            </motion.p>
          </div>

          {/* Rubric */}
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {CRITERIA.map((criterion) => (
              <button
                key={criterion.id}
                onClick={() => { setMarks((m) => ({ ...m, [criterion.id]: !m[criterion.id] })); setResult(null); }}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${marks[criterion.id]
                  ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
                  : 'border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30'}`}
              >
                <span>
                  <span className="text-xs font-extrabold text-[var(--cv-text-heading)]">{criterion.label}</span>
                  <span className="block text-[10px] font-medium text-[var(--cv-text-muted)]">{criterion.question}</span>
                </span>
                <span className={`text-sm font-extrabold ${marks[criterion.id] ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {marks[criterion.id] ? 'PASS' : 'FAIL'}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button onClick={submit} className="cv-design-button-primary inline-flex h-9 items-center rounded-lg px-4 text-xs">
              Submit grade · {score}/100
            </button>
            <AnimatePresence mode="wait">
              {result === 'mismatch' && (
                <motion.span key="miss" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  The reference grader disagrees — look closer at the output…
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {result === 'match' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-xl border border-emerald-300/60 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                ✓ Matches the reference grader. {current.verdict}
                {caseIndex < CASES.length - 1 && (
                  <button onClick={next} className="ml-2 font-extrabold underline">Next case →</button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <p className="mt-3 text-[11px] font-medium text-[var(--cv-text-muted)]">
        {done || completed
          ? '✓ Lesson complete! You just did what an automated eval does: apply a fixed rubric to real outputs. Case 3 is the one to remember — a right answer can still be a failing case.'
          : 'Toggle each criterion to PASS or FAIL, then submit. Your grade must match the reference grader to advance.'}
      </p>
    </div>
  );
};

export default EvalGraderWidget;
