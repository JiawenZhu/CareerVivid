import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { GoogleAuth } from "google-auth-library";

import { secureCorsHandler } from "./utils/corsUtils.js";
import { resolveAuth } from "./utils/authUtils.js";
import { getAIClient } from "./utils/ai";

if (!admin.apps.length) {
    admin.initializeApp();
}

const corsHandler = secureCorsHandler;
const MAX_TRANSCRIPT_ENTRIES = 80;
const MAX_TRANSCRIPT_CHARS = 28_000;

type InterviewCategory = "Behavioral" | "System Design" | "Technical" | "Leadership";
type TranscriptSpeaker = "user" | "ai";

interface MobileInterviewLiveTokenRequestBody {
    jobTitle?: string;
    company?: string;
    category?: InterviewCategory | string;
    questions?: string[];
    source?: string;
}

interface MobileTranscriptEntry {
    speaker?: TranscriptSpeaker | "candidate" | "interviewer" | "model";
    text?: string;
    isFinal?: boolean;
    timestamp?: number;
}

interface MobileInterviewAnalyzeRequestBody extends MobileInterviewLiveTokenRequestBody {
    sessionId?: string;
    prompt?: string;
    transcript?: MobileTranscriptEntry[];
    durationInSeconds?: number;
}

interface InterviewAnalysisPayload {
    overallScore: number;
    communicationScore: number;
    confidenceScore: number;
    relevanceScore: number;
    strengths: string;
    areasForImprovement: string;
}

interface NormalizedTranscriptEntry {
    speaker: TranscriptSpeaker;
    text: string;
    isFinal: boolean;
    timestamp: number;
}

function normalizeCategory(value?: string): InterviewCategory {
    const clean = (value || "").trim().toLowerCase();
    if (clean.includes("system")) return "System Design";
    if (clean.includes("technical") || clean.includes("code")) return "Technical";
    if (clean.includes("leader")) return "Leadership";
    return "Behavioral";
}

function createPracticeId(jobTitle: string, company: string): string {
    const sanitize = (value: string) =>
        value
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/[\s/]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");

    const id = `${sanitize(jobTitle) || "interview"}-${sanitize(company) || "career-vivid"}`;
    return id.slice(0, 100) || `ios-interview-${Date.now()}`;
}

function normalizeQuestions(questions?: string[], category: InterviewCategory = "Behavioral"): string[] {
    const clean = (questions || [])
        .map((question) => String(question || "").trim())
        .filter(Boolean)
        .slice(0, 7);

    if (clean.length > 0) return clean;

    switch (category) {
        case "System Design":
            return [
                "How would you design the core system for this role's product area?",
                "What trade-offs would you make around latency, reliability, and cost?",
                "How would you monitor and debug the system in production?",
            ];
        case "Technical":
            return [
                "Walk me through a technical project that best proves you can do this role.",
                "What was the hardest engineering decision, and how did you validate it?",
                "How do you keep quality high while shipping quickly?",
            ];
        case "Leadership":
            return [
                "Tell me about a time you aligned people around a difficult technical decision.",
                "How do you handle unclear ownership across teams?",
                "How do you coach teammates while still delivering your own work?",
            ];
        case "Behavioral":
        default:
            return [
                "Tell me about a recent project that shows why you are a fit for this role.",
                "Describe a time you handled competing priorities under pressure.",
                "What did you learn from a project that did not go as planned?",
            ];
    }
}

function normalizeTranscript(entries?: MobileTranscriptEntry[]): NormalizedTranscriptEntry[] {
    const normalized = (entries || [])
        .slice(0, MAX_TRANSCRIPT_ENTRIES)
        .map((entry) => {
            const rawSpeaker = String(entry.speaker || "").toLowerCase();
            const speaker: TranscriptSpeaker =
                rawSpeaker === "ai" || rawSpeaker === "model" || rawSpeaker === "interviewer"
                    ? "ai"
                    : "user";
            return {
                speaker,
                text: String(entry.text || "").trim(),
                isFinal: entry.isFinal !== false,
                timestamp: typeof entry.timestamp === "number" ? entry.timestamp : Date.now(),
            };
        })
        .filter((entry) => entry.text.length > 0);

    const totalChars = normalized.reduce((sum, entry) => sum + entry.text.length, 0);
    if (totalChars > MAX_TRANSCRIPT_CHARS) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The interview transcript is too long for one mobile analysis request."
        );
    }

    return normalized;
}

function formatTranscriptForPrompt(entries: NormalizedTranscriptEntry[]): string {
    return entries
        .map((entry) => `${entry.speaker === "ai" ? "Interviewer" : "Candidate"}: ${entry.text}`)
        .join("\n\n");
}

function clampScore(value: unknown, fallback: number): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

function parseAnalysis(rawText: string): InterviewAnalysisPayload {
    const parsed = JSON.parse(rawText.trim()) as Partial<InterviewAnalysisPayload>;
    return {
        overallScore: clampScore(parsed.overallScore, 65),
        communicationScore: clampScore(parsed.communicationScore, 65),
        confidenceScore: clampScore(parsed.confidenceScore, 65),
        relevanceScore: clampScore(parsed.relevanceScore, 65),
        strengths: String(parsed.strengths || "The candidate gave relevant context and started connecting experience to the role."),
        areasForImprovement: String(parsed.areasForImprovement || "Use tighter STAR structure, add measurable outcomes, and connect each answer back to the target role."),
    };
}

async function createInterviewAnalysis(params: {
    transcript: NormalizedTranscriptEntry[];
    prompt: string;
    category: InterviewCategory;
    durationInSeconds?: number;
}): Promise<InterviewAnalysisPayload> {
    const formattedTranscript = formatTranscriptForPrompt(params.transcript);
    const durationLine = params.durationInSeconds
        ? `The session lasted about ${params.durationInSeconds} seconds.`
        : "The session duration was not provided.";

    const fullPrompt = `
You are CareerVivid's senior interview coach. Analyze the candidate's mobile mock interview transcript.

Role context:
${params.prompt}

Interview category:
${params.category}

${durationLine}

Transcript:
---
${formattedTranscript}
---

Return a strict JSON object with:
- overallScore: number from 0 to 100
- communicationScore: number from 0 to 100
- confidenceScore: number from 0 to 100
- relevanceScore: number from 0 to 100
- strengths: concise markdown string with 2-4 bullets
- areasForImprovement: concise markdown string with 3-5 actionable bullets

Be useful even if the interview is short. If the answer is sparse, score honestly and explain what to improve next. Do not mention that this is a JSON task.
`;

    const ai = getAIClient();
    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    overallScore: { type: "NUMBER" },
                    communicationScore: { type: "NUMBER" },
                    confidenceScore: { type: "NUMBER" },
                    relevanceScore: { type: "NUMBER" },
                    strengths: { type: "STRING" },
                    areasForImprovement: { type: "STRING" },
                },
                required: [
                    "overallScore",
                    "communicationScore",
                    "confidenceScore",
                    "relevanceScore",
                    "strengths",
                    "areasForImprovement",
                ],
            },
        },
    });

    return parseAnalysis(result.text || "{}");
}

export const mobileInterviewLiveToken = functions.region("us-west1").runWith({
    timeoutSeconds: 15,
    memory: "256MB",
}).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") {
            res.status(204).send("");
            return;
        }
        if (req.method !== "POST") {
            res.status(405).json({ error: "Method Not Allowed" });
            return;
        }

        const user = await resolveAuth(req);
        if (!user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }

        try {
            const body = req.body as MobileInterviewLiveTokenRequestBody;
            const jobTitle = body.jobTitle?.trim() || "Software Engineer";
            const company = body.company?.trim() || "CareerVivid";
            const category = normalizeCategory(body.category);
            const questions = normalizeQuestions(body.questions, category);
            const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "jastalk-firebase";
            const location = process.env.GOOGLE_CLOUD_LOCATION || "us-west1";
            const model = `projects/${project}/locations/${location}/publishers/google/models/gemini-live-2.5-flash-native-audio`;

            const sessionRef = admin.firestore().collection("interviewSessions").doc();
            await sessionRef.set({
                uid: user.uid,
                jobTitle,
                company,
                category,
                questions,
                source: body.source || "ios",
                startedAt: admin.firestore.FieldValue.serverTimestamp(),
                model,
                status: "started",
            });

            const auth = new GoogleAuth({
                scopes: "https://www.googleapis.com/auth/cloud-platform",
            });
            const client = await auth.getClient();
            const accessTokenResponse = await client.getAccessToken();
            const accessToken = accessTokenResponse.token;

            if (!accessToken) {
                throw new Error("Could not create a Vertex AI access token.");
            }

            res.status(200).json({
                accessToken,
                project,
                location,
                model,
                sessionId: sessionRef.id,
                questions,
            });
        } catch (err: any) {
            console.error("[mobileInterviewLiveToken] Error:", err.message);
            res.status(500).json({ error: err.message || "Could not start mobile interview session." });
        }
    });
});

export const mobileInterviewAnalyze = functions.region("us-west1").runWith({
    timeoutSeconds: 120,
    memory: "1GB",
}).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") {
            res.status(204).send("");
            return;
        }
        if (req.method !== "POST") {
            res.status(405).json({ error: "Method Not Allowed" });
            return;
        }

        const user = await resolveAuth(req);
        if (!user) {
            res.status(401).json({ error: "Unauthorized." });
            return;
        }

        try {
            const body = req.body as MobileInterviewAnalyzeRequestBody;
            const jobTitle = body.jobTitle?.trim() || "Software Engineer";
            const company = body.company?.trim() || "CareerVivid";
            const category = normalizeCategory(body.category);
            const questions = normalizeQuestions(body.questions, category);
            const transcript = normalizeTranscript(body.transcript);
            const userAnswerCount = transcript.filter((entry) => entry.speaker === "user").length;

            if (userAnswerCount === 0) {
                res.status(422).json({
                    error: "The interview needs at least one candidate answer before feedback can be generated.",
                });
                return;
            }

            const prompt = body.prompt?.trim() ||
                `${category} interview for ${jobTitle} at ${company}. Focus on role-specific proof, communication, and decision quality.`;
            const analysisCore = await createInterviewAnalysis({
                transcript,
                prompt,
                category,
                durationInSeconds: body.durationInSeconds,
            });

            const practiceId = createPracticeId(jobTitle, company);
            const analysis = {
                ...analysisCore,
                id: `analysis_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
                timestamp: Date.now(),
                transcript,
                durationInSeconds: body.durationInSeconds || null,
                source: "ios-live-api",
                analysisVersion: "web-compatible-v1",
            };
            const job = {
                id: practiceId,
                title: jobTitle,
                company,
                description: prompt,
                location: "",
                url: "",
            };
            const historyRef = admin.firestore()
                .collection("users")
                .doc(user.uid)
                .collection("practiceHistory")
                .doc(practiceId);

            await historyRef.set({
                job,
                questions,
                section: "interviews",
                activeInterviewDraft: null,
                transcript,
                interviewHistory: admin.firestore.FieldValue.arrayUnion(analysis),
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                source: "ios",
                lastInterviewCategory: category,
                lastInterviewPrompt: prompt,
            }, { merge: true });

            if (body.sessionId) {
                await admin.firestore().collection("interviewSessions").doc(body.sessionId).set({
                    status: "analyzed",
                    endedAt: admin.firestore.FieldValue.serverTimestamp(),
                    transcript,
                    analysis,
                    practiceId,
                }, { merge: true });
            }

            res.status(200).json({
                success: true,
                practiceId,
                analysis,
            });
        } catch (err: any) {
            console.error("[mobileInterviewAnalyze] Error:", err.message);
            if (err instanceof functions.https.HttpsError) {
                const status = err.code === "invalid-argument" ? 400 : 500;
                res.status(status).json({ error: err.message });
                return;
            }
            res.status(500).json({ error: err.message || "Could not analyze interview transcript." });
        }
    });
});
