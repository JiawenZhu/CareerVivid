import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, query, where, limit, orderBy } from 'firebase/firestore';

export type QuestionType = 'coding' | 'behavioral' | 'system_design' | 'values' | 'other';

export interface InterviewGuide {
  company: string;
  slug: string;
  url: string;
  scrapedAt: string;
  difficulty: number | null;
  interviewStages: string[];
  codingTopics: string[];
  systemDesignTopics: string[];
  behavioralTopics: string[];
  tips: string[];
  compensation: string[] | null;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  type: QuestionType;
  company: string;
  slug: string;
  difficulty: number | null;
  source: string;
}

export interface MockInterviewContext {
  guide: InterviewGuide;
  questions: Record<QuestionType, InterviewQuestion[]>;
}

/** Fetch a company interview guide by slug. */
export async function getInterviewGuide(slug: string): Promise<InterviewGuide | null> {
  const snap = await getDoc(doc(db, 'interviewGuides', slug));
  if (!snap.exists()) return null;
  return snap.data() as InterviewGuide;
}

/** Fetch questions for a company, optionally filtered by type. */
export async function getCompanyQuestions(
  slug: string,
  options: { type?: QuestionType; maxPerType?: number } = {},
): Promise<InterviewQuestion[]> {
  const { type, maxPerType = 5 } = options;
  const qRef = collection(db, 'interviewGuides', slug, 'questions');

  const q = type
    ? query(qRef, where('type', '==', type), limit(maxPerType))
    : query(qRef, limit(maxPerType * 5));

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as InterviewQuestion));
}

/**
 * Build the full context object for a mock interview session.
 * Fetches the guide + questions grouped by type.
 */
export async function buildMockInterviewContext(
  slug: string,
  questionsPerType = 3,
): Promise<MockInterviewContext | null> {
  const guide = await getInterviewGuide(slug);
  if (!guide) return null;

  const allQuestions = await getCompanyQuestions(slug, { maxPerType: questionsPerType * 5 });

  const grouped: Record<QuestionType, InterviewQuestion[]> = {
    coding: [],
    behavioral: [],
    system_design: [],
    values: [],
    other: [],
  };

  for (const q of allQuestions) {
    const bucket = grouped[q.type] ?? grouped.other;
    if (bucket.length < questionsPerType) bucket.push(q);
  }

  return { guide, questions: grouped };
}

/**
 * Build a prompt string for the AI agent to generate interview questions
 * for a given company context. Used when the DB has few/no questions.
 */
export function buildGuidePrompt(guide: InterviewGuide): string {
  const lines = [
    `You are a senior technical interviewer at ${guide.company}.`,
    ``,
    `## Company Interview Context`,
    `Difficulty: ${guide.difficulty ? `${guide.difficulty}/10` : 'not rated'}`,
    ``,
    `### Interview Stages`,
    ...guide.interviewStages.map(s => `- ${s}`),
    ``,
    `### Coding Topics`,
    ...guide.codingTopics.map(t => `- ${t}`),
    ``,
    `### System Design Topics`,
    ...guide.systemDesignTopics.map(t => `- ${t}`),
    ``,
    `### Behavioral Focus`,
    ...guide.behavioralTopics.map(t => `- ${t}`),
    ``,
    `### Preparation Tips (for your context)`,
    ...guide.tips.slice(0, 5).map(t => `- ${t}`),
    ``,
    `Based on the above, generate realistic interview questions that a ${guide.company} engineer would ask.`,
    `Return JSON with this shape:`,
    `{ "coding": [...], "behavioral": [...], "system_design": [...], "values": [...] }`,
    `Each array should have 3–5 specific, realistic questions.`,
  ];

  return lines.join('\n');
}

/** Search for a company guide by display name (case-insensitive prefix). */
export async function searchCompanyGuides(namePrefix: string): Promise<InterviewGuide[]> {
  const upper = namePrefix.toUpperCase();
  const q = query(
    collection(db, 'interviewGuides'),
    orderBy('company'),
    where('company', '>=', upper),
    where('company', '<=', upper + ''),
    limit(10),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as InterviewGuide);
}
