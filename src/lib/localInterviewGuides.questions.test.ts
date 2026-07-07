import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  LocalInterviewGuide,
  getGuideQuestionPool,
  isCandidateDirectedQuestion,
} from './localInterviewGuides';

/**
 * Guards the AI interviewer's question pipeline.
 *
 * The guide data mixes two kinds of questions:
 *  - interviewer → candidate (coding, systemDesign, behavioral, values)
 *  - candidate → company FAQs ("Do I need a finance background?") in `other`
 *
 * The interviewer must never ask the second kind. These tests verify the
 * filter logic AND scan every guide JSON on disk, so contaminated data or a
 * regression in the pool logic fails CI before it reaches a mock interview.
 */

const GUIDES_DIR = join(__dirname, '../../data/interview-guides');

const loadAllGuides = (): Array<{ file: string; guide: LocalInterviewGuide }> =>
  readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((file) => ({
      file,
      guide: JSON.parse(readFileSync(join(GUIDES_DIR, file), 'utf8')) as LocalInterviewGuide,
    }));

describe('isCandidateDirectedQuestion', () => {
  it('flags candidate-facing FAQ questions', () => {
    const candidateQuestions = [
      'Do I need a finance background?',
      'How algorithmically hard are the coding rounds really?',
      'Is equity really valuable if Wealthfront stays private?',
      'How does Wealthfront compare to Robinhood on interviews?',
      "What's happening post-UBS-deal?",
      'Is Klaviyo remote-friendly?',
      "What's the IPO outlook?",
      'What is the engineering culture?',
      'Should I negotiate the offer?',
      'How has Cisco acquisition changed Splunk?',
      'Do I need to know Lucene internally?',
    ];
    for (const q of candidateQuestions) {
      expect(isCandidateDirectedQuestion(q), q).toBe(true);
    }
  });

  it('does not flag legitimate interviewer questions', () => {
    const interviewerQuestions = [
      'Given an array of integers, find the two numbers that add up to a target value.',
      'How would you design tax-aware rebalancing that respects both target allocations and wash-sale avoidance?',
      'Given this portfolio of returns, calculate Sharpe ratio. What assumptions are you making?',
      'Tell me about a time you disagreed with a teammate or manager. How did it resolve?',
      'Walk me through your background and what brings you to this role.',
      'Design a rate limiter for a public API. Discuss algorithms and failure modes.',
      'How would you detect a cycle in a linked list? Compare at least two approaches.',
      'Describe a project that failed or fell short. What did you learn?',
      'What would you do in your first 90 days on this team?',
    ];
    for (const q of interviewerQuestions) {
      expect(isCandidateDirectedQuestion(q), q).toBe(false);
    }
  });
});

describe('getGuideQuestionPool', () => {
  const guideWithFaqs: LocalInterviewGuide = {
    company: 'Wealthfront',
    slug: 'wealthfront',
    url: 'https://example.com',
    scrapedAt: '2026-07-01T00:00:00.000Z',
    interviewStages: [],
    codingTopics: [],
    systemDesignTopics: [],
    behavioralTopics: [],
    sampleQuestions: {
      coding: [],
      behavioral: ['Tell me about a time you led a project.'],
      systemDesign: ['How would you design tax-aware rebalancing?'],
      values: [],
      other: [
        'How algorithmically hard are the coding rounds really?',
        'Do I need a finance background?',
        'Is equity really valuable if Wealthfront stays private?',
      ],
    },
    difficulty: 7,
    tips: [],
    compensation: null,
  };

  it('never includes the candidate-FAQ `other` bucket in any mode', () => {
    for (const mode of ['Technical', 'Behavioral', 'Screening', 'Mixed']) {
      const pool = getGuideQuestionPool(guideWithFaqs, mode);
      for (const q of pool) {
        expect(guideWithFaqs.sampleQuestions.other, `mode=${mode}: "${q}"`).not.toContain(q);
        expect(isCandidateDirectedQuestion(q), `mode=${mode}: "${q}"`).toBe(false);
      }
    }
  });

  it('still returns interviewer questions', () => {
    expect(getGuideQuestionPool(guideWithFaqs, 'Behavioral')).toContain('Tell me about a time you led a project.');
    expect(getGuideQuestionPool(guideWithFaqs, 'Technical')).toContain('How would you design tax-aware rebalancing?');
  });
});

describe('guide data on disk — full scan', () => {
  const guides = loadAllGuides();

  it('loads a meaningful number of guides', () => {
    expect(guides.length).toBeGreaterThan(100);
  });

  it('has no candidate-directed questions in interviewer-facing buckets', () => {
    const offenders: string[] = [];
    for (const { file, guide } of guides) {
      const sq = guide.sampleQuestions ?? ({} as LocalInterviewGuide['sampleQuestions']);
      for (const bucket of ['coding', 'systemDesign', 'behavioral', 'values'] as const) {
        for (const q of sq[bucket] ?? []) {
          if (isCandidateDirectedQuestion(q)) offenders.push(`${file} [${bucket}]: ${q}`);
        }
      }
    }
    expect(offenders, `Candidate-directed questions found in interviewer buckets:\n${offenders.join('\n')}`)
      .toEqual([]);
  });

  it('produces clean interviewer pools for every guide and mode', () => {
    const offenders: string[] = [];
    for (const { file, guide } of guides) {
      for (const mode of ['Technical', 'Behavioral', 'Screening', 'Mixed']) {
        for (const q of getGuideQuestionPool(guide, mode)) {
          if (isCandidateDirectedQuestion(q)) offenders.push(`${file} (${mode}): ${q}`);
        }
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});
