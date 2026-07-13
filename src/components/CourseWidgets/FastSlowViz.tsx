import React from 'react';
import { motion } from 'framer-motion';
import { Rabbit } from 'lucide-react';
import type { CourseWidgetProps } from './types';
import StepPlayerShell from './algoViz/StepPlayerShell';

/**
 * Fast & slow pointers animation — Floyd's cycle detection on a linked list
 * with a loop. The tortoise moves 1, the hare moves 2; if there's a cycle
 * they MUST meet. Watch it happen.
 */

// List: 0→1→2→3→4→5→6→7→3 (7 links back to 3).
const NEXT = [1, 2, 3, 4, 5, 6, 7, 3];
const POS: { x: number; y: number }[] = [
  { x: 32, y: 110 }, { x: 84, y: 110 }, { x: 136, y: 110 },   // tail
  { x: 188, y: 110 }, { x: 226, y: 50 }, { x: 296, y: 72 },   // cycle
  { x: 296, y: 148 }, { x: 226, y: 170 },
];

interface Step { slow: number; fast: number }

const buildSteps = (): Step[] => {
  const steps: Step[] = [{ slow: 0, fast: 0 }];
  let slow = 0;
  let fast = 0;
  do {
    slow = NEXT[slow];
    fast = NEXT[NEXT[fast]];
    steps.push({ slow, fast });
  } while (slow !== fast);
  return steps;
};

const STEPS = buildSteps();

const captions = STEPS.map(({ slow, fast }, i) => {
  if (i === 0) return 'Both pointers start at the head. Slow 🐢 moves 1 node per step, fast 🐇 moves 2.';
  if (slow === fast) return `They meet at node ${slow}! Inside a cycle the hare gains exactly 1 node per step on the tortoise, so a meeting is inevitable — cycle detected in O(1) extra space.`;
  return `Step ${i}: slow → node ${slow}, fast → node ${fast}. The fast pointer is already ${i} nodes ahead — if there were NO cycle it would simply hit null and we'd return false.`;
});

const FastSlowViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={Rabbit}
    title="Fast & slow pointers · Floyd's cycle detection"
    totalSteps={STEPS.length}
    nextLabel="Advance both"
    captions={captions}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Lesson complete! Two speeds, no extra memory — the same trick finds a list's middle node, detects Happy Number loops, and locates the duplicate in Find the Duplicate Number."
    todoText="Advance the pointers until the hare catches the tortoise inside the loop."
    legend={
      <>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-[#15803d] bg-[#eef9f2] align-middle" /> slow (+1)</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-[#5f8fd9] bg-[#ecf4fd] align-middle" /> fast (+2)</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-[#e8a33d] bg-[#fdf3d7] align-middle" /> meeting point</span>
      </>
    }
  >
    {(step) => {
      const { slow, fast } = STEPS[step];
      const met = slow === fast && step > 0;
      return (
        <div className="flex justify-center">
          <svg viewBox="0 0 340 210" className="w-full max-w-md" role="img" aria-label="Linked list with a cycle">
            <defs>
              <marker id="fs-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" className="fill-[var(--cv-text-muted)]" />
              </marker>
            </defs>
            {NEXT.map((to, from) => {
              const a = POS[from];
              const b = POS[to];
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const len = Math.hypot(dx, dy);
              const trim = 16 / len;
              const isBackEdge = from === 7;
              return (
                <line
                  key={from}
                  x1={a.x + dx * trim}
                  y1={a.y + dy * trim}
                  x2={b.x - dx * trim}
                  y2={b.y - dy * trim}
                  strokeWidth={2}
                  strokeDasharray={isBackEdge ? '5 4' : undefined}
                  className={isBackEdge ? 'stroke-[#b03a54]' : 'stroke-[var(--cv-border-warm)]'}
                  markerEnd="url(#fs-arrow)"
                />
              );
            })}
            {POS.map((p, i) => {
              const isSlow = i === slow;
              const isFast = i === fast;
              const cls = met && isSlow
                ? 'fill-[#fdf3d7] stroke-[#e8a33d]'
                : isSlow
                  ? 'fill-[#eef9f2] stroke-[#15803d]'
                  : isFast
                    ? 'fill-[#ecf4fd] stroke-[#5f8fd9]'
                    : 'fill-[var(--cv-surface-warm-card,#fff)] stroke-[var(--cv-text-muted)]';
              return (
                <g key={i}>
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    r={14}
                    strokeWidth={2.5}
                    className={cls}
                    animate={{ scale: isSlow || isFast ? [1, 1.15, 1] : 1 }}
                    transition={{ duration: 0.4 }}
                  />
                  <text x={p.x} y={p.y + 4} textAnchor="middle" className="fill-[var(--cv-text-heading)] font-mono text-[11px] font-bold">{i}</text>
                  {isSlow && <text x={p.x} y={p.y - 20} textAnchor="middle" fontSize="13">🐢</text>}
                  {isFast && <text x={p.x + (isSlow ? 18 : 0)} y={p.y - 20} textAnchor="middle" fontSize="13">🐇</text>}
                </g>
              );
            })}
            <text x={226} y={116} textAnchor="middle" className="fill-[var(--cv-text-muted)] text-[9px] font-bold uppercase">cycle</text>
          </svg>
        </div>
      );
    }}
  </StepPlayerShell>
);

export default FastSlowViz;
