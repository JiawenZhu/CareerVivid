import { LocalInterviewGuide, buildLocalInterviewGuidePrompt, getGuideQuestionPool } from './localInterviewGuides';
import { normalizeScore } from './gamification';

export type QuestStageKind =
  | 'screening'
  | 'coding'
  | 'system_design'
  | 'behavioral'
  | 'values'
  | 'final';

export type QuestInterviewMode = 'Behavioral' | 'Technical' | 'Mixed' | 'Screening';

export interface QuestStage {
  id: QuestStageKind;
  title: string;
  description: string;
  mode: QuestInterviewMode;
  /** Normalized 0-100 score required to clear the stage. */
  passThreshold: number;
}

const STAGE_BLUEPRINTS: Record<QuestStageKind, Omit<QuestStage, 'passThreshold'>> = {
  screening: {
    id: 'screening',
    title: 'Recruiter screen',
    description: 'Background, motivation, and role fit — make a clean first impression.',
    mode: 'Screening',
  },
  coding: {
    id: 'coding',
    title: 'Coding round',
    description: 'Technical problem solving in the company\'s style.',
    mode: 'Technical',
  },
  system_design: {
    id: 'system_design',
    title: 'System design',
    description: 'Architecture, trade-offs, and scale.',
    mode: 'Technical',
  },
  behavioral: {
    id: 'behavioral',
    title: 'Behavioral round',
    description: 'Past experience, teamwork, and impact — STAR stories.',
    mode: 'Behavioral',
  },
  values: {
    id: 'values',
    title: 'Values round',
    description: 'Mission alignment and judgment on open-ended questions.',
    mode: 'Behavioral',
  },
  final: {
    id: 'final',
    title: 'Final round',
    description: 'Hiring manager wrap-up — everything can come up.',
    mode: 'Mixed',
  },
};

/**
 * Derive a quest line (ordered interview stages) from a company guide.
 * Every company gets screening, coding, behavioral, and final; system design
 * and values rounds appear when the guide shows evidence of them.
 */
export const buildQuestLine = (guide: LocalInterviewGuide): QuestStage[] => {
  const difficulty = guide.difficulty ?? 6;
  const basePass = difficulty >= 8 ? 75 : 70;

  const kinds: QuestStageKind[] = ['screening', 'coding'];

  const mentionsSystemDesign = guide.systemDesignTopics.length > 0
    || guide.interviewStages.some((s) => s.toLowerCase().includes('system design'));
  if (mentionsSystemDesign) kinds.push('system_design');

  kinds.push('behavioral');

  const hasValuesRound = (guide.sampleQuestions?.values?.length ?? 0) > 0
    || guide.interviewStages.some((s) => /values|safety|culture/i.test(s));
  if (hasValuesRound) kinds.push('values');

  kinds.push('final');

  return kinds.map((kind) => ({
    ...STAGE_BLUEPRINTS[kind],
    passThreshold: kind === 'final' ? basePass + 5 : basePass,
  }));
};

/** Interview prompt for one quest stage: full company context + stage focus. */
export const buildQuestStagePrompt = (guide: LocalInterviewGuide, stage: QuestStage): string => {
  const base = buildLocalInterviewGuidePrompt(guide, {
    mode: stage.mode,
    difficulty: 'Standard',
    duration: '15 min',
  });

  return [
    base,
    '',
    `This session is the "${stage.title}" stage of the ${guide.company} interview loop.`,
    `Stage focus: ${stage.description}`,
    'Stay in character for this stage only — do not mix in question types that belong to other stages.',
  ].join('\n');
};

/** Question pool for a stage, reusing the guide's mode-based pools. */
export const getStageQuestionPool = (guide: LocalInterviewGuide, stage: QuestStage): string[] => {
  const pool = getGuideQuestionPool(guide, stage.mode);
  if (stage.id === 'values') {
    const values = guide.sampleQuestions?.values ?? [];
    return values.length ? [...values, ...pool.filter((q) => !values.includes(q))] : pool;
  }
  return pool;
};

/**
 * Curated per-stage fallback questions, templated with the company name.
 * Used when the guide has too few questions and AI generation is unavailable,
 * so a quest stage can always start.
 */
export const getStageFallbackQuestions = (company: string, stage: QuestStage): string[] => {
  switch (stage.id) {
    case 'screening':
      return [
        `Walk me through your background and what brings you to ${company}.`,
        `What do you know about ${company}, and why do you want to work here?`,
        'What are you looking for in your next role?',
        'What is your proudest accomplishment in your current or most recent position?',
        'What is your timeline, and are you interviewing elsewhere?',
      ];
    case 'coding':
      return [
        'Given an array of integers, find the two numbers that add up to a target value. Talk through your approach, complexity, and edge cases.',
        'Design a data structure that supports insert, delete, and get-random in constant time. Explain your reasoning.',
        'Given a string, find the length of the longest substring without repeating characters. Walk through your solution.',
        'How would you detect a cycle in a linked list? Compare at least two approaches.',
        'Describe how you would test the solution you just wrote. What edge cases matter most?',
      ];
    case 'system_design':
      return [
        `Design a service at ${company}-scale that shortens URLs. Cover the API, storage, and how you handle hot keys.`,
        'Design a rate limiter for a public API. Discuss algorithms, distributed coordination, and failure modes.',
        'How would you design a news feed that serves millions of users? Focus on fan-out strategy and caching.',
        'A service you own suddenly sees 10x traffic. Walk me through how you diagnose and scale it.',
      ];
    case 'behavioral':
      return [
        'Tell me about a time you disagreed with a teammate or manager. How did it resolve?',
        'Describe a project that failed or fell short. What did you learn and change afterward?',
        'Tell me about a time you had to deliver under a tight deadline. What trade-offs did you make?',
        'Give me an example of when you took ownership of something outside your job description.',
        'Describe the piece of work you are most proud of. What was your specific contribution?',
      ];
    case 'values':
      return [
        `Why ${company} specifically, rather than other companies in this space?`,
        'Tell me about a time you had to make a decision where the right thing and the easy thing were different.',
        'How do you decide when to move fast versus when to be careful?',
        'What kind of team culture brings out your best work, and what have you done to build it?',
      ];
    case 'final':
      return [
        'Looking back at the whole process, what role do you see yourself playing here in your first six months?',
        'What questions do you have about the team, the roadmap, or how we work?',
        'Tell me about the hardest technical or product decision you have made. Would you make it again?',
        'What would make you turn down an offer from us?',
        'Is there anything we have not asked about that you think we should know?',
      ];
  }
};

export const isStageCleared = (bestScore: number | undefined, stage: QuestStage): boolean =>
  bestScore !== undefined && normalizeScore(bestScore) >= stage.passThreshold;

export interface SystemDesignBrief {
  challenge: string;
  requirements: string[];
  /** Full text passed to the vision grader. */
  prompt: string;
}

/**
 * Build a system design challenge for the whiteboard stage. Prefers a topic
 * pulled from the company's own guide; falls back to a classic prompt.
 */
export const buildSystemDesignBrief = (guide: LocalInterviewGuide): SystemDesignBrief => {
  const topics = guide.systemDesignTopics.filter((t) => t.trim().length > 0);
  const picked = topics[0];

  const challenge = picked
    ? cleanChallenge(picked, guide.company)
    : `Design a scalable backend service that ${guide.company} might run in production.`;

  const requirements = [
    'Show the major components and how requests flow between them.',
    'Include data storage and explain what each store holds.',
    'Handle scale: caching, load balancing, or partitioning where it matters.',
    'Call out at least one bottleneck or failure mode and how you address it.',
  ];

  const prompt = [
    `Challenge: ${challenge}`,
    '',
    'Requirements:',
    ...requirements.map((r) => `- ${r}`),
    '',
    `Design difficulty target: ${guide.difficulty ? `${guide.difficulty}/10` : 'standard'}.`,
  ].join('\n');

  return { challenge, requirements, prompt };
};

/** Turn a raw guide topic into a "Design ..." challenge sentence. */
const cleanChallenge = (topic: string, company: string): string => {
  const trimmed = topic.split(/[.\n]/)[0].trim();
  if (/^design\b/i.test(trimmed)) return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
  return `Design ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)} at ${company} scale.`;
};
