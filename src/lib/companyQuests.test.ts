import { describe, it, expect } from 'vitest';
import { buildQuestLine, buildQuestStagePrompt, buildSystemDesignBrief, getStageFallbackQuestions, isStageCleared } from './companyQuests';
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

  it('raises pass thresholds for hard companies and the final round', () => {
    const easy = buildQuestLine(makeGuide({ difficulty: 6 }));
    const hard = buildQuestLine(makeGuide({ difficulty: 8.5 }));

    expect(easy.find((s) => s.id === 'coding')!.passThreshold).toBe(70);
    expect(easy.find((s) => s.id === 'final')!.passThreshold).toBe(75);
    expect(hard.find((s) => s.id === 'coding')!.passThreshold).toBe(75);
    expect(hard.find((s) => s.id === 'final')!.passThreshold).toBe(80);
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
    expect(brief.challenge).toContain('rate limiter');
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
});

describe('isStageCleared', () => {
  const stage = { ...buildQuestLine(makeGuide())[1] }; // coding, threshold 70

  it('handles 0-100 scores', () => {
    expect(isStageCleared(72, stage)).toBe(true);
    expect(isStageCleared(69, stage)).toBe(false);
  });

  it('handles 0-10 scores via normalization', () => {
    expect(isStageCleared(7.5, stage)).toBe(true);
    expect(isStageCleared(6.5, stage)).toBe(false);
  });

  it('handles missing scores', () => {
    expect(isStageCleared(undefined, stage)).toBe(false);
  });
});
