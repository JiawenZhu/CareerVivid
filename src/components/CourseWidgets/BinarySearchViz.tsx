import React from 'react';
import { motion } from 'framer-motion';
import { Crosshair } from 'lucide-react';
import type { CourseWidgetProps } from './types';
import StepPlayerShell, { ALGO_COLORS } from './algoViz/StepPlayerShell';

/**
 * Binary-search animation — watch the search space halve on every comparison.
 * lo / mid / hi markers, discarded halves fade out.
 */

const NUMS = [3, 7, 12, 19, 25, 31, 42, 58, 66, 74, 88];
const TARGET = 25;

interface Step { lo: number; hi: number; mid: number; found?: boolean }

const buildSteps = (): Step[] => {
  const steps: Step[] = [];
  let lo = 0;
  let hi = NUMS.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ lo, hi, mid, found: NUMS[mid] === TARGET });
    if (NUMS[mid] === TARGET) break;
    if (NUMS[mid] < TARGET) lo = mid + 1;
    else hi = mid - 1;
  }
  return steps;
};

const STEPS = buildSteps();

const captionFor = ({ lo, hi, mid, found }: Step): string => {
  if (found) return `nums[${mid}] = ${TARGET} — found it in ${STEPS.indexOf(STEPS.find((s) => s.found)!) + 1} comparisons instead of scanning ${NUMS.length} elements.`;
  return NUMS[mid] < TARGET
    ? `mid = ${mid}, nums[mid] = ${NUMS[mid]} < ${TARGET} — the answer can't be in the left half. Discard it: lo = ${mid + 1}.`
    : `mid = ${mid}, nums[mid] = ${NUMS[mid]} > ${TARGET} — discard the right half: hi = ${mid - 1}. (Search space was [${lo}, ${hi}].)`;
};

const BinarySearchViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={Crosshair}
    title={`Binary search · find ${TARGET} in a sorted array`}
    totalSteps={STEPS.length}
    nextLabel="Halve it"
    captions={STEPS.map(captionFor)}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Lesson complete! Each comparison halves the space: n → n/2 → n/4 … that's O(log n), and the same skeleton solves rotated arrays, first/last position, and 'search on the answer' problems."
    todoText="Keep halving until you land on the target. Watch how much of the array each comparison throws away."
    legend={
      <>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#5f8fd9] bg-[#ecf4fd] align-middle" /> mid (compared now)</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#b9e3c8] bg-[#eef9f2] align-middle" /> still in play [lo, hi]</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[var(--cv-border-warm)] opacity-40 align-middle" /> discarded</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#e8a33d] bg-[#fdf3d7] align-middle" /> target found</span>
      </>
    }
  >
    {(step) => {
      const { lo, hi, mid, found } = STEPS[step];
      return (
        <div className="flex flex-wrap justify-center gap-1.5 pb-7">
          {NUMS.map((value, index) => {
            const inRange = index >= lo && index <= hi;
            const cls = found && index === mid
              ? ALGO_COLORS.resultCell
              : index === mid
                ? ALGO_COLORS.activeCell
                : inRange
                  ? ALGO_COLORS.goodCell
                  : ALGO_COLORS.deadCell;
            return (
              <motion.div
                key={index}
                layout
                animate={{ scale: index === mid ? 1.1 : 1, opacity: inRange ? 1 : 0.35 }}
                className={`relative flex h-12 w-11 items-center justify-center rounded-lg border-2 font-mono text-sm font-bold transition-colors ${cls}`}
              >
                {value}
                {index === lo && <span className="absolute -bottom-6 left-1 text-[10px] font-extrabold text-[#15803d]">lo</span>}
                {index === mid && <span className="absolute -top-5 text-[10px] font-extrabold text-[#1861a8]">mid</span>}
                {index === hi && <span className="absolute -bottom-6 right-1 text-[10px] font-extrabold text-[#b03a54]">hi</span>}
              </motion.div>
            );
          })}
        </div>
      );
    }}
  </StepPlayerShell>
);

export default BinarySearchViz;
