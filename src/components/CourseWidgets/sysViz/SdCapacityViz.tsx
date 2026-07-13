import React from 'react';
import { motion } from 'framer-motion';
import { Calculator, ArrowDown } from 'lucide-react';
import type { CourseWidgetProps } from '../types';
import StepPlayerShell from '../algoViz/StepPlayerShell';

/**
 * Napkin-math cascade — capacity estimation as an animated calculation chain.
 * Each step reveals one line of arithmetic; by the end the learner has QPS,
 * peak QPS, daily storage, and yearly storage from four honest assumptions.
 */

interface Row { formula: string; result: string; note: string; tone: 'blue' | 'green' | 'amber' }

const ROWS: Row[] = [
  { formula: '1,000,000 DAU × 12 actions/day', result: '12M requests/day', note: 'Assumption #1 — say it out loud: "I\'ll assume 12 actions per user per day."', tone: 'blue' },
  { formula: '12,000,000 ÷ 86,400 s', result: '≈ 140 QPS average', note: '86,400 seconds per day. Round aggressively — 100k s/day is fine on a whiteboard.', tone: 'blue' },
  { formula: '140 QPS × 4 (peak factor)', result: '≈ 560 QPS peak', note: 'Assumption #2 — traffic is never flat. Peak/average of 3–5× is a standard multiplier.', tone: 'amber' },
  { formula: '12M writes × 20% × 1 KB', result: '≈ 2.4 GB/day new data', note: 'Assumption #3 — read:write 80:20, ~1 KB per durable record. Caches & indexes grow separately.', tone: 'green' },
  { formula: '2.4 GB × 365 × 3 replicas', result: '≈ 2.6 TB/year', note: 'Assumption #4 — replication factor 3. Now you can size the fleet AND justify sharding later.', tone: 'green' },
];

const TONE = {
  blue: { border: '#5f8fd9', bg: '#ecf4fd', text: '#1861a8' },
  green: { border: '#15803d', bg: '#eef9f2', text: '#15803d' },
  amber: { border: '#e8a33d', bg: '#fdf3d7', text: '#a35410' },
};

const captions = [
  'Capacity estimation = a chain of small, honest multiplications. Interviewers grade the stated assumptions, not decimal precision.',
  ...ROWS.map((r) => r.note),
];

const SdCapacityViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={Calculator}
    title="Back-of-envelope · from DAU to terabytes"
    totalSteps={ROWS.length + 1}
    nextLabel="Next calculation"
    captions={captions}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Lesson complete! Four assumptions → QPS, peak QPS, daily and yearly storage. This exact cascade works for URL shorteners, feeds, and chat alike."
    todoText="Reveal the calculation chain line by line. Predict each result before you click."
  >
    {(step) => (
      <div className="mx-auto flex max-w-md flex-col items-center gap-1">
        {ROWS.map((row, i) => {
          const revealed = step >= i + 1;
          const isNew = step === i + 1;
          const tone = TONE[row.tone];
          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <ArrowDown size={14} className="text-[var(--cv-text-muted)]" style={{ opacity: revealed ? 1 : 0.15 }} />
              )}
              <motion.div
                animate={{ opacity: revealed ? 1 : 0.15, scale: isNew ? [0.95, 1.02, 1] : 1 }}
                transition={{ duration: 0.35 }}
                className="flex w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-2.5"
                style={{ borderColor: revealed ? tone.border : 'var(--cv-border-warm)', backgroundColor: revealed ? tone.bg : 'transparent' }}
              >
                <span className={`font-mono text-xs font-bold ${revealed ? '' : 'text-[var(--cv-text-muted)]'}`} style={revealed ? { color: 'var(--cv-text-heading)' } : undefined}>
                  {row.formula}
                </span>
                <span className="shrink-0 font-mono text-sm font-black" style={{ color: revealed ? tone.text : 'transparent' }}>
                  {row.result}
                </span>
              </motion.div>
            </React.Fragment>
          );
        })}
      </div>
    )}
  </StepPlayerShell>
);

export default SdCapacityViz;
