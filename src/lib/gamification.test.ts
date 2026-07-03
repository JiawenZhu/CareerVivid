import { describe, it, expect } from 'vitest';
import {
  advanceStreak,
  applyXpEvent,
  initialProgress,
  interviewXp,
  levelFromXp,
  levelInfoFromXp,
  localDayString,
  normalizeScore,
  previousDayString,
  totalXpForLevel,
  XP_RULES,
} from './gamification';
import { XpEvent } from '../types';

const makeEvent = (overrides: Partial<XpEvent> = {}): XpEvent => ({
  id: 'evt_test',
  type: 'interview_completed',
  xp: 50,
  createdAt: 1720000000000,
  ...overrides,
});

describe('normalizeScore', () => {
  it('treats scores <= 10 as a 10-point scale', () => {
    expect(normalizeScore(8)).toBe(80);
    expect(normalizeScore(10)).toBe(100);
  });

  it('passes through 0-100 scores and clamps above 100', () => {
    expect(normalizeScore(72)).toBe(72);
    expect(normalizeScore(140)).toBe(100);
  });

  it('handles junk input', () => {
    expect(normalizeScore(NaN)).toBe(0);
    expect(normalizeScore(-5)).toBe(0);
  });
});

describe('interviewXp', () => {
  it('awards base XP for a low score', () => {
    expect(interviewXp({ overallScore: 40 })).toEqual({ xp: 50, passed: false, excellent: false });
  });

  it('awards pass bonus at 70+', () => {
    expect(interviewXp({ overallScore: 75 })).toEqual({ xp: 75, passed: true, excellent: false });
  });

  it('awards excellent bonus at 85+', () => {
    expect(interviewXp({ overallScore: 9 })).toEqual({ xp: 100, passed: true, excellent: true });
  });
});

describe('level curve', () => {
  it('has expected cumulative thresholds', () => {
    expect(totalXpForLevel(1)).toBe(0);
    expect(totalXpForLevel(2)).toBe(100);
    expect(totalXpForLevel(3)).toBe(250);
    expect(totalXpForLevel(4)).toBe(450);
    expect(totalXpForLevel(5)).toBe(700);
  });

  it('levelFromXp inverts totalXpForLevel', () => {
    for (let level = 1; level <= 30; level++) {
      const floor = totalXpForLevel(level);
      expect(levelFromXp(floor)).toBe(level);
      expect(levelFromXp(floor + 1)).toBe(level);
      if (level > 1) expect(levelFromXp(floor - 1)).toBe(level - 1);
    }
  });

  it('levelInfoFromXp reports progress within the level', () => {
    const info = levelInfoFromXp(150); // level 2 floor=100, next needs 150
    expect(info.level).toBe(2);
    expect(info.currentLevelXp).toBe(50);
    expect(info.nextLevelXp).toBe(150);
    expect(info.progress).toBeCloseTo(50 / 150);
  });
});

describe('streaks', () => {
  it('previousDayString handles month boundaries', () => {
    expect(previousDayString('2026-03-01')).toBe('2026-02-28');
    expect(previousDayString('2026-01-01')).toBe('2025-12-31');
  });

  it('same-day activity does not change the streak', () => {
    const s = { current: 3, longest: 5, lastActiveDay: '2026-07-02' };
    expect(advanceStreak(s, '2026-07-02')).toBe(s);
  });

  it('consecutive-day activity increments', () => {
    const s = advanceStreak({ current: 3, longest: 3, lastActiveDay: '2026-07-01' }, '2026-07-02');
    expect(s).toEqual({ current: 4, longest: 4, lastActiveDay: '2026-07-02' });
  });

  it('a gap resets to 1 but keeps longest', () => {
    const s = advanceStreak({ current: 6, longest: 6, lastActiveDay: '2026-06-28' }, '2026-07-02');
    expect(s).toEqual({ current: 1, longest: 6, lastActiveDay: '2026-07-02' });
  });

  it('first-ever activity starts at 1', () => {
    const s = advanceStreak({ current: 0, longest: 0, lastActiveDay: '' }, '2026-07-02');
    expect(s).toEqual({ current: 1, longest: 1, lastActiveDay: '2026-07-02' });
  });
});

describe('applyXpEvent', () => {
  it('accumulates xp, levels up, and starts a streak', () => {
    const prev = initialProgress(1720000000000);
    const result = applyXpEvent(prev, makeEvent({ xp: 120 }), '2026-07-02');

    expect(result.progress.xp).toBe(120);
    expect(result.progress.level).toBe(2);
    expect(result.leveledUp).toBe(true);
    expect(result.progress.streak.current).toBe(1);
    expect(result.progress.counters.interviewsCompleted).toBe(1);
  });

  it('awards first_interview and first_pass badges together on a passed interview', () => {
    const prev = initialProgress();
    const result = applyXpEvent(prev, makeEvent({ meta: { passed: true } }), '2026-07-02');

    const ids = result.newBadges.map((b) => b.id);
    expect(ids).toContain('first_interview');
    expect(ids).toContain('first_pass');
    expect(result.progress.counters.interviewsPassed).toBe(1);
  });

  it('does not re-award existing badges', () => {
    const prev = initialProgress();
    const first = applyXpEvent(prev, makeEvent({ id: 'a' }), '2026-07-02');
    const second = applyXpEvent(first.progress, makeEvent({ id: 'b' }), '2026-07-02');

    expect(second.newBadges.map((b) => b.id)).not.toContain('first_interview');
    expect(second.progress.badges.filter((b) => b.id === 'first_interview')).toHaveLength(1);
  });

  it('daily_login does not advance the streak', () => {
    const prev = initialProgress();
    const result = applyXpEvent(prev, makeEvent({ type: 'daily_login', xp: XP_RULES.daily_login }), '2026-07-02');
    expect(result.progress.streak.current).toBe(0);
  });

  it('localDayString formats as YYYY-MM-DD', () => {
    expect(localDayString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
