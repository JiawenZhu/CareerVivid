import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { AgencyBranchProfile, AgencyPrepSession, ResumeData } from '../types';
import {
  buildAgencyPrepSessionId,
  getAgencyReadinessSummary,
  normalizeAgencySlug,
  resolveAgencyPrepStatus,
} from '../utils/agencyPartnerUtils';

const cleanFirestoreData = (data: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

export const getAgencyBranchBySlug = async (slug: string): Promise<AgencyBranchProfile | null> => {
  const normalizedSlug = normalizeAgencySlug(slug);
  const branchesRef = collection(db, 'agencyBranches');
  const branchQuery = query(branchesRef, where('slug', '==', normalizedSlug), limit(1));
  const snapshot = await getDocs(branchQuery);

  if (snapshot.empty) return null;
  const branchDoc = snapshot.docs[0];
  return { id: branchDoc.id, ...branchDoc.data() } as AgencyBranchProfile;
};

export const getAgencyBranchById = async (branchId: string): Promise<AgencyBranchProfile | null> => {
  const branchSnap = await getDoc(doc(db, 'agencyBranches', branchId));
  if (!branchSnap.exists()) return null;
  return { id: branchSnap.id, ...branchSnap.data() } as AgencyBranchProfile;
};

export const listenAgencyBranchesForAdmin = (
  onChange: (branches: AgencyBranchProfile[]) => void,
  onError?: (error: Error) => void,
) => {
  const branchesRef = collection(db, 'agencyBranches');
  const branchQuery = query(branchesRef, limit(50));

  return onSnapshot(branchQuery, (snapshot) => {
    const branches = snapshot.docs
      .map(branchDoc => ({ id: branchDoc.id, ...branchDoc.data() } as AgencyBranchProfile))
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
    onChange(branches);
  }, onError);
};

export const listenAgencyBranchesForOwner = (
  ownerUserId: string,
  onChange: (branches: AgencyBranchProfile[]) => void,
  onError?: (error: Error) => void,
) => {
  const branchesRef = collection(db, 'agencyBranches');
  const branchQuery = query(branchesRef, where('ownerUserId', '==', ownerUserId));

  return onSnapshot(branchQuery, (snapshot) => {
    const branches = snapshot.docs
      .map(branchDoc => ({ id: branchDoc.id, ...branchDoc.data() } as AgencyBranchProfile))
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
    onChange(branches);
  }, onError);
};

export const listenAgencyPrepSessions = (
  agencyBranchId: string,
  onChange: (sessions: AgencyPrepSession[]) => void,
  onError?: (error: Error) => void,
) => {
  const sessionsRef = collection(db, 'agencyPrepSessions');
  const sessionsQuery = query(sessionsRef, where('agencyBranchId', '==', agencyBranchId), limit(300));

  return onSnapshot(sessionsQuery, (snapshot) => {
    const sessions = snapshot.docs
      .map(sessionDoc => ({ id: sessionDoc.id, ...sessionDoc.data() } as AgencyPrepSession))
      .sort((a, b) => {
        const timeA = a.updatedAt?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
    onChange(sessions);
  }, onError);
};

export const upsertAgencyPrepSession = async ({
  branch,
  candidateUserId,
  candidateName,
  candidateEmail,
  resume,
  latestScore,
}: {
  branch: AgencyBranchProfile;
  candidateUserId: string;
  candidateName: string;
  candidateEmail: string;
  resume?: ResumeData | null;
  latestScore?: number;
}): Promise<string> => {
  const sessionId = buildAgencyPrepSessionId(branch.id, candidateUserId);
  const sessionRef = doc(db, 'agencyPrepSessions', sessionId);
  const existingSnap = await getDoc(sessionRef);
  const existing = existingSnap.exists() ? existingSnap.data() as AgencyPrepSession : null;
  const scoreDelta = typeof latestScore === 'number' && typeof existing?.startingScore === 'number'
    ? latestScore - existing.startingScore
    : 0;
  const status = resolveAgencyPrepStatus({
    hasResume: Boolean(resume?.id),
    latestScore,
    consentToShare: existing?.consentToShare,
  });

  const payload = cleanFirestoreData({
    agencyBranchId: branch.id,
    agencyOwnerUserId: branch.ownerUserId,
    agencySlug: branch.slug,
    candidateUserId,
    candidateName,
    candidateEmail,
    resumeId: resume?.id,
    resumeTitle: resume ? [resume.personalDetails?.firstName, resume.personalDetails?.lastName].filter(Boolean).join(' ') || resume.title || 'CareerVivid Resume' : undefined,
    status,
    startingScore: existing?.startingScore ?? latestScore,
    latestScore,
    scoreDelta,
    consentToShare: existing?.consentToShare ?? false,
    createdAt: existing?.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
    startedAt: existing?.startedAt ?? serverTimestamp(),
  });

  await setDoc(sessionRef, payload, { merge: true });
  return sessionId;
};

export const shareAgencyPrepSession = async ({
  sessionId,
  candidateUserId,
  resumeId,
  latestScore,
}: {
  sessionId: string;
  candidateUserId: string;
  resumeId: string;
  latestScore: number;
}): Promise<void> => {
  const sessionRef = doc(db, 'agencyPrepSessions', sessionId);
  const sessionSnap = await getDoc(sessionRef);
  const session = sessionSnap.exists() ? sessionSnap.data() as AgencyPrepSession : null;
  const scoreDelta = typeof session?.startingScore === 'number'
    ? Math.max(0, latestScore - session.startingScore)
    : 0;

  await updateDoc(doc(db, 'users', candidateUserId, 'resumes', resumeId), {
    shareConfig: {
      enabled: true,
      permission: 'viewer',
    },
    updatedAt: serverTimestamp(),
  });

  await updateDoc(sessionRef, {
    consentToShare: true,
    status: 'shared',
    latestScore,
    scoreDelta,
    resumeSharePath: `/shared/${candidateUserId}/${resumeId}`,
    readinessReport: {
      resumeId,
      latestScore,
      scoreDelta,
      summary: getAgencyReadinessSummary(latestScore, scoreDelta),
      generatedAt: serverTimestamp(),
    },
    sharedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/** Subscribe to real-time updates for a single candidate prep session. */
export const listenAgencyPrepSession = (
  sessionId: string,
  onChange: (session: AgencyPrepSession | null) => void,
  onError?: (error: Error) => void,
) => {
  const sessionRef = doc(db, 'agencyPrepSessions', sessionId);
  return onSnapshot(
    sessionRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(null);
        return;
      }
      onChange({ id: snapshot.id, ...snapshot.data() } as AgencyPrepSession);
    },
    onError,
  );
};
