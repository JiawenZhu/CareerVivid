import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Filter,
  GitFork,
  Layers3,
  Network,
  Route,
  ScanSearch,
  Split,
  type LucideIcon,
} from 'lucide-react';
import type { CourseWidgetProps } from './types';
import StepPlayerShell, { ALGO_COLORS } from './algoViz/StepPlayerShell';

type TraceStep = {
  input: string[];
  focus: number[];
  workspace: string[];
  result: string[];
  caption: string;
  final?: boolean;
};

type TraceScenario = {
  icon: LucideIcon;
  title: string;
  nextLabel: string;
  inputLabel: string;
  workspaceLabel: string;
  resultLabel: string;
  todoText: string;
  doneText: string;
  steps: TraceStep[];
};

const scenario = (
  icon: LucideIcon,
  title: string,
  nextLabel: string,
  labels: [string, string, string],
  todoText: string,
  doneText: string,
  steps: TraceStep[],
): TraceScenario => ({
  icon,
  title,
  nextLabel,
  inputLabel: labels[0],
  workspaceLabel: labels[1],
  resultLabel: labels[2],
  todoText,
  doneText,
  steps,
});

const TRACE_SCENARIOS: Record<string, TraceScenario> = {
  'merge-sort': scenario(
    Split,
    'Merge sort · split, solve, merge',
    'Merge next run',
    ['Input', 'Recursive runs', 'Merged output'],
    'Track which run is splitting or merging before you advance.',
    'Lesson complete. Divide-and-conquer splits independent subproblems, then merges their solved results in O(n log n).',
    [
      { input: ['8', '3', '5', '1'], focus: [0, 1, 2, 3], workspace: ['[8,3,5,1]'], result: [], caption: 'Start with one unsorted run. Divide until each run has one value.' },
      { input: ['8', '3', '5', '1'], focus: [0, 1], workspace: ['[8,3]', '[5,1]'], result: [], caption: 'Split around the middle. The two halves can now be solved independently.' },
      { input: ['8', '3', '5', '1'], focus: [0, 1], workspace: ['[8] + [3]', '[5] + [1]'], result: ['[3,8]'], caption: 'Merge [8] and [3] by taking the smaller front value first: [3,8].' },
      { input: ['8', '3', '5', '1'], focus: [2, 3], workspace: ['[3,8]', '[5] + [1]'], result: ['[3,8]', '[1,5]'], caption: 'Merge the right pair in the same way: [1,5].' },
      { input: ['8', '3', '5', '1'], focus: [0, 1, 2, 3], workspace: ['[3,8] + [1,5]'], result: ['1', '3', '5', '8'], final: true, caption: 'Merge the two sorted runs. Each comparison chooses the smaller front value, producing [1,3,5,8].' },
    ],
  ),
  quickselect: scenario(
    ScanSearch,
    'Quickselect · partition around a pivot',
    'Partition',
    ['Candidates', 'Pivot decision', 'kth value'],
    'Predict which side can be discarded after the partition.',
    'Lesson complete. Quickselect keeps only the partition containing k, giving expected O(n) time without sorting everything.',
    [
      { input: ['9', '2', '7', '4', '5'], focus: [0, 1, 2, 3, 4], workspace: ['k = 3rd smallest', 'pivot = 5'], result: [], caption: 'Choose pivot 5. We only need the third smallest value, not a fully sorted array.' },
      { input: ['2', '4', '5', '9', '7'], focus: [2], workspace: ['smaller: [2,4]', 'pivot rank = 3'], result: [], caption: 'Partition values around 5. Two values are smaller, so pivot 5 is exactly the third smallest.' },
      { input: ['2', '4', '5', '9', '7'], focus: [2], workspace: ['right partition discarded'], result: ['5'], final: true, caption: 'The pivot has the target rank. Stop now instead of sorting the remaining values.' },
    ],
  ),
  'sweep-line': scenario(
    LineChart,
    'Sweep line · process ordered events',
    'Process event',
    ['Timeline events', 'Active intervals', 'Peak overlap'],
    'Advance one event at a time and watch the active count change.',
    'Lesson complete. Sorting starts and ends turns many interval-overlap questions into one linear sweep after sorting.',
    [
      { input: ['1 start A', '2 start B', '4 end A', '5 end B'], focus: [0], workspace: ['active = 0'], result: ['peak = 0'], caption: 'Sort all starts and ends on one timeline. Start events add an active interval; end events remove one.' },
      { input: ['1 start A', '2 start B', '4 end A', '5 end B'], focus: [1], workspace: ['active: A, B'], result: ['peak = 2'], caption: 'B begins before A ends, so two intervals overlap. Update the peak to 2.' },
      { input: ['1 start A', '2 start B', '4 end A', '5 end B'], focus: [2], workspace: ['active: B'], result: ['peak = 2'], caption: 'A ends. Remove it from the active set; the peak remains 2.' },
      { input: ['1 start A', '2 start B', '4 end A', '5 end B'], focus: [3], workspace: ['active = 0'], result: ['peak = 2'], final: true, caption: 'B ends and the sweep is complete. Two rooms are enough for these meetings.' },
    ],
  ),
  'monotonic-queue': scenario(
    Layers3,
    'Monotonic queue · keep only candidates',
    'Slide window',
    ['Window values', 'Deque (largest first)', 'Window maxima'],
    'Before advancing, identify which smaller tail values become irrelevant.',
    'Lesson complete. A monotonic deque keeps each index at most once, so sliding-window maxima run in O(n).',
    [
      { input: ['1', '3', '-1', '-3', '5'], focus: [0], workspace: ['deque: [1]'], result: [], caption: 'Start the size-3 window. The deque stores values that can still become a maximum.' },
      { input: ['1', '3', '-1', '-3', '5'], focus: [1], workspace: ['pop 1', 'deque: [3]'], result: [], caption: '3 makes 1 irrelevant: 1 is older and smaller, so it can never win a later window.' },
      { input: ['1', '3', '-1', '-3', '5'], focus: [2], workspace: ['deque: [3,-1]'], result: ['3'], caption: 'The first window is full. The deque front, 3, is its maximum.' },
      { input: ['1', '3', '-1', '-3', '5'], focus: [4], workspace: ['pop -3, -1, 3', 'deque: [5]'], result: ['3', '3', '5'], final: true, caption: '5 removes every smaller tail candidate. The final maximum sequence is [3,3,5].' },
    ],
  ),
  'string-matching': scenario(
    Filter,
    'String matching · reuse a known prefix',
    'Compare',
    ['Text', 'Pattern / prefix table', 'Match index'],
    'When a comparison fails, use the prefix table instead of restarting blindly.',
    'Lesson complete. KMP reuses matched-prefix knowledge for O(n + m) search; rolling hashes offer a different Rabin-Karp trade-off for many matches.',
    [
      { input: ['A', 'B', 'A', 'B', 'A', 'C'], focus: [0, 1, 2], workspace: ['pattern: A B A C', 'LPS: 0 0 1 0'], result: [], caption: 'Build the prefix table once. LPS tells KMP how much of the pattern is still useful after a mismatch.' },
      { input: ['A', 'B', 'A', 'B', 'A', 'C'], focus: [3], workspace: ['matched: A B A', 'mismatch: B vs C', 'fallback to length 1'], result: [], caption: 'Do not restart from text index 1. The prefix A is already known to match, so continue from it.' },
      { input: ['A', 'B', 'A', 'B', 'A', 'C'], focus: [2, 3, 4, 5], workspace: ['matched: A B A C'], result: ['index 2'], final: true, caption: 'The pattern completes at index 2. KMP never moves the text pointer backward.' },
    ],
  ),
  'union-find': scenario(
    Network,
    'Union Find · merge components quickly',
    'Union sets',
    ['Edges', 'Parent links', 'Connected components'],
    'Track how path compression keeps future find operations short.',
    'Lesson complete. Union Find answers connectivity questions with near-constant amortized union and find operations.',
    [
      { input: ['1-2', '2-3', '4-5', '3-5'], focus: [0], workspace: ['parents: 1|2|3|4|5'], result: ['5 components'], caption: 'Start with every node as its own parent and every node in a separate component.' },
      { input: ['1-2', '2-3', '4-5', '3-5'], focus: [1], workspace: ['1 <- 2 <- 3', '4', '5'], result: ['3 components'], caption: 'Union 1-2 and 2-3. Nodes 1, 2, and 3 now share a root.' },
      { input: ['1-2', '2-3', '4-5', '3-5'], focus: [2], workspace: ['1 <- 2 <- 3', '4 <- 5'], result: ['2 components'], caption: 'Union 4-5 to form the second component.' },
      { input: ['1-2', '2-3', '4-5', '3-5'], focus: [3], workspace: ['1 <- 2 <- 3 -> 5 -> 4', 'compress paths'], result: ['1 component'], final: true, caption: 'Union 3-5 connects both groups. Path compression flattens parent links for later queries.' },
    ],
  ),
  'range-tree': scenario(
    GitFork,
    'Range tree · aggregate intervals',
    'Query range',
    ['Array', 'Tree aggregates', 'Range sum'],
    'Identify the smallest tree nodes that exactly cover the query range.',
    'Lesson complete. Segment trees and Fenwick trees trade extra structure for fast updates and range queries.',
    [
      { input: ['2', '1', '3', '4'], focus: [0, 1, 2, 3], workspace: ['root sum = 10', 'left = 3, right = 7'], result: [], caption: 'Store aggregate sums at tree nodes so a range does not need to scan every leaf.' },
      { input: ['2', '1', '3', '4'], focus: [1, 2], workspace: ['query [1,2]', 'take leaf 1 + leaf 3'], result: [], caption: 'The query [1,2] crosses the middle, so it is covered by two small nodes.' },
      { input: ['2', '1', '3', '4'], focus: [1, 2], workspace: ['1 + 3'], result: ['4'], final: true, caption: 'Combine the selected aggregates: range sum [1,2] is 4 without scanning unrelated values.' },
    ],
  ),
  mst: scenario(
    Route,
    'Minimum spanning tree · take safe edges',
    'Consider edge',
    ['Edges by weight', 'Components', 'MST weight'],
    'Choose the lightest edge that joins two different components.',
    'Lesson complete. Kruskal sorts edges and uses Union Find to reject cycles; Prim grows one frontier instead.',
    [
      { input: ['A-B 1', 'B-C 2', 'A-C 3', 'C-D 4'], focus: [0], workspace: ['components: A | B | C | D'], result: ['weight 0'], caption: 'Sort edges by weight. Kruskal considers them from cheapest to most expensive.' },
      { input: ['A-B 1', 'B-C 2', 'A-C 3', 'C-D 4'], focus: [1], workspace: ['take A-B', 'take B-C'], result: ['weight 3'], caption: 'Both edges connect different components, so they are safe to add.' },
      { input: ['A-B 1', 'B-C 2', 'A-C 3', 'C-D 4'], focus: [2], workspace: ['A, B, C already connected', 'skip cycle'], result: ['weight 3'], caption: 'A-C would close a cycle, so skip it. Union Find makes that check immediate.' },
      { input: ['A-B 1', 'B-C 2', 'A-C 3', 'C-D 4'], focus: [3], workspace: ['take C-D'], result: ['weight 7'], final: true, caption: 'C-D reaches the final vertex. The three selected edges form the minimum spanning tree with weight 7.' },
    ],
  ),
  'shortest-paths': scenario(
    Route,
    'Shortest paths · relax until stable',
    'Relax edge',
    ['Weighted edges', 'Distances from A', 'Shortest route'],
    'A relaxation only changes a distance when it proves a cheaper path.',
    'Lesson complete. Bellman-Ford handles negative edges and detects negative cycles; Floyd-Warshall fills every source/destination pair.',
    [
      { input: ['A-B 4', 'A-C 5', 'B-C -2', 'C-D 3'], focus: [0, 1], workspace: ['d(A)=0', 'd(B)=∞, d(C)=∞, d(D)=∞'], result: [], caption: 'Initialize the source distance to 0 and every other distance to infinity.' },
      { input: ['A-B 4', 'A-C 5', 'B-C -2', 'C-D 3'], focus: [0], workspace: ['d(B)=4', 'd(C)=5'], result: [], caption: 'Relax edges out of A. We now know tentative routes to B and C.' },
      { input: ['A-B 4', 'A-C 5', 'B-C -2', 'C-D 3'], focus: [2], workspace: ['d(C)=min(5, 4-2)=2'], result: [], caption: 'B-C improves C from 5 to 2. A relaxation keeps the cheaper path.' },
      { input: ['A-B 4', 'A-C 5', 'B-C -2', 'C-D 3'], focus: [3], workspace: ['d(D)=2+3=5'], result: ['A -> B -> C -> D = 5'], final: true, caption: 'Relax C-D. The shortest known route to D is now A -> B -> C -> D with cost 5.' },
    ],
  ),
  'network-flow': scenario(
    Network,
    'Network flow · augment a residual path',
    'Augment path',
    ['Residual capacities', 'Augmenting path', 'Total flow'],
    'Find a source-to-sink path, send its bottleneck capacity, then update the residual graph.',
    'Lesson complete. Max flow repeats residual-path augmentation; min cut explains why no additional flow can cross the final boundary.',
    [
      { input: ['S-A 3', 'S-B 2', 'A-T 2', 'B-T 3'], focus: [0, 2], workspace: ['path S -> A -> T', 'bottleneck = 2'], result: ['flow 0'], caption: 'Find an augmenting path from source S to sink T. Its bottleneck is the smallest residual capacity: 2.' },
      { input: ['S-A 1', 'S-B 2', 'A-T 0', 'B-T 3'], focus: [0, 2], workspace: ['update forward and reverse residual edges'], result: ['flow 2'], caption: 'Send 2 units. S-A and A-T lose capacity; reverse residual edges record the option to reroute later.' },
      { input: ['S-A 1', 'S-B 2', 'A-T 0', 'B-T 3'], focus: [1, 3], workspace: ['path S -> B -> T', 'bottleneck = 2'], result: ['flow 2'], caption: 'A is saturated, so find the next augmenting path through B.' },
      { input: ['S-A 1', 'S-B 0', 'A-T 0', 'B-T 1'], focus: [1, 3], workspace: ['no residual path from S to T'], result: ['max flow 4'], final: true, caption: 'Send 2 more units through B. No source-to-sink residual path remains, so the maximum flow is 4.' },
    ],
  ),
};

const TokenLane: React.FC<{
  label: string;
  tokens: string[];
  variant: 'input' | 'workspace' | 'result';
  focus?: number[];
  final?: boolean;
}> = ({ label, tokens, variant, focus = [], final }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cv-text-muted)]">{label}</p>
    <div className="mt-1.5 flex min-h-10 flex-wrap items-center gap-1.5">
      {tokens.length ? tokens.map((token, index) => {
        const className = variant === 'input'
          ? focus.includes(index) ? ALGO_COLORS.activeCell : ALGO_COLORS.idleCell
          : variant === 'result' && final ? ALGO_COLORS.resultCell
          : variant === 'result' ? ALGO_COLORS.goodCell
          : 'border-[var(--cv-action-soft-border)] bg-[var(--cv-action-soft-bg)] text-[var(--cv-action-primary)] dark:border-[var(--cv-border-accent)] dark:text-[var(--cv-action-soft-text)]';
        return (
          <motion.span
            key={`${token}-${index}`}
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0, scale: variant === 'input' && focus.includes(index) ? 1.04 : 1 }}
            className={`inline-flex min-h-8 items-center rounded-md border px-2 font-mono text-[11px] font-bold ${className}`}
          >
            {token}
          </motion.span>
        );
      }) : <span className="text-xs font-medium text-[var(--cv-text-muted)]">Waiting for a result</span>}
    </div>
  </div>
);

const PatternTraceViz: React.FC<CourseWidgetProps & { scenarioId: string }> = ({ completed, onComplete, scenarioId }) => {
  const current = TRACE_SCENARIOS[scenarioId];
  if (!current) return null;

  return (
    <StepPlayerShell
      icon={current.icon}
      title={current.title}
      totalSteps={current.steps.length}
      nextLabel={current.nextLabel}
      captions={current.steps.map((step) => step.caption)}
      completed={completed}
      onComplete={onComplete}
      doneText={current.doneText}
      todoText={current.todoText}
      legend={(
        <>
          <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#5f8fd9] bg-[#ecf4fd] align-middle" /> processing now</span>
          <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[var(--cv-action-soft-border)] bg-[var(--cv-action-soft-bg)] align-middle" /> working state</span>
          <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#e8a33d] bg-[#fdf3d7] align-middle" /> final answer</span>
        </>
      )}
    >
      {(stepIndex) => {
        const step = current.steps[stepIndex];
        return (
          <div className="grid gap-3 sm:grid-cols-3">
            <TokenLane label={current.inputLabel} tokens={step.input} variant="input" focus={step.focus} />
            <TokenLane label={current.workspaceLabel} tokens={step.workspace} variant="workspace" />
            <TokenLane label={current.resultLabel} tokens={step.result} variant="result" final={step.final} />
          </div>
        );
      }}
    </StepPlayerShell>
  );
};

export const createPatternTraceWidget = (scenarioId: string): React.FC<CourseWidgetProps> =>
  function PatternTraceWidget(props) {
    return <PatternTraceViz {...props} scenarioId={scenarioId} />;
  };

export default PatternTraceViz;
