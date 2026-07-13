import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Thermometer } from 'lucide-react';
import type { CourseWidgetProps } from './types';

/**
 * Temperature playground — a slider reshapes a next-token probability
 * distribution in real time, and sample completions get wilder as the
 * temperature rises. Completes once the learner has explored both a low
 * (≤0.2) and a high (≥1.2) temperature.
 */

const BASE_LOGITS: { token: string; logit: number }[] = [
  { token: 'projects', logit: 3.2 },
  { token: 'practice', logit: 2.6 },
  { token: 'courses', logit: 2.1 },
  { token: 'curiosity', logit: 1.4 },
  { token: 'coffee', logit: 0.6 },
  { token: 'pigeons', logit: -0.4 },
];

const SAMPLES: { max: number; text: string; label: string }[] = [
  { max: 0.35, text: 'The best way to learn AI is projects. Build real projects.', label: 'Focused & repeatable — great for extraction, code, facts' },
  { max: 0.8, text: 'The best way to learn AI is practice: small projects, honest evals, steady iteration.', label: 'Balanced — good default for most tasks' },
  { max: 1.15, text: 'The best way to learn AI is curiosity — chase weird ideas, break things, compare notes.', label: 'Creative — brainstorms, naming, marketing copy' },
  { max: Infinity, text: 'The best way to learn AI is pigeons?! Teach a flock backprop and let chaos evaluate you.', label: 'Chaotic — fun, but rarely what production wants' },
];

const softmax = (logits: number[], temperature: number): number[] => {
  const t = Math.max(temperature, 0.05);
  const scaled = logits.map((l) => l / t);
  const max = Math.max(...scaled);
  const exps = scaled.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
};

const TemperatureWidget: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => {
  const [temperature, setTemperature] = useState(0.7);
  const [sawLow, setSawLow] = useState(false);
  const [sawHigh, setSawHigh] = useState(false);

  useEffect(() => {
    if (temperature <= 0.2) setSawLow(true);
    if (temperature >= 1.2) setSawHigh(true);
  }, [temperature]);

  useEffect(() => {
    if (sawLow && sawHigh && !completed) onComplete();
  }, [sawLow, sawHigh, completed, onComplete]);

  const probs = useMemo(() => softmax(BASE_LOGITS.map((b) => b.logit), temperature), [temperature]);
  const sample = SAMPLES.find((s) => temperature <= s.max) ?? SAMPLES[SAMPLES.length - 1];

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">
        <Thermometer size={13} /> Temperature playground
      </p>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-[11px] font-bold text-[var(--cv-text-muted)]">0.0</span>
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.05}
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          className="h-2 flex-1 cursor-pointer accent-[var(--cv-action-primary)]"
          aria-label="Temperature"
        />
        <span className="text-[11px] font-bold text-[var(--cv-text-muted)]">1.5</span>
        <span className="w-12 rounded-lg bg-[var(--cv-action-soft-bg,rgba(99,91,213,0.1))] px-2 py-1 text-center text-sm font-extrabold tabular-nums text-[var(--cv-action-primary)]">
          {temperature.toFixed(2)}
        </span>
      </div>

      <p className="mt-2 text-[11px] font-medium text-[var(--cv-text-muted)]">
        Prompt: <code className="font-bold">"The best way to learn AI is ___"</code> — the bars show how likely each next token is at this temperature.
      </p>

      {/* Distribution */}
      <div className="mt-3 grid gap-1.5">
        {BASE_LOGITS.map((item, i) => (
          <div key={item.token} className="flex items-center gap-2">
            <code className="w-24 shrink-0 text-right text-[12px] font-bold text-[var(--cv-text-heading)]">{item.token}</code>
            <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.05))]">
              <motion.div
                animate={{ width: `${probs[i] * 100}%` }}
                transition={{ type: 'spring', stiffness: 160, damping: 24 }}
                className="h-full rounded-md bg-gradient-to-r from-[var(--cv-action-primary)] to-[#8b7ff0]"
              />
            </div>
            <span className="w-11 shrink-0 text-[11px] font-bold tabular-nums text-[var(--cv-text-muted)]">
              {(probs[i] * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {/* Sample completion */}
      <motion.div
        key={sample.text}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-xl bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.04))] p-3"
      >
        <p className="font-mono text-[13px] leading-relaxed text-[var(--cv-text-heading)]">{sample.text}</p>
        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--cv-text-muted)]">{sample.label}</p>
      </motion.div>

      {/* Progress hint */}
      <div className="mt-3 flex items-center gap-3 text-[11px] font-bold">
        <span className={sawLow ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--cv-text-muted)]'}>
          {sawLow ? '✓' : '○'} Try ≤ 0.2 (deterministic)
        </span>
        <span className={sawHigh ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--cv-text-muted)]'}>
          {sawHigh ? '✓' : '○'} Try ≥ 1.2 (chaotic)
        </span>
        {sawLow && sawHigh && <span className="ml-auto text-emerald-600 dark:text-emerald-400">Lesson complete!</span>}
      </div>
    </div>
  );
};

export default TemperatureWidget;
