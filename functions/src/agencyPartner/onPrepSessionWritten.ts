import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { appendPrepEvent } from "./appendPrepEvent";
import { sendAgencyReadinessEmail } from "./agencyEmails";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const REGION = "us-west1";

const LIFT_THRESHOLD = 5;
const READINESS_THRESHOLD = 85;

const readinessSummaryFromScore = (latestScore: number, scoreDelta: number): string => {
  const deltaText = scoreDelta > 0 ? `, improving by ${scoreDelta} points` : "";
  if (latestScore >= 90) return `Candidate reached a recruiter-ready score of ${latestScore}${deltaText}.`;
  if (latestScore >= READINESS_THRESHOLD) return `Candidate is close to recruiter-ready with a score of ${latestScore}${deltaText}.`;
  return `Candidate is still preparing with a current score of ${latestScore}${deltaText}.`;
};

/**
 * Watch agencyPrepSessions writes and emit timeline events for state changes
 * the client already makes (started, resume_selected, score_lifted, marked_ready,
 * consent_granted). Also queues the readiness notification email to the
 * branch owner when consent flips to true.
 *
 * This keeps the existing client services free of event-write coupling and
 * lets the activity timeline reflect what's already happening.
 */
export const onAgencyPrepSessionWritten = functions
  .region(REGION)
  .firestore.document("agencyPrepSessions/{sessionId}")
  .onWrite(async (change, context) => {
    const sessionId = context.params.sessionId as string;
    const before = change.before.exists ? change.before.data() as FirebaseFirestore.DocumentData : null;
    const after = change.after.exists ? change.after.data() as FirebaseFirestore.DocumentData : null;

    // Deletion — nothing to do (resetDemoBranch handles its own teardown).
    if (!after) return;

    const beforeStatus = before?.status as string | undefined;
    const afterStatus = after.status as string;
    const beforeScore = typeof before?.latestScore === "number" ? before.latestScore : undefined;
    const afterScore = typeof after.latestScore === "number" ? after.latestScore : undefined;
    const beforeConsent = Boolean(before?.consentToShare);
    const afterConsent = Boolean(after.consentToShare);
    const beforeResumeId = before?.resumeId as string | undefined;
    const afterResumeId = after.resumeId as string | undefined;

    const candidateName = (after.candidateName as string) || "Candidate";
    const candidateUid = after.candidateUserId as string | undefined;

    const ops: Promise<unknown>[] = [];

    // started — first time the session exists
    if (!before && after) {
      const branchId = after.agencyBranchId as string | undefined;
      if (branchId) {
        const branchSnap = await db.collection("agencyBranches").doc(branchId).get();
        const branchData = branchSnap.exists ? branchSnap.data() : null;
        const seatLimit = branchData && typeof branchData.inviteLimit === "number" ? branchData.inviteLimit : 40;

        const sessionsSnap = await db.collection("agencyPrepSessions")
          .where("agencyBranchId", "==", branchId)
          .get();

        if (sessionsSnap.size > seatLimit) {
          await change.after.ref.update({
            status: "inactive",
            overLimit: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          await appendPrepEvent({
            sessionId,
            type: "consent_revoked", // reuse standard event type mapping or safe type
            actorUserId: candidateUid,
            actorName: candidateName,
            payload: { reason: "pilot_seat_limit_exceeded" }
          });
          return;
        }
      }

      ops.push(appendPrepEvent({
        sessionId,
        type: "started",
        actorUserId: candidateUid,
        actorName: candidateName,
      }));
    }

    // resume_selected — candidate attached/changed a resume
    if (afterResumeId && afterResumeId !== beforeResumeId) {
      ops.push(appendPrepEvent({
        sessionId,
        type: "resume_selected",
        actorUserId: candidateUid,
        actorName: candidateName,
        payload: { resumeId: afterResumeId },
      }));
    }

    // ai_review_run — status transitioned to reviewed and we didn't already track it
    if (afterStatus === "reviewed" && beforeStatus !== "reviewed") {
      ops.push(appendPrepEvent({
        sessionId,
        type: "ai_review_run",
        actorUserId: candidateUid,
        actorName: candidateName,
      }));
    }

    // score_lifted — meaningful upward score movement
    if (
      typeof afterScore === "number" &&
      typeof beforeScore === "number" &&
      afterScore - beforeScore >= LIFT_THRESHOLD
    ) {
      ops.push(appendPrepEvent({
        sessionId,
        type: "score_lifted",
        actorUserId: candidateUid,
        actorName: candidateName,
        payload: { fromScore: beforeScore, toScore: afterScore },
      }));
    }

    // marked_ready — first time we observe a ready (or higher) status
    if ((afterStatus === "ready" || afterStatus === "shared") && beforeStatus !== "ready" && beforeStatus !== "shared") {
      ops.push(appendPrepEvent({
        sessionId,
        type: "marked_ready",
        actorUserId: candidateUid,
        actorName: candidateName,
      }));
    }

    // consent_granted — candidate just turned on sharing
    if (afterConsent && !beforeConsent) {
      ops.push(appendPrepEvent({
        sessionId,
        type: "consent_granted",
        actorUserId: candidateUid,
        actorName: candidateName,
      }));

      // Queue the readiness notification email to the branch owner.
      const branchId = after.agencyBranchId as string | undefined;
      const recruiterUid = after.agencyOwnerUserId as string | undefined;
      if (branchId && recruiterUid) {
        const branchSnap = await db.collection("agencyBranches").doc(branchId).get();
        const recruiterSnap = await db.collection("users").doc(recruiterUid).get();
        const branchData = branchSnap.exists ? branchSnap.data() : null;
        const recruiterData = recruiterSnap.exists ? recruiterSnap.data() : null;
        const recruiterEmail = (recruiterData?.email as string) || (branchData?.contactEmail as string) || "";

        if (recruiterEmail && branchData) {
          const latestScore = typeof afterScore === "number" ? afterScore : 0;
          const scoreDelta = typeof after.scoreDelta === "number" ? after.scoreDelta : 0;
          const summary = (after.readinessReport && (after.readinessReport as any).summary)
            || readinessSummaryFromScore(latestScore, scoreDelta);
          ops.push(sendAgencyReadinessEmail({
            branchId,
            branchName: (branchData.branchName as string) || "your branch",
            recruiterEmail,
            recruiterName: (recruiterData?.displayName as string) || (branchData.contactName as string),
            candidateName,
            candidateEmail: (after.candidateEmail as string) || "",
            latestScore,
            scoreDelta,
            readinessSummary: summary,
            resumeSharePath: after.resumeSharePath as string | undefined,
          }).catch((err) => {
            console.error("Failed to queue agency readiness email:", err);
          }));
        }
      }
    }

    if (ops.length > 0) {
      await Promise.all(ops);
    }
  });
