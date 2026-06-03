import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { appendPrepEvent } from "./appendPrepEvent";
import { sendAgencyReadinessEmail } from "./agencyEmails";
import { DEFAULT_AGENCY_INVITE_LIMIT } from "./access";

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
  if (latestScore >= READINESS_THRESHOLD) return `Candidate is recruiter-ready with a score of ${latestScore}${deltaText}.`;
  return `Candidate is still preparing with a current score of ${latestScore}${deltaText}.`;
};

const hasChanged = (
  before: FirebaseFirestore.DocumentData | null,
  after: FirebaseFirestore.DocumentData,
  field: string
): boolean => before?.[field] !== after[field];

async function updateBranchAggregates(branchId: string): Promise<{
  seatsUsed: number;
  inviteLimit: number;
  overInviteLimit: boolean;
}> {
  const branchRef = db.collection("agencyBranches").doc(branchId);

  const sessionsSnap = await db.collection("agencyPrepSessions")
    .where("agencyBranchId", "==", branchId)
    .get();

  let scoreSum = 0;
  let scoreCount = 0;
  let deltaSum = 0;
  let deltaCount = 0;
  const statusCounts: Record<string, number> = {};

  for (const docSnap of sessionsSnap.docs) {
    const data = docSnap.data();
    const status = String(data.status || "started");
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    if (typeof data.latestScore === "number") {
      scoreSum += data.latestScore;
      scoreCount += 1;
    }
    if (typeof data.scoreDelta === "number") {
      deltaSum += data.scoreDelta;
      deltaCount += 1;
    }
  }

  return db.runTransaction(async (transaction) => {
    const branchSnap = await transaction.get(branchRef);
    if (!branchSnap.exists) {
      return {
        seatsUsed: sessionsSnap.size,
        inviteLimit: DEFAULT_AGENCY_INVITE_LIMIT,
        overInviteLimit: sessionsSnap.size > DEFAULT_AGENCY_INVITE_LIMIT,
      };
    }

    const branch = branchSnap.data() || {};
    const inviteLimit = typeof branch.inviteLimit === "number"
      ? branch.inviteLimit
      : DEFAULT_AGENCY_INVITE_LIMIT;
    const averageLatestScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : null;
    const averageScoreLift = deltaCount > 0 ? Math.round((deltaSum / deltaCount) * 10) / 10 : null;
    const overInviteLimit = sessionsSnap.size > inviteLimit;
    const readyCount = (statusCounts.ready || 0) + (statusCounts.shared || 0);
    const sharedCount = statusCounts.shared || 0;

    transaction.set(branchRef, {
      seatsUsed: sessionsSnap.size,
      totalCandidateSeatsUsed: sessionsSnap.size,
      averageLatestScore,
      averageBranchCandidateScore: averageLatestScore,
      averageScoreLift,
      averageBranchScoreLiftDelta: averageScoreLift,
      overInviteLimit,
      seatLimitExceeded: overInviteLimit,
      quotaStatus: overInviteLimit ? "over_limit" : "ok",
      metrics: {
        seatsUsed: sessionsSnap.size,
        inviteLimit,
        averageLatestScore,
        averageScoreLift,
        statusCounts,
        readyCount,
        sharedCount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      metricsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return { seatsUsed: sessionsSnap.size, inviteLimit, overInviteLimit };
  });
}

/**
 * Keep agency branch metrics and session timeline events synchronized from
 * writes to agencyPrepSessions.
 */
export const onAgencyPrepSessionWritten = functions
  .region(REGION)
  .firestore.document("agencyPrepSessions/{sessionId}")
  .onWrite(async (change, context) => {
    const sessionId = context.params.sessionId as string;
    const before = change.before.exists ? change.before.data() as FirebaseFirestore.DocumentData : null;
    const after = change.after.exists ? change.after.data() as FirebaseFirestore.DocumentData : null;

    const branchId = (after?.agencyBranchId || before?.agencyBranchId) as string | undefined;
    let aggregateResult: { seatsUsed: number; inviteLimit: number; overInviteLimit: boolean } | null = null;
    if (branchId) {
      aggregateResult = await updateBranchAggregates(branchId);
    }

    if (!after) return;

    if (
      aggregateResult?.overInviteLimit &&
      before === null &&
      after.overLimit !== true
    ) {
      await change.after.ref.set({
        overLimit: true,
        status: "inactive",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      await appendPrepEvent({
        sessionId,
        type: "quota_exceeded",
        actorUserId: after.candidateUserId as string | undefined,
        actorName: (after.candidateName as string) || "Candidate",
        payload: {
          seatsUsed: aggregateResult.seatsUsed,
          inviteLimit: aggregateResult.inviteLimit,
        },
      });
      return;
    }

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

    if (!before && after) {
      ops.push(appendPrepEvent({
        sessionId,
        type: "started",
        actorUserId: candidateUid,
        actorName: candidateName,
      }));
    }

    if (afterResumeId && afterResumeId !== beforeResumeId) {
      ops.push(appendPrepEvent({
        sessionId,
        type: "resume_imported",
        actorUserId: candidateUid,
        actorName: candidateName,
        payload: { resumeId: afterResumeId },
      }));
    }

    if (
      (afterStatus === "reviewed" || afterStatus === "ready" || afterStatus === "shared") &&
      beforeStatus !== afterStatus &&
      beforeStatus !== "reviewed"
    ) {
      ops.push(appendPrepEvent({
        sessionId,
        type: "ai_review_run",
        actorUserId: candidateUid,
        actorName: candidateName,
      }));
    }

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
        description: `Improved readiness score from ${beforeScore} to ${afterScore}.`,
      }));
    }

    if ((afterStatus === "ready" || afterStatus === "shared") && beforeStatus !== "ready" && beforeStatus !== "shared") {
      ops.push(appendPrepEvent({
        sessionId,
        type: "marked_ready",
        actorUserId: candidateUid,
        actorName: candidateName,
      }));
    }

    if (afterConsent && !beforeConsent) {
      ops.push(appendPrepEvent({
        sessionId,
        type: "consent_granted",
        actorUserId: candidateUid,
        actorName: candidateName,
      }));

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

    if (
      hasChanged(before, after, "latestScore") ||
      hasChanged(before, after, "scoreDelta") ||
      hasChanged(before, after, "status")
    ) {
      const latestScore = typeof afterScore === "number" ? afterScore : null;
      const scoreDelta = typeof after.scoreDelta === "number" ? after.scoreDelta : null;
      if (
        (latestScore !== after.readinessReport?.latestScore || scoreDelta !== after.readinessReport?.scoreDelta) &&
        (afterStatus === "ready" || afterStatus === "shared")
      ) {
        ops.push(change.after.ref.set({
          readinessReport: {
            ...(after.readinessReport || {}),
            resumeId: after.resumeId || after.readinessReport?.resumeId || null,
            latestScore,
            scoreDelta,
            summary: typeof latestScore === "number" && typeof scoreDelta === "number"
              ? readinessSummaryFromScore(latestScore, scoreDelta)
              : after.readinessReport?.summary || null,
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true }));
      }
    }

    if (ops.length > 0) {
      await Promise.all(ops);
    }
  });
