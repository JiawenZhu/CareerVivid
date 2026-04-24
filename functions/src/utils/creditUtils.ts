/**
 * creditUtils.ts — Shared credit resolution & deduction logic.
 *
 * Extracted from agentProxy.ts so it can be reused by llmGateway
 * and any future billing-aware Cloud Functions.
 */

import * as admin from "firebase-admin";

const db = () => admin.firestore();

// ─── Credit costs per model ───────────────────────────────────────────────────
export const MODEL_CREDIT_COST: Record<string, number> = {
  // Gemini
  "gemini-3.1-flash-lite-preview": 0.5,
  "gemini-2.5-flash": 1,
  "gemini-3.1-flash-preview": 1,
  "gemini-3.1-pro-preview": 2,
  "gemini-2.5-pro-preview": 2,
  // Anthropic / Claude
  "claude-haiku-4-5": 0.5,
  "claude-3-5-haiku-20241022": 0.5,
  "claude-sonnet-4-5": 1.5,
  "claude-3-5-sonnet-20241022": 1.5,
  "claude-opus-4-5": 3,
  // OpenAI via OpenRouter
  "gpt-4o-mini": 0.5,
  "gpt-4o": 2,
  // Default fallback
  default: 1,
};

export function getMonthlyLimit(plan?: string): number {
  if (plan === "max" || plan === "pro_max") return 10000;
  if (plan === "pro_monthly" || plan === "pro") return 1000;
  if (plan === "pro_sprint") return 300;
  return 100; // free tier
}

export interface CreditResult {
  ok: boolean;
  uid?: string;
  reason?: string;
  creditsUsed?: number;
  creditsRemaining?: number;
  monthlyLimit?: number;
}

/**
 * Validates a cv_live_ API key, looks up the owning user, and atomically
 * deducts credits for the requested model. Returns ok=false if the key is
 * invalid, user not found, or credit limit reached.
 */
export async function resolveAndDeduct(
  apiKey: string,
  model: string
): Promise<CreditResult> {
  const firestore = db();

  // Resolve user by API key (stored at users/{uid}/private/{docId}.key)
  const snapshot = await firestore
    .collectionGroup("private")
    .where("key", "==", apiKey)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { ok: false, reason: "Invalid or revoked API key." };
  }

  const keyDoc = snapshot.docs[0];
  const pathSegments = keyDoc.ref.path.split("/");
  const uid = pathSegments[1]; // users/{uid}/private/{docId}

  const costPerCall = MODEL_CREDIT_COST[model] ?? MODEL_CREDIT_COST["default"];
  const userRef = firestore.collection("users").doc(uid);

  const result = await firestore.runTransaction(async (tx) => {
    const userDoc = await tx.get(userRef);
    if (!userDoc.exists) {
      return { ok: false, reason: "User not found." };
    }

    const userData = userDoc.data()!;
    const isAdmin =
      userData.role === "admin" || (userData.roles || []).includes("admin");

    const aiUsage = userData.aiUsage || {};
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usageMonth: string = aiUsage.month || "";
    let count: number = usageMonth === currentMonth ? (aiUsage.count ?? 0) : 0;
    let limit: number = aiUsage.monthlyLimit ?? getMonthlyLimit(userData.plan);
    const tokenCredits = userData.promotions?.tokenCredits || 0;
    limit += tokenCredits;

    if (!isAdmin && count + costPerCall > limit - 2) {
      return {
        ok: false,
        reason: "limit_reached",
        creditsRemaining: Math.max(0, limit - count),
        monthlyLimit: limit,
      };
    }

    tx.update(userRef, {
      "aiUsage.count":
        usageMonth === currentMonth
          ? admin.firestore.FieldValue.increment(costPerCall)
          : count + costPerCall,
      "aiUsage.month": currentMonth,
      "aiUsage.gatewayCount": admin.firestore.FieldValue.increment(costPerCall),
    });

    return {
      ok: true,
      uid,
      creditsUsed: costPerCall,
      creditsRemaining: Math.max(0, limit - count - costPerCall),
      monthlyLimit: limit,
    };
  });

  return result;
}
