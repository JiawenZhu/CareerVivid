import * as functions from "firebase-functions/v1";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { sendAgencyReminderEmail } from "./agencyEmails";
import { appendPrepEvent } from "./appendPrepEvent";
import { authorizeBranchOwnerOrAdmin } from "./access";
import { getAgencyReminderThrottleReason } from "./agencyEmailPolicy";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const REGION = "us-west1";
const STALE_SESSION_AGE_MS = 3 * 24 * 60 * 60 * 1000;
const SCHEDULED_REMINDER_LIMIT = 200;

const shouldSkipReminderStatus = (status: unknown): boolean => {
  const normalized = String(status || "").trim().toLowerCase();
  return normalized === "shared" || normalized === "inactive";
};

const getFirstName = (candidateName: unknown): string | undefined => {
  const value = String(candidateName || "").trim();
  return value ? value.split(/\s+/)[0] : undefined;
};

const queueReminderForSession = async ({
  branchId,
  branch,
  sessionId,
  session,
  actorUserId,
  actorName,
  demo,
}: {
  branchId: string;
  branch: FirebaseFirestore.DocumentData;
  sessionId: string;
  session: FirebaseFirestore.DocumentData;
  actorUserId?: string;
  actorName: string;
  demo?: boolean;
}): Promise<{ queued: boolean; reason: string }> => {
  if (session.agencyBranchId !== branchId) {
    return { queued: false, reason: "wrong_branch" };
  }
  if (shouldSkipReminderStatus(session.status)) {
    return { queued: false, reason: "terminal_status" };
  }

  const recipientEmail = String(session.candidateEmail || "").trim().toLowerCase();
  if (!recipientEmail) {
    return { queued: false, reason: "missing_candidate_email" };
  }

  if (!demo) {
    const throttleReason = getAgencyReminderThrottleReason(session);
    if (throttleReason) {
      return { queued: false, reason: throttleReason };
    }
  }

  const emailResult = await sendAgencyReminderEmail({
    branchId,
    branchName: (branch.branchName as string) || "your agency branch",
    branchSlug: (branch.slug as string) || branchId,
    recruiterName: actorName,
    recipientEmail,
    recipientFirstName: getFirstName(session.candidateName),
    demo,
  });

  if (!emailResult.queued) {
    return emailResult;
  }

  const sessionRef = db.collection("agencyPrepSessions").doc(sessionId);
  await sessionRef.set({
    lastAgencyReminderAt: admin.firestore.FieldValue.serverTimestamp(),
    lastReminderAt: admin.firestore.FieldValue.serverTimestamp(),
    reminderEmailCount: admin.firestore.FieldValue.increment(1),
  }, { merge: true });

  await appendPrepEvent({
    sessionId,
    type: "reminded",
    actorUserId,
    actorName,
    payload: { branchId },
  });

  return emailResult;
};

/**
 * Send reminder emails to a batch of candidate sessions that are stale.
 * Rate-limited to max 1 bulk reminder per branch per 24 hours.
 */
export const sendBulkAgencyReminder = functions.region(REGION).https.onCall(async (data, context) => {
  const branchId = String(data?.branchId || "").trim();
  const sessionIds = Array.isArray(data?.sessionIds) ? data.sessionIds : [];
  const demo = Boolean(data?.demo);

  if (!branchId) throw new functions.https.HttpsError("invalid-argument", "branchId is required.");
  if (sessionIds.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "At least one sessionId must be provided.");
  }

  const { branchRef, branchData: branch, callerUid } = await authorizeBranchOwnerOrAdmin(context, branchId);

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

  // Process sessions sequentially to prevent Firebase congestion.
  for (const sessionId of sessionIds) {
    const sessionRef = db.collection("agencyPrepSessions").doc(sessionId);
    const sessionSnap = await sessionRef.get();
    
    if (!sessionSnap.exists) {
      skipped++;
      continue;
    }

    const session = sessionSnap.data() as FirebaseFirestore.DocumentData;
    const emailResult = await queueReminderForSession({
      branchId,
      branch,
      sessionId,
      session,
      actorUserId: callerUid,
      actorName: recruiterName,
      demo,
    });

    if (emailResult.queued) {
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

export const sendAgencyPrepReminders = onSchedule({
  schedule: "every day 09:00",
  timeZone: "America/Chicago",
  timeoutSeconds: 540,
  memory: "512MiB",
  region: REGION,
}, async () => {
  const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - STALE_SESSION_AGE_MS);
  const sessionsSnap = await db
    .collection("agencyPrepSessions")
    .where("updatedAt", "<=", cutoff)
    .limit(SCHEDULED_REMINDER_LIMIT)
    .get();

  const branchCache = new Map<string, FirebaseFirestore.DocumentData | null>();
  let sent = 0;
  let skipped = 0;

  for (const sessionDoc of sessionsSnap.docs) {
    const session = sessionDoc.data();
    const branchId = String(session.agencyBranchId || "").trim();
    if (!branchId || shouldSkipReminderStatus(session.status)) {
      skipped++;
      continue;
    }

    if (!branchCache.has(branchId)) {
      const branchSnap = await db.collection("agencyBranches").doc(branchId).get();
      branchCache.set(branchId, branchSnap.exists ? branchSnap.data() as FirebaseFirestore.DocumentData : null);
    }

    const branch = branchCache.get(branchId);
    if (!branch || branch.pilotStatus === "paused") {
      skipped++;
      continue;
    }

    const recruiterName = (branch.contactName as string)
      || (branch.branchName as string)
      || "Your recruiter";

    const result = await queueReminderForSession({
      branchId,
      branch,
      sessionId: sessionDoc.id,
      session,
      actorName: recruiterName,
    });

    if (result.queued) {
      sent++;
    } else {
      skipped++;
    }
  }

  functions.logger.info("[sendAgencyPrepReminders] complete", {
    scanned: sessionsSnap.size,
    sent,
    skipped,
  });
});
