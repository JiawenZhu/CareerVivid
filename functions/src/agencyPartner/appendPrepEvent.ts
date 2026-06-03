import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export type AgencyPrepEventType =
  | "invited"
  | "started"
  | "resume_imported"
  | "resume_selected"
  | "mock_interview_completed"
  | "ai_review_run"
  | "score_lifted"
  | "marked_ready"
  | "consent_granted"
  | "consent_revoked"
  | "notes_updated"
  | "report_viewed_by_agency"
  | "recruiter_note_added"
  | "reminded"
  | "quota_exceeded";

export interface AppendPrepEventInput {
  sessionId: string;
  type: AgencyPrepEventType;
  payload?: Record<string, unknown>;
  actorUserId?: string;
  actorName?: string;
  description?: string;
}

const DEFAULT_DESCRIPTIONS: Record<AgencyPrepEventType, string> = {
  invited: "Candidate was invited to the agency prep portal.",
  started: "Candidate started their prep session.",
  resume_imported: "Candidate imported or selected a resume.",
  resume_selected: "Candidate selected a resume.",
  mock_interview_completed: "Candidate completed a mock interview practice.",
  ai_review_run: "Candidate completed an AI resume review.",
  score_lifted: "Candidate improved their readiness score.",
  marked_ready: "Candidate is ready for recruiter review.",
  consent_granted: "Candidate granted sharing consent.",
  consent_revoked: "Candidate revoked sharing consent.",
  notes_updated: "Recruiter notes were updated.",
  report_viewed_by_agency: "Agency viewed the readiness report.",
  recruiter_note_added: "Recruiter added a private note.",
  reminded: "Candidate reminder email was sent.",
  quota_exceeded: "Branch invite quota was exceeded.",
};

/**
 * Append an event to agencyPrepSessions/{sessionId}/events.
 *
 * Events are append-only and server-only — no client write paths.
 * Used by other callables/triggers to record the candidate's prep journey
 * for the recruiter-facing activity timeline.
 */
export async function appendPrepEvent(input: AppendPrepEventInput): Promise<void> {
  const sessionRef = db.collection("agencyPrepSessions").doc(input.sessionId);
  const eventRef = sessionRef.collection("events").doc();

  const payload: Record<string, unknown> = {
    type: input.type,
    eventType: input.type,
    description: input.description || DEFAULT_DESCRIPTIONS[input.type],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (input.payload && Object.keys(input.payload).length > 0) payload.payload = input.payload;
  if (input.actorUserId) payload.actorUserId = input.actorUserId;
  if (input.actorName) payload.actorName = input.actorName;

  await eventRef.set(payload);
}
