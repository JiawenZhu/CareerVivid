import React from 'react';
import { motion } from 'framer-motion';
import { Grid3x3 } from 'lucide-react';
import type { CourseWidgetProps } from './types';
import StepPlayerShell from './algoViz/StepPlayerShell';

/**
 * Dynamic-programming animation — Unique Paths on a 4×4 grid. Watch the DP
 * table fill cell by cell: every value is just (from above) + (from left).
 * Big scary "DP" reduced to filling a spreadsheet.
 */

const N = 4;

// dp table + fill order for the inner cells.
const DP: number[][] = Array.from({ length: N }, () => Array(N).fill(1));
const FILL_ORDER: [number, number][] = [];
for (let r = 1; r < N; r += 1) {
  for (let c = 1; c < N; c += 1) {
    DP[r][c] = DP[r - 1][c] + DP[r][c - 1];
    FILL_ORDER.push([r, c]);
  }
}
// Step 0 = seeded edges; steps 1..9 fill inner cells; last fill = answer.
const TOTAL_STEPS = FILL_ORDER.length + 1;

const captions: string[] = [
  'Seed the base cases: 1 way to reach every cell in the first row (only →) and first column (only ↓).',
  ...FILL_ORDER.map(([r, c], i) =>
    i === FILL_ORDER.length - 1
      ? `dp[${r}][${c}] = ${DP[r - 1][c]} + ${DP[r][c - 1]} = ${DP[r][c]} — the answer! ${DP[r][c]} unique paths, computed without exploring a single one.`
      : `dp[${r}][${c}] = dp[${r - 1}][${c}] + dp[${r}][${c - 1}] = ${DP[r - 1][c]} + ${DP[r][c - 1]} = ${DP[r][c]}. You can only arrive from above or from the left.`),
];

const DpGridViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={Grid3x3}
    title="Dynamic programming · Unique Paths, table fill"
    totalSteps={TOTAL_STEPS}
    nextLabel="Fill next cell"
    captions={captions}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Lesson complete! Define the subproblem, seed base cases, fill in dependency order — the same three moves solve Climbing Stairs, Coin Change, and Longest Common Subsequence."
    todoText="Fill the table cell by cell. Before each click, predict the value from its two neighbors."
    legend={
      <>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#5f8fd9] bg-[#ecf4fd] align-middle" /> cell being computed</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#b9e3c8] bg-[#eef9f2] align-middle" /> its two sources</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#e8a33d] bg-[#fdf3d7] align-middle" /> final answer</span>
      </>
    }
  >
    {(step) => {
      const filled = new Set<string>();
      for (let i = 0; i < step; i += 1) filled.add(FILL_ORDER[i].join(','));
      const active = step >= 1 && step <= FILL_ORDER.length ? FILL_ORDER[step - 1] : null;
      const isAnswerRevealed = step === TOTAL_STEPS - 1;
      return (
        <div className="mx-auto grid w-fit grid-cols-4 gap-1.5">
          {DP.flatMap((row, r) =>
            row.map((value, c) => {
              const isSeed = r === 0 || c === 0;
              const isActive = active !== null && active[0] === r && active[1] === c;
              const isSource = isActive === false && active !== null
                && ((r === active[0] - 1 && c === active[1]) || (r === active[0] && c === active[1] - 1));
              const isFilled = isSeed || filled.has(`${r},${c}`) || isActive;
              const isAnswer = isAnswerRevealed && r === N - 1 && c === N - 1;
              let cls = 'border-[var(--cv-border-warm)] text-transparent';
              if (isAnswer) cls = 'border-[#e8a33d] bg-[#fdf3d7] text-[#a35410] dark:bg-[#39332a] dark:text-[#f0c08a]';
              else if (isActive) cls = 'border-[#5f8fd9] bg-[#ecf4fd] text-[#1861a8] dark:bg-[#1c2a3a] dark:text-[#8fc4f0]';
              else if (isSource) cls = 'border-[#b9e3c8] bg-[#eef9f2] text-[#15803d] dark:bg-[#1d3226] dark:text-[#86e0a8]';
              else if (isFilled) cls = 'border-[var(--cv-border-warm)] text-[var(--cv-text-heading)]';
              return (
                <motion.div
                  key={`${r},${c}`}
                  animate={{ scale: isActive || isAnswer ? [1, 1.15, 1] : 1 }}
                  transition={{ duration: 0.4 }}
                  className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 font-mono text-lg font-bold transition-colors ${cls}`}
                >
                  {isFilled ? value : '·'}
                </motion.div>
              );
            }))}
        </div>
      );
    }}
  </StepPlayerShell>
);

export default DpGridViz;
