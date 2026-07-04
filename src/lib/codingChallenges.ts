import { LocalInterviewGuide } from './localInterviewGuides';

/**
 * Curated coding challenges for the quest coding stage.
 *
 * Problems are hand-written with deterministic outputs so the hidden test
 * suite is guaranteed correct — the AI grades code quality, the tests decide
 * correctness. The company guide only flavors the framing/difficulty pick.
 */

export type CodingLanguage = 'javascript' | 'python';

export interface CodingTestCase {
  /** Positional arguments passed to the solution function. */
  input: unknown[];
  /** Expected return value (JSON-comparable). */
  expected: unknown;
  /** Hidden tests only run on submit, not on "Run". */
  hidden?: boolean;
}

export interface CodingChallenge {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium';
  /** Function the candidate must implement, per language. */
  functionName: Record<CodingLanguage, string>;
  description: string;
  requirements: string[];
  /** Short worked example shown in the brief. */
  example: string;
  starterCode: Record<CodingLanguage, string>;
  tests: CodingTestCase[];
}

export interface CodingBrief {
  challenge: CodingChallenge;
  /** Full text passed to the AI grader. */
  prompt: string;
}

const CHALLENGES: CodingChallenge[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'easy',
    functionName: { javascript: 'twoSum', python: 'two_sum' },
    description:
      'Given an array of integers and a target, return the indices of the two numbers that add up to the target, sorted ascending. Exactly one solution exists; you may not use the same element twice.',
    requirements: [
      'Return the two indices as an array/list sorted ascending.',
      'Aim for better than O(n²) time.',
      'Handle negative numbers and duplicate values.',
    ],
    example: 'twoSum([2, 7, 11, 15], 9) → [0, 1]',
    starterCode: {
      javascript:
        'function twoSum(nums, target) {\n  // Return the indices of the two numbers that add up to target,\n  // sorted ascending. Exactly one solution exists.\n\n}\n',
      python:
        'def two_sum(nums, target):\n    # Return the indices of the two numbers that add up to target,\n    # sorted ascending. Exactly one solution exists.\n    pass\n',
    },
    tests: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] },
      { input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4], hidden: true },
      { input: [[0, 4, 3, 0], 0], expected: [0, 3], hidden: true },
      { input: [[5, 75, 25], 100], expected: [1, 2], hidden: true },
    ],
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'easy',
    functionName: { javascript: 'isValid', python: 'is_valid' },
    description:
      "Given a string containing only the characters '(', ')', '{', '}', '[' and ']', determine whether the input is valid: every opening bracket must be closed by the same type in the correct order.",
    requirements: [
      'Return true/False for validity.',
      'An empty string is valid.',
      'Solve in a single pass, O(n) time.',
    ],
    example: "isValid('()[]{}') → true · isValid('(]') → false",
    starterCode: {
      javascript:
        "function isValid(s) {\n  // Return true if every bracket is closed by the same type\n  // in the correct order.\n\n}\n",
      python:
        'def is_valid(s):\n    # Return True if every bracket is closed by the same type\n    # in the correct order.\n    pass\n',
    },
    tests: [
      { input: ['()[]{}'], expected: true },
      { input: ['(]'], expected: false },
      { input: ['([{}])'], expected: true },
      { input: [''], expected: true, hidden: true },
      { input: ['(('], expected: false, hidden: true },
      { input: ['){'], expected: false, hidden: true },
      { input: ['{[()()]}[]'], expected: true, hidden: true },
    ],
  },
  {
    id: 'max-subarray',
    title: 'Maximum Subarray',
    difficulty: 'medium',
    functionName: { javascript: 'maxSubArray', python: 'max_sub_array' },
    description:
      'Given an integer array, find the contiguous subarray (containing at least one number) with the largest sum, and return that sum.',
    requirements: [
      'Return the maximum sum as a number.',
      'Handle arrays that are entirely negative.',
      'Aim for O(n) time and O(1) extra space (Kadane’s algorithm).',
    ],
    example: 'maxSubArray([-2,1,-3,4,-1,2,1,-5,4]) → 6  (subarray [4,-1,2,1])',
    starterCode: {
      javascript:
        'function maxSubArray(nums) {\n  // Return the largest sum of any contiguous subarray.\n\n}\n',
      python:
        'def max_sub_array(nums):\n    # Return the largest sum of any contiguous subarray.\n    pass\n',
    },
    tests: [
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { input: [[1]], expected: 1 },
      { input: [[5, 4, -1, 7, 8]], expected: 23 },
      { input: [[-3, -1, -2]], expected: -1, hidden: true },
      { input: [[-1, 0, -2]], expected: 0, hidden: true },
      { input: [[8, -19, 5, -4, 20]], expected: 21, hidden: true },
    ],
  },
  {
    id: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'medium',
    functionName: { javascript: 'mergeIntervals', python: 'merge_intervals' },
    description:
      'Given an array of intervals [start, end], merge all overlapping intervals and return the merged intervals sorted by start.',
    requirements: [
      'Return intervals sorted ascending by start value.',
      'Intervals that touch (e.g. [1,4] and [4,5]) count as overlapping.',
      'Aim for O(n log n) time.',
    ],
    example: 'mergeIntervals([[1,3],[2,6],[8,10],[15,18]]) → [[1,6],[8,10],[15,18]]',
    starterCode: {
      javascript:
        'function mergeIntervals(intervals) {\n  // Merge overlapping intervals; return them sorted by start.\n\n}\n',
      python:
        'def merge_intervals(intervals):\n    # Merge overlapping intervals; return them sorted by start.\n    pass\n',
    },
    tests: [
      { input: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
      { input: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
      { input: [[[1, 4]]], expected: [[1, 4]] },
      { input: [[[5, 6], [1, 2]]], expected: [[1, 2], [5, 6]], hidden: true },
      { input: [[[1, 10], [2, 3], [4, 5]]], expected: [[1, 10]], hidden: true },
      { input: [[[1, 4], [0, 0]]], expected: [[0, 0], [1, 4]], hidden: true },
    ],
  },
  {
    id: 'longest-unique-substring',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'medium',
    functionName: { javascript: 'lengthOfLongestSubstring', python: 'length_of_longest_substring' },
    description:
      'Given a string, return the length of the longest substring without repeating characters.',
    requirements: [
      'Return the length as a number.',
      'Handle empty strings and strings of one repeated character.',
      'Aim for O(n) time with a sliding window.',
    ],
    example: "lengthOfLongestSubstring('abcabcbb') → 3  ('abc')",
    starterCode: {
      javascript:
        "function lengthOfLongestSubstring(s) {\n  // Return the length of the longest substring with no\n  // repeating characters.\n\n}\n",
      python:
        'def length_of_longest_substring(s):\n    # Return the length of the longest substring with no\n    # repeating characters.\n    pass\n',
    },
    tests: [
      { input: ['abcabcbb'], expected: 3 },
      { input: ['bbbbb'], expected: 1 },
      { input: ['pwwkew'], expected: 3 },
      { input: [''], expected: 0, hidden: true },
      { input: ['au'], expected: 2, hidden: true },
      { input: ['dvdf'], expected: 3, hidden: true },
      { input: ['tmmzuxt'], expected: 5, hidden: true },
    ],
  },
  {
    id: 'product-except-self',
    title: 'Product of Array Except Self',
    difficulty: 'medium',
    functionName: { javascript: 'productExceptSelf', python: 'product_except_self' },
    description:
      'Given an integer array nums, return an array where each element is the product of all other elements — without using division.',
    requirements: [
      'Do not use division.',
      'Handle zeros in the input.',
      'Aim for O(n) time.',
    ],
    example: 'productExceptSelf([1,2,3,4]) → [24,12,8,6]',
    starterCode: {
      javascript:
        'function productExceptSelf(nums) {\n  // Return an array where each element is the product of all\n  // the other elements. No division allowed.\n\n}\n',
      python:
        'def product_except_self(nums):\n    # Return a list where each element is the product of all\n    # the other elements. No division allowed.\n    pass\n',
    },
    tests: [
      { input: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
      { input: [[2, 3]], expected: [3, 2] },
      { input: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0] },
      { input: [[0, 0]], expected: [0, 0], hidden: true },
      { input: [[1, -1]], expected: [-1, 1], hidden: true },
      { input: [[4, 5, 1, 8, 2]], expected: [80, 64, 320, 40, 160], hidden: true },
    ],
  },
  {
    id: 'climbing-stairs',
    title: 'Climbing Stairs',
    difficulty: 'easy',
    functionName: { javascript: 'climbStairs', python: 'climb_stairs' },
    description:
      'You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. In how many distinct ways can you reach the top?',
    requirements: [
      'Return the count as a number.',
      'Handle n up to 45 without recursion blowing up (use iteration/DP).',
      'Explain the recurrence in a comment.',
    ],
    example: 'climbStairs(3) → 3  (1+1+1, 1+2, 2+1)',
    starterCode: {
      javascript:
        'function climbStairs(n) {\n  // Return how many distinct ways you can climb n steps\n  // taking 1 or 2 steps at a time.\n\n}\n',
      python:
        'def climb_stairs(n):\n    # Return how many distinct ways you can climb n steps\n    # taking 1 or 2 steps at a time.\n    pass\n',
    },
    tests: [
      { input: [2], expected: 2 },
      { input: [3], expected: 3 },
      { input: [5], expected: 8 },
      { input: [1], expected: 1, hidden: true },
      { input: [10], expected: 89, hidden: true },
      { input: [45], expected: 1836311903, hidden: true },
    ],
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    difficulty: 'easy',
    functionName: { javascript: 'search', python: 'search' },
    description:
      'Given a sorted (ascending) integer array and a target, return the index of the target, or -1 if it is not present. Your solution must run in O(log n).',
    requirements: [
      'Return the index, or -1 when absent.',
      'Must be O(log n) — no linear scans.',
      'Watch for integer-midpoint and off-by-one mistakes.',
    ],
    example: 'search([-1,0,3,5,9,12], 9) → 4',
    starterCode: {
      javascript:
        'function search(nums, target) {\n  // Sorted array: return the index of target or -1.\n  // Must run in O(log n).\n\n}\n',
      python:
        'def search(nums, target):\n    # Sorted list: return the index of target or -1.\n    # Must run in O(log n).\n    pass\n',
    },
    tests: [
      { input: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { input: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
      { input: [[5], 5], expected: 0 },
      { input: [[], 3], expected: -1, hidden: true },
      { input: [[1, 3], 3], expected: 1, hidden: true },
      { input: [[2, 4, 6, 8, 10, 12, 14, 16], 2], expected: 0, hidden: true },
    ],
  },
];

/** Stable tiny hash so a company keeps the same challenge between visits. */
const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

export const getCodingChallengeById = (id: string): CodingChallenge | undefined =>
  CHALLENGES.find((c) => c.id === id);

/** Full bank, exposed for validation tests (see codingChallenges.test.ts). */
export const getAllCodingChallenges = (): CodingChallenge[] => [...CHALLENGES];

/**
 * Pick a challenge for the coding stage. Harder guides get medium problems;
 * the pick is deterministic per company so retries face the same problem.
 */
export const buildCodingBrief = (guide: LocalInterviewGuide): CodingBrief => {
  const wantsMedium = (guide.difficulty ?? 5) >= 6;
  const pool = CHALLENGES.filter((c) => (wantsMedium ? c.difficulty === 'medium' : c.difficulty === 'easy'));
  const candidates = pool.length ? pool : CHALLENGES;
  const challenge = candidates[hashString(guide.company) % candidates.length];

  const prompt = [
    `Coding challenge: ${challenge.title} (${challenge.difficulty})`,
    '',
    challenge.description,
    '',
    'Requirements:',
    ...challenge.requirements.map((r) => `- ${r}`),
    '',
    `Interview context: coding round at ${guide.company}${guide.difficulty ? ` (difficulty ${guide.difficulty}/10)` : ''}.`,
  ].join('\n');

  return { challenge, prompt };
};

/** Serializable summary of a test run, fed to the AI grader. */
export interface CodingTestResult {
  hidden: boolean;
  pass: boolean;
  input: string;
  expected: string;
  received: string;
  error?: string;
}

export interface CodingRunSummary {
  passed: number;
  total: number;
  results: CodingTestResult[];
  durationMs: number;
}
