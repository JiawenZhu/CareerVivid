import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { appendPrepEvent } from "./appendPrepEvent";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const REGION = "us-west1";

const DEMO_BRANCH_ID = "demo-champaign-agency-2026";
const DEMO_BRANCH_SLUG = "champaign-agency-demo";

interface DemoCandidate {
  uid: string;
  name: string;
  email: string;
  status: "started" | "reviewed" | "ready" | "shared";
  startingScore: number;
  latestScore: number;
  resumeId: string;
  consentToShare: boolean;
}

const DEMO_CANDIDATES: DemoCandidate[] = [
  {
    uid: "demo-candidate-priya-patel",
    name: "Priya Patel",
    email: "priya.demo@careervivid.app",
    status: "started",
    startingScore: 62,
    latestScore: 62,
    resumeId: "demo-resume-priya",
    consentToShare: false,
  },
  {
    uid: "demo-candidate-marcus-lee",
    name: "Marcus Lee",
    email: "marcus.demo@careervivid.app",
    status: "reviewed",
    startingScore: 64,
    latestScore: 78,
    resumeId: "demo-resume-marcus",
    consentToShare: false,
  },
  {
    uid: "demo-candidate-david-chen",
    name: "David Chen",
    email: "david.demo@careervivid.app",
    status: "ready",
    startingScore: 68,
    latestScore: 88,
    resumeId: "demo-resume-david",
    consentToShare: false,
  },
  {
    uid: "demo-candidate-amina-johnson",
    name: "Amina Johnson",
    email: "amina.demo@careervivid.app",
    status: "shared",
    startingScore: 71,
    latestScore: 92,
    resumeId: "demo-resume-amina",
    consentToShare: true,
  },
];

const buildSessionId = (branchId: string, candidateUid: string) =>
  `${branchId}_${candidateUid}`.replace(/\//g, "_");

const readinessSummary = (latestScore: number, scoreDelta: number) => {
  const deltaText = scoreDelta > 0 ? `, improving by ${scoreDelta} points` : "";
  if (latestScore >= 90) return `Candidate reached a recruiter-ready score of ${latestScore}${deltaText}.`;
  if (latestScore >= 85) return `Candidate is close to recruiter-ready with a score of ${latestScore}${deltaText}.`;
  return `Candidate is still preparing with a current score of ${latestScore}${deltaText}.`;
};

/**
 * Wipe and re-seed the canonical demo branch. Admin-only.
 *
 * Idempotent: every call clears all demo sessions / notes / events / invites
 * tied to the demo branch and re-creates a fresh, predictable demo dataset.
 *
 * Scope is strictly limited to the demo branch — non-demo branches are never
 * touched, regardless of input.
 */
export const resetDemoBranch = functions.region(REGION).https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
  }
  const callerUid = context.auth.uid;
  const adminSnap = await db.collection("admins").doc(callerUid).get();
  if (!adminSnap.exists) {
    throw new functions.https.HttpsError("permission-denied", "Admin only.");
  }

  const branchRef = db.collection("agencyBranches").doc(DEMO_BRANCH_ID);

  // 1. Wipe old demo sessions, their notes, and their events.
  const oldSessions = await db
    .collection("agencyPrepSessions")
    .where("agencyBranchId", "==", DEMO_BRANCH_ID)
    .get();

  for (const sessionDoc of oldSessions.docs) {
    const notesSnap = await sessionDoc.ref.collection("notes").get();
    for (const noteDoc of notesSnap.docs) await noteDoc.ref.delete();
    const eventsSnap = await sessionDoc.ref.collection("events").get();
    for (const eventDoc of eventsSnap.docs) await eventDoc.ref.delete();
    await sessionDoc.ref.delete();
  }

  // 2. Wipe old invites.
  const oldInvites = await branchRef.collection("invites").get();
  for (const inviteDoc of oldInvites.docs) await inviteDoc.ref.delete();

  // 3. Ensure the branch profile exists with demo defaults.
  const existingBranch = await branchRef.get();
  if (!existingBranch.exists) {
    await branchRef.set({
      ownerUserId: callerUid,
      organization: "Champaign Demo Agency",
      branchName: "Champaign Demo Agency",
      slug: DEMO_BRANCH_SLUG,
      contactName: "Demo Recruiter",
      contactEmail: "demo@careervivid.app",
      website: "https://careervivid.app/partners/agency",
      primaryColor: "#9a651f",
      pilotStatus: "active",
      inviteLimit: 20,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await branchRef.update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 4. Re-seed candidates.
  const now = Date.now();
  for (const candidate of DEMO_CANDIDATES) {
    const sessionId = buildSessionId(DEMO_BRANCH_ID, candidate.uid);
    const sessionRef = db.collection("agencyPrepSessions").doc(sessionId);
    const scoreDelta = candidate.latestScore - candidate.startingScore;

    const basePayload: Record<string, unknown> = {
      agencyBranchId: DEMO_BRANCH_ID,
      agencyOwnerUserId: callerUid,
      agencySlug: DEMO_BRANCH_SLUG,
      candidateUserId: candidate.uid,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      resumeId: candidate.resumeId,
      resumeTitle: `${candidate.name} – CareerVivid Resume`,
      status: candidate.status,
      startingScore: candidate.startingScore,
      latestScore: candidate.latestScore,
      scoreDelta,
      consentToShare: candidate.consentToShare,
      createdAt: admin.firestore.Timestamp.fromMillis(now - 3 * 24 * 60 * 60 * 1000),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      startedAt: admin.firestore.Timestamp.fromMillis(now - 2 * 24 * 60 * 60 * 1000),
    };

    if (candidate.consentToShare) {
      basePayload.resumeSharePath = `/shared/${candidate.uid}/${candidate.resumeId}`;
      basePayload.sharedAt = admin.firestore.Timestamp.fromMillis(now - 6 * 60 * 60 * 1000);
      basePayload.readinessReport = {
        resumeId: candidate.resumeId,
        latestScore: candidate.latestScore,
        scoreDelta,
        summary: readinessSummary(candidate.latestScore, scoreDelta),
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
    }

    await sessionRef.set(basePayload);

    // Seed a realistic timeline for the candidate.
    const events: Array<{ type: Parameters<typeof appendPrepEvent>[0]["type"]; payload?: Record<string, unknown> }> = [
      { type: "started" },
      { type: "resume_selected", payload: { resumeId: candidate.resumeId } },
    ];
    if (candidate.status !== "started") {
      events.push({ type: "ai_review_run" });
      if (scoreDelta > 0) {
        events.push({ type: "score_lifted", payload: { fromScore: candidate.startingScore, toScore: candidate.latestScore } });
      }
    }
    if (candidate.status === "ready" || candidate.status === "shared") {
      events.push({ type: "marked_ready" });
    }
    if (candidate.status === "shared") {
      events.push({ type: "consent_granted" });
    }
    for (const evt of events) {
      await appendPrepEvent({ sessionId, type: evt.type, payload: evt.payload, actorName: candidate.name });
    }
  }

  return { ok: true, candidates: DEMO_CANDIDATES.length };
});
