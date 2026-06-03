// Pure functions for deriving sales-friendly metrics from prep sessions.
// No Firestore, no React. Easy to unit-test and reuse across surfaces.

import type {
  AgencyPrepSession,
  PilotFunnelStats,
  TimeSavedEstimate,
} from '../types';

const MINUTES_PER_READY = 10; // Resume cleanup recruiter time avoided.
const MINUTES_PER_SHARED = 5; // Triage time avoided.
const MINUTES_PER_BIG_LIFT = 3; // Coaching time avoided when score lift > 10.
const BIG_LIFT_THRESHOLD = 10;

/** Compute the time-saved estimate for a single session. */
export const minutesSavedFor = (session: AgencyPrepSession): number => {
  let total = 0;
  if (session.status === 'ready' || session.status === 'shared') {
    total += MINUTES_PER_READY;
  }
  if (session.status === 'shared' || session.consentToShare) {
    total += MINUTES_PER_SHARED;
  }
  if (typeof session.scoreDelta === 'number' && session.scoreDelta > BIG_LIFT_THRESHOLD) {
    total += MINUTES_PER_BIG_LIFT;
  }
  return total;
};

/** Aggregate time-saved estimate across all sessions for a branch. */
export const summarizeTimeSaved = (sessions: AgencyPrepSession[]): TimeSavedEstimate => {
  let totalMinutes = 0;
  let readyCandidates = 0;
  let sharedCandidates = 0;
  let bigScoreLifts = 0;

  for (const session of sessions) {
    totalMinutes += minutesSavedFor(session);
    if (session.status === 'ready' || session.status === 'shared') readyCandidates += 1;
    if (session.status === 'shared' || session.consentToShare) sharedCandidates += 1;
    if (typeof session.scoreDelta === 'number' && session.scoreDelta > BIG_LIFT_THRESHOLD) bigScoreLifts += 1;
  }

  const perCandidateMinutes = sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0;
  return {
    totalMinutes,
    perCandidateMinutes,
    breakdown: { readyCandidates, sharedCandidates, bigScoreLifts },
  };
};

/** Format a minute count for display, e.g. 195 -> "~3.3 hours". */
export const formatMinutesSaved = (minutes: number): string => {
  if (minutes <= 0) return '0 min';
  if (minutes < 60) return `~${minutes} min`;
  const hours = minutes / 60;
  if (hours < 10) return `~${hours.toFixed(1)} hours`;
  return `~${Math.round(hours)} hours`;
};

/** Compute the funnel breakdown for the Pilot Metrics tab. */
export const funnelStats = (sessions: AgencyPrepSession[], invitedCount?: number): PilotFunnelStats => {
  let started = 0;
  let reviewed = 0;
  let ready = 0;
  let shared = 0;

  for (const session of sessions) {
    if (session.status === 'invited') continue;
    started += 1;
    if (session.status === 'reviewed' || session.status === 'ready' || session.status === 'shared') reviewed += 1;
    if (session.status === 'ready' || session.status === 'shared') ready += 1;
    if (session.status === 'shared' || session.consentToShare) shared += 1;
  }

  // Invited count comes from the invites subcollection. If not provided, fall
  // back to total session count so the funnel still renders sensibly.
  const invited = typeof invitedCount === 'number' && invitedCount > 0
    ? invitedCount
    : Math.max(sessions.length, started);

  const safeRate = (numerator: number, denominator: number): number | null => {
    if (denominator <= 0) return null;
    return Math.round((numerator / denominator) * 100);
  };

  return {
    invited,
    started,
    reviewed,
    ready,
    shared,
    startRate: safeRate(started, invited),
    readyRate: safeRate(ready, started),
    shareRate: safeRate(shared, ready),
  };
};
