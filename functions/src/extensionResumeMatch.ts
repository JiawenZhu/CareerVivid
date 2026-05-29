import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

import {
  DEFAULT_VERTEX_TEXT_MODEL,
  getAIClient,
  getVertexLocationForModel,
  resolveVertexModelName,
} from "./utils/ai";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const MATCH_ANALYSIS_CREDIT_COST = 1;

interface GranularMatchCategory {
  score: number;
  rating: string;
  impact: string;
  details: string[];
}

interface ResumeMatchAnalysis {
  totalKeywords: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  matchPercentage: number;
  summary: string;
  verdict?: string;
  verdictCategory?: string;
  qualifications?: GranularMatchCategory;
  responsibilities?: GranularMatchCategory;
  keywords?: GranularMatchCategory;
  jobTitle?: GranularMatchCategory;
}

function getMonthlyLimit(data: admin.firestore.DocumentData): number {
  const plan = data.plan || "free";
  let limit = 100;

  if (plan === "pro" || plan === "premium" || plan === "pro_monthly" || plan === "pro_sprint") {
    limit = 1000;
  } else if (plan === "max" || plan === "pro_max") {
    limit = 5000;
  } else if (plan === "enterprise") {
    limit = Math.max(1, Number(data.seats || 1)) * 1500;
  }

  return limit + Number(data.promotions?.tokenCredits || 0);
}

function getResetDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof admin.firestore.Timestamp) return value.toDate();
  if (typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as admin.firestore.Timestamp).toDate();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function hasMonthElapsed(lastReset: Date | null): boolean {
  if (!lastReset) return false;
  const now = new Date();
  return (now.getFullYear() - lastReset.getFullYear()) * 12 + (now.getMonth() - lastReset.getMonth()) >= 1;
}

async function deductCredits(userId: string, cost: number) {
  const userRef = db.collection("users").doc(userId);

  return db.runTransaction(async (tx) => {
    const userDoc = await tx.get(userRef);
    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User not found");
    }

    const data = userDoc.data() || {};
    const aiUsage = data.aiUsage || {};
    const limit = getMonthlyLimit(data);
    const shouldReset = hasMonthElapsed(getResetDate(aiUsage.lastResetDate));
    const currentCount = shouldReset ? 0 : Number(aiUsage.count || 0);
    const isAdmin = data.role === "admin" || (data.roles || []).includes("admin");

    if (!isAdmin && currentCount + cost > limit) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "AI credit limit reached. Please upgrade your plan."
      );
    }

    const nextCount = currentCount + cost;
    tx.update(userRef, {
      "aiUsage.count": nextCount,
      "aiUsage.monthlyLimit": limit,
      "aiUsage.lastResetDate": shouldReset || !aiUsage.lastResetDate
        ? admin.firestore.FieldValue.serverTimestamp()
        : aiUsage.lastResetDate,
    });

    return {
      count: nextCount,
      limit,
      remaining: Math.max(0, limit - nextCount),
      charged: cost,
    };
  });
}

async function refundCredits(userId: string, cost: number): Promise<void> {
  const userRef = db.collection("users").doc(userId);
  await db.runTransaction(async (tx) => {
    const userDoc = await tx.get(userRef);
    if (!userDoc.exists) return;

    const data = userDoc.data() || {};
    const currentCount = Number(data.aiUsage?.count || 0);
    tx.update(userRef, {
      "aiUsage.count": Math.max(0, currentCount - cost),
    });
  });
}

function parseJsonObject(text: string): ResumeMatchAnalysis {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Unable to parse resume match response.");
  }
}

function normalizeCategory(value: Partial<GranularMatchCategory> | undefined): GranularMatchCategory {
  return {
    score: Number(value?.score ?? 0),
    rating: value?.rating || "Fair",
    impact: value?.impact || "Medium Impact",
    details: Array.isArray(value?.details) ? value!.details!.slice(0, 4).map(String) : [],
  };
}

function normalizeAnalysis(value: Partial<ResumeMatchAnalysis>): ResumeMatchAnalysis {
  const matchedKeywords = Array.isArray(value.matchedKeywords) ? value.matchedKeywords.map(String).slice(0, 12) : [];
  const missingKeywords = Array.isArray(value.missingKeywords) ? value.missingKeywords.map(String).slice(0, 12) : [];

  return {
    totalKeywords: Number(value.totalKeywords ?? matchedKeywords.length + missingKeywords.length),
    matchedKeywords,
    missingKeywords,
    matchPercentage: Math.max(0, Math.min(100, Math.round(Number(value.matchPercentage ?? 0)))),
    summary: value.summary || "Resume match analysis completed.",
    verdict: value.verdict || value.summary || "Resume match analysis completed.",
    verdictCategory: value.verdictCategory || "Fair",
    qualifications: normalizeCategory(value.qualifications),
    responsibilities: normalizeCategory(value.responsibilities),
    keywords: normalizeCategory(value.keywords),
    jobTitle: normalizeCategory(value.jobTitle),
  };
}

export const analyzeExtensionResumeMatch = functions
  .region("us-west1")
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
  })
  .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }

    const resumeText = String(data?.resumeText || "").slice(0, 4000);
    const jobDescription = String(data?.jobDescription || "").slice(0, 2500);

    if (!resumeText || !jobDescription) {
      throw new functions.https.HttpsError("invalid-argument", "Resume text and job description are required.");
    }

    const userId = context.auth.uid;
    let credits: Awaited<ReturnType<typeof deductCredits>> | null = null;

    try {
      credits = await deductCredits(userId, MATCH_ANALYSIS_CREDIT_COST);

      const prompt = `Act as an expert scanning engine. Analyze resume against job description.

Job Description:
${jobDescription}

Resume:
${resumeText}

Audit matches across these four categories:
1. Qualifications: Degrees, study fields, certifications, licenses.
2. Responsibilities: Scope, project scale, seniority level, duties.
3. Keywords: Core tools, tech skills, software.
4. Job Title: Current or past titles compared with target seniority.

Return only compact JSON with this shape:
{
  "totalKeywords": number,
  "matchedKeywords": string[],
  "missingKeywords": string[],
  "matchPercentage": number,
  "summary": string,
  "verdict": string,
  "verdictCategory": "Great" | "Good" | "Fair" | "Missing",
  "qualifications": { "score": number, "rating": string, "impact": string, "details": string[] },
  "responsibilities": { "score": number, "rating": string, "impact": string, "details": string[] },
  "keywords": { "score": number, "rating": string, "impact": string, "details": string[] },
  "jobTitle": { "score": number, "rating": string, "impact": string, "details": string[] }
}

Keep each details array to exactly 2 concise points. Keep keyword arrays to 6-8 core items.`;

      const model = resolveVertexModelName(DEFAULT_VERTEX_TEXT_MODEL);
      const ai = getAIClient(undefined, getVertexLocationForModel(model));
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const analysis = normalizeAnalysis(parseJsonObject(response.text || ""));
      return { analysis, credits };
    } catch (error: any) {
      if (credits) {
        await refundCredits(userId, MATCH_ANALYSIS_CREDIT_COST).catch((refundError) => {
          console.error("[analyzeExtensionResumeMatch] Credit refund failed:", refundError);
        });
      }

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      console.error("[analyzeExtensionResumeMatch] Failed:", error);
      throw new functions.https.HttpsError(
        "internal",
        error?.message || "Failed to analyze resume match."
      );
    }
  });
