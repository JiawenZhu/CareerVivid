import React from 'react';
import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';
import type { CourseWidgetProps } from '../types';
import StepPlayerShell from '../algoViz/StepPlayerShell';

/**
 * The 45-minute interview clock — the framework animation. Five phases with
 * explicit time budgets light up in order; the takeaway is that great answers
 * are paced, not improvised.
 */

const PHASES = [
  { id: 'clarify', label: 'Clarify requirements', minutes: 7, color: '#5f8fd9', items: ['Users & core actions', 'Scale: DAU, peak, growth', 'Consistency & latency targets', 'What is OUT of scope'] },
  { id: 'estimate', label: 'Back-of-envelope', minutes: 5, color: '#8f7ad9', items: ['QPS (avg → ×4 peak)', 'Storage per day / year', 'Bandwidth & memory', 'Say assumptions OUT LOUD'] },
  { id: 'highlevel', label: 'High-level design', minutes: 13, color: '#15803d', items: ['Draw client → LB → API → store', 'One responsibility per box', 'Walk one request end-to-end', 'Get interviewer buy-in'] },
  { id: 'deepdive', label: 'Deep dives', minutes: 14, color: '#e8a33d', items: ['Interviewer picks the hot spot', 'Trade-offs, not name-drops', 'Handle the failure follow-up', 'Bottleneck → fix → new bottleneck'] },
  { id: 'wrap', label: 'Wrap up', minutes: 6, color: '#b03a54', items: ['Recap requirements → design fit', 'Known limitations', 'What you would do with more time'] },
];
const TOTAL_MIN = PHASES.reduce((t, p) => t + p.minutes, 0);

const captions = [
  'A system design interview is a 45-minute budget. Winging it means running out of clock mid-design — pace it in five phases.',
  ...PHASES.map((p, i) => {
    const elapsed = PHASES.slice(0, i + 1).reduce((t, x) => t + x.minutes, 0);
    return `${p.label} (~${p.minutes} min, ${elapsed}/${TOTAL_MIN} used): ${p.items[0]} — never skip this phase to "save time".`;
  }),
];

const SdTimelineViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={Timer}
    title="The 45-minute interview clock"
    totalSteps={PHASES.length + 1}
    nextLabel="Next phase"
    captions={captions}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Lesson complete! Clarify → estimate → high-level → deep dive → wrap. Interviewers grade the PROCESS as much as the boxes."
    todoText="Step through all five phases of the interview clock."
  >
    {(step) => {
      const activeIdx = step - 1; // step 0 = overview
      return (
        <div className="mx-auto max-w-xl">
          {/* Clock bar */}
          <div className="flex h-9 w-full overflow-hidden rounded-full border border-[var(--cv-border-warm)]">
            {PHASES.map((p, i) => {
              const on = step === 0 || i <= activeIdx;
              return (
                <motion.div
                  key={p.id}
                  animate={{ opacity: on ? 1 : 0.18, scale: i === activeIdx ? 1.02 : 1 }}
                  className="flex items-center justify-center text-[10px] font-extrabold text-white"
                  style={{ width: `${(p.minutes / TOTAL_MIN) * 100}%`, backgroundColor: p.color }}
                >
                  {p.minutes}′
                </motion.div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-[10px] font-bold text-[var(--cv-text-muted)]">
            <span>0:00</span><span>45:00</span>
          </div>

          {/* Phase cards */}
          <div className="mt-4 grid gap-2 sm:grid-cols-5">
            {PHASES.map((p, i) => {
              const isActive = i === activeIdx;
              const isDone = activeIdx > i;
              return (
                <motion.div
                  key={p.id}
                  animate={{ opacity: step === 0 || isActive || isDone ? 1 : 0.35, y: isActive ? -3 : 0 }}
                  className="rounded-xl border-2 p-2.5"
                  style={{ borderColor: isActive ? p.color : 'var(--cv-border-warm)', backgroundColor: isActive ? `${p.color}14` : 'transparent' }}
                >
                  <p className="text-[10px] font-extrabold uppercase leading-tight" style={{ color: p.color }}>{p.label}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-[var(--cv-text-muted)]">~{p.minutes} min</p>
                  {isActive && (
                    <ul className="mt-1.5 space-y-1">
                      {p.items.map((item) => (
                        <motion.li key={item} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-semibold leading-snug text-[var(--cv-text-body)]">
                          • {item}
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      );
    }}
  </StepPlayerShell>
);

export default SdTimelineViz;
