/**
 * VectorLotto Firestore Service Layer
 * 
 * Collections (shared in jastalk-firebase project):
 *   vectorlotto_predictions  - each generate() call saves a run
 *   vectorlotto_users        - usage tracking & subscription status
 *   vectorlotto_draw_history - Mega Millions historical draw data (migrated from CSV)
 *   vectorlotto_waitlist     - email captures from PaywallModal
 */

import {
  collection,
  addDoc,
  setDoc,
  getDoc,
  doc,
  serverTimestamp,
  increment,
  Timestamp,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  predictionCount: number;           // total lifetime predictions
  dailyCount: number;                // resets each day
  lastPredictionDate: string | null; // YYYY-MM-DD
  plan: "free" | "pro";             // subscription tier
  joinedAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PredictionRecord {
  userId: string | null;             // null for anonymous
  sessionId: string;                 // browser fingerprint fallback
  runId: string;
  targetDrawDate: string;
  ticketCount: number;
  budget: number;
  bankrollAtPred: number;
  ensembleWeights: Record<string, unknown>;
  tickets: Array<{ wb: number[]; mb: number; strategy: string }>;
  createdAt: Timestamp;
}

export interface WaitlistEntry {
  email: string;
  source: "paywall" | "landing";
  predictionCount: number;
  createdAt: Timestamp;
}

// ── Session ID (anonymous tracking) ────────────────────────────────────────────

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let sid = localStorage.getItem("vl_session_id");
  if (!sid) {
    sid = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("vl_session_id", sid);
  }
  return sid;
}

// ── User Profile ───────────────────────────────────────────────────────────────

export async function getOrCreateUserProfile(
  uid: string,
  email: string | null,
  displayName: string | null,
  photoURL: string | null
): Promise<UserProfile> {
  const ref = doc(db, "vectorlotto_users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  const profile: UserProfile = {
    uid,
    email,
    displayName,
    photoURL,
    predictionCount: 0,
    dailyCount: 0,
    lastPredictionDate: null,
    plan: "free",
    joinedAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  await setDoc(ref, profile);
  return profile;
}

export async function incrementUserPrediction(uid: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const ref = doc(db, "vectorlotto_users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const data = snap.data() as UserProfile;
  const isNewDay = data.lastPredictionDate !== today;

  await setDoc(
    ref,
    {
      predictionCount: increment(1),
      dailyCount: isNewDay ? 1 : increment(1),
      lastPredictionDate: today,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUserPlan(uid: string): Promise<"free" | "pro"> {
  const snap = await getDoc(doc(db, "vectorlotto_users", uid));
  if (!snap.exists()) return "free";
  return (snap.data() as UserProfile).plan ?? "free";
}

// ── Prediction History ─────────────────────────────────────────────────────────

export async function savePrediction(record: Omit<PredictionRecord, "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "vectorlotto_predictions"), {
    ...record,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getRecentPredictions(userId: string, n = 10): Promise<PredictionRecord[]> {
  const q = query(
    collection(db, "vectorlotto_predictions"),
    orderBy("createdAt", "desc"),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PredictionRecord);
}

// ── Waitlist ───────────────────────────────────────────────────────────────────

export async function addToWaitlist(
  email: string,
  source: WaitlistEntry["source"],
  predictionCount: number
): Promise<void> {
  // Use email as doc ID to prevent duplicates
  await setDoc(
    doc(db, "vectorlotto_waitlist", email.replace(/\./g, "_")),
    {
      email,
      source,
      predictionCount,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ── Free Tier Gate ─────────────────────────────────────────────────────────────

const FREE_DAILY_LIMIT = 3;

export async function checkUsageGate(uid: string | null): Promise<{
  allowed: boolean;
  remainingToday: number;
  isPro: boolean;
}> {
  // Anonymous users: localStorage-only gate (handled in UI)
  if (!uid) {
    return { allowed: true, remainingToday: 3, isPro: false };
  }

  const snap = await getDoc(doc(db, "vectorlotto_users", uid));
  if (!snap.exists()) return { allowed: true, remainingToday: FREE_DAILY_LIMIT, isPro: false };

  const data = snap.data() as UserProfile;

  if (data.plan === "pro") {
    return { allowed: true, remainingToday: Infinity, isPro: true };
  }

  const today = new Date().toISOString().slice(0, 10);
  const isNewDay = data.lastPredictionDate !== today;
  const dailyCount = isNewDay ? 0 : (data.dailyCount ?? 0);
  const remaining = Math.max(0, FREE_DAILY_LIMIT - dailyCount);

  return {
    allowed: remaining > 0,
    remainingToday: remaining,
    isPro: false,
  };
}
