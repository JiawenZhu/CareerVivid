import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { appendPrepEvent } from "./appendPrepEvent";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const REGION = "us-west1";

/**
 * Server-side revoke of an agency readiness share. The candidate (and admins)
 * may call this. It atomically clears the share fields on the session and
 * appends a `consent_revoked` event.
 *
 * Trade-off documented in the agency overview: this does NOT auto-disable
 * the underlying resume's public share toggle, because other consumers may
 * rely on it. The candidate can disable the public toggle independently.
 */
export const revokeAgencyShare = functions.region(REGION).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
  }
  const sessionId = String(data?.sessionId || "").trim();
  if (!sessionId) {
    throw new functions.https.HttpsError("invalid-argument", "sessionId is required.");
  }

  const sessionRef = db.collection("agencyPrepSessions").doc(sessionId);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Prep session not found.");
  }
  const sessionData = sessionSnap.data() as FirebaseFirestore.DocumentData;

  const callerUid = context.auth.uid;
  const adminSnap = await db.collection("admins").doc(callerUid).get();
  const isAdmin = adminSnap.exists;

  if (!isAdmin && sessionData.candidateUserId !== callerUid) {
    throw new functions.https.HttpsError("permission-denied", "Only the candidate or an admin can revoke this share.");
  }

  // Determine the new status. If the latest score is high enough to be ready,
  // drop back to `ready`; otherwise drop back to `reviewed` or `started`.
  let nextStatus: string = "ready";
  if (typeof sessionData.latestScore === "number" && sessionData.latestScore < 85) {
    nextStatus = sessionData.resumeId ? "reviewed" : "started";
  }

  await sessionRef.update({
    consentToShare: false,
    status: nextStatus,
    resumeSharePath: admin.firestore.FieldValue.delete(),
    readinessReport: admin.firestore.FieldValue.delete(),
    sharedAt: admin.firestore.FieldValue.delete(),
    revokedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await appendPrepEvent({
    sessionId,
    type: "consent_revoked",
    actorUserId: callerUid,
    actorName: (sessionData.candidateName as string) || "Candidate",
    payload: { previousStatus: sessionData.status },
  });

  return { ok: true, status: nextStatus };
});
