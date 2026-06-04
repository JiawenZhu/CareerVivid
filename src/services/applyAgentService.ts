import { httpsCallable } from 'firebase/functions';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db, functions } from '../firebase';
import type {
  ApplicationAnswerPlanItem,
  ApplicationProfile,
  ApplicationQueueItem,
  ApplicationRunReceiptStep,
  JobApplicationData,
} from '../types';
import {
  createDefaultApplicationProfile,
  withApplicationProfileCompletion,
} from '../utils/applicationProfile';

export function applicationProfileRef(userId: string) {
  return doc(db, 'users', userId, 'applicationProfile', 'profile');
}

export async function getApplicationProfile(userId: string): Promise<ApplicationProfile | null> {
  const snap = await getDoc(applicationProfileRef(userId));
  if (!snap.exists()) return null;
  return snap.data() as ApplicationProfile;
}

export function subscribeApplicationProfile(
  userId: string,
  onValue: (profile: ApplicationProfile | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    applicationProfileRef(userId),
    snap => onValue(snap.exists() ? (snap.data() as ApplicationProfile) : null),
    error => onError?.(error)
  );
}

export async function saveApplicationProfile(
  userId: string,
  profile: ApplicationProfile
): Promise<void> {
  const nextProfile = withApplicationProfileCompletion({
    ...createDefaultApplicationProfile(userId),
    ...profile,
    uid: userId,
  });
  await setDoc(
    applicationProfileRef(userId),
    {
      ...nextProfile,
      updatedAt: serverTimestamp(),
      createdAt: nextProfile.createdAt || serverTimestamp(),
    },
    { merge: true }
  );
}

export function subscribeApplicationQueue(
  userId: string,
  onValue: (items: ApplicationQueueItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const ref = collection(db, 'users', userId, 'applicationQueue');
  const q = query(ref, orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    snap => onValue(snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ApplicationQueueItem))),
    error => onError?.(error)
  );
}

export async function prepareApplicationQueueItem(params: {
  job: JobApplicationData;
  resumeId?: string;
}): Promise<{ success: boolean; queueItem: ApplicationQueueItem }> {
  const fn = httpsCallable<
    { jobId: string; resumeId?: string },
    { success: boolean; queueItem: ApplicationQueueItem }
  >(functions, 'prepareApplicationQueueItem');
  const result = await fn({ jobId: params.job.id, resumeId: params.resumeId });
  return result.data;
}

export async function resolveApplicationAnswers(params: {
  queueId: string;
  questions: Array<{ label: string; type: string; existingValue?: string; options?: string[] }>;
  companyName: string;
  jobTitle: string;
  jobDescription?: string;
  jobId?: string;
}): Promise<{ success: boolean; answers: ApplicationAnswerPlanItem[] }> {
  const fn = httpsCallable<typeof params, { success: boolean; answers: ApplicationAnswerPlanItem[] }>(
    functions,
    'resolveApplicationAnswers'
  );
  const result = await fn(params);
  return result.data;
}

export async function claimApplicationQueueItem(params: {
  queueId: string;
  executorId: string;
  executorType: 'extension' | 'desktop';
}): Promise<{ success: boolean; queueItem: ApplicationQueueItem }> {
  const fn = httpsCallable<typeof params, { success: boolean; queueItem: ApplicationQueueItem }>(
    functions,
    'claimApplicationQueueItem'
  );
  const result = await fn(params);
  return result.data;
}

export async function reportApplicationRunStep(params: {
  queueId: string;
  runId?: string;
  step: Omit<ApplicationRunReceiptStep, 'createdAt'>;
}): Promise<{ success: boolean; runId: string }> {
  const fn = httpsCallable<typeof params, { success: boolean; runId: string }>(
    functions,
    'reportApplicationRunStep'
  );
  const result = await fn(params);
  return result.data;
}

export async function completeApplicationRun(params: {
  queueId: string;
  runId?: string;
  status: 'submitted' | 'failed' | 'needs_user' | 'skipped';
  confirmationText?: string;
  error?: string;
}): Promise<{ success: boolean }> {
  const fn = httpsCallable<typeof params, { success: boolean }>(functions, 'completeApplicationRun');
  const result = await fn(params);
  return result.data;
}
