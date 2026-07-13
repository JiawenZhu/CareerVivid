import { describe, it, expect } from 'vitest';
import {
  CODING_LANGUAGES,
  CODING_TOPICS,
  COMPANY_CODING_POOL_SIZE,
  CodingChallenge,
  buildCodingBrief,
  getAllCodingChallenges,
  getCodingChallengeById,
  getCodingChallengesByTopic,
  getCodingPool,
  getCodingStarterCode,
  getPreferredCodingLanguage,
  selectNextCodingChallenge,
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
  maxDrawdown: (prices: number[]) => {
    let peak = -Infinity;
    let worst = 0;
    for (const p of prices) {
      peak = Math.max(peak, p);
      worst = Math.max(worst, peak - p);
    }
    return worst;
  },
  lruCacheOps: (capacity: number, operations: Array<[string, number, number?]>) => {
    const cache = new Map<number, number>(); // Map preserves insertion order
    return operations.map(([op, key, value]) => {
      if (op === 'get') {
        if (!cache.has(key)) return -1;
        const v = cache.get(key)!;
        cache.delete(key);
        cache.set(key, v); // refresh recency
        return v;
      }
      if (cache.has(key)) cache.delete(key);
      cache.set(key, value!);
      if (cache.size > capacity) cache.delete(cache.keys().next().value!);
      return null;
    });
  },
  canFinish: (numCourses: number, prerequisites: number[][]) => {
    const indegree = new Array<number>(numCourses).fill(0);
    const adj: number[][] = Array.from({ length: numCourses }, () => []);
    for (const [a, b] of prerequisites) {
      adj[b].push(a);
      indegree[a] += 1;
    }
    const queue = indegree.flatMap((d, i) => (d === 0 ? [i] : []));
    let seen = 0;
    while (queue.length) {
      const node = queue.shift()!;
      seen += 1;
      for (const next of adj[node]) {
        indegree[next] -= 1;
        if (indegree[next] === 0) queue.push(next);
      }
    }
    return seen === numCourses;
  },
  trap: (heights: number[]) => {
    let l = 0;
    let r = heights.length - 1;
    let leftMax = 0;
    let rightMax = 0;
    let water = 0;
    while (l < r) {
      if (heights[l] < heights[r]) {
        leftMax = Math.max(leftMax, heights[l]);
        water += leftMax - heights[l];
        l += 1;
      } else {
        rightMax = Math.max(rightMax, heights[r]);
        water += rightMax - heights[r];
        r -= 1;
      }
    }
    return water;
  },
  mergeKSorted: (lists: number[][]) => {
    // Simple correct reference: concatenate + sort (performance is not
    // what the reference validates — only expected outputs).
    return lists.flat().sort((a, b) => a - b);
  },
  maxSlidingWindow: (nums: number[], k: number) => {
    const deque: number[] = []; // indices, values decreasing
    const out: number[] = [];
    for (let i = 0; i < nums.length; i += 1) {
      while (deque.length && deque[0] <= i - k) deque.shift();
      while (deque.length && nums[deque[deque.length - 1]] <= nums[i]) deque.pop();
      deque.push(i);
      if (i >= k - 1) out.push(nums[deque[0]]);
    }
    return out;
  },
  isPowerOfTwo: (n: number) => n > 0 && (n & (n - 1)) === 0,
  trieOps: (operations: Array<[string, string]>) => {
    const root: Record<string, any> = {};
    return operations.map(([op, word]) => {
      if (op === 'insert') {
        let node = root;
        for (const ch of word) node = (node[ch] ??= {});
        node.isEnd = true;
        return null;
      }
      let node = root;
      for (const ch of word) {
        if (!node[ch]) return false;
        node = node[ch];
      }
      return op === 'search' ? node.isEnd === true : true;
    });
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
    '%s: starter code defines the expected executable function names',
    (_id, challenge) => {
      expect(challenge.starterCode.javascript).toContain(`function ${challenge.functionName.javascript}(`);
      expect(challenge.starterCode.python).toContain(`def ${challenge.functionName.python}(`);
    },
  );

  it.each(challenges.map((c): [string, CodingChallenge] => [c.id, c]))(
    '%s: provides starter code for every supported language',
    (_id, challenge) => {
      for (const language of CODING_LANGUAGES) {
        expect(getCodingStarterCode(challenge, language).trim().length).toBeGreaterThan(20);
      }
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

describe('coding challenge bank — topic taxonomy (techinterview.org)', () => {
  it.each(challenges.map((c): [string, CodingChallenge] => [c.id, c]))(
    '%s: is tagged with at least one canonical topic, all valid',
    (_id, challenge) => {
      expect(challenge.topics.length).toBeGreaterThanOrEqual(1);
      for (const topic of challenge.topics) {
        expect(CODING_TOPICS).toContain(topic);
      }
      expect(new Set(challenge.topics).size).toBe(challenge.topics.length);
    },
  );

  it('groups every challenge under each of its topics', () => {
    const grouped = getCodingChallengesByTopic();
    // Grouping keys are exactly the canonical topic set, in canonical order.
    expect(Object.keys(grouped)).toEqual([...CODING_TOPICS]);
    for (const challenge of challenges) {
      for (const topic of challenge.topics) {
        expect(grouped[topic].map((c) => c.id)).toContain(challenge.id);
      }
    }
  });

  it('covers the full canonical taxonomy — no empty topics', () => {
    const grouped = getCodingChallengesByTopic();
    for (const topic of CODING_TOPICS) {
      expect(grouped[topic].length, `topic "${topic}" has no challenges`).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('buildCodingBrief', () => {
  it('is deterministic per company', () => {
    const guide = makeGuide({ company: 'Stripe' });
    expect(buildCodingBrief(guide).challenge.id).toBe(buildCodingBrief(guide).challenge.id);
  });

  it('maps guide rating to challenge tier: >=8 hard, >=6 medium, else easy', () => {
    expect(buildCodingBrief(makeGuide({ difficulty: 9 })).challenge.difficulty).toBe('hard');
    expect(buildCodingBrief(makeGuide({ difficulty: 8 })).challenge.difficulty).toBe('hard');
    expect(buildCodingBrief(makeGuide({ difficulty: 6 })).challenge.difficulty).toBe('medium');
    expect(buildCodingBrief(makeGuide({ difficulty: 3 })).challenge.difficulty).toBe('easy');
  });

  it('prefers domain-tagged challenges matching the company codingTopics', () => {
    const fintech = buildCodingBrief(makeGuide({
      difficulty: 6,
      codingTopics: ['Time-series processing for portfolio and trading analytics'],
    }));
    expect(fintech.challenge.id).toBe('max-drawdown');

    const infra = buildCodingBrief(makeGuide({
      difficulty: 8,
      codingTopics: ['Systems programming: cache design and memory management'],
    }));
    expect(infra.challenge.id).toBe('lru-cache');

    const graphs = buildCodingBrief(makeGuide({
      difficulty: 8,
      codingTopics: ['Graph algorithms and dependency resolution'],
    }));
    expect(graphs.challenge.id).toBe('course-schedule');
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

describe('getCodingPool', () => {
  it('is deterministic per company', () => {
    const guide = makeGuide({ company: 'Google' });
    expect(getCodingPool(guide).map((c) => c.id)).toEqual(getCodingPool(guide).map((c) => c.id));
  });

  it('opens with the same problem buildCodingBrief serves by default', () => {
    const guide = makeGuide({ company: 'Google', difficulty: 8 });
    expect(getCodingPool(guide)[0].id).toBe(buildCodingBrief(guide).challenge.id);
  });

  it('returns several distinct problems, capped at the pool size', () => {
    const pool = getCodingPool(makeGuide({ company: 'Google', difficulty: 8 }));
    expect(pool.length).toBeGreaterThan(1);
    expect(pool.length).toBeLessThanOrEqual(COMPANY_CODING_POOL_SIZE);
    expect(new Set(pool.map((c) => c.id)).size).toBe(pool.length);
  });
});

describe('getPreferredCodingLanguage', () => {
  it('uses explicit guide language signals', () => {
    expect(getPreferredCodingLanguage(makeGuide({
      company: 'Hudson River Trading',
      slug: 'hudson-river-trading',
      rawSummary: 'Coding: C++ is dominant. Python accepted for some rounds.',
    }))).toBe('cpp');

    expect(getPreferredCodingLanguage(makeGuide({
      company: 'Airbyte',
      slug: 'airbyte-interview-guide',
      rawSummary: 'Technical phone screen: Java, Python, or Kotlin.',
    }))).toBe('java');

    expect(getPreferredCodingLanguage(makeGuide({
      company: 'Microsoft',
      slug: 'microsoft',
      rawSummary: 'Teams use C#, .NET, TypeScript, and Azure services.',
    }))).toBe('csharp');
  });

  it('falls back by company/domain when no explicit language is published', () => {
    expect(getPreferredCodingLanguage(makeGuide({
      company: 'OpenAI',
      slug: 'openai',
      rawSummary: 'AI research company with inference systems and model work.',
    }))).toBe('python');

    expect(getPreferredCodingLanguage(makeGuide({
      company: 'Figma',
      slug: 'figma',
      rawSummary: 'Frontend, browser, React, TypeScript, product engineering.',
    }))).toBe('javascript');
  });
});

describe('selectNextCodingChallenge', () => {
  const guide = makeGuide({ company: 'Google', difficulty: 8 });

  it('serves the opening problem when nothing is solved yet', () => {
    expect(selectNextCodingChallenge(guide, []).id).toBe(getCodingPool(guide)[0].id);
  });

  it('advances past solved problems to the next unsolved one', () => {
    const pool = getCodingPool(guide);
    const solved = [pool[0].id];
    expect(selectNextCodingChallenge(guide, solved).id).toBe(pool[1].id);
  });

  it('skips every solved problem in the pool', () => {
    const pool = getCodingPool(guide);
    const solved = pool.slice(0, 2).map((c) => c.id);
    expect(selectNextCodingChallenge(guide, solved).id).toBe(pool[2].id);
  });

  it('rotates back through the pool once all problems are solved', () => {
    const pool = getCodingPool(guide);
    const allSolved = pool.map((c) => c.id);
    const next = selectNextCodingChallenge(guide, allSolved);
    expect(pool.map((c) => c.id)).toContain(next.id);
  });
});
