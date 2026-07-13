import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch } from 'lucide-react';
import type { CourseWidgetProps } from './types';
import StepPlayerShell, { ALGO_COLORS } from './algoViz/StepPlayerShell';

/**
 * DFS preorder animation — visit the node, recursively finish its left
 * subtree, then its right subtree. Each visible step is produced by the same
 * traversal order students implement in the companion code lab.
 */

type TreeNode = {
  id: string;
  x: number;
  y: number;
  left?: string;
  right?: string;
};

const NODES: Record<string, TreeNode> = {
  A: { id: 'A', x: 50, y: 12, left: 'B', right: 'C' },
  B: { id: 'B', x: 27, y: 45, left: 'D', right: 'E' },
  C: { id: 'C', x: 73, y: 45, right: 'F' },
  D: { id: 'D', x: 15, y: 79 },
  E: { id: 'E', x: 39, y: 79 },
  F: { id: 'F', x: 85, y: 79 },
};

type Step = {
  current: string;
  path: string[];
  output: string[];
  final: boolean;
};

const buildSteps = (): Step[] => {
  const steps: Step[] = [];
  const path: string[] = [];
  const output: string[] = [];

  const visit = (id: string) => {
    const node = NODES[id];
    path.push(id);
    output.push(id);
    steps.push({
      current: id,
      path: [...path],
      output: [...output],
      final: output.length === Object.keys(NODES).length,
    });
    if (node.left) visit(node.left);
    if (node.right) visit(node.right);
    path.pop();
  };

  visit('A');
  return steps;
};

const STEPS = buildSteps();

const captionFor = (step: Step): string => {
  const position = step.output.length;
  if (step.final) {
    return `Visit F and finish: preorder is ${step.output.join(' -> ')}. DFS completes a whole branch before it visits a sibling branch.`;
  }
  const node = NODES[step.current];
  if (!node.left && !node.right) {
    return `Visit ${step.current}, add it to the output, then return to its parent. A leaf has no children to explore.`;
  }
  const next = node.left || node.right;
  return `Visit ${step.current} first (position ${position}), then recurse into ${next}. Preorder means node, left subtree, right subtree.`;
};

const edgePairs = Object.values(NODES).flatMap((node) => [node.left, node.right]
  .filter((child): child is string => Boolean(child))
  .map((child) => [node.id, child] as const));

const DfsTreeViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={GitBranch}
    title="DFS preorder · finish one branch before the next"
    totalSteps={STEPS.length}
    nextLabel="Visit node"
    captions={STEPS.map(captionFor)}
    completed={completed}
    onComplete={onComplete}
    doneText="Lesson complete. DFS uses a stack (explicit or recursive) to traverse trees, explore components, validate paths, and solve grid search problems in O(V + E)."
    todoText="Before advancing, predict which child DFS visits next and which nodes stay on the call stack."
    legend={(
      <>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#5f8fd9] bg-[#ecf4fd] align-middle" /> visiting now</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#b9e3c8] bg-[#eef9f2] align-middle" /> already output</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#e8a33d] bg-[#fdf3d7] align-middle" /> traversal complete</span>
      </>
    )}
  >
    {(stepIndex) => {
      const step = STEPS[stepIndex];
      const visited = new Set(step.output);
      return (
        <div className="mx-auto max-w-lg">
          <div className="relative h-56 overflow-hidden" aria-label="Depth-first preorder traversal tree">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
              {edgePairs.map(([parentId, childId]) => {
                const parent = NODES[parentId];
                const child = NODES[childId];
                const isActivePath = step.path.includes(parentId) && step.path.includes(childId);
                return (
                  <line
                    key={`${parentId}-${childId}`}
                    x1={parent.x}
                    y1={parent.y + 5}
                    x2={child.x}
                    y2={child.y - 5}
                    strokeWidth="1.5"
                    className={isActivePath ? 'stroke-[var(--cv-action-primary)]' : 'stroke-[var(--cv-border-warm)]'}
                  />
                );
              })}
            </svg>

            {Object.values(NODES).map((node) => {
              const isCurrent = node.id === step.current;
              const isFinal = step.final && node.id === step.current;
              const isVisited = visited.has(node.id);
              const colorClass = isFinal
                ? ALGO_COLORS.resultCell
                : isCurrent
                  ? ALGO_COLORS.activeCell
                  : isVisited
                    ? ALGO_COLORS.goodCell
                    : ALGO_COLORS.idleCell;
              return (
                <motion.div
                  key={node.id}
                  className={`absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 font-mono text-sm font-black ${colorClass}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  animate={{ scale: isCurrent ? [1, 1.14, 1] : 1, opacity: isVisited || isCurrent ? 1 : 0.68 }}
                  transition={{ duration: 0.32 }}
                  aria-label={`Node ${node.id}${isCurrent ? ', visiting now' : isVisited ? ', already output' : ''}`}
                >
                  {node.id}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="border-t border-[var(--cv-border-warm)] pt-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cv-text-muted)]">Call stack</p>
              <p className="mt-1 font-mono text-xs font-bold text-[var(--cv-text-heading)]">{step.path.join(' -> ')}</p>
            </div>
            <div className="border-t border-[var(--cv-border-warm)] pt-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cv-text-muted)]">Preorder output</p>
              <p className="mt-1 font-mono text-xs font-bold text-[var(--cv-text-heading)]">{step.output.join(' -> ')}</p>
            </div>
          </div>
        </div>
      );
    }}
  </StepPlayerShell>
);

export default DfsTreeViz;
