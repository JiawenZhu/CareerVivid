import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { appendPrepEvent, AgencyPrepEventType } from "./appendPrepEvent";
import { DEFAULT_AGENCY_INVITE_LIMIT, isCallableAdmin } from "./access";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const REGION = "us-west1";

const DEMO_BRANCH_ID = "demo-champaign-agency-2026";
const DEMO_BRANCH_SLUG = "champaign-agency-demo";

type DemoStatus = "started" | "resume_imported" | "reviewed" | "ready" | "shared";
type ResetDemoMode = "reseed" | "delete_only";

interface DemoCandidate {
  uid: string;
  name: string;
  email: string;
  status: DemoStatus;
  startingScore: number;
  latestScore: number;
  scoreDelta: number;
  resumeId: string;
  consentToShare: boolean;
  positionTags: string[];
  note: string;
}

const DEMO_CANDIDATES: DemoCandidate[] = [
  {
    uid: "demo-candidate-alex-morgan",
    name: "Alex Morgan",
    email: "alex.morgan.demo@careervivid.app",
    status: "started",
    startingScore: 58,
    latestScore: 62,
    scoreDelta: 4,
    resumeId: "demo-resume-alex-morgan",
    consentToShare: false,
    positionTags: ["Warehouse", "Entry Level"],
    note: "Needs first resume import finished before recruiter screen.",
  },
  {
    uid: "demo-candidate-priya-shah",
    name: "Priya Shah",
    email: "priya.shah.demo@careervivid.app",
    status: "resume_imported",
    startingScore: 63,
    latestScore: 71,
    scoreDelta: 8,
    resumeId: "demo-resume-priya-shah",
    consentToShare: false,
    positionTags: ["Administrative", "Customer Support"],
    note: "Resume imported. Ask candidate to complete review suggestions.",
  },
  {
    uid: "demo-candidate-marcus-lee",
    name: "Marcus Lee",
    email: "marcus.lee.demo@careervivid.app",
    status: "reviewed",
    startingScore: 67,
    latestScore: 78,
    scoreDelta: 11,
    resumeId: "demo-resume-marcus-lee",
    consentToShare: false,
    positionTags: ["Manufacturing", "Quality Control"],
    note: "Solid lift after review. Good candidate for light industrial roles.",
  },
  {
    uid: "demo-candidate-lena-garcia",
    name: "Lena Garcia",
    email: "lena.garcia.demo@careervivid.app",
    status: "ready",
    startingScore: 73,
    latestScore: 88,
    scoreDelta: 15,
    resumeId: "demo-resume-lena-garcia",
    consentToShare: false,
    positionTags: ["Warehouse", "Forklift"],
    note: "Ready for placement discussion. Forklift experience should be surfaced first.",
  },
  {
    uid: "demo-candidate-david-vance",
    name: "David Vance",
    email: "david.vance.demo@careervivid.app",
    status: "shared",
    startingScore: 74,
    latestScore: 92,
    scoreDelta: 18,
    resumeId: "demo-resume-david-vance",
    consentToShare: true,
    positionTags: ["CDL Driver", "Logistics"],
    note: "Shared and recruiter-ready. Prioritize for logistics openings.",
  },
  {
    uid: "demo-candidate-nora-kim",
    name: "Nora Kim",
    email: "nora.kim.demo@careervivid.app",
    status: "ready",
    startingScore: 69,
    latestScore: 86,
    scoreDelta: 17,
    resumeId: "demo-resume-nora-kim",
    consentToShare: false,
    positionTags: ["Healthcare", "Medical Assistant"],
    note: "Good healthcare placement candidate after final phone confirmation.",
  },
  {
    uid: "demo-candidate-jamal-brooks",
    name: "Jamal Brooks",
    email: "jamal.brooks.demo@careervivid.app",
    status: "reviewed",
    startingScore: 61,
    latestScore: 76,
    scoreDelta: 15,
    resumeId: "demo-resume-jamal-brooks",
    consentToShare: false,
    positionTags: ["Retail", "Shift Lead"],
    note: "Strong customer-facing background. Needs interview prep next.",
  },
];

const buildSessionId = (branchId: string, candidateUid: string) =>
  `${branchId}_${candidateUid}`.replace(/\//g, "_");

const splitCandidateName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || "Demo",
    lastName: parts.slice(1).join(" ") || "Candidate",
  };
};

const buildDemoResume = (candidate: DemoCandidate) => {
  const { firstName, lastName } = splitCandidateName(candidate.name);
  const primaryTag = candidate.positionTags[0] || "Candidate";
  const secondaryTag = candidate.positionTags[1] || "Operations";
  const today = new Date().toISOString();

  return {
    id: candidate.resumeId,
    title: `${candidate.name} - CareerVivid Resume`,
    updatedAt: today,
    templateId: "modern",
    personalDetails: {
      jobTitle: `${primaryTag} Candidate`,
      photo: "",
      firstName,
      lastName,
      email: candidate.email,
      phone: "(217) 555-0198",
      address: "",
      city: "Champaign",
      postalCode: "61820",
      country: "United States",
    },
    professionalSummary: `${candidate.name} is a ${primaryTag.toLowerCase()} candidate prepared through CareerVivid's agency pilot. Current resume score is ${candidate.latestScore}, with a ${candidate.scoreDelta}-point lift from the starting score.`,
    websites: [],
    skills: [
      { id: `${candidate.uid}-skill-1`, name: primaryTag, level: "Advanced" },
      { id: `${candidate.uid}-skill-2`, name: secondaryTag, level: "Intermediate" },
      { id: `${candidate.uid}-skill-3`, name: "Customer Communication", level: "Intermediate" },
      { id: `${candidate.uid}-skill-4`, name: "Schedule Reliability", level: "Advanced" },
    ],
    employmentHistory: [
      {
        id: `${candidate.uid}-job-1`,
        jobTitle: `${primaryTag} Associate`,
        employer: "Demo Placement Employer",
        city: "Champaign, IL",
        startDate: "2022",
        endDate: "Present",
        description: [
          `- Improved day-to-day ${primaryTag.toLowerCase()} workflows by following documented procedures and communicating status clearly with supervisors.`,
          `- Supported team operations across ${secondaryTag.toLowerCase()} responsibilities while maintaining reliable attendance and task completion.`,
          `- Prepared for agency review through CareerVivid, improving resume readiness from ${candidate.startingScore} to ${candidate.latestScore}.`,
        ].join("\n"),
      },
    ],
    education: [
      {
        id: `${candidate.uid}-edu-1`,
        school: "Champaign Career Prep Program",
        degree: "Workforce Readiness Certificate",
        city: "Champaign, IL",
        startDate: "2024",
        endDate: "2024",
        description: "Career readiness, interview preparation, and workplace communication.",
      },
    ],
    languages: [],
    themeColor: "#2563eb",
    titleFont: "Inter",
    bodyFont: "Inter",
    language: "en",
    sectionTitles: {
      profile: "Profile",
      skills: "Skills",
      experience: "Experience",
      education: "Education",
      contact: "Contact",
    },
    shareConfig: {
      enabled: candidate.consentToShare,
      permission: "viewer",
      readyForRecruiters: candidate.consentToShare || candidate.status === "ready",
      readyAt: candidate.status === "ready" || candidate.status === "shared" ? today : null,
    },
    isDefault: true,
    agencyDemo: {
      branchId: DEMO_BRANCH_ID,
      status: candidate.status,
      latestScore: candidate.latestScore,
      scoreDelta: candidate.scoreDelta,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    seededAt: admin.firestore.FieldValue.serverTimestamp(),
  };
};

const readinessSummary = (latestScore: number, scoreDelta: number) => {
  const deltaText = scoreDelta > 0 ? `, improving by ${scoreDelta} points` : "";
  if (latestScore >= 90) return `Candidate reached a recruiter-ready score of ${latestScore}${deltaText}.`;
  if (latestScore >= 85) return `Candidate is recruiter-ready with a score of ${latestScore}${deltaText}.`;
  if (latestScore >= 75) return `Candidate has been reviewed and is improving with a score of ${latestScore}${deltaText}.`;
  return `Candidate is still preparing with a current score of ${latestScore}${deltaText}.`;
};

const deleteCollection = async (query: FirebaseFirestore.Query): Promise<number> => {
  const snapshot = await query.get();
  if (snapshot.empty) return 0;

  let deleted = 0;
  for (let i = 0; i < snapshot.docs.length; i += 450) {
    const batch = db.batch();
    for (const docSnap of snapshot.docs.slice(i, i + 450)) {
      batch.delete(docSnap.ref);
      deleted += 1;
    }
    await batch.commit();
  }

  return deleted;
};

const demoEventsFor = (candidate: DemoCandidate): Array<{
  type: AgencyPrepEventType;
  description?: string;
  payload?: Record<string, unknown>;
}> => {
  const events: Array<{
    type: AgencyPrepEventType;
    description?: string;
    payload?: Record<string, unknown>;
  }> = [
    { type: "started", description: "Candidate opened the branch prep link." },
  ];

  if (candidate.status !== "started") {
    events.push({
      type: "resume_imported",
      description: "Imported resume into CareerVivid prep workspace.",
      payload: { resumeId: candidate.resumeId },
    });
  }
  if (["reviewed", "ready", "shared"].includes(candidate.status)) {
    events.push({
      type: "ai_review_run",
      description: `Completed AI resume review (+${candidate.scoreDelta} score lift).`,
      payload: { fromScore: candidate.startingScore, toScore: candidate.latestScore },
    });
  }
  if (["ready", "shared"].includes(candidate.status)) {
    events.push({
      type: "mock_interview_completed",
      description: "Completed mock interview practice and readiness prep.",
    });
    events.push({
      type: "marked_ready",
      description: "Marked as recruiter-ready for the branch dashboard.",
    });
  }
  if (candidate.status === "shared") {
    events.push({
      type: "consent_granted",
      description: "Candidate shared their viewer-only resume and readiness report.",
    });
  }

  return events;
};

const wipeDemoDataset = async () => {
  const branchRef = db.collection("agencyBranches").doc(DEMO_BRANCH_ID);
  const oldSessions = await db
    .collection("agencyPrepSessions")
    .where("agencyBranchId", "==", DEMO_BRANCH_ID)
    .get();

  let sessionsDeleted = 0;
  for (const sessionDoc of oldSessions.docs) {
    await deleteCollection(sessionDoc.ref.collection("notes"));
    await deleteCollection(sessionDoc.ref.collection("events"));
    await sessionDoc.ref.delete();
    sessionsDeleted += 1;
  }

  const invitesDeleted = await deleteCollection(branchRef.collection("invites"));
  const rootInvitesDeleted = await deleteCollection(db.collection("agencyInvites").where("agencyBranchId", "==", DEMO_BRANCH_ID));

  let demoUsersDeleted = 0;
  for (const candidate of DEMO_CANDIDATES) {
    const userRef = db.collection("users").doc(candidate.uid);
    await deleteCollection(userRef.collection("resumes"));
    await deleteCollection(userRef.collection("jobTracker"));
    await deleteCollection(userRef.collection("practiceHistory"));
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      await userRef.delete();
      demoUsersDeleted += 1;
    }
  }

  const branchSnap = await branchRef.get();
  if (branchSnap.exists) {
    await branchRef.delete();
  }

  return {
    sessionsDeleted,
    invitesDeleted,
    rootInvitesDeleted,
    demoUsersDeleted,
    branchDeleted: branchSnap.exists,
  };
};

/**
 * Wipe and re-seed the canonical demo branch.
 *
 * Access: authenticated admin or the existing demo branch owner. If the branch
 * does not exist yet, only an admin can create it.
 */
export const resetDemoBranch = functions.region(REGION).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
  }

  const callerUid = context.auth.uid;
  const branchRef = db.collection("agencyBranches").doc(DEMO_BRANCH_ID);
  const existingBranch = await branchRef.get();
  const callerIsAdmin = await isCallableAdmin(context);
  const mode: ResetDemoMode = String(data?.mode || "reseed") === "delete_only" ? "delete_only" : "reseed";

  if (!callerIsAdmin && (!existingBranch.exists || existingBranch.data()?.ownerUserId !== callerUid)) {
    throw new functions.https.HttpsError("permission-denied", "Only an admin or the demo branch owner can reset this branch.");
  }

  const ownerUserId = existingBranch.exists
    ? String(existingBranch.data()?.ownerUserId || callerUid)
    : callerUid;

  const deleted = await wipeDemoDataset();

  if (mode === "delete_only") {
    return {
      ok: true,
      mode,
      candidates: 0,
      branchId: DEMO_BRANCH_ID,
      deleted,
    };
  }

  await branchRef.set({
    ownerUserId,
    organization: "Champaign Agency Demo Branch",
    branchName: "Champaign Agency Demo Branch",
    slug: DEMO_BRANCH_SLUG,
    contactName: "Demo Recruiter",
    contactEmail: "demo@careervivid.app",
    website: "https://careervivid.app/partners/agency",
    primaryColor: "#9a651f",
    pilotStatus: "active",
    inviteLimit: DEFAULT_AGENCY_INVITE_LIMIT,
    seatsUsed: DEMO_CANDIDATES.length,
    averageLatestScore: 0,
    averageScoreLift: 0,
    createdAt: existingBranch.exists
      ? existingBranch.data()?.createdAt || admin.firestore.FieldValue.serverTimestamp()
      : admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  const now = Date.now();
  for (const [index, candidate] of DEMO_CANDIDATES.entries()) {
    const sessionId = buildSessionId(DEMO_BRANCH_ID, candidate.uid);
    const sessionRef = db.collection("agencyPrepSessions").doc(sessionId);
    const userRef = db.collection("users").doc(candidate.uid);
    const resumeRef = userRef.collection("resumes").doc(candidate.resumeId);
    const createdAt = admin.firestore.Timestamp.fromMillis(now - (7 - index) * 24 * 60 * 60 * 1000);
    const updatedAt = admin.firestore.Timestamp.fromMillis(now - Math.max(1, 7 - index) * 6 * 60 * 60 * 1000);
    const resumeSharePath = candidate.consentToShare ? `/shared/${candidate.uid}/${candidate.resumeId}` : null;

    await userRef.set({
      email: candidate.email,
      displayName: candidate.name,
      role: "user",
      agencyDemo: true,
      agencyBranchId: DEMO_BRANCH_ID,
      createdAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    await resumeRef.set({
      ...buildDemoResume(candidate),
      createdAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    const payload: Record<string, unknown> = {
      agencyBranchId: DEMO_BRANCH_ID,
      agencyOwnerUserId: ownerUserId,
      agencySlug: DEMO_BRANCH_SLUG,
      candidateUserId: candidate.uid,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      resumeId: candidate.resumeId,
      resumeTitle: `${candidate.name} - CareerVivid Resume`,
      status: candidate.status,
      startingScore: candidate.startingScore,
      latestScore: candidate.latestScore,
      scoreDelta: candidate.scoreDelta,
      positionTags: candidate.positionTags,
      consentToShare: candidate.consentToShare,
      resumeSharePath,
      readinessReport: candidate.consentToShare || candidate.status === "ready"
        ? {
          resumeId: candidate.resumeId,
          latestScore: candidate.latestScore,
          scoreDelta: candidate.scoreDelta,
          summary: readinessSummary(candidate.latestScore, candidate.scoreDelta),
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }
        : null,
      createdAt,
      updatedAt,
      startedAt: createdAt,
      sharedAt: candidate.consentToShare ? updatedAt : null,
    };

    await sessionRef.set(payload);

    for (const event of demoEventsFor(candidate)) {
      await appendPrepEvent({
        sessionId,
        type: event.type,
        description: event.description,
        payload: event.payload,
        actorName: candidate.name,
        actorUserId: candidate.uid,
      });
    }

    const noteRef = sessionRef.collection("notes").doc();
    await noteRef.set({
      body: candidate.note,
      noteText: candidate.note,
      authorUserId: callerUid,
      recruiterId: callerUid,
      authorName: "Demo Recruiter",
      recruiterName: "Demo Recruiter",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return { ok: true, mode, candidates: DEMO_CANDIDATES.length, branchId: DEMO_BRANCH_ID, deleted };
});
