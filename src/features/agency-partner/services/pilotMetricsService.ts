// Thin wrapper that exposes the pure metric utilities to UI components.
// Kept as a service so we can later swap in server-derived metrics without
// touching call sites.

import type { AgencyPrepSession, PilotFunnelStats, TimeSavedEstimate } from '../types';
import { funnelStats, summarizeTimeSaved } from '../utils/timeSaved';

export const computeFunnelStats = (
  sessions: AgencyPrepSession[],
  invitedCount?: number,
): PilotFunnelStats => funnelStats(sessions, invitedCount);

export const computeTimeSaved = (sessions: AgencyPrepSession[]): TimeSavedEstimate =>
  summarizeTimeSaved(sessions);
