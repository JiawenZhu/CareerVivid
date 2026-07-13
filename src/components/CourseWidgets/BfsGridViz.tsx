import React from 'react';
import { motion } from 'framer-motion';
import { Waves } from 'lucide-react';
import type { CourseWidgetProps } from './types';
import StepPlayerShell from './algoViz/StepPlayerShell';

/**
 * BFS animation — a wave expanding through a grid maze, one distance ring per
 * step, then the reconstructed shortest path. BFS = shortest path in an
 * unweighted graph, visualized.
 */

// 0 = open, 1 = wall. Start (0,0), End (4,4).
const GRID = [
  [0, 0, 0, 1, 0],
  [0, 1, 0, 1, 0],
  [0, 1, 0, 0, 0],
  [0, 0, 1, 0, 0],
  [1, 0, 0, 0, 0],
];
const ROWS = GRID.length;
const COLS = GRID[0].length;
const START: [number, number] = [0, 0];
const END: [number, number] = [4, 4];

const key = (r: number, c: number) => `${r},${c}`;

const bfs = () => {
  const dist = new Map<string, number>();
  const parent = new Map<string, string>();
  dist.set(key(...START), 0);
  const queue: [number, number][] = [START];
  while (queue.length) {
    const [r, c] = queue.shift()!;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS || GRID[nr][nc] === 1) continue;
      if (dist.has(key(nr, nc))) continue;
      dist.set(key(nr, nc), dist.get(key(r, c))! + 1);
      parent.set(key(nr, nc), key(r, c));
      queue.push([nr, nc]);
    }
  }
  const path = new Set<string>();
  let cursor: string | undefined = key(...END);
  while (cursor) {
    path.add(cursor);
    cursor = parent.get(cursor);
  }
  return { dist, path, maxDist: dist.get(key(...END))! };
};

const { dist: DIST, path: PATH, maxDist: MAX_DIST } = bfs();
// Steps: 0 = start only, 1..MAX_DIST = frontier rings, last = path reveal.
const TOTAL_STEPS = MAX_DIST + 2;

const captions: string[] = [
  'Start the wave at S. BFS explores level by level — all cells at distance 1 before any cell at distance 2.',
  ...Array.from({ length: MAX_DIST }, (_, i) =>
    i + 1 === MAX_DIST
      ? `Ring ${i + 1}: the wave reaches E. Because BFS visits in distance order, the FIRST time we touch E is guaranteed to be the shortest route.`
      : `Ring ${i + 1}: expand the frontier one step in every direction. Walls block the wave; visited cells are never re-entered.`),
  `Walk parent pointers back from E to S — shortest path, length ${MAX_DIST}.`,
];

const BfsGridViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={Waves}
    title="BFS · shortest path as an expanding wave"
    totalSteps={TOTAL_STEPS}
    nextLabel="Expand wave"
    captions={captions}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Lesson complete! Queue + visited set + level-by-level expansion solves Number of Islands, Rotting Oranges, Word Ladder, and every unweighted shortest-path question."
    todoText="Expand the wave until it reaches E, then reveal the shortest path."
    legend={
      <>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#5f8fd9] bg-[#ecf4fd] align-middle" /> frontier (this ring)</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#b9e3c8] bg-[#eef9f2] align-middle" /> visited</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm bg-[var(--cv-text-heading)] opacity-70 align-middle" /> wall</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#e8a33d] bg-[#fdf3d7] align-middle" /> shortest path</span>
      </>
    }
  >
    {(step) => {
      const showPath = step === TOTAL_STEPS - 1;
      const wave = Math.min(step, MAX_DIST);
      return (
        <div className="mx-auto grid w-fit grid-cols-5 gap-1">
          {GRID.flatMap((row, r) =>
            row.map((cell, c) => {
              const k = key(r, c);
              const d = DIST.get(k);
              const isStart = r === START[0] && c === START[1];
              const isEnd = r === END[0] && c === END[1];
              const visited = d !== undefined && d <= wave;
              const isFrontier = d === wave && !showPath;
              const onPath = showPath && PATH.has(k);
              let cls = 'border-[var(--cv-border-warm)] bg-transparent text-[var(--cv-text-muted)]';
              if (cell === 1) cls = 'border-transparent bg-[var(--cv-text-heading)] opacity-70';
              else if (onPath) cls = 'border-[#e8a33d] bg-[#fdf3d7] text-[#a35410] dark:bg-[#39332a] dark:text-[#f0c08a]';
              else if (isFrontier && visited) cls = 'border-[#5f8fd9] bg-[#ecf4fd] text-[#1861a8] dark:bg-[#1c2a3a] dark:text-[#8fc4f0]';
              else if (visited) cls = 'border-[#b9e3c8] bg-[#eef9f2] text-[#15803d] dark:bg-[#1d3226] dark:text-[#86e0a8]';
              return (
                <motion.div
                  key={k}
                  animate={{ scale: isFrontier && visited ? [1, 1.12, 1] : 1 }}
                  transition={{ duration: 0.4 }}
                  className={`flex h-11 w-11 items-center justify-center rounded-md border-2 font-mono text-xs font-bold transition-colors ${cls}`}
                >
                  {isStart ? 'S' : isEnd ? 'E' : cell === 1 ? '' : visited ? d : ''}
                </motion.div>
              );
            }))}
        </div>
      );
    }}
  </StepPlayerShell>
);

export default BfsGridViz;
