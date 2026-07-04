import { describe, it, expect } from 'vitest';
import {
  CodingChallenge,
  buildCodingBrief,
  getAllCodingChallenges,
  getCodingChallengeById,
} from './codingChallenges';
import { LocalInterviewGuide } from './localInterviewGuides';

/**
 * Guards the coding-stage question bank. Every test case in every challenge
 * is executed against a known-good reference solution, so a wrong expected
 * value (or a typo in a new challenge) fails CI before it ever reaches a
 * candidate. Runs on `npm test` — no scheduled re-checking needed, because
 * the bank only changes when this file's inputs change.
 */

// ---------------------------------------------------------------------------
// Reference solutions (independent implementations, keyed by JS function name)
// ---------------------------------------------------------------------------

const REFERENCE_SOLUTIONS: Record<string, (...args: any[]) => unknown> = {
  twoSum: (nums: number[], target: number) => {
    const seen = new Map<number, number>();
    for (let i = 0; i < nums.length; i += 1) {
      const other = seen.get(target - nums[i]);
      if (other !== undefined) return [other, i].sort((a, b) => a - b);
      seen.set(nums[i], i);
    }
    return undefined;
  },
  isValid: (s: string) => {
    const stack: string[] = [];
    const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
    for (const ch of s) {
      if ('([{'.includes(ch)) stack.push(ch);
      else if (stack.pop() !== pairs[ch]) return false;
    }
    return stack.length === 0;
  },
  maxSubArray: (nums: number[]) => {
    let best = nums[0];
    let current = nums[0];
    for (let i = 1; i < nums.length; i += 1) {
      current = Math.max(nums[i], current + nums[i]);
      best = Math.max(best, current);
    }
    return best;
  },
  mergeIntervals: (intervals: number[][]) => {
    const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
    const merged: number[][] = [];
    for (const [start, end] of sorted) {
      const last = merged[merged.length - 1];
      if (last && start <= last[1]) last[1] = Math.max(last[1], end);
      else merged.push([start, end]);
    }
    return merged;
  },
  lengthOfLongestSubstring: (s: string) => {
    const lastSeen = new Map<string, number>();
    let best = 0;
    let left = 0;
    for (let right = 0; right < s.length; right += 1) {
      const prev = lastSeen.get(s[right]);
      if (prev !== undefined && prev >= left) left = prev + 1;
      lastSeen.set(s[right], right);
      best = Math.max(best, right - left + 1);
    }
    return best;
  },
  productExceptSelf: (nums: number[]) => {
    const out = new Array<number>(nums.length).fill(1);
    let acc = 1;
    for (let i = 0; i < nums.length; i += 1) {
      out[i] = acc;
      acc *= nums[i];
    }
    acc = 1;
    for (let i = nums.length - 1; i >= 0; i -= 1) {
      out[i] *= acc;
      acc *= nums[i];
    }
    return out;
  },
  climbStairs: (n: number) => {
    let a = 1;
    let b = 1;
    for (let i = 0; i < n - 1; i += 1) [a, b] = [b, a + b];
    return b;
  },
  search: (nums: number[], target: number) => {
    let lo = 0;
    let hi = nums.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (nums[mid] === target) return mid;
      if (nums[mid] < target) lo = mid + 1;
      else hi = mid - 1;
    }
    return -1;
  },
};

const makeGuide = (overrides: Partial<LocalInterviewGuide> = {}): LocalInterviewGuide => ({
  company: 'TestCo',
  slug: 'testco',
  url: 'https://example.com/testco',
  scrapedAt: '2026-07-02T00:00:00.000Z',
  interviewStages: ['Phone Screen (45 minutes)', 'Onsite (4-5 rounds)'],
  codingTopics: ['Arrays and strings'],
  systemDesignTopics: [],
  behavioralTopics: ['Teamwork'],
  sampleQuestions: { coding: [], behavioral: [], systemDesign: [], values: [], other: [] },
  difficulty: 6,
  tips: [],
  compensation: null,
  ...overrides,
});

const challenges = getAllCodingChallenges();

describe('coding challenge bank — correctness', () => {
  it('covers every challenge with a reference solution', () => {
    for (const challenge of challenges) {
      expect(
        REFERENCE_SOLUTIONS[challenge.functionName.javascript],
        `Missing reference solution for "${challenge.id}" — add one to codingChallenges.test.ts when adding a challenge.`,
      ).toBeTypeOf('function');
    }
  });

  it.each(challenges.map((c): [string, CodingChallenge] => [c.id, c]))(
    '%s: every test case matches the reference solution',
    (_id, challenge) => {
      const solve = REFERENCE_SOLUTIONS[challenge.functionName.javascript];
      for (const test of challenge.tests) {
        const received = solve(...structuredClone(test.input));
        expect(JSON.stringify(received), `input=${JSON.stringify(test.input)}`)
          .toBe(JSON.stringify(test.expected));
      }
    },
  );
});

describe('coding challenge bank — structure', () => {
  it('has unique ids', () => {
    const ids = challenges.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(challenges.map((c): [string, CodingChallenge] => [c.id, c]))(
    '%s: starter code defines the expected function in both languages',
    (_id, challenge) => {
      expect(challenge.starterCode.javascript).toContain(`function ${challenge.functionName.javascript}(`);
      expect(challenge.starterCode.python).toContain(`def ${challenge.functionName.python}(`);
    },
  );

  it.each(challenges.map((c): [string, CodingChallenge] => [c.id, c]))(
    '%s: has visible tests for feedback and hidden tests for grading',
    (_id, challenge) => {
      expect(challenge.tests.filter((t) => !t.hidden).length).toBeGreaterThanOrEqual(2);
      expect(challenge.tests.filter((t) => t.hidden).length).toBeGreaterThanOrEqual(2);
    },
  );

  it.each(challenges.map((c): [string, CodingChallenge] => [c.id, c]))(
    '%s: all inputs and expected values survive a JSON round-trip',
    (_id, challenge) => {
      for (const test of challenge.tests) {
        expect(JSON.parse(JSON.stringify(test.input))).toEqual(test.input);
        expect(test.expected === undefined ? undefined : JSON.parse(JSON.stringify(test.expected)))
          .toEqual(test.expected);
      }
    },
  );
});

describe('buildCodingBrief', () => {
  it('is deterministic per company', () => {
    const guide = makeGuide({ company: 'Stripe' });
    expect(buildCodingBrief(guide).challenge.id).toBe(buildCodingBrief(guide).challenge.id);
  });

  it('picks medium problems for hard guides and easy for gentle ones', () => {
    expect(buildCodingBrief(makeGuide({ difficulty: 8 })).challenge.difficulty).toBe('medium');
    expect(buildCodingBrief(makeGuide({ difficulty: 3 })).challenge.difficulty).toBe('easy');
  });

  it('produces a prompt containing the title and every requirement', () => {
    const brief = buildCodingBrief(makeGuide());
    expect(brief.prompt).toContain(brief.challenge.title);
    for (const req of brief.challenge.requirements) {
      expect(brief.prompt).toContain(req);
    }
  });

  it('looks up challenges by id', () => {
    for (const challenge of challenges) {
      expect(getCodingChallengeById(challenge.id)?.title).toBe(challenge.title);
    }
  });
});
