/**
 * careerOpsService.ts
 *
 * Client-side service for the Career-Ops AI pipeline.
 * Wraps Firebase callable Functions and Firestore reads/writes.
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import type { CareerProfile, AIJobEvaluation } from "../types";

const functions = getFunctions(undefined, "us-west1");
const db = getFirestore();

// ─────────────────────────────────────────────────────────────────────────────
// Types for function call payloads
// ─────────────────────────────────────────────────────────────────────────────

export interface EvaluateJobParams {
  jobId: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  jobPostURL?: string;
  location?: string;
}

export interface EvaluateJobResult {
  success: boolean;
  evaluation: AIJobEvaluation;
}

export interface LinkedInOutreachParams {
  jobId: string;
  jobTitle: string;
  companyName: string;
  hiringManagerName?: string;
}

export interface DeepResearchParams {
  jobId: string;
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Callable Function Wrappers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the full A-F job evaluation against the user's career profile.
 * Costs 3 AI credits. Requires career profile to be set up first.
 */
export async function evaluateJob(params: EvaluateJobParams): Promise<EvaluateJobResult> {
  const fn = httpsCallable<EvaluateJobParams, EvaluateJobResult>(functions, "evaluateJob");
  const result = await fn(params);
  return result.data;
}

/**
 * Generate a ≤300 char LinkedIn connection request message.
 * Costs 1 AI credit.
 */
export async function generateLinkedInOutreach(
  params: LinkedInOutreachParams
): Promise<string> {
  const fn = httpsCallable<LinkedInOutreachParams, { success: boolean; message: string }>(
    functions,
    "generateLinkedInOutreach"
  );
  const result = await fn(params);
  return result.data.message;
}

/**
 * Generate a deep research prompt for this company (for Perplexity/ChatGPT).
 * Costs 1 AI credit.
 */
export async function generateDeepResearch(params: DeepResearchParams): Promise<string> {
  const fn = httpsCallable<DeepResearchParams, { success: boolean; researchPrompt: string }>(
    functions,
    "generateDeepResearch"
  );
  const result = await fn(params);
  return result.data.researchPrompt;
}

// ─────────────────────────────────────────────────────────────────────────────
// Career Profile CRUD (direct Firestore — simpler than a Function for reads)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Save / update the user's career profile (CV markdown, archetypes, salary target).
 */
export async function saveCareerProfile(
  userId: string,
  profile: Omit<CareerProfile, "uid" | "updatedAt">
): Promise<void> {
  const ref = doc(db, "users", userId, "careerProfile", "profile");
  await setDoc(
    ref,
    {
      ...profile,
      uid: userId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Fetch the user's career profile. Returns null if not set up yet.
 */
export async function getCareerProfile(userId: string): Promise<CareerProfile | null> {
  const ref = doc(db, "users", userId, "careerProfile", "profile");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as CareerProfile;
}

/**
 * Returns true if the user has set up their career profile (has CV text).
 */
export async function hasCareerProfile(userId: string): Promise<boolean> {
  const profile = await getCareerProfile(userId);
  return Boolean(profile?.cvMarkdown && profile.cvMarkdown.trim().length > 100);
}
