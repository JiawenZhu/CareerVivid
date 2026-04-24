/**
 * agentProxy — Firebase HTTP Function
 *
 * Proxies CareerVivid CLI agent requests to Gemini using the server-side API key.
 * Authentication is done via the user's `cv_live_` API key (same as agentDeductCredits).
 *
 * Request body (POST JSON):
 *   - apiKey:          string  — the user's cv_live_... CareerVivid API key
 *   - model:           string  — Gemini model name (e.g. "gemini-2.5-flash")
 *   - contents:        Content[] — the full conversation history in @google/genai format
 *   - tools?:          Tool[]  — Gemini tool declarations
 *   - systemInstruction?: string — system prompt
 *   - thinkingBudget?: number — thinking token budget (0 to disable)
 *   - includeThoughts?: boolean — whether to return thought parts
 *
 * Response JSON:
 *   - candidates:      Gemini response candidates
 *   - creditsUsed:     number
 *   - creditsRemaining: number
 *   - monthlyLimit:    number
 */

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import cors from "cors";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI, Content } from "@google/generative-ai";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const corsHandler = cors({ origin: true });
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// ─────────────────────────────────────────────────────────────────────────────
// Credit costs per model (must match agentCredits.ts)
// ─────────────────────────────────────────────────────────────────────────────
const MODEL_CREDIT_COST: Record<string, number> = {
  "gemini-3.1-flash-lite-preview": 0.5,
  "gemini-2.5-flash": 1,
  "gemini-3.1-pro-preview": 2,
  default: 1,
};

function getMonthlyLimit(plan?: string): number {
  if (plan === "max" || plan === "pro_max") return 10000;
  if (plan === "pro_monthly" || plan === "pro") return 1000;
  if (plan === "pro_sprint") return 300;
  return 100; // free
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve user from API key and deduct credits atomically
// ─────────────────────────────────────────────────────────────────────────────
async function resolveAndDeduct(
  apiKey: string,
  model: string
): Promise<{
  ok: boolean;
  uid?: string;
  reason?: string;
  creditsUsed?: number;
  creditsRemaining?: number;
  monthlyLimit?: number;
}> {
  // Resolve user from API key via collection group query on the 'private' subcollection.
  // API keys are stored at: users/{uid}/private/{docId} with a 'key' field.
  // The fieldOverride index in firestore.indexes.json covers: collectionGroup=private, field=key, COLLECTION_GROUP
  const snapshot = await db
    .collectionGroup("private")
    .where("key", "==", apiKey)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { ok: false, reason: "Invalid or revoked API key." };
  }

  const keyDoc = snapshot.docs[0];
  const pathSegments = keyDoc.ref.path.split("/");
  // Path: users/{uid}/private/{docId} → segments[0]=users, segments[1]=uid
  const uid = pathSegments[1];

  const costPerCall = MODEL_CREDIT_COST[model] ?? MODEL_CREDIT_COST["default"];
  const userRef = db.collection("users").doc(uid);

  const result = await db.runTransaction(async (tx) => {
    const userDoc = await tx.get(userRef);
    if (!userDoc.exists) {
      return { ok: false, reason: "User not found." };
    }

    const userData = userDoc.data()!;
    const isAdmin =
      userData.role === "admin" || (userData.roles || []).includes("admin");

    const aiUsage = userData.aiUsage || {};
    const currentMonth = new Date().toISOString().slice(0, 7); // "2026-04"
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

    const updates: Record<string, any> = {
      "aiUsage.count":
        usageMonth === currentMonth
          ? admin.firestore.FieldValue.increment(costPerCall)
          : count + costPerCall,
      "aiUsage.month": currentMonth,
      "aiUsage.cliCount": admin.firestore.FieldValue.increment(costPerCall),
    };

    tx.update(userRef, updates);

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

// ─────────────────────────────────────────────────────────────────────────────
// agentProxy — HTTPS function
// ─────────────────────────────────────────────────────────────────────────────
export const agentProxy = functions
  .region("us-west1")
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
    secrets: [geminiApiKey],
  })
  .https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
      // Preflight
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed" });
        return;
      }

      const {
        apiKey,
        model,
        contents,
        tools: toolDeclarations,
        systemInstruction,
        thinkingBudget,
        includeThoughts,
      } = req.body || {};

      // ── Input validation ────────────────────────────────────────────────
      if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("cv_live_")) {
        res.status(401).json({ error: "A valid CareerVivid API key is required." });
        return;
      }
      if (!model || typeof model !== "string") {
        res.status(400).json({ error: "model is required." });
        return;
      }
      if (!Array.isArray(contents) || contents.length === 0) {
        res.status(400).json({ error: "contents (conversation history) is required." });
        return;
      }

      // ── Check + deduct credits ──────────────────────────────────────────
      const creditResult = await resolveAndDeduct(apiKey, model);
      if (!creditResult.ok) {
        if (creditResult.reason === "limit_reached") {
          res.status(402).json({
            error: "credit_limit_reached",
            creditsRemaining: creditResult.creditsRemaining ?? 0,
            monthlyLimit: creditResult.monthlyLimit ?? 100,
          });
        } else {
          res.status(401).json({ error: creditResult.reason || "Authentication failed." });
        }
        return;
      }

      // ── Call Gemini ─────────────────────────────────────────────────────
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey.value());

        const generationConfig: Record<string, any> = {};
        if (thinkingBudget && thinkingBudget > 0) {
          generationConfig.thinkingConfig = {
            thinkingBudget,
            includeThoughts: includeThoughts ?? false,
          };
        }

        const modelInstance = genAI.getGenerativeModel({
          model,
          systemInstruction: systemInstruction ?? undefined,
          tools: toolDeclarations ?? undefined,
          generationConfig: Object.keys(generationConfig).length > 0 ? generationConfig : undefined,
        });

        const result = await modelInstance.generateContent({
          contents: contents as Content[],
        });

        const response = result.response;

        res.json({
          candidates: response.candidates,
          promptFeedback: response.promptFeedback,
          creditsUsed: creditResult.creditsUsed,
          creditsRemaining: creditResult.creditsRemaining,
          monthlyLimit: creditResult.monthlyLimit,
        });
      } catch (err: any) {
        console.error("[agentProxy] Gemini error:", err);
        res.status(500).json({
          error: err.message || "Gemini call failed.",
          details: err.toString(),
        });
      }
    });
  });
