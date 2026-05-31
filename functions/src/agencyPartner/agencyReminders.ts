import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { sendAgencyReminderEmail } from "./agencyEmails";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const REGION = "us-west1";

/**
 * Send reminder emails to a batch of candidate sessions that are stale.
 * Rate-limited to max 1 bulk reminder per branch per 24 hours.
 */
export const sendBulkAgencyReminder = functions.region(REGION).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
  }
  const callerUid = context.auth.uid;

  const branchId = String(data?.branchId || "").trim();
  const sessionIds = Array.isArray(data?.sessionIds) ? data.sessionIds : [];
  const demo = Boolean(data?.demo);

  if (!branchId) throw new functions.https.HttpsError("invalid-argument", "branchId is required.");
  if (sessionIds.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "At least one sessionId must be provided.");
  }

  // Load branch + authorize
  const branchRef = db.collection("agencyBranches").doc(branchId);
  const branchSnap = await branchRef.get();
  if (!branchSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Agency branch not found.");
  }
  const branch = branchSnap.data() as FirebaseFirestore.DocumentData;

  const adminSnap = await db.collection("admins").doc(callerUid).get();
  const isAdmin = adminSnap.exists;
  if (!isAdmin && branch.ownerUserId !== callerUid) {
    throw new functions.https.HttpsError("permission-denied", "Only the branch owner or an admin can send reminders.");
  }

  // Rate-limiting check: max 1 bulk reminder per 24 hours per branch
  const lastReminder = branch.lastBulkReminderAt;
  if (lastReminder && !demo) {
    const lastMs = typeof lastReminder.toMillis === "function" 
      ? lastReminder.toMillis() 
      : new Date(lastReminder).getTime();
    
    const nextAllowedMs = lastMs + 24 * 60 * 60 * 1000;
    if (Date.now() < nextAllowedMs) {
      const remainingHours = Math.ceil((nextAllowedMs - Date.now()) / (60 * 60 * 1000));
      throw new functions.https.HttpsError(
        "resource-exhausted",
        `Bulk reminders can only be sent once every 24 hours. Try again in ${remainingHours} hour(s).`
      );
    }
  }

  // Resolve recruiter display name
  const callerUserSnap = await db.collection("users").doc(callerUid).get();
  const recruiterName = (callerUserSnap.data()?.displayName as string)
    || (callerUserSnap.data()?.email as string)
    || (branch.contactName as string)
    || "Your recruiter";

  let sent = 0;
  let skipped = 0;

  // Process sessions sequentially to prevent Firebase congestion
  for (const sessionId of sessionIds) {
    const sessionRef = db.collection("agencyPrepSessions").doc(sessionId);
    const sessionSnap = await sessionRef.get();
    
    if (!sessionSnap.exists) {
      skipped++;
      continue;
    }

    const session = sessionSnap.data() as FirebaseFirestore.DocumentData;
    
    // Ensure session belongs to this branch and isn't already shared
    if (session.agencyBranchId !== branchId || session.status === "shared") {
      skipped++;
      continue;
    }

    // Queue reminder email
    const firstName = session.candidateName ? session.candidateName.split(" ")[0] : undefined;
    const emailResult = await sendAgencyReminderEmail({
      branchId,
      branchName: branch.branchName as string,
      branchSlug: branch.slug as string,
      recruiterName,
      recipientEmail: session.candidateEmail as string,
      recipientFirstName: firstName,
      demo,
    });

    if (emailResult.queued) {
      // Append "reminded" activity timeline event
      await sessionRef.collection("events").add({
        type: "reminded",
        actorUserId: callerUid,
        actorName: recruiterName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Touch session document so that dashboard lists show it was recently active/updated
      await sessionRef.update({
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      sent++;
    } else {
      skipped++;
    }
  }

  // Update branch metadata with last nudge timestamp
  await branchRef.update({
    lastBulkReminderAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { sent, skipped };
});
