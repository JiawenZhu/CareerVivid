/**
 * CLI Jobs API — Backend for `cv jobs hunt` and `cv jobs update`
 *
 * Authentication: x-api-key header (same pattern as verifyAuth / publishPost)
 * Firestore path: users/{uid}/jobTracker  (ApplicationStatus type)
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import { resolveAuth } from "./utils/authUtils.js";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const corsHandler = cors({ origin: true });
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const googleSearchApiKey = defineSecret("GOOGLE_SEARCH_API_KEY");
const googleSearchCx = defineSecret("GOOGLE_SEARCH_CX");

// ── Types ─────────────────────────────────────────────────────────────────────

type ApplicationStatus = "To Apply" | "Applied" | "Interviewing" | "Offered" | "Rejected";

interface RawJob {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    salary?: string;
}

interface ScoredJob extends RawJob {
    score: number;   // 0–100
    scoreLabel: "Excellent" | "Good" | "Fair" | "Low";
    aiSummary: string;
    missingSkills: string[];
}

interface JobTrackerEntry {
    id: string;
    jobTitle: string;
    companyName: string;
    location: string;
    jobPostURL: string;
    jobDescription: string;
    applicationStatus: ApplicationStatus;
    createdAt: admin.firestore.FieldValue;
    updatedAt: admin.firestore.FieldValue;
    portalSource: string;
    aiScore?: number;
    aiSummary?: string;
    userId: string;
    dateSaved?: string;
}

// ── Auth Helper ───────────────────────────────────────────────────────────────
// Auth logic moved to shared utils/authUtils.js

// ── Google Search Helper ──────────────────────────────────────────────────────

async function performSearch(query: string, searchKey: string, cx: string): Promise<{ title: string; link: string; snippet: string }[]> {
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${searchKey}&cx=${cx}&num=10`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`CSE error: ${resp.status}`);
    const data = await resp.json() as any;
    return (data.items || []).map((item: any) => ({
        title: item.title || "",
        link: item.link || "",
        snippet: item.snippet || "",
    }));
}

// ── Score Label ───────────────────────────────────────────────────────────────

function scoreLabel(score: number): ScoredJob["scoreLabel"] {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Low";
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /cliJobsHunt
// Body: { resumeContent: string, role: string, location: string, count?: number, minScore?: number }
// Returns: { jobs: ScoredJob[] }
// ──────────────────────────────────────────────────────────────────────────────

export const cliJobsHunt = functions.region("us-west1").runWith({
    secrets: [geminiApiKey, googleSearchApiKey, googleSearchCx],
    timeoutSeconds: 120,
    memory: "512MB",
}).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") {
            res.set("Access-Control-Allow-Origin", "*");
            res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.set("Access-Control-Allow-Headers", "Content-Type, x-api-key");
            res.status(204).send("");
            return;
        }
        if (req.method !== "POST") { res.status(405).json({ error: "Method Not Allowed" }); return; }

        const user = await resolveAuth(req);
        if (!user) { res.status(401).json({ error: "Unauthorized. Invalid API key or missing authentication." }); return; }

        const { resumeContent, role = "Software Engineer", location = "", count = 10, minScore = 0, targetOrgs } = req.body as {
            resumeContent?: string;
            role?: string;
            location?: string;
            count?: number;
            minScore?: number;
            targetOrgs?: string[];
        };

        const gemKey = geminiApiKey.value();
        const searchKey = googleSearchApiKey.value();
        const cx = googleSearchCx.value();

        if (!gemKey) { res.status(500).json({ error: "AI key not configured." }); return; }

        // ── Step 1: Parallel Job Search ────────────────────────────────────────
        let queries: string[] = [];
        if (targetOrgs && targetOrgs.length > 0) {
            const orgsQuery = targetOrgs.map(o => `"${o}"`).join(" OR ");
            queries = [
                `${role} (${orgsQuery}) ${location ? "in " + location + " " : ""}site:greenhouse.io OR site:lever.co OR site:myworkdayjobs.com OR site:ashbyhq.com`
            ];
        } else {
            queries = [
                `${role} jobs${location ? " in " + location : ""} site:linkedin.com OR site:lever.co OR site:greenhouse.io`,
                `${role} careers${location ? " " + location : ""} apply now`,
            ];
        }

        let rawResults: { title: string; link: string; snippet: string }[] = [];

        if (searchKey && cx) {
            const searches = await Promise.allSettled(
                queries.map(q => performSearch(q, searchKey, cx))
            );
            searches.forEach(r => {
                if (r.status === "fulfilled") rawResults.push(...r.value);
            });
            // Deduplicate by link
            const seen = new Set<string>();
            rawResults = rawResults.filter(r => {
                if (seen.has(r.link)) return false;
                seen.add(r.link);
                return true;
            });
        }

        // ── Step 2: Parse & Score with Gemini ─────────────────────────────────
        const ai = new GoogleGenAI({ apiKey: gemKey });

        const searchContext = rawResults.length > 0
            ? rawResults.slice(0, 20).map(r => `URL: ${r.link}\nTitle: ${r.title}\nSnippet: ${r.snippet}`).join("\n\n")
            : `(No real search results — generate realistic mock jobs for role: ${role}${location ? ", location: " + location : ""})`;

        const resumeSnippet = resumeContent
            ? resumeContent.substring(0, 3000)
            : "No resume provided. Use general scoring.";

        const prompt = `You are an expert job matching AI.

CANDIDATE RESUME (excerpt):
${resumeSnippet}

JOB SEARCH RESULTS for "${role}"${location ? " in " + location : ""}:
${searchContext}

TASK:
1. Extract up to ${count} real job postings from the search results. If search results are empty, create ${count} realistic mock jobs.
2. For each job, score the candidate's match (0-100) based on the resume.
3. Return ONLY a valid JSON array. No markdown. No explanation.

REQUIRED format — each item must have all fields:
[
  {
    "id": "unique-slug-from-title-company",
    "title": "Exact Job Title",
    "company": "Company Name",
    "location": "City, State or Remote",
    "description": "2-3 sentence job description",
    "url": "https://apply-url.com",
    "salary": "$120k-$160k or null",
    "score": 85,
    "scoreLabel": "Excellent|Good|Fair|Low",
    "aiSummary": "1 sentence: why this job matches (or doesn't match) the candidate",
    "missingSkills": ["Skill1", "Skill2"]
  }
]`;

        let jobs: ScoredJob[] = [];

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });

            const text = (response.text || "").trim();
            // Strip markdown code fences if present
            const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

            const parsed = JSON.parse(cleaned) as any[];
            jobs = parsed.map(j => ({
                id: j.id || `${String(j.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${String(j.company || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                title: String(j.title || "Unknown Role"),
                company: String(j.company || "Unknown Company"),
                location: String(j.location || "Remote / Unspecified"),
                description: String(j.description || "No description provided."),
                url: String(j.url || ""),
                salary: j.salary || null,
                score: typeof j.score === "number" ? Math.min(100, Math.max(0, j.score)) : 50,
                scoreLabel: j.scoreLabel || scoreLabel(j.score || 50),
                aiSummary: String(j.aiSummary || "No AI summary available."),
                missingSkills: Array.isArray(j.missingSkills) ? j.missingSkills : [],
            }));

            // Apply minScore filter & sort descending
            jobs = jobs
                .filter(j => j.score >= minScore)
                .sort((a, b) => b.score - a.score)
                .slice(0, count);

        } catch (err: any) {
            console.error("[cliJobsHunt] Gemini/parse error:", err.message);
            res.status(500).json({ error: `AI processing failed: ${err.message}` });
            return;
        }

        // ── Step 3: Save to user's jobSearchHistory (async) ───────────────────
        const historyBatch = db.batch();
        jobs.forEach(job => {
            const ref = db.collection("users").doc(user.uid).collection("jobSearchHistory").doc(job.id);
            historyBatch.set(ref, {
                ...job,
                searchedAt: admin.firestore.FieldValue.serverTimestamp(),
                source: "cli_hunt",
            }, { merge: true });
        });
        historyBatch.commit().catch(e => console.warn("[cliJobsHunt] History save failed:", e));

        console.log(`[cliJobsHunt] User ${user.uid} — found ${jobs.length} scored jobs for "${role}"`);
        res.json({ jobs, total: jobs.length });
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /cliJobsCreate
// Body: { jobTitle, companyName, location, jobPostURL, jobDescription, aiScore?, aiSummary? }
// Returns: { id, success }
// ──────────────────────────────────────────────────────────────────────────────

export const cliJobsCreate = functions.region("us-west1").runWith({
    timeoutSeconds: 30,
    memory: "256MB",
}).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") {
            res.set("Access-Control-Allow-Origin", "*");
            res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.set("Access-Control-Allow-Headers", "Content-Type, x-api-key");
            res.status(204).send("");
            return;
        }
        if (req.method !== "POST") { res.status(405).json({ error: "Method Not Allowed" }); return; }

        const user = await resolveAuth(req);
        if (!user) { res.status(401).json({ error: "Unauthorized. Invalid API key or missing authentication." }); return; }

        const {
            jobTitle,
            companyName,
            location = "",
            jobPostURL = "",
            jobDescription = "",
            aiScore,
            aiSummary,
            notes = "",
        } = req.body as {
            jobTitle?: string;
            companyName?: string;
            location?: string;
            jobPostURL?: string;
            jobDescription?: string;
            aiScore?: number;
            aiSummary?: string;
            notes?: string;
        };

        if (!jobTitle || !companyName) {
            res.status(400).json({ error: "jobTitle and companyName are required." });
            return;
        }

        const entry: Omit<JobTrackerEntry, "id"> = {
            jobTitle,
            companyName,
            location,
            jobPostURL,
            jobDescription,
            applicationStatus: "To Apply",
            portalSource: "cli_hunt",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            userId: user.uid,
            dateSaved: new Date().toISOString().split("T")[0],
            ...(aiScore !== undefined && { aiScore }),
            ...(aiSummary && { aiSummary }),
            ...(notes && { notes }),
        };

        try {
            const ref = await db.collection("users").doc(user.uid).collection("jobTracker").add(entry);
            console.log(`[cliJobsCreate] User ${user.uid} — created job tracker entry ${ref.id}: ${jobTitle} @ ${companyName}`);
            res.json({ success: true, id: ref.id, message: `Added "${jobTitle}" at ${companyName} to your tracker.` });
        } catch (err: any) {
            console.error("[cliJobsCreate] Error:", err.message);
            res.status(500).json({ error: `Failed to create job entry: ${err.message}` });
        }
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /cliJobsUpdate
// Body: { jobId, status: ApplicationStatus, notes? }
// Returns: { success, jobId, newStatus }
// ──────────────────────────────────────────────────────────────────────────────

const VALID_STATUSES: ApplicationStatus[] = ["To Apply", "Applied", "Interviewing", "Offered", "Rejected"];

export const cliJobsUpdate = functions.region("us-west1").runWith({
    timeoutSeconds: 30,
    memory: "256MB",
}).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") {
            res.set("Access-Control-Allow-Origin", "*");
            res.set("Access-Control-Allow-Methods", "POST, PATCH, OPTIONS");
            res.set("Access-Control-Allow-Headers", "Content-Type, x-api-key");
            res.status(204).send("");
            return;
        }
        if (req.method !== "POST" && req.method !== "PATCH") {
            res.status(405).json({ error: "Method Not Allowed" });
            return;
        }

        const user = await resolveAuth(req);
        if (!user) { res.status(401).json({ error: "Unauthorized. Invalid API key or missing authentication." }); return; }

        const { jobId, status, notes } = req.body as {
            jobId?: string;
            status?: string;
            notes?: string;
        };

        if (!jobId || !status) {
            res.status(400).json({ error: "jobId and status are required." });
            return;
        }

        if (!VALID_STATUSES.includes(status as ApplicationStatus)) {
            res.status(400).json({ error: `Invalid status. Valid values: ${VALID_STATUSES.join(", ")}` });
            return;
        }

        try {
            const docRef = db.collection("users").doc(user.uid).collection("jobTracker").doc(jobId);
            const snap = await docRef.get();

            if (!snap.exists) {
                res.status(404).json({ error: `Job ${jobId} not found in your tracker.` });
                return;
            }

            const updateData: Record<string, any> = {
                applicationStatus: status as ApplicationStatus,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            if (notes) updateData.notes = notes;

            await docRef.update(updateData);

            const jobData = snap.data();
            console.log(`[cliJobsUpdate] User ${user.uid} — updated ${jobId} status to "${status}"`);
            res.json({
                success: true,
                jobId,
                newStatus: status,
                jobTitle: jobData?.jobTitle || "Unknown",
                companyName: jobData?.companyName || "Unknown",
                message: `Updated "${jobData?.jobTitle || jobId}" → ${status}`,
            });
        } catch (err: any) {
            console.error("[cliJobsUpdate] Error:", err.message);
            res.status(500).json({ error: `Failed to update job: ${err.message}` });
        }
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /cliJobsList
// Query: ?status=Applied (optional filter)
// Returns: { jobs: [{ id, jobTitle, companyName, applicationStatus, location, updatedAt }] }
// ──────────────────────────────────────────────────────────────────────────────

export const cliJobsList = functions.region("us-west1").runWith({
    timeoutSeconds: 30,
    memory: "256MB",
}).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") {
            res.set("Access-Control-Allow-Origin", "*");
            res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
            res.set("Access-Control-Allow-Headers", "Content-Type, x-api-key");
            res.status(204).send("");
            return;
        }
        if (req.method !== "GET") { res.status(405).json({ error: "Method Not Allowed" }); return; }

        const user = await resolveAuth(req);
        if (!user) { res.status(401).json({ error: "Unauthorized. Invalid API key or missing authentication." }); return; }

        const statusFilter = req.query.status as string | undefined;

        try {
            let query: admin.firestore.Query = db
                .collection("users").doc(user.uid)
                .collection("jobTracker")
                .orderBy("updatedAt", "desc")
                .limit(50);

            if (statusFilter && VALID_STATUSES.includes(statusFilter as ApplicationStatus)) {
                query = db.collection("users").doc(user.uid)
                    .collection("jobTracker")
                    .where("applicationStatus", "==", statusFilter)
                    .orderBy("updatedAt", "desc")
                    .limit(50);
            }

            const snap = await query.get();
            const jobs = snap.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    jobTitle: d.jobTitle || "Unknown",
                    companyName: d.companyName || "Unknown",
                    location: d.location || "",
                    applicationStatus: d.applicationStatus || "To Apply",
                    aiScore: d.aiScore ?? null,
                    jobPostURL: d.jobPostURL || "",
                    updatedAt: d.updatedAt?.toDate?.()?.toISOString() || null,
                    notes: d.notes || "",
                };
            });

            res.json({ jobs, total: jobs.length });
        } catch (err: any) {
            console.error("[cliJobsList] Error:", err.message);
            res.status(500).json({ error: `Failed to list jobs: ${err.message}` });
        }
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /cliResumeGet
// Returns the latest resume markdown from users/{uid}/resumes (cvMarkdown field)
// ──────────────────────────────────────────────────────────────────────────────

export const cliResumeGet = functions.region("us-west1").runWith({
    timeoutSeconds: 30,
    memory: "256MB",
}).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") {
            res.set("Access-Control-Allow-Origin", "*");
            res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
            res.set("Access-Control-Allow-Headers", "Content-Type, x-api-key");
            res.status(204).send("");
            return;
        }
        if (req.method !== "GET") { res.status(405).json({ error: "Method Not Allowed" }); return; }

        const user = await resolveAuth(req);
        if (!user) { res.status(401).json({ error: "Unauthorized. Invalid API key or missing authentication." }); return; }

        // Optional: ?resumeId=<docId> to pick a specific resume
        const resumeId = req.query.resumeId as string | undefined;

        try {
            let resumeDoc: admin.firestore.DocumentSnapshot | null = null;

            if (resumeId) {
                resumeDoc = await db.collection("users").doc(user.uid).collection("resumes").doc(resumeId).get();
            } else {
                // Get most recently updated resume
                const snap = await db.collection("users").doc(user.uid)
                    .collection("resumes")
                    .orderBy("updatedAt", "desc")
                    .limit(1)
                    .get();
                resumeDoc = snap.empty ? null : snap.docs[0];
            }

            if (!resumeDoc || !resumeDoc.exists) {
                res.status(404).json({ error: "No resume found. Please upload one to CareerVivid first." });
                return;
            }

            const data = resumeDoc.data()!;

            // Build text representation from structured resume data
            const personal = data.personalDetails || {};
            const name = `${personal.firstName || ""}${personal.lastName ? " " + personal.lastName : ""}`.trim();
            const jobTitle = personal.jobTitle || "";

            const lines: string[] = [];
            if (name) lines.push(`# ${name}`);
            if (jobTitle) lines.push(jobTitle);
            if (personal.email) lines.push(`Email: ${personal.email}`);
            if (personal.city) lines.push(`Location: ${personal.city}${personal.country ? ", " + personal.country : ""}`);

            if (data.sections) {
                for (const section of data.sections) {
                    if (!section?.title) continue;
                    lines.push(`\n## ${section.title}`);
                    lines.push(section.content || section.description || "");
                }
            }

            // Skills
            if (Array.isArray(data.skills) && data.skills.length > 0) {
                lines.push("\n## Skills");
                lines.push(data.skills.map((s: any) => s.name || s).join(", "));
            }

            // Employment
            if (Array.isArray(data.employmentHistory) && data.employmentHistory.length > 0) {
                lines.push("\n## Experience");
                for (const job of data.employmentHistory) {
                    lines.push(`**${job.jobTitle || ""}** at ${job.employer || ""} (${job.startDate || ""}–${job.endDate || "Present"})`);
                    if (job.description) lines.push(job.description);
                }
            }

            // Education
            if (Array.isArray(data.education) && data.education.length > 0) {
                lines.push("\n## Education");
                for (const edu of data.education) {
                    lines.push(`${edu.degree || ""} — ${edu.school || ""} (${edu.endDate || ""})`);
                }
            }

            const cvMarkdown = lines.join("\n");

            res.json({
                resumeId: resumeDoc.id,
                title: data.title || `${name}'s Resume`,
                cvMarkdown,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
            });

        } catch (err: any) {
            console.error("[cliResumeGet] Error:", err.message);
            res.status(500).json({ error: `Failed to fetch resume: ${err.message}` });
        }
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /cliResumesList
// Returns a lightweight list of the user's resumes (id, title, updatedAt)
// ──────────────────────────────────────────────────────────────────────────────

export const cliResumesList = functions.region("us-west1").runWith({
    timeoutSeconds: 30,
    memory: "256MB",
}).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") {
            res.set("Access-Control-Allow-Origin", "*");
            res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
            res.set("Access-Control-Allow-Headers", "Content-Type, x-api-key");
            res.status(204).send("");
            return;
        }
        if (req.method !== "GET") { res.status(405).json({ error: "Method Not Allowed" }); return; }

        const user = await resolveAuth(req);
        if (!user) { res.status(401).json({ error: "Unauthorized. Invalid API key or missing authentication." }); return; }

        try {
            const snap = await db.collection("users").doc(user.uid)
                .collection("resumes")
                .select("title", "updatedAt") // Only fetch lightweight fields
                .orderBy("updatedAt", "desc")
                .limit(50)
                .get();

            const resumes = snap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title || "Untitled Resume",
                    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
                };
            });

            res.json({ resumes, total: resumes.length });
        } catch (err: any) {
            console.error("[cliResumesList] Error:", err.message);
            res.status(500).json({ error: `Failed to list resumes: ${err.message}` });
        }
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /cliResumeCreate
// Body: { title?: string, baseContent: string }
// Generates a structured Resume JSON from free-form text and saves it.
// ──────────────────────────────────────────────────────────────────────────────

export const cliResumeCreate = functions.region("us-west1").runWith({
    secrets: [geminiApiKey],
    timeoutSeconds: 60,
    memory: "512MB",
}).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") { res.set("Access-Control-Allow-Origin", "*"); res.set("Access-Control-Allow-Methods", "POST, OPTIONS"); res.set("Access-Control-Allow-Headers", "Content-Type, x-api-key"); res.status(204).send(""); return; }
        if (req.method !== "POST") { res.status(405).json({ error: "Method Not Allowed" }); return; }

        const user = await resolveAuth(req);
        if (!user) { res.status(401).json({ error: "Unauthorized." }); return; }

        const { title = "CLI Generated Resume", baseContent } = req.body as { title?: string, baseContent: string };
        if (!baseContent) { res.status(400).json({ error: "baseContent is required to generate a resume." }); return; }

        const prompt = `You are a professional resume writer.
Convert the following free-form description or resume dump into a strictly structured JSON resume object.

INPUT:
${baseContent}

OUTPUT MUST BE VALID JSON ONLY with this exact structure:
{
  "title": "${title}",
  "personalDetails": { "firstName": "", "lastName": "", "jobTitle": "", "email": "", "city": "", "country": "" },
  "sections": [ { "title": "Summary", "content": "Professional summary here..." } ],
  "skills": [{"name": "Skill 1"}, {"name": "Skill 2"}],
  "employmentHistory": [ { "jobTitle": "", "employer": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "description": "Bullet points..." } ],
  "education": [ { "degree": "", "school": "", "endDate": "YYYY" } ]
}`;

        try {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
            const cleaned = (response.text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
            const resumeData = JSON.parse(cleaned);

            resumeData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
            resumeData.createdAt = admin.firestore.FieldValue.serverTimestamp();
            if (!resumeData.title) resumeData.title = title;

            const ref = await db.collection("users").doc(user.uid).collection("resumes").add(resumeData);
            res.json({ success: true, resumeId: ref.id, message: "Resume generated successfully." });
        } catch (err: any) {
            console.error("[cliResumeCreate] Error:", err.message);
            res.status(500).json({ error: `Generation failed: ${err.message}` });
        }
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /cliResumeUpdate
// Body: { resumeId: string, action: 'tailor'|'refine', jobDescription?: string, instruction?: string, newTitle?: string }
// Applies AI tailoring to an existing resume and optionally saves as a new copy.
// ──────────────────────────────────────────────────────────────────────────────

export const cliResumeUpdate = functions.region("us-west1").runWith({
    secrets: [geminiApiKey],
    timeoutSeconds: 120,
    memory: "512MB",
}).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") { res.set("Access-Control-Allow-Origin", "*"); res.set("Access-Control-Allow-Methods", "POST, OPTIONS"); res.set("Access-Control-Allow-Headers", "Content-Type, x-api-key"); res.status(204).send(""); return; }
        if (req.method !== "POST") { res.status(405).json({ error: "Method Not Allowed" }); return; }

        const user = await resolveAuth(req);
        if (!user) { res.status(401).json({ error: "Unauthorized." }); return; }

        const { resumeId, action = 'tailor', jobDescription, instruction, newTitle, copy = true } = req.body as { resumeId: string, action?: 'tailor'|'refine', jobDescription?: string, instruction?: string, newTitle?: string, copy?: boolean };
        
        if (!resumeId) { res.status(400).json({ error: "resumeId is required." }); return; }

        try {
            const docRef = db.collection("users").doc(user.uid).collection("resumes").doc(resumeId);
            const snap = await docRef.get();
            if (!snap.exists) { res.status(404).json({ error: "Resume not found." }); return; }
            
            const resumeJson = snap.data()!;
            let prompt = "";

            const jobDescContext = jobDescription ? `JOB DESCRIPTION CONTEXT:\n${jobDescription}` : '';
            if (action === 'refine') {
                prompt = `You are a resume writing assistant. REFINE this resume JSON per instructions.
INSTRUCTION: ${instruction || 'Improve phrasing and grammar'}
${jobDescContext}
CURRENT RESUME JSON:
${JSON.stringify(resumeJson)}`;
            } else {
                prompt = `You are an expert resume writer. REWRITE the experience descriptions and summary in this resume JSON to align with the given Job Description.
TARGET JOB DESCRIPTION:
${jobDescription || 'Make it sound professional.'}
CURRENT RESUME JSON:
${JSON.stringify(resumeJson)}`;
            }
            prompt += `\nRETURN ONLY VALID JSON mirroring the current resume structure exactly, applying the refinements requested.`;

            const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
            const cleaned = (response.text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
            const tailoredData = JSON.parse(cleaned);

            tailoredData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
            if (newTitle) { tailoredData.title = newTitle; }
            
            if (copy) {
                tailoredData.createdAt = admin.firestore.FieldValue.serverTimestamp();
                const newRef = await db.collection("users").doc(user.uid).collection("resumes").add(tailoredData);
                res.json({ success: true, resumeId: newRef.id, message: "Tailored resume created successfully." });
            } else {
                await docRef.update(tailoredData);
                res.json({ success: true, resumeId: docRef.id, message: "Resume updated successfully." });
            }
        } catch (err: any) {
            console.error("[cliResumeUpdate] Error:", err.message);
            res.status(500).json({ error: `Update failed: ${err.message}` });
        }
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /cliResumeDelete
// Body: { resumeId: string }
// ──────────────────────────────────────────────────────────────────────────────

export const cliResumeDelete = functions.region("us-west1").runWith({
    timeoutSeconds: 15,
    memory: "256MB",
}).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") { res.set("Access-Control-Allow-Origin", "*"); res.set("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS"); res.set("Access-Control-Allow-Headers", "Content-Type, x-api-key"); res.status(204).send(""); return; }
        if (req.method !== "POST" && req.method !== "DELETE") { res.status(405).json({ error: "Method Not Allowed" }); return; }

        const user = await resolveAuth(req);
        if (!user) { res.status(401).json({ error: "Unauthorized." }); return; }

        const { resumeId } = req.body as { resumeId: string };
        if (!resumeId) { res.status(400).json({ error: "resumeId is required." }); return; }

        try {
            await db.collection("users").doc(user.uid).collection("resumes").doc(resumeId).delete();
            res.json({ success: true, message: "Resume deleted successfully." });
        } catch (err: any) {
            console.error("[cliResumeDelete] Error:", err.message);
            res.status(500).json({ error: `Delete failed: ${err.message}` });
        }
    });
});
