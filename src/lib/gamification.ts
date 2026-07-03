import { BadgeAward, ProgressCounters, StreakState, UserProgress, XpEvent, XpEventType } from '../types';

// --- XP rules ---

export const XP_RULES: Record<XpEventType, number> = {
  interview_completed: 50,
  daily_login: 10,
  resume_created: 20,
  lesson_completed: 25,
  quest_stage_cleared: 75,
  quest_completed: 300,
};

/** overallScore at or above this (on a 0–100 scale) counts as a pass. */
export const INTERVIEW_PASS_THRESHOLD = 70;
export const INTERVIEW_EXCELLENT_THRESHOLD = 85;
export const INTERVIEW_PASS_BONUS = 25;
export const INTERVIEW_EXCELLENT_BONUS = 50;

/** Some analyses score 0–10, others 0–100. Normalize to 0–100. */
export const normalizeScore = (score: number): number => {
  if (!Number.isFinite(score) || score <= 0) return 0;
  return score <= 10 ? score * 10 : Math.min(score, 100);
};

export interface InterviewXpInput {
  overallScore: number;
}

/** XP for a completed interview: base + score bonus. */
export const interviewXp = ({ overallScore }: InterviewXpInput): { xp: number; passed: boolean; excellent: boolean } => {
  const score = normalizeScore(overallScore);
  const excellent = score >= INTERVIEW_EXCELLENT_THRESHOLD;
  const passed = score >= INTERVIEW_PASS_THRESHOLD;
  const bonus = excellent ? INTERVIEW_EXCELLENT_BONUS : passed ? INTERVIEW_PASS_BONUS : 0;
  return { xp: XP_RULES.interview_completed + bonus, passed, excellent };
};

// --- Level curve ---
// XP needed to advance from level n to n+1 grows linearly: 100, 150, 200, ...
// Cumulative thresholds: L1=0, L2=100, L3=250, L4=450, L5=700, ...

export const xpToAdvanceFrom = (level: number): number => 100 + (level - 1) * 50;

export const totalXpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  const n = level - 1;
  // sum of arithmetic series: n terms starting at 100 with step 50
  return n * 100 + (n * (n - 1) * 50) / 2;
};

export const levelFromXp = (xp: number): number => {
  let level = 1;
  while (totalXpForLevel(level + 1) <= xp) level += 1;
  return level;
};

export interface LevelInfo {
  level: number;
  /** XP earned within the current level. */
  currentLevelXp: number;
  /** XP required to advance to the next level. */
  nextLevelXp: number;
  /** 0–1 progress toward the next level. */
  progress: number;
}

export const levelInfoFromXp = (xp: number): LevelInfo => {
  const level = levelFromXp(xp);
  const floor = totalXpForLevel(level);
  const nextLevelXp = xpToAdvanceFrom(level);
  const currentLevelXp = xp - floor;
  return {
    level,
    currentLevelXp,
    nextLevelXp,
    progress: Math.min(currentLevelXp / nextLevelXp, 1),
  };
};

// --- Streaks ---

/** Format a date as a local-calendar YYYY-MM-DD string. */
export const localDayString = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Day string for the day before the given day string (DST-safe via noon anchor). */
export const previousDayString = (day: string): string => {
  const anchor = new Date(`${day}T12:00:00`);
  anchor.setDate(anchor.getDate() - 1);
  return localDayString(anchor);
};

export const advanceStreak = (streak: StreakState, today: string): StreakState => {
  if (streak.lastActiveDay === today) return streak;
  const current = streak.lastActiveDay === previousDayString(today) ? streak.current + 1 : 1;
  return {
    current,
    longest: Math.max(streak.longest, current),
    lastActiveDay: today,
  };
};

// --- Badges ---

export interface BadgeDefinition {
  id: string;
  label: string;
  description: string;
  earned: (progress: UserProgress) => boolean;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_interview',
    label: 'First rep',
    description: 'Complete your first mock interview.',
    earned: (p) => p.counters.interviewsCompleted >= 1,
  },
  {
    id: 'interviews_10',
    label: 'Well drilled',
    description: 'Complete 10 mock interviews.',
    earned: (p) => p.counters.interviewsCompleted >= 10,
  },
  {
    id: 'first_pass',
    label: 'Cleared the bar',
    description: 'Score 70+ in a mock interview.',
    earned: (p) => p.counters.interviewsPassed >= 1,
  },
  {
    id: 'streak_3',
    label: 'Warming up',
    description: 'Practice 3 days in a row.',
    earned: (p) => p.streak.current >= 3 || p.streak.longest >= 3,
  },
  {
    id: 'streak_7',
    label: 'On fire',
    description: 'Practice 7 days in a row.',
    earned: (p) => p.streak.current >= 7 || p.streak.longest >= 7,
  },
  {
    id: 'level_5',
    label: 'Momentum',
    description: 'Reach level 5.',
    earned: (p) => p.level >= 5,
  },
];

export const getBadgeDefinition = (id: string): BadgeDefinition | undefined =>
  BADGE_DEFINITIONS.find((b) => b.id === id);

// --- Progress state machine ---

export const initialProgress = (now: number = Date.now()): UserProgress => ({
  xp: 0,
  level: 1,
  streak: { current: 0, longest: 0, lastActiveDay: '' },
  badges: [],
  counters: {
    interviewsCompleted: 0,
    interviewsPassed: 0,
    lessonsCompleted: 0,
    questStagesCleared: 0,
  },
  updatedAt: now,
});

const advanceCounters = (counters: ProgressCounters, event: XpEvent): ProgressCounters => {
  const next = { ...counters };
  switch (event.type) {
    case 'interview_completed':
      next.interviewsCompleted += 1;
      if (event.meta?.passed === true) next.interviewsPassed += 1;
      break;
    case 'lesson_completed':
      next.lessonsCompleted += 1;
      break;
    case 'quest_stage_cleared':
      next.questStagesCleared += 1;
      break;
  }
  return next;
};

/** Event types that count as "activity" for streak purposes (login alone doesn't). */
const STREAK_QUALIFYING: Set<XpEventType> = new Set([
  'interview_completed',
  'lesson_completed',
  'quest_stage_cleared',
  'quest_completed',
]);

export interface ApplyResult {
  progress: UserProgress;
  xpGained: number;
  leveledUp: boolean;
  newBadges: BadgeAward[];
}

/**
 * Pure reducer: applies one XP event to a progress snapshot.
 * Deduplication is the caller's responsibility (event id as Firestore doc id).
 */
export const applyXpEvent = (
  prev: UserProgress,
  event: XpEvent,
  today: string = localDayString(),
): ApplyResult => {
  const xp = prev.xp + event.xp;
  const level = levelFromXp(xp);
  const streak = STREAK_QUALIFYING.has(event.type) ? advanceStreak(prev.streak, today) : prev.streak;
  const counters = advanceCounters(prev.counters, event);

  const candidate: UserProgress = {
    xp,
    level,
    streak,
    counters,
    badges: prev.badges,
    updatedAt: event.createdAt,
  };

  const earnedIds = new Set(prev.badges.map((b) => b.id));
  const newBadges: BadgeAward[] = BADGE_DEFINITIONS
    .filter((def) => !earnedIds.has(def.id) && def.earned(candidate))
    .map((def) => ({ id: def.id, earnedAt: event.createdAt }));

  return {
    progress: { ...candidate, badges: [...prev.badges, ...newBadges] },
    xpGained: event.xp,
    leveledUp: level > prev.level,
    newBadges,
  };
};
