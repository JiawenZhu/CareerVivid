import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight } from 'lucide-react';
import type { CourseWidgetProps } from './types';
import StepPlayerShell, { ALGO_COLORS } from './algoViz/StepPlayerShell';

/**
 * Two-pointers animation — pair-with-target-sum on a sorted array.
 * Pointers start at both ends and converge: sum too small → move L right,
 * sum too big → move R left. Every algorithm gets its own animation.
 */

const NUMS = [1, 3, 4, 6, 8, 11, 13];
const TARGET = 15;

interface Step { l: number; r: number; found?: boolean }

const buildSteps = (): Step[] => {
  const steps: Step[] = [];
  let l = 0;
  let r = NUMS.length - 1;
  while (l < r) {
    const sum = NUMS[l] + NUMS[r];
    steps.push({ l, r, found: sum === TARGET });
    if (sum === TARGET) break;
    if (sum < TARGET) l += 1;
    else r -= 1;
  }
  return steps;
};

const STEPS = buildSteps();

const captionFor = ({ l, r, found }: Step): string => {
  const sum = NUMS[l] + NUMS[r];
  if (found) return `${NUMS[l]} + ${NUMS[r]} = ${TARGET} — found the pair! Sorted order let us skip every other combination.`;
  return sum < TARGET
    ? `${NUMS[l]} + ${NUMS[r]} = ${sum} < ${TARGET} — too small, so move L right (a bigger left value is the only fix).`
    : `${NUMS[l]} + ${NUMS[r]} = ${sum} > ${TARGET} — too big, so move R left.`;
};

const TwoPointersViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={ArrowLeftRight}
    title={`Two pointers · find a pair that sums to ${TARGET}`}
    totalSteps={STEPS.length}
    nextLabel="Move pointer"
    captions={STEPS.map(captionFor)}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Lesson complete! Converging pointers turn an O(n²) pair search into a single O(n) pass — the trick behind Two Sum II, 3Sum, and Container With Most Water."
    todoText="Move the pointers until they find the pair. Predict which pointer moves before you click."
    legend={
      <>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#b9e3c8] bg-[#eef9f2] align-middle" /> under the pointers</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#e8a33d] bg-[#fdf3d7] align-middle" /> pair found</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[var(--cv-border-warm)] opacity-40 align-middle" /> ruled out</span>
      </>
    }
  >
    {(step) => {
      const { l, r, found } = STEPS[step];
      return (
        <div className="flex justify-center gap-1.5 pb-7">
          {NUMS.map((value, index) => {
            const isPointer = index === l || index === r;
            const ruledOut = index < l || index > r;
            const cls = found && isPointer
              ? ALGO_COLORS.resultCell
              : isPointer
                ? ALGO_COLORS.goodCell
                : ruledOut
                  ? ALGO_COLORS.deadCell
                  : ALGO_COLORS.idleCell;
            return (
              <motion.div
                key={index}
                layout
                animate={{ scale: isPointer ? 1.08 : 1 }}
                className={`relative flex h-12 w-11 items-center justify-center rounded-lg border-2 font-mono text-base font-bold transition-colors ${cls}`}
              >
                {value}
                {index === l && <span className="absolute -bottom-6 text-[10px] font-extrabold text-[#15803d]">↑ L</span>}
                {index === r && <span className="absolute -bottom-6 text-[10px] font-extrabold text-[#b03a54]">↑ R</span>}
              </motion.div>
            );
          })}
        </div>
      );
    }}
  </StepPlayerShell>
);

export default TwoPointersViz;
