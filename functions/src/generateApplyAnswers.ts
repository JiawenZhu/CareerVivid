import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI } from "@google/genai";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApplyQuestion {
    label: string;
    type: "text" | "textarea" | "select" | "email" | "tel" | "url" | "date" | "unknown";
    /** Existing structured answer from FieldMapper (if already resolved) */
    existingValue?: string;
    /** Available options for select fields */
    options?: string[];
}

interface ApplyAnswer {
    label: string;
    answer: string;
    confidence: "high" | "medium" | "low";
    source: "profile_field" | "ai_generated" | "skipped";
    reasoning?: string;
}

// ── Credit helper ─────────────────────────────────────────────────────────────

async function deductCredits(userId: string, cost: number): Promise<void> {
    const userRef = db.collection("users").doc(userId);
    await db.runTransaction(async (tx) => {
        const userDoc = await tx.get(userRef);
        if (!userDoc.exists) {
            throw new functions.https.HttpsError("not-found", "User not found");
        }
        const data = userDoc.data()!;
        const aiUsage = data.aiUsage || {};
        const count: number = aiUsage.count || 0;
        const limit: number = aiUsage.monthlyLimit || getDefaultLimit(data.plan);
        const isAdmin = data.role === "admin" || (data.roles || []).includes("admin");

        if (!isAdmin && count + cost > limit) {
            throw new functions.https.HttpsError(
                "resource-exhausted",
                "AI credit limit reached. Please upgrade your plan."
            );
        }
        tx.update(userRef, {
            "aiUsage.count": admin.firestore.FieldValue.increment(cost),
        });
    });
}

function getDefaultLimit(plan?: string): number {
    if (plan === "pro_monthly") return 300;
    if (plan === "pro_sprint") return 100;
    if (plan === "pro" || plan === "pro_max") return 666;
    return 10;
}

// ── Determine which questions need AI ─────────────────────────────────────────

const STRUCTURED_PATTERNS = [
    /^(first|last|full|given|family|legal)[\s_]?name/i,
    /^(email|e-mail|work email|personal email)/i,
    /^(phone|mobile|cell|telephone)/i,
    /^(city|state|province|country|location|address)/i,
    /^(linkedin|github|portfolio|website|personal site)/i,
    /^(degree|education|school|university|college|gpa|graduation)/i,
    /^(current employer|current company|employer|company name)$/i,
    /^(current title|job title|position|current role)$/i,
    /^(salary|compensation|expected salary|desired salary)/i,
    /^(start date|available|notice period)/i,
    /^(authorized|visa|sponsorship|work authorization)/i,
    /^(years of experience)/i,
];

function needsAI(label: string, existingValue?: string): boolean {
    // If we already have a structured answer, skip AI for this field
    if (existingValue && existingValue.trim().length > 0) return false;

    const normalized = label.toLowerCase().trim();

    // If it matches a known structured field pattern, skip AI
    if (STRUCTURED_PATTERNS.some((p) => p.test(normalized))) return false;

    // Everything else (cover letters, "why us", behavioral Qs) needs AI
    return true;
}

// ── Main Cloud Function ───────────────────────────────────────────────────────

export const generateApplyAnswers = functions
    .region("us-west1")
    .runWith({
        secrets: [geminiApiKey],
        timeoutSeconds: 120,
        memory: "512MB",
    })
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError(
                "unauthenticated",
                "User must be authenticated"
            );
        }

        const userId = context.auth.uid;
        const {
            questions,
            companyName,
            jobTitle,
            jobDescription,
            jobId,
        }: {
            questions: ApplyQuestion[];
            companyName: string;
            jobTitle: string;
            jobDescription?: string;
            jobId?: string;
        } = data;

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "questions array is required"
            );
        }

        if (!companyName || !jobTitle) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "companyName and jobTitle are required"
            );
        }

        // Deduct 3 credits for the AI answer generation
        await deductCredits(userId, 3);

        // ── 1. Fetch user's career profile (CV markdown) ──────────────────────

        let cvMarkdown = "";
        try {
            const profileDoc = await db
                .collection("users")
                .doc(userId)
                .collection("careerProfile")
                .doc("profile")
                .get();

            if (profileDoc.exists) {
                cvMarkdown = profileDoc.data()?.cvMarkdown || "";
            }
        } catch (_) {
            // Non-fatal — we'll work with whatever we have
        }

        // Fallback: build cv context from resumes collection
        if (!cvMarkdown) {
            try {
                const resumeSnap = await db
                    .collection("users")
                    .doc(userId)
                    .collection("resumes")
                    .orderBy("updatedAt", "desc")
                    .limit(1)
                    .get();

                if (!resumeSnap.empty) {
                    const r = resumeSnap.docs[0].data();
                    const personal = r.personalDetails || {};
                    const lines: string[] = [];
                    if (personal.firstName) lines.push(`Name: ${personal.firstName} ${personal.lastName}`);
                    if (personal.jobTitle) lines.push(`Title: ${personal.jobTitle}`);
                    if (r.professionalSummary) lines.push(`Summary: ${r.professionalSummary}`);
                    if (Array.isArray(r.employmentHistory)) {
                        r.employmentHistory.forEach((j: any) => {
                            lines.push(`- ${j.jobTitle} at ${j.employer} (${j.startDate}–${j.endDate}): ${j.description}`);
                        });
                    }
                    if (Array.isArray(r.skills)) {
                        lines.push(`Skills: ${r.skills.map((s: any) => s.name || s).join(", ")}`);
                    }
                    cvMarkdown = lines.join("\n");
                }
            } catch (_) { }
        }

        // ── 2. Fetch existing job evaluation (if jobId provided) ──────────────

        let evalContext = "";
        if (jobId) {
            try {
                const jobDoc = await db
                    .collection("users")
                    .doc(userId)
                    .collection("jobTracker")
                    .doc(jobId)
                    .get();

                if (jobDoc.exists) {
                    const evaluation = jobDoc.data()?.aiEvaluation;
                    if (evaluation?.blocksA_F) {
                        evalContext = `
EXISTING JOB EVALUATION:
- CV Match: ${evaluation.blocksA_F.cvMatch || ""}
- Personalization Plan: ${evaluation.blocksA_F.personalizationPlan || ""}
- ATS Keywords: ${(evaluation.atsKeywords || []).join(", ")}
- Archetype: ${evaluation.archetype || ""}`;
                    }
                }
            } catch (_) { }
        }

        // ── 3. Filter questions that need AI ──────────────────────────────────

        const aiQuestions = questions.filter((q) =>
            needsAI(q.label, q.existingValue)
        );

        // Build pass-through answers for structured fields (already filled by FieldMapper)
        const structuredAnswers: ApplyAnswer[] = questions
            .filter((q) => !needsAI(q.label, q.existingValue))
            .map((q) => ({
                label: q.label,
                answer: q.existingValue || "",
                confidence: "high" as const,
                source: "profile_field" as const,
            }));

        if (aiQuestions.length === 0) {
            // All fields are structured — no AI needed
            return { success: true, answers: structuredAnswers, aiCount: 0 };
        }

        // ── 4. Build Gemini prompt (career-ops apply.md rules) ────────────────

        const questionsBlock = aiQuestions
            .map((q, i) => {
                const optionNote = q.options?.length
                    ? `\n   Available options: ${q.options.join(", ")}`
                    : "";
                const typeNote = q.type === "textarea" ? " (long answer expected)" : "";
                return `${i + 1}. "${q.label}"${typeNote}${optionNote}`;
            })
            .join("\n");

        const prompt = `You are helping a job seeker complete an application form. Generate personalized, compelling answers to each question below.

=== CANDIDATE CV ===
${cvMarkdown || "(No CV provided — use general professional language)"}

=== TARGET JOB ===
Company: ${companyName}
Role: ${jobTitle}
${jobDescription ? `Job Description (excerpt):\n${jobDescription.substring(0, 1500)}` : ""}
${evalContext}

=== APPLICATION QUESTIONS ===
${questionsBlock}

=== ANSWER RULES (from career-ops) ===
1. Tone: confident and choosing — "I'm choosing ${companyName}" not "I hope to work at ${companyName}"
2. Proof points: reference specific skills, projects, or achievements from the CV when relevant
3. STAR format for behavioral questions (Situation, Task, Action, Result)
4. Cover letter: 3 paragraphs max — hook (specific company insight), value proposition (top 2-3 proof points), soft close
5. "Why this company?": reference something specific about ${companyName} (product, mission, recent news you likely know)
6. Keep answers concise: textarea = 3-5 sentences max unless it's a cover letter
7. Do NOT fabricate experiences not in the CV
8. For select fields with options, choose the most appropriate option exactly as written

Return a JSON array with exactly ${aiQuestions.length} objects, one per question, in the same order:
[
  {
    "label": "exact question label",
    "answer": "the answer text",
    "confidence": "high|medium|low",
    "reasoning": "1 sentence explaining your answer choice"
  }
]

confidence guide:
- high: CV clearly supports this answer
- medium: reasonable inference from CV context
- low: generic answer, CV lacks specific proof points

Return ONLY the JSON array, no markdown fences.`;

        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

        let aiAnswers: ApplyAnswer[] = [];
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });

            const text = (response.text || "").trim()
                .replace(/^```(?:json)?\s*/i, "")
                .replace(/\s*```\s*$/i, "")
                .trim();

            const parsed = JSON.parse(text) as any[];

            aiAnswers = parsed.map((item: any, idx: number) => ({
                label: item.label || aiQuestions[idx]?.label || "",
                answer: item.answer || "",
                confidence: (["high", "medium", "low"].includes(item.confidence)
                    ? item.confidence
                    : "low") as "high" | "medium" | "low",
                source: "ai_generated" as const,
                reasoning: item.reasoning || undefined,
            }));
        } catch (parseError: any) {
            console.error("[generateApplyAnswers] Gemini parse error:", parseError);
            // Return low-confidence empty answers rather than crashing
            aiAnswers = aiQuestions.map((q) => ({
                label: q.label,
                answer: "",
                confidence: "low" as const,
                source: "skipped" as const,
                reasoning: "AI generation failed — please fill manually",
            }));
        }

        // ── 5. Merge structured + AI answers in original question order ────────

        const allAnswers: ApplyAnswer[] = questions.map((q) => {
            const structured = structuredAnswers.find(
                (a) => a.label === q.label
            );
            if (structured) return structured;

            const ai = aiAnswers.find((a) => a.label === q.label);
            if (ai) return ai;

            return {
                label: q.label,
                answer: "",
                confidence: "low" as const,
                source: "skipped" as const,
            };
        });

        // ── 6. Log to Firestore for audit (non-blocking) ─────────────────────

        db.collection("users")
            .doc(userId)
            .collection("applyRuns")
            .add({
                companyName,
                jobTitle,
                jobId: jobId || null,
                questionCount: questions.length,
                aiQuestionCount: aiQuestions.length,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            })
            .catch(() => { });

        console.log(
            `[generateApplyAnswers] User ${userId} — ${aiQuestions.length} AI answers for "${jobTitle}" at ${companyName}`
        );

        return {
            success: true,
            answers: allAnswers,
            aiCount: aiAnswers.length,
            structuredCount: structuredAnswers.length,
        };
    });
