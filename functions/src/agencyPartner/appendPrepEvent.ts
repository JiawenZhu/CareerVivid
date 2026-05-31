import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export type AgencyPrepEventType =
  | "invited"
  | "started"
  | "resume_selected"
  | "ai_review_run"
  | "score_lifted"
  | "marked_ready"
  | "consent_granted"
  | "consent_revoked"
  | "report_viewed_by_agency"
  | "recruiter_note_added";

export interface AppendPrepEventInput {
  sessionId: string;
  type: AgencyPrepEventType;
  payload?: Record<string, unknown>;
  actorUserId?: string;
  actorName?: string;
}

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
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (input.payload && Object.keys(input.payload).length > 0) payload.payload = input.payload;
  if (input.actorUserId) payload.actorUserId = input.actorUserId;
  if (input.actorName) payload.actorName = input.actorName;

  await eventRef.set(payload);
}
