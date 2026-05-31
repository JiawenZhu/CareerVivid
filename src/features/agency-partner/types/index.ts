// Agency Partner Pilot — feature module type surface.
//
// Re-exports the canonical agency types from src/types.ts so the rest of this
// module can import everything from a single, local path. Also defines new
// types that are unique to this module (events, recruiter notes, invites).

export type {
  AgencyBranchProfile,
  AgencyReadinessReport,
  AgencyPrepSession,
  AgencyPrepSessionStatus,
  AgencyPilotStatus,
} from '../../../types';

/**
 * Activity event written to agencyPrepSessions/{sessionId}/events.
 * Events are append-only. Writes happen server-side only (callables / triggers);
 * the client just listens.
 *
 * Visible to: candidate-owner, agency-owner, admin.
 */
export type AgencyPrepEventType =
  | 'invited'
  | 'started'
  | 'resume_selected'
  | 'ai_review_run'
  | 'score_lifted'
  | 'marked_ready'
  | 'consent_granted'
  | 'consent_revoked'
  | 'report_viewed_by_agency'
  | 'recruiter_note_added'
  | 'reminded';

export interface AgencyPrepEvent {
  id: string;
  type: AgencyPrepEventType;
  /** Free-form structured payload, e.g. { fromScore, toScore } for score_lifted. */
  payload?: Record<string, unknown>;
  /** uid of the actor when known (candidate, recruiter, or system). */
  actorUserId?: string;
  /** Display name of the actor, when known. */
  actorName?: string;
  createdAt: any; // Firestore Timestamp
}

/**
 * Recruiter-private note attached to a prep session.
 * Lives at agencyPrepSessions/{sessionId}/notes/{noteId}.
 *
 * Visible to: agency-owner, admin. NEVER visible to candidate.
 */
export interface RecruiterNote {
  id: string;
  body: string;
  authorUserId: string;
  authorName: string;
  createdAt: any; // Firestore Timestamp
}

/**
 * Candidate invite record written when a recruiter sends an invite email.
 * Lives at agencyBranches/{branchId}/invites/{inviteId}.
 *
 * Visible to: agency-owner, admin.
 */
export type AgencyInviteStatus = 'sent' | 'started' | 'ready' | 'shared' | 'bounced';

export interface AgencyInvite {
  id: string;
  email: string;
  firstName?: string;
  message?: string;
  /** uid of the recruiter who sent the invite. */
  sentByUserId: string;
  sentByName?: string;
  status: AgencyInviteStatus;
  /** Convenience link to the matching prep session once the candidate signs in. */
  matchedSessionId?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

/** Derived funnel breakdown for the Pilot Metrics tab. */
export interface PilotFunnelStats {
  invited: number;
  started: number;
  reviewed: number;
  ready: number;
  shared: number;
  /** invited -> started conversion as percentage (0-100), or null if invited == 0. */
  startRate: number | null;
  /** started -> ready conversion as percentage. */
  readyRate: number | null;
  /** ready -> shared conversion as percentage. */
  shareRate: number | null;
}

/** Derived recruiter-time-saved estimate, in minutes. */
export interface TimeSavedEstimate {
  totalMinutes: number;
  perCandidateMinutes: number;
  /** Counted contributions, useful for tooltip transparency. */
  breakdown: {
    readyCandidates: number;
    sharedCandidates: number;
    bigScoreLifts: number;
  };
}
