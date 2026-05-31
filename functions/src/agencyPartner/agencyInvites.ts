import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { sendAgencyInviteEmail } from "./agencyEmails";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const REGION = "us-west1";
const MAX_INVITES_PER_BRANCH_PER_DAY = 50;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Send an agency invite email to a candidate and record the invite under
 * agencyBranches/{branchId}/invites. Only the branch owner (agency_partner)
 * or admin may call. Rate-limited per branch per day.
 */
export const sendAgencyInvite = functions.region(REGION).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
  }
  const callerUid = context.auth.uid;

  const branchId = String(data?.branchId || "").trim();
  const email = String(data?.email || "").trim().toLowerCase();
  const firstName = data?.firstName ? String(data.firstName).trim() : undefined;
  const customMessage = data?.message ? String(data.message).trim() : undefined;
  const demo = Boolean(data?.demo);

  if (!branchId) throw new functions.https.HttpsError("invalid-argument", "branchId is required.");
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new functions.https.HttpsError("invalid-argument", "Valid recipient email is required.");
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
    throw new functions.https.HttpsError("permission-denied", "Only the branch owner or an admin can send invites.");
  }

  // Seat-limit check: enforce branch's maximum total invites (default 40).
  const allInvitesSnap = await branchRef.collection("invites").get();
  const inviteLimit = typeof branch.inviteLimit === "number" ? branch.inviteLimit : 40;
  if (allInvitesSnap.size >= inviteLimit) {
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
  const recruiterName = (callerUserSnap.data()?.displayName as string)
    || (callerUserSnap.data()?.email as string)
    || (branch.contactName as string)
    || "Your recruiter";

  // Write invite record first so the UI updates immediately even if email
  // suppression returns "not queued".
  const inviteRef = branchRef.collection("invites").doc();
  await inviteRef.set({
    email,
    firstName: firstName || null,
    message: customMessage || null,
    sentByUserId: callerUid,
    sentByName: recruiterName,
    status: "sent",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Compose and queue the lifecycle email.
  const result = await sendAgencyInviteEmail({
    branchId,
    branchName: branch.branchName as string,
    branchSlug: branch.slug as string,
    recruiterName,
    recipientEmail: email,
    recipientFirstName: firstName,
    customMessage,
    demo,
  });

  // Record suppression reason on the invite doc for visibility in the dashboard.
  if (!result.queued) {
    await inviteRef.update({
      status: "sent",
      deliveryNote: result.reason,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return { inviteId: inviteRef.id, queued: result.queued, reason: result.reason };
});
