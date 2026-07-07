import { describe, it, expect } from 'vitest';
import {
  SYSTEM_DESIGN_PATTERNS,
  buildQuestLine,
  buildQuestStagePrompt,
  buildSystemDesignBrief,
  getStageFallbackQuestions,
  getSystemDesignPool,
  isStageCleared,
  selectNextSystemDesignChallenge,
} from './companyQuests';
import { LocalInterviewGuide } from './localInterviewGuides';

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

describe('buildQuestLine', () => {
  it('always includes screening, coding, behavioral, and final in order', () => {
    const ids = buildQuestLine(makeGuide()).map((s) => s.id);
    expect(ids).toEqual(['screening', 'coding', 'behavioral', 'final']);
  });

  it('adds system design when the guide has system design topics', () => {
    const ids = buildQuestLine(makeGuide({ systemDesignTopics: ['Design a URL shortener'] })).map((s) => s.id);
    expect(ids).toContain('system_design');
    expect(ids.indexOf('system_design')).toBeGreaterThan(ids.indexOf('coding'));
    expect(ids.indexOf('system_design')).toBeLessThan(ids.indexOf('behavioral'));
  });

  it('detects system design from stage descriptions', () => {
    const guide = makeGuide({ interviewStages: ['System Design (1 round): scalable systems'] });
    expect(buildQuestLine(guide).map((s) => s.id)).toContain('system_design');
  });

  it('adds values round when the guide has values questions', () => {
    const guide = makeGuide({
      sampleQuestions: { coding: [], behavioral: [], systemDesign: [], values: ['Why us?'], other: [] },
    });
    const ids = buildQuestLine(guide).map((s) => s.id);
    expect(ids).toContain('values');
  });

  it('uses a 75-point clear threshold for every stage', () => {
    const easy = buildQuestLine(makeGuide({ difficulty: 6 }));
    const hard = buildQuestLine(makeGuide({ difficulty: 8.5 }));

    expect(easy.find((s) => s.id === 'coding')!.passThreshold).toBe(75);
    expect(easy.find((s) => s.id === 'final')!.passThreshold).toBe(75);
    expect(hard.find((s) => s.id === 'coding')!.passThreshold).toBe(75);
    expect(hard.find((s) => s.id === 'final')!.passThreshold).toBe(75);
  });
});

describe('buildQuestStagePrompt', () => {
  it('includes company context and stage focus', () => {
    const guide = makeGuide();
    const stage = buildQuestLine(guide)[0];
    const prompt = buildQuestStagePrompt(guide, stage);

    expect(prompt).toContain('Company: TestCo');
    expect(prompt).toContain('Recruiter screen');
    expect(prompt).toContain('Stage focus:');
  });
});

describe('getStageFallbackQuestions', () => {
  it('provides at least 3 questions for every stage kind', () => {
    const guide = makeGuide({
      systemDesignTopics: ['Design something'],
      sampleQuestions: { coding: [], behavioral: [], systemDesign: [], values: ['Why?'], other: [] },
    });
    for (const stage of buildQuestLine(guide)) {
      const questions = getStageFallbackQuestions('TestCo', stage);
      expect(questions.length).toBeGreaterThanOrEqual(3);
      expect(new Set(questions).size).toBe(questions.length);
    }
  });

  it('personalizes screening and values questions with the company name', () => {
    const guide = makeGuide();
    const screening = buildQuestLine(guide)[0];
    const questions = getStageFallbackQuestions('Stripe', screening);
    expect(questions.some((q) => q.includes('Stripe'))).toBe(true);
  });
});

describe('buildSystemDesignBrief', () => {
  it('uses a guide system design topic when available', () => {
    const guide = makeGuide({ systemDesignTopics: ['Design a distributed rate limiter'] });
    const brief = buildSystemDesignBrief(guide);
    expect(brief.challengeId).toBe('guide-design-a-distributed-rate-limiter-0');
    expect(brief.challenge).toContain('rate limiter');
    expect(brief.category).toBe('System Design');
    expect(brief.focus).toContain('company-specific');
    expect(brief.requirements.length).toBeGreaterThanOrEqual(3);
    expect(brief.prompt).toContain('Requirements:');
  });

  it('falls back to a company-flavored challenge with no topics', () => {
    const guide = makeGuide({ company: 'Acme', systemDesignTopics: [] });
    const brief = buildSystemDesignBrief(guide);
    expect(brief.challenge).toContain('Acme');
  });

  it('normalizes a non-"design" topic into a design challenge', () => {
    const guide = makeGuide({ company: 'Acme', systemDesignTopics: ['E-commerce checkout systems'] });
    const brief = buildSystemDesignBrief(guide);
    expect(brief.challenge.toLowerCase()).toContain('design');
    expect(brief.challenge).toContain('Acme');
  });

  it('draws the topic-less fallback from the classic system design canon', () => {
    const brief = buildSystemDesignBrief(makeGuide({ company: 'Acme', systemDesignTopics: [] }));
    const canonTitles = SYSTEM_DESIGN_PATTERNS
      .filter((p) => p.category === 'System Design')
      .map((p) => p.title);
    expect(canonTitles.some((title) => brief.challenge.startsWith(title))).toBe(true);
  });

  it('builds a prompt from a selected system design challenge', () => {
    const guide = makeGuide({ company: 'FinCo', systemDesignTopics: [] });
    const financePrompt = SYSTEM_DESIGN_PATTERNS.find((p) => p.id === 'personal-finance')!;
    const brief = buildSystemDesignBrief(guide, financePrompt);
    expect(brief.challengeId).toBe('personal-finance');
    expect(brief.challenge).toContain('FinCo');
    expect(brief.prompt).toContain('Mobile System Design');
    expect(brief.prompt).toContain(financePrompt.focus);
  });
});

describe('getSystemDesignPool', () => {
  it('turns multiple guide topics into multiple company prompts', () => {
    const pool = getSystemDesignPool(makeGuide({
      systemDesignTopics: [
        'Design a low-latency market data platform',
        'Design portfolio rebalancing workflows',
      ],
    }));
    expect(pool[0].id).toBe('guide-design-a-low-latency-market-data-platform-0');
    expect(pool[1].id).toBe('guide-design-portfolio-rebalancing-workflows-1');
    expect(pool.length).toBeGreaterThanOrEqual(3);
  });

  it('ranks catalog prompts by company domain tags', () => {
    const pool = getSystemDesignPool(makeGuide({
      company: 'Wealthfront',
      slug: 'wealthfront',
      systemDesignTopics: [],
      codingTopics: ['portfolio', 'finance', 'tax lots'],
    }));
    expect(pool.map((p) => p.id)).toContain('personal-finance');
  });

  it('selects the first uncleared prompt and rotates after all are cleared', () => {
    const guide = makeGuide({
      systemDesignTopics: ['Design search indexing', 'Design offline sync'],
    });
    const pool = getSystemDesignPool(guide);
    expect(selectNextSystemDesignChallenge(guide, [pool[0].id]).id).toBe(pool[1].id);
    expect(selectNextSystemDesignChallenge(guide, pool.map((p) => p.id)).id).toBe(pool[0].id);
  });
});

describe('SYSTEM_DESIGN_PATTERNS (techinterview.org catalog)', () => {
  it('includes the classic system design canon', () => {
    const ids = SYSTEM_DESIGN_PATTERNS.filter((p) => p.category === 'System Design').map((p) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining(['url-shortener', 'twitter', 'rate-limiter', 'discord', 'news-feed']),
    );
  });

  it('includes a mobile system design track', () => {
    const mobile = SYSTEM_DESIGN_PATTERNS.filter((p) => p.category === 'Mobile System Design');
    expect(mobile.length).toBeGreaterThanOrEqual(10);
    expect(mobile.map((p) => p.id)).toEqual(
      expect.arrayContaining(['encrypted-messenger', 'public-transit']),
    );
  });

  it('has unique ids and a focus line for every pattern', () => {
    const ids = SYSTEM_DESIGN_PATTERNS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const pattern of SYSTEM_DESIGN_PATTERNS) {
      expect(pattern.title.length).toBeGreaterThan(0);
      expect(pattern.focus.length).toBeGreaterThan(0);
    }
  });
});

describe('isStageCleared', () => {
  const stage = { ...buildQuestLine(makeGuide())[1] }; // coding, threshold 75

  it('handles 0-100 scores', () => {
    expect(isStageCleared(75, stage)).toBe(true);
    expect(isStageCleared(74, stage)).toBe(false);
  });

  it('handles 0-10 scores via normalization', () => {
    expect(isStageCleared(7.5, stage)).toBe(true);
    expect(isStageCleared(6.5, stage)).toBe(false);
  });

  it('handles missing scores', () => {
    expect(isStageCleared(undefined, stage)).toBe(false);
  });
});
