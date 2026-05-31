import { AgencyPrepSession } from '../types';

/**
 * Normalizes Firestore timestamps, JavaScript Dates, numbers, or strings to milliseconds since epoch.
 */
export function getSessionTimestamp(time: any): number {
  if (!time) return Date.now();
  if (typeof time.toDate === 'function') {
    return time.toDate().getTime();
  }
  if (typeof time.seconds === 'number') {
    return time.seconds * 1000;
  }
  if (typeof time === 'number') {
    return time;
  }
  if (time instanceof Date) {
    return time.getTime();
  }
  const parsed = new Date(time).getTime();
  return isNaN(parsed) ? Date.now() : parsed;
}

/**
 * Returns true if the prep session is not shared and hasn't been updated in the given threshold days.
 */
export function isStaleCandidate(session: AgencyPrepSession, thresholdDays: number = 3): boolean {
  // Shared candidates do not need to be marked as stale (they are completed)
  if (session.status === 'shared') return false;

  const updatedAtMs = getSessionTimestamp(session.updatedAt);
  const differenceMs = Date.now() - updatedAtMs;
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
  
  return differenceMs > thresholdMs;
}

/**
 * Filters the list of sessions to only return stale ones.
 */
export function getStaleCandidates(
  sessions: AgencyPrepSession[],
  thresholdDays: number = 3
): AgencyPrepSession[] {
  return sessions.filter((session) => isStaleCandidate(session, thresholdDays));
}

/**
 * Computes stale candidate metrics for the dashboard banner and analytics.
 */
export function getStaleBreakdown(sessions: AgencyPrepSession[], thresholdDays: number = 3) {
  const staleSessions = getStaleCandidates(sessions, thresholdDays);
  
  let oldestStaleDays = 0;
  if (staleSessions.length > 0) {
    const oldestMs = Math.min(
      ...staleSessions.map((s) => getSessionTimestamp(s.updatedAt))
    );
    oldestStaleDays = Math.round((Date.now() - oldestMs) / (24 * 60 * 60 * 1000));
  }

  return {
    staleCount: staleSessions.length,
    totalCount: sessions.filter(s => s.status !== 'shared').length,
    oldestStaleDays,
    staleSessions,
  };
}
