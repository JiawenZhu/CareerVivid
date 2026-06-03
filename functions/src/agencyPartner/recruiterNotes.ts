import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { appendPrepEvent } from "./appendPrepEvent";
import { authorizeSessionBranchOwnerOrAdmin } from "./access";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const REGION = "us-west1";
const MAX_NOTE_LENGTH = 2000;

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

  const { callerUid, callerName } = await authorizeSessionBranchOwnerOrAdmin(context, sessionId);
  const noteRef = db.collection("agencyPrepSessions").doc(sessionId).collection("notes").doc();

  await noteRef.set({
    body,
    noteText: body,
    authorUserId: callerUid,
    recruiterId: callerUid,
    authorName: callerName,
    recruiterName: callerName,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await appendPrepEvent({
    sessionId,
    type: "recruiter_note_added",
    actorUserId: callerUid,
    actorName: callerName,
    payload: { noteId: noteRef.id },
  });

  return { noteId: noteRef.id };
});

export const updateRecruiterNote = functions.region(REGION).https.onCall(async (data, context) => {
  const sessionId = String(data?.sessionId || "").trim();
  const noteId = String(data?.noteId || "").trim();
  const body = String(data?.body || "").trim();

  if (!sessionId || !noteId) {
    throw new functions.https.HttpsError("invalid-argument", "sessionId and noteId are required.");
  }
  if (!body) {
    throw new functions.https.HttpsError("invalid-argument", "Note body is required.");
  }
  if (body.length > MAX_NOTE_LENGTH) {
    throw new functions.https.HttpsError("invalid-argument", `Note must be ${MAX_NOTE_LENGTH} characters or less.`);
  }

  const { callerUid, callerName } = await authorizeSessionBranchOwnerOrAdmin(context, sessionId);
  const noteRef = db.collection("agencyPrepSessions").doc(sessionId).collection("notes").doc(noteId);
  const noteSnap = await noteRef.get();
  if (!noteSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Recruiter note not found.");
  }

  await noteRef.set({
    body,
    noteText: body,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedByUserId: callerUid,
    updatedByName: callerName,
  }, { merge: true });

  await appendPrepEvent({
    sessionId,
    type: "notes_updated",
    actorUserId: callerUid,
    actorName: callerName,
    payload: { noteId },
  });

  return { ok: true };
});

export const deleteRecruiterNote = functions.region(REGION).https.onCall(async (data, context) => {
  const sessionId = String(data?.sessionId || "").trim();
  const noteId = String(data?.noteId || "").trim();

  if (!sessionId || !noteId) {
    throw new functions.https.HttpsError("invalid-argument", "sessionId and noteId are required.");
  }

  const { callerUid, callerName } = await authorizeSessionBranchOwnerOrAdmin(context, sessionId);
  await db.collection("agencyPrepSessions").doc(sessionId).collection("notes").doc(noteId).delete();

  await appendPrepEvent({
    sessionId,
    type: "notes_updated",
    actorUserId: callerUid,
    actorName: callerName,
    payload: { noteId, action: "deleted" },
    description: "Recruiter deleted a private note.",
  });

  return { ok: true };
});
