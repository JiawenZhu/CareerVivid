import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, CheckCircle2 } from 'lucide-react';
import type { CourseWidgetProps } from '../types';
import { CAPACITY_QUICKFIRE } from '../../../lib/systemDesignQuestionBank';

/**
 * Capacity quick-fire — six napkin-math drills with tolerance grading.
 * Trains the conversions (per-day → per-second, bits → bytes, records × size)
 * that interviews expect on autopilot.
 */

const parseNum = (raw: string): number => Number(raw.replace(/[,\s]/g, ''));

const CapacityQuizWidget: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => {
  const [inputs, setInputs] = useState<string[]>(CAPACITY_QUICKFIRE.map(() => ''));
  const [checked, setChecked] = useState<boolean[]>(CAPACITY_QUICKFIRE.map(() => false));
  const [correct, setCorrect] = useState<boolean[]>(CAPACITY_QUICKFIRE.map(() => false));
  const solvedCount = correct.filter(Boolean).length;
  const allSolved = solvedCount === CAPACITY_QUICKFIRE.length;

  const check = (idx: number) => {
    const q = CAPACITY_QUICKFIRE[idx];
    const value = parseNum(inputs[idx]);
    const ok = Number.isFinite(value) && Math.abs(value - q.answer) <= Math.abs(q.answer) * q.tolerance;
    setChecked((prev) => prev.map((c, i) => (i === idx ? true : c)));
    setCorrect((prev) => {
      const next = prev.map((c, i) => (i === idx ? ok : c));
      if (next.every(Boolean) && !completed) onComplete();
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">
          <Calculator size={13} /> Capacity quick-fire · napkin math on autopilot
        </p>
        <span className="text-[11px] font-bold tabular-nums text-[var(--cv-text-muted)]">{solvedCount}/{CAPACITY_QUICKFIRE.length} solved</span>
      </div>

      <div className="mt-4 grid gap-2.5">
        {CAPACITY_QUICKFIRE.map((q, i) => (
          <div key={i} className={`rounded-xl border-2 p-3 transition-colors ${correct[i] ? 'border-[#b9e3c8] bg-[#eef9f2]/50' : 'border-[var(--cv-border-warm)]'}`}>
            <p className="text-sm font-bold text-[var(--cv-text-heading)]">
              {correct[i] && <CheckCircle2 size={14} className="mr-1 inline text-[#15803d]" />}
              {q.prompt}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={inputs[i]}
                onChange={(e) => setInputs((prev) => prev.map((v, vi) => (vi === i ? e.target.value : v)))}
                onKeyDown={(e) => { if (e.key === 'Enter' && inputs[i].trim()) check(i); }}
                disabled={correct[i]}
                placeholder="estimate"
                className="h-9 w-32 rounded-lg border-2 border-[var(--cv-border-warm)] bg-transparent px-3 font-mono text-sm font-bold text-[var(--cv-text-heading)] outline-none focus:border-[var(--cv-action-primary)] disabled:opacity-60"
              />
              <span className="text-xs font-bold text-[var(--cv-text-muted)]">{q.unit}</span>
              {!correct[i] && (
                <button type="button" onClick={() => check(i)} disabled={!inputs[i].trim()} className="cv-design-button-primary h-9 rounded-lg px-3 text-xs disabled:opacity-40">
                  Check
                </button>
              )}
              {checked[i] && !correct[i] && <span className="text-xs font-black text-[#b03a54]">✗ off — try again</span>}
            </div>
            {checked[i] && (
              <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`mt-2 rounded-lg px-3 py-2 font-mono text-[11px] font-semibold leading-5 ${correct[i] ? 'bg-[#eef9f2] text-[#15803d]' : 'bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.04))] text-[var(--cv-text-body)]'}`}>
                {q.working}
              </motion.p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-[11px] font-medium text-[var(--cv-text-muted)]">
        {allSolved || completed
          ? '✓ Lesson complete! 86,400 s/day, ÷8 for bits→bytes, ×4 for peak — these conversions should now be reflex.'
          : 'Answers within tolerance count — interviews grade the method, not the decimals.'}
      </p>
    </div>
  );
};

export default CapacityQuizWidget;
