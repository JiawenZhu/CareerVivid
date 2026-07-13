import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, GitBranch, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CourseWidgetProps } from './types';

/**
 * Backtracking animation — explore ↓, dead-end, backtrack ↑, try the next
 * branch, find the solution. A scripted walk over a small decision tree with
 * the same color language as the classic diagram: green = exploring,
 * blue dashed = backtracking, orange = solution path.
 */

type NodeState = 'idle' | 'exploring' | 'backtracked' | 'solution';

/** Fixed tree: root → A,B,C; each has two leaves. Positions in a 320x210 box. */
const TREE = {
  root: { x: 160, y: 24 },
  children: [
    { id: 'A', x: 60, y: 100, leaves: [{ id: 'A1', x: 28, y: 180 }, { id: 'A2', x: 92, y: 180 }] },
    { id: 'B', x: 160, y: 100, leaves: [{ id: 'B1', x: 128, y: 180 }, { id: 'B2', x: 192, y: 180 }] },
    { id: 'C', x: 260, y: 100, leaves: [{ id: 'C1', x: 228, y: 180 }, { id: 'C2', x: 292, y: 180 }] },
  ],
};

interface Step {
  caption: string;
  states: Record<string, NodeState>;
  backtrackEdge?: string; // 'A' | 'B' — draw dashed return arrow from this child to root
}

const STEPS: Step[] = [
  { caption: 'Start at the root. Three choices — try the first branch.', states: {} },
  { caption: 'Choose branch A and explore down (green).', states: { A: 'exploring' } },
  { caption: 'Go deeper: A → A1. Check it… not a valid solution.', states: { A: 'exploring', A1: 'exploring' } },
  { caption: 'Dead end. UNDO the last choice and step back up — that\'s the "backtrack".', states: { A: 'exploring', A1: 'backtracked' } },
  { caption: 'A2 also fails. Branch A is exhausted — backtrack to the root (blue dashed).', states: { A: 'backtracked', A1: 'backtracked', A2: 'backtracked' }, backtrackEdge: 'A' },
  { caption: 'Try branch B. Explore B → B1… fails. Backtrack again.', states: { A: 'backtracked', A1: 'backtracked', A2: 'backtracked', B: 'backtracked', B1: 'backtracked' }, backtrackEdge: 'B' },
  { caption: 'Try branch C and explore down.', states: { A: 'backtracked', A1: 'backtracked', A2: 'backtracked', B: 'backtracked', B1: 'backtracked', C: 'exploring' } },
  { caption: '✓ C → C2 satisfies the constraints — solution found (orange path)!', states: { A: 'backtracked', A1: 'backtracked', A2: 'backtracked', B: 'backtracked', B1: 'backtracked', C: 'solution', C2: 'solution' } },
];

const nodeClass = (state: NodeState): string => {
  switch (state) {
    case 'exploring': return 'fill-[#eef9f2] stroke-[#15803d]';
    case 'backtracked': return 'fill-[#ecf4fd] stroke-[#5f8fd9]';
    case 'solution': return 'fill-[#fdf3d7] stroke-[#e8a33d]';
    default: return 'fill-[var(--cv-surface-warm-card,#fff)] stroke-[var(--cv-text-muted,#888)]';
  }
};

const BacktrackingViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => {
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

  const stateOf = (id: string): NodeState => current.states[id] ?? 'idle';
  const edgeClass = (childState: NodeState) =>
    childState === 'exploring' ? 'stroke-[#15803d]' : childState === 'solution' ? 'stroke-[#e8a33d]' : 'stroke-[var(--cv-border-warm,#ddd)]';

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">
          <GitBranch size={13} /> Backtracking · explore, undo, try the next branch
        </p>
        <span className="text-[11px] font-bold tabular-nums text-[var(--cv-text-muted)]">
          {t('courses.step_counter', { index: step + 1, total: STEPS.length, defaultValue: 'Step {{index}} / {{total}}' })}
        </span>
      </div>

      {/* Decision tree */}
      <div className="mt-4 flex justify-center">
        <svg viewBox="0 0 320 210" className="w-full max-w-md" role="img" aria-label="Backtracking decision tree">
          {/* Edges root→children and children→leaves */}
          {TREE.children.map((child) => (
            <g key={child.id}>
              <line x1={TREE.root.x} y1={TREE.root.y + 14} x2={child.x} y2={child.y - 14} strokeWidth={2} className={edgeClass(stateOf(child.id))} />
              {child.leaves.map((leaf) => (
                <line key={leaf.id} x1={child.x} y1={child.y + 14} x2={leaf.x} y2={leaf.y - 12} strokeWidth={2} className={edgeClass(stateOf(leaf.id))} />
              ))}
            </g>
          ))}

          {/* Backtrack dashed arrow */}
          {current.backtrackEdge && (() => {
            const child = TREE.children.find((c) => c.id === current.backtrackEdge)!;
            return (
              <motion.path
                key={`bt-${step}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7 }}
                d={`M ${child.x + 14} ${child.y - 8} Q ${(child.x + TREE.root.x) / 2 + 34} ${(child.y + TREE.root.y) / 2}, ${TREE.root.x + 12} ${TREE.root.y + 16}`}
                fill="none"
                strokeWidth={2.5}
                strokeDasharray="6 5"
                className="stroke-[#5f8fd9]"
                markerEnd="url(#bt-arrow)"
              />
            );
          })()}
          <defs>
            <marker id="bt-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" className="fill-[#5f8fd9]" />
            </marker>
          </defs>

          {/* Nodes */}
          {[{ id: 'root', x: TREE.root.x, y: TREE.root.y },
            ...TREE.children.map((c) => ({ id: c.id, x: c.x, y: c.y })),
            ...TREE.children.flatMap((c) => c.leaves.map((l) => ({ id: l.id, x: l.x, y: l.y })))].map((node) => {
            const state = node.id === 'root' ? (step > 0 ? 'exploring' : 'idle') : stateOf(node.id);
            return (
              <motion.circle
                key={node.id}
                cx={node.x}
                cy={node.y}
                r={13}
                strokeWidth={2.5}
                className={nodeClass(state as NodeState)}
                animate={{ scale: state === 'exploring' || state === 'solution' ? [1, 1.15, 1] : 1 }}
                transition={{ duration: 0.5 }}
              />
            );
          })}
        </svg>
      </div>

      {/* Caption */}
      <motion.p
        key={step}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-2 max-w-lg rounded-xl bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.04))] px-4 py-2.5 text-center text-sm font-semibold text-[var(--cv-text-heading)]"
      >
        {current.caption}
      </motion.p>

      {/* Legend — mirrors the classic diagram */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold text-[var(--cv-text-body)]">
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-[#15803d] bg-[#eef9f2] align-middle" /> explore / go deeper</span>
        <span><span className="mr-1.5 inline-block h-0.5 w-5 border-t-2 border-dashed border-[#5f8fd9] align-middle" /> backtrack / undo a step</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-[#e8a33d] bg-[#fdf3d7] align-middle" /> solution found</span>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--cv-border-warm)] px-3 text-xs font-bold text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)] disabled:opacity-40">
          <ChevronLeft size={14} /> {t('courses.prev_step', 'Prev')}
        </button>
        <button type="button" onClick={() => go(step + 1)} disabled={step === STEPS.length - 1} className="cv-design-button-primary inline-flex h-9 items-center gap-1 rounded-lg px-4 text-xs disabled:opacity-40">
          {t('courses.viz.next_step', 'Next step')} <ChevronRight size={14} />
        </button>
        <button type="button" onClick={() => setStep(0)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--cv-border-warm)] px-3 text-xs font-bold text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)]">
          <RotateCcw size={13} /> {t('courses.reset', 'Reset')}
        </button>
      </div>

      <p className="mt-3 text-center text-[11px] font-medium text-[var(--cv-text-muted)]">
        {reachedEnd || completed
          ? '✓ Lesson complete! choose → explore → un-choose is the whole pattern behind subsets, permutations, N-Queens, and Sudoku solvers.'
          : 'Walk the search to the solution to complete this lesson.'}
      </p>
    </div>
  );
};

export default BacktrackingViz;
