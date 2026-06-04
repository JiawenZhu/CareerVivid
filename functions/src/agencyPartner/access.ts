import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const DEFAULT_AGENCY_INVITE_LIMIT = 40;

export type AgencyBranchData = FirebaseFirestore.DocumentData & {
  ownerUserId?: string;
  branchName?: string;
  slug?: string;
  inviteLimit?: number;
};

export function assertAuthenticated(
  context: functions.https.CallableContext
): NonNullable<functions.https.CallableContext["auth"]> {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
  }
  return context.auth;
}

export async function isCallableAdmin(context: functions.https.CallableContext): Promise<boolean> {
  const auth = context.auth;
  if (!auth) return false;

  const token = auth.token || {};
  if (token.admin === true || token.role === "admin" || token.role === "super_admin") {
    return true;
  }
  if (Array.isArray(token.roles) && (token.roles.includes("admin") || token.roles.includes("super_admin"))) {
    return true;
  }

  const adminSnap = await db.collection("admins").doc(auth.uid).get();
  if (adminSnap.exists) return true;

  const userSnap = await db.collection("users").doc(auth.uid).get();
  const userData = userSnap.exists ? userSnap.data() : null;
  const role = userData?.role as string | undefined;
  const roles = Array.isArray(userData?.roles) ? userData?.roles as string[] : [];
  return role === "admin" || role === "super_admin" || roles.includes("admin") || roles.includes("super_admin");
}

export async function getBranchOrThrow(branchId: string): Promise<{
  ref: FirebaseFirestore.DocumentReference;
  data: AgencyBranchData;
}> {
  const ref = db.collection("agencyBranches").doc(branchId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError("not-found", "Agency branch not found.");
  }
  return { ref, data: snap.data() as AgencyBranchData };
}

export async function authorizeBranchOwnerOrAdmin(
  context: functions.https.CallableContext,
  branchId: string
): Promise<{
  branchRef: FirebaseFirestore.DocumentReference;
  branchData: AgencyBranchData;
  callerUid: string;
  isAdmin: boolean;
}> {
  const auth = assertAuthenticated(context);
  const { ref, data } = await getBranchOrThrow(branchId);
  const isAdmin = await isCallableAdmin(context);

  if (!isAdmin && data.ownerUserId !== auth.uid) {
    throw new functions.https.HttpsError("permission-denied", "Only the branch owner or an admin can do this.");
  }

  return { branchRef: ref, branchData: data, callerUid: auth.uid, isAdmin };
}

export async function authorizeSessionBranchOwnerOrAdmin(
  context: functions.https.CallableContext,
  sessionId: string
): Promise<{
  sessionRef: FirebaseFirestore.DocumentReference;
  sessionData: FirebaseFirestore.DocumentData;
  branchRef: FirebaseFirestore.DocumentReference;
  branchData: AgencyBranchData;
  callerUid: string;
  callerName: string;
  isAdmin: boolean;
}> {
  const auth = assertAuthenticated(context);
  const sessionRef = db.collection("agencyPrepSessions").doc(sessionId);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Prep session not found.");
  }

  const sessionData = sessionSnap.data() as FirebaseFirestore.DocumentData;
  const branchId = String(sessionData.agencyBranchId || "").trim();
  if (!branchId) {
    throw new functions.https.HttpsError("failed-precondition", "Prep session is missing its agency branch.");
  }

  const { ref: branchRef, data: branchData } = await getBranchOrThrow(branchId);
  const isAdmin = await isCallableAdmin(context);
  const branchOwnerId = branchData.ownerUserId || sessionData.agencyOwnerUserId;

  if (!isAdmin && branchOwnerId !== auth.uid) {
    throw new functions.https.HttpsError("permission-denied", "Only the branch owner or an admin can do this.");
  }

  const callerUserSnap = await db.collection("users").doc(auth.uid).get();
  const callerUserData = callerUserSnap.exists ? callerUserSnap.data() : null;
  const callerName = (callerUserData?.displayName as string)
    || (callerUserData?.email as string)
    || (auth.token?.name as string)
    || "Recruiter";

  return {
    sessionRef,
    sessionData,
    branchRef,
    branchData,
    callerUid: auth.uid,
    callerName,
    isAdmin,
  };
}

