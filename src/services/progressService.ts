import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { InterviewAnalysis, UserProgress, XpEvent, XpEventType } from '../types';
import {
  applyXpEvent,
  initialProgress,
  interviewXp,
  localDayString,
  XP_RULES,
} from '../lib/gamification';

export interface AwardOutcome {
  awarded: boolean;
  xpGained: number;
  leveledUp: boolean;
  newBadgeIds: string[];
  progress: UserProgress | null;
}

const NOOP_OUTCOME: AwardOutcome = {
  awarded: false,
  xpGained: 0,
  leveledUp: false,
  newBadgeIds: [],
  progress: null,
};

export const progressSummaryRef = (uid: string) =>
  doc(db, 'users', uid, 'progress', 'summary');

const progressEventRef = (uid: string, eventId: string) =>
  doc(db, 'users', uid, 'progress', 'summary', 'events', eventId);

/** Firestore doc ids cannot contain '/'; keep ids conservative. */
const sanitizeEventId = (id: string): string => id.replace(/[^\w.-]/g, '_').slice(0, 200);

export interface AwardXpInput {
  type: XpEventType;
  /** Deterministic dedupe key. Awarding twice with the same key is a no-op. */
  dedupeId: string;
  /** Override the rule-book amount (e.g. score-based interview XP). */
  xp?: number;
  meta?: XpEvent['meta'];
}

/**
 * Idempotently award XP: writes an event doc keyed by dedupeId and updates
 * the progress summary in one transaction. Safe to call fire-and-forget.
 */
export const awardXp = async (uid: string, input: AwardXpInput): Promise<AwardOutcome> => {
  const eventId = sanitizeEventId(input.dedupeId);
  const now = Date.now();
  const event: XpEvent = {
    id: eventId,
    type: input.type,
    xp: input.xp ?? XP_RULES[input.type],
    createdAt: now,
    ...(input.meta ? { meta: input.meta } : {}),
  };

  return runTransaction(db, async (tx) => {
    const eventRef = progressEventRef(uid, eventId);
    const existing = await tx.get(eventRef);
    if (existing.exists()) return NOOP_OUTCOME;

    const summaryRef = progressSummaryRef(uid);
    const summarySnap = await tx.get(summaryRef);
    const prev: UserProgress = summarySnap.exists()
      ? (summarySnap.data() as UserProgress)
      : initialProgress(now);

    const result = applyXpEvent(prev, event, localDayString());

    tx.set(eventRef, event);
    tx.set(summaryRef, result.progress);

    return {
      awarded: true,
      xpGained: result.xpGained,
      leveledUp: result.leveledUp,
      newBadgeIds: result.newBadges.map((b) => b.id),
      progress: result.progress,
    };
  });
};

/** Award XP for a saved interview analysis. Idempotent per analysis id. */
export const awardInterviewCompletion = async (
  uid: string,
  analysis: Pick<InterviewAnalysis, 'id' | 'overallScore'>,
): Promise<AwardOutcome> => {
  const { xp, passed, excellent } = interviewXp({ overallScore: analysis.overallScore });
  return awardXp(uid, {
    type: 'interview_completed',
    dedupeId: `interview_${analysis.id}`,
    xp,
    meta: { passed, excellent, overallScore: analysis.overallScore },
  });
};

/** Award the once-per-day login XP. Idempotent per local calendar day. */
export const awardDailyLogin = async (uid: string): Promise<AwardOutcome> =>
  awardXp(uid, {
    type: 'daily_login',
    dedupeId: `login_${localDayString()}`,
  });
