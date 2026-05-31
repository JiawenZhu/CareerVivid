import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { appendPrepEvent } from "./appendPrepEvent";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const REGION = "us-west1";
const MAX_NOTE_LENGTH = 2000;

/**
 * Verify the caller is the agency owner of the branch that owns the given
 * session, OR a CareerVivid admin. Returns the loaded session data so the
 * caller can avoid a second read.
 */
async function authorizeBranchOwnerOrAdmin(
  context: functions.https.CallableContext,
  sessionId: string
): Promise<{
  sessionData: FirebaseFirestore.DocumentData;
  callerName: string;
  isAdmin: boolean;
}> {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
  }
  const callerUid = context.auth.uid;

  const sessionSnap = await db.collection("agencyPrepSessions").doc(sessionId).get();
  if (!sessionSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Prep session not found.");
  }
  const sessionData = sessionSnap.data() as FirebaseFirestore.DocumentData;

  // Admin check
  const adminSnap = await db.collection("admins").doc(callerUid).get();
  const isAdmin = adminSnap.exists;

  if (!isAdmin && sessionData.agencyOwnerUserId !== callerUid) {
    throw new functions.https.HttpsError("permission-denied", "Only the branch owner or an admin can manage notes.");
  }

  // Resolve a display name for the actor.
  const callerUserSnap = await db.collection("users").doc(callerUid).get();
  const callerName = (callerUserSnap.data()?.displayName as string)
    || (callerUserSnap.data()?.email as string)
    || (context.auth.token?.name as string)
    || "Recruiter";

  return { sessionData, callerName, isAdmin };
}

export const addRecruiterNote = functions.region(REGION).https.onCall(async (data, context) => {
  const sessionId = String(data?.sessionId || "").trim();
  const body = String(data?.body || "").trim();

  if (!sessionId) {
    throw new functions.https.HttpsError("invalid-argument", "sessionId is required.");
  }
  if (!body) {
    throw new functions.https.HttpsError("invalid-argument", "Note body is required.");
  }
  if (body.length > MAX_NOTE_LENGTH) {
    throw new functions.https.HttpsError("invalid-argument", `Note must be ${MAX_NOTE_LENGTH} characters or less.`);
  }

  const { callerName } = await authorizeBranchOwnerOrAdmin(context, sessionId);
  const noteRef = db.collection("agencyPrepSessions").doc(sessionId).collection("notes").doc();

  await noteRef.set({
    body,
    authorUserId: context.auth!.uid,
    authorName: callerName,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await appendPrepEvent({
    sessionId,
    type: "recruiter_note_added",
    actorUserId: context.auth!.uid,
    actorName: callerName,
    payload: { noteId: noteRef.id },
  });

  return { noteId: noteRef.id };
});

export const deleteRecruiterNote = functions.region(REGION).https.onCall(async (data, context) => {
  const sessionId = String(data?.sessionId || "").trim();
  const noteId = String(data?.noteId || "").trim();

  if (!sessionId || !noteId) {
    throw new functions.https.HttpsError("invalid-argument", "sessionId and noteId are required.");
  }

  await authorizeBranchOwnerOrAdmin(context, sessionId);
  await db.collection("agencyPrepSessions").doc(sessionId).collection("notes").doc(noteId).delete();

  return { ok: true };
});
