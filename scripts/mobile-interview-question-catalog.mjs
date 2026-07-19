/**
 * Shared, server-side equivalent of the web quest's getStageQuestionPool().
 *
 * Web reads `data/interview-guides/*.json` and `quest-category-banks.json`.
 * The native app must never invent a different sequence, so both the Cloud
 * Function fallback catalog and the Firestore sync consume this module.
 */

const CANDIDATE_QUESTION_PATTERNS = [
  /^(do|can|will|should|would|am|are|is) i\b/i,
  /\bdo i (need|have to|get)\b/i,
  /\bhow (hard|difficult|tough|intense) (is|are)\b/i,
  /\bhow does .+ compare (to|with|against)\b/i,
  /\b(is|are) (it|they|the \w+) (worth|really|actually|still)\b/i,
  /\bworth (joining|it|the equity)\b/i,
  /\bwhat('s| is) it like\b/i,
  /\bwhat('s| is) (the )?(engineering|company|team) (culture|bar)\b/i,
  /\bremote.friendly\b|\bwork.life balance\b|\bwlb\b/i,
  /\b(ipo|acquisition|merger|layoffs?|funding|valuation|stock price|equity)\b.*\b(outlook|worth|valuable|changed|affect|impact|going|happening|recovery)\b/i,
  /\bhow (has|did) .+ (acquisition|merger|deal|ipo) (change|affect|impact)/i,
  /\bwhat('s| is) happening\b/i,
  /\bstill (hiring|worth|growing)\b/i,
  /\b(the|their) (interviews?|coding rounds?|onsite|process|loop)\b.*\breally\b/i,
  /\bhow long (does|is) (the )?(process|loop|interview)\b/i,
  /\b(lowball|down.?level|negotiat)/i,
  /\b(comp|compensation|salary|pay|equity|rsu)s?\b.*\b(good|competitive|fair|top|real)\b/i,
];

const TIER_FALLBACK = {
  easy: ['easy', 'medium', 'hard'],
  medium: ['medium', 'easy', 'hard'],
  hard: ['hard', 'medium', 'easy'],
};

// CompanyQuestPage takes the first five questions from the canonical stage
// pool before starting a Web quest. Native must receive that exact sequence,
// rather than exposing every difficulty tier as a longer, different session.
export const WEB_QUEST_STAGE_QUESTION_LIMIT = 5;

const unique = (...lists) => {
  const seen = new Set();
  const result = [];
  for (const list of lists) {
    for (const raw of list ?? []) {
      const question = String(raw ?? '').trim();
      if (!question || seen.has(question)) continue;
      seen.add(question);
      result.push(question);
    }
  }
  return result;
};

const isCandidateDirectedQuestion = (question) =>
  CANDIDATE_QUESTION_PATTERNS.some((pattern) => pattern.test(question));

const guideQuestionPool = (guide, mode) => {
  const questions = guide.sampleQuestions ?? {};
  const modeKey = String(mode).toLowerCase();
  const preferred = modeKey === 'technical'
    ? [...(questions.coding ?? []), ...(questions.systemDesign ?? [])]
    : modeKey === 'behavioral'
      ? [...(questions.behavioral ?? []), ...(questions.values ?? [])]
      : modeKey === 'screening'
        ? [...(questions.values ?? []), ...(questions.behavioral ?? [])]
        : [
          ...(questions.coding ?? []),
          ...(questions.systemDesign ?? []),
          ...(questions.behavioral ?? []),
          ...(questions.values ?? []),
        ];
  const fallback = [
    ...(questions.coding ?? []),
    ...(questions.systemDesign ?? []),
    ...(questions.behavioral ?? []),
    ...(questions.values ?? []),
  ];

  return unique(preferred.length ? preferred : fallback)
    .filter((question) => !isCandidateDirectedQuestion(question));
};

const resolveQuestDifficulty = (rating) => {
  const normalized = rating ?? 5;
  return normalized >= 8 ? 'hard' : normalized >= 6 ? 'medium' : 'easy';
};

const categoryStageQuestions = (guide, banks, stage, difficulty) => {
  const category = banks.companyCategory?.[guide.slug];
  if (!category) {
    throw new Error(`Missing category assignment for ${guide.slug}; update quest-category-banks.json before generating the mobile catalog.`);
  }
  const stageBank = banks.questionBanks?.[category]?.[stage];
  if (!stageBank) return [];
  return unique(...TIER_FALLBACK[difficulty].map((tier) =>
    (stageBank[tier] ?? []).map((question) => String(question).replace(/\{company\}/g, guide.company)),
  ));
};

/** Returns the exact Web-quest pool for all six native stage ids. */
export const getMobileQuestionBuckets = (guide, banks) => {
  const questions = guide.sampleQuestions ?? {};
  const technical = guideQuestionPool(guide, 'Technical');
  const behavioral = guideQuestionPool(guide, 'Behavioral');
  const mixed = guideQuestionPool(guide, 'Mixed');
  const screeningDifficulty = resolveQuestDifficulty(Math.min(guide.difficulty ?? 5, 6));
  const stageDifficulty = resolveQuestDifficulty(guide.difficulty);
  const screeningCategory = categoryStageQuestions(guide, banks, 'screening', screeningDifficulty);
  const behavioralCategory = categoryStageQuestions(guide, banks, 'behavioral', stageDifficulty);
  const valuesCategory = categoryStageQuestions(guide, banks, 'values', stageDifficulty);
  const finalCategory = categoryStageQuestions(guide, banks, 'final', stageDifficulty);

  const websiteSequence = (questions) => questions.slice(0, WEB_QUEST_STAGE_QUESTION_LIMIT);

  return {
    // `coding` and `system_design` both use Web's Technical-stage pool.
    coding: websiteSequence(technical),
    systemDesign: websiteSequence(technical),
    screening: websiteSequence(unique(screeningCategory, questions.values)),
    behavioral: websiteSequence(unique(questions.behavioral, behavioralCategory, behavioral)),
    values: websiteSequence(unique(questions.values, valuesCategory, behavioral)),
    final: websiteSequence(unique(finalCategory, mixed)),
  };
};

export const buildMobileInterviewQuestionCatalog = (guides, banks) => Object.fromEntries(
  guides
    .filter((guide) => guide?.slug && guide?.company)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((guide) => [guide.slug, {
      company: guide.company,
      sourceURL: guide.url ?? '',
      stageQuestions: getMobileQuestionBuckets(guide, banks),
    }]),
);
