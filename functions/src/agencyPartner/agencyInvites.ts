import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { randomBytes } from "crypto";
import { sendAgencyInviteEmail } from "./agencyEmails";
import { appendPrepEvent } from "./appendPrepEvent";
import { authorizeBranchOwnerOrAdmin, DEFAULT_AGENCY_INVITE_LIMIT } from "./access";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const REGION = "us-west1";
const MAX_INVITES_PER_BRANCH_PER_DAY = 50;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createInviteToken = (): string =>
  randomBytes(18)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

/**
 * Send an agency invite email to a candidate and record the invite under
 * agencyBranches/{branchId}/invites. Only the branch owner (agency_partner)
 * or admin may call. Rate-limited per branch per day.
 */
export const sendAgencyInvite = functions.region(REGION).https.onCall(async (data, context) => {
  const branchId = String(data?.branchId || "").trim();
  const email = String(data?.email || "").trim().toLowerCase();
  const firstName = data?.firstName ? String(data.firstName).trim() : undefined;
  const customMessage = data?.message ? String(data.message).trim() : undefined;
  const demo = Boolean(data?.demo);

  if (!branchId) throw new functions.https.HttpsError("invalid-argument", "branchId is required.");
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new functions.https.HttpsError("invalid-argument", "Valid recipient email is required.");
  }

  const { branchRef, branchData: branch, callerUid } = await authorizeBranchOwnerOrAdmin(context, branchId);

  // Seat-limit check: count both invite records and already-started sessions,
  // de-duplicated by candidate email so an invite that became a session only
  // consumes one pilot seat.
  const allInvitesSnap = await branchRef.collection("invites").get();
  const sessionsSnap = await db
    .collection("agencyPrepSessions")
    .where("agencyBranchId", "==", branchId)
    .get();
  const occupiedEmails = new Set<string>();
  allInvitesSnap.docs.forEach((inviteDoc) => {
    const inviteEmail = String(inviteDoc.data().email || "").trim().toLowerCase();
    if (inviteEmail) occupiedEmails.add(inviteEmail);
  });
  sessionsSnap.docs.forEach((sessionDoc) => {
    const sessionEmail = String(sessionDoc.data().candidateEmail || "").trim().toLowerCase();
    if (sessionEmail) occupiedEmails.add(sessionEmail);
  });

  const inviteLimit = typeof branch.inviteLimit === "number" ? branch.inviteLimit : DEFAULT_AGENCY_INVITE_LIMIT;
  if (!occupiedEmails.has(email) && occupiedEmails.size >= inviteLimit) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      `Invite limit of ${inviteLimit} reached for this branch pilot. Please contact CareerVivid to upgrade your pilot seat limit.`
    );
  }

  // Rate-limit: count invites sent in the past 24h for this branch.
  const sinceMs = Date.now() - 24 * 60 * 60 * 1000;
  const recentInvitesSnap = await branchRef
    .collection("invites")
    .where("createdAt", ">=", admin.firestore.Timestamp.fromMillis(sinceMs))
    .get();
  if (recentInvitesSnap.size >= MAX_INVITES_PER_BRANCH_PER_DAY) {
    throw new functions.https.HttpsError(
      "resource-exhausted",
      `Daily invite limit (${MAX_INVITES_PER_BRANCH_PER_DAY}) reached for this branch.`
    );
  }

  // Resolve a display name for the recruiter.
  const callerUserSnap = await db.collection("users").doc(callerUid).get();
  const branchName = String(branch.branchName || branch.organization || "your agency branch");
  const branchSlug = String(branch.slug || branchId);
  const recruiterName = (callerUserSnap.data()?.displayName as string)
    || (callerUserSnap.data()?.email as string)
    || (branch.contactName as string)
    || "Your recruiter";

  // Write invite record first so the UI updates immediately even if email
  // suppression returns "not queued".
  const inviteToken = createInviteToken();
  const inviteRef = branchRef.collection("invites").doc();
  const rootInviteRef = db.collection("agencyInvites").doc(inviteRef.id);
  const invitePayload = {
    agencyBranchId: branchId,
    branchName,
    branchSlug,
    inviteToken,
    preparePath: `/prepare/${encodeURIComponent(branchSlug)}`,
    email,
    firstName: firstName || null,
    message: customMessage || null,
    sentByUserId: callerUid,
    sentByName: recruiterName,
    status: "sent",
    deliveryState: "CREATED",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await Promise.all([
    inviteRef.set(invitePayload),
    rootInviteRef.set(invitePayload),
  ]);

  // Compose and queue the lifecycle email.
  const result = await sendAgencyInviteEmail({
    branchId,
    branchName,
    branchSlug,
    recruiterName,
    recipientEmail: email,
    recipientFirstName: firstName,
    customMessage,
    inviteToken,
    demo,
  });

  const deliveryPatch = {
    status: "sent",
    queuedMailId: result.mailId || null,
    deliveryState: result.queued ? "QUEUED" : "SUPPRESSED",
    deliveryNote: result.reason,
    emailQueuedAt: result.queued ? admin.firestore.FieldValue.serverTimestamp() : null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await Promise.all([
    inviteRef.update(deliveryPatch),
    rootInviteRef.update(deliveryPatch),
  ]);

  const matchingSession = sessionsSnap.docs.find((sessionDoc) => {
    const sessionEmail = String(sessionDoc.data().candidateEmail || "").trim().toLowerCase();
    return sessionEmail === email;
  });
  if (matchingSession) {
    await appendPrepEvent({
      sessionId: matchingSession.id,
      type: "invited",
      actorUserId: callerUid,
      actorName: recruiterName,
      payload: { inviteId: inviteRef.id },
    });
  }

  await branchRef.set({
    lastInviteAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    inviteId: inviteRef.id,
    inviteToken,
    mailId: result.mailId || null,
    queued: result.queued,
    reason: result.reason,
  };
});
