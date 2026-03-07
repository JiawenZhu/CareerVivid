import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { resolveAuth } from "./utils/authUtils.js";

const db = admin.firestore();
const corsHandler = cors({ origin: true });

// ── Helpers ───────────────────────────────────────────────────────────────────

async function handleApiAuth(req: any, res: any) {
    const authResult = await resolveAuth(req);
    if (!authResult) {
        res.status(401).json({
            error: "Unauthorized.",
            hint: "Provide a CareerVivid API key in the x-api-key header.",
        });
        return null;
    }
    return authResult;
}

// ── 1. Init Portfolio ─────────────────────────────────────────────────────────
export const initPortfolio = onRequest({ region: "us-west1", memory: "256MiB" }, async (req, res) => {
    corsHandler(req as any, res as any, async () => {
        if (req.method === "OPTIONS") { res.status(204).send(""); return; }
        if (req.method !== "POST") { res.status(405).json({ error: "Method Not Allowed. Use POST." }); return; }

        const authResult = await handleApiAuth(req, res);
        if (!authResult) return;

        const body = req.body || {};
        const title = body.title || "My Dev Portfolio";
        const templateId = body.templateId || "developer";

        const newPortfolio: any = {
            userId: authResult.uid,
            title,
            templateId,
            section: "portfolios",
            mode: "portfolio",
            hero: { headline: "Software Engineer", subheadline: "Building the future.", ctaPrimaryLabel: "View Resume", ctaPrimaryUrl: "/resume" },
            about: "I am a passionate software engineer.",
            projects: [],
            techStack: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        try {
            const docRef = db.collection("users").doc(authResult.uid).collection("portfolios").doc();

            const batch = db.batch();
            batch.set(docRef, newPortfolio);
            batch.set(db.collection("public_portfolios").doc(docRef.id), newPortfolio);
            await batch.commit();

            res.status(201).json({ success: true, portfolioId: docRef.id, url: `https://careervivid.app/portfolio/edit/${docRef.id}` });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });
});

// ── 2. Update Projects ────────────────────────────────────────────────────────
export const updatePortfolioProjects = onRequest({ region: "us-west1", memory: "256MiB" }, async (req, res) => {
    corsHandler(req as any, res as any, async () => {
        if (req.method === "OPTIONS") { res.status(204).send(""); return; }
        if (req.method !== "PATCH") { res.status(405).json({ error: "Method Not Allowed. Use PATCH." }); return; }

        const authResult = await handleApiAuth(req, res);
        if (!authResult) return;

        const { portfolioId, projects, techStack } = req.body;
        if (!portfolioId || !projects || !Array.isArray(projects)) {
            res.status(400).json({ error: "Missing highly required portfolioId or projects array." });
            return;
        }

        try {
            const docRef = db.collection("users").doc(authResult.uid).collection("portfolios").doc(portfolioId);
            const docSnap = await docRef.get();
            if (!docSnap.exists) {
                res.status(404).json({ error: "Portfolio not found." });
                return;
            }

            const updates: any = {
                projects,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            if (techStack && Array.isArray(techStack)) {
                updates.techStack = admin.firestore.FieldValue.arrayUnion(...techStack);
            }

            const batch = db.batch();
            batch.set(docRef, updates, { merge: true });
            batch.set(db.collection("public_portfolios").doc(portfolioId), updates, { merge: true });
            await batch.commit();

            res.status(200).json({ success: true, message: "Projects updated successfully." });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });
});

// ── 3. Update Hero / Settings ─────────────────────────────────────────────────
export const updatePortfolioHero = onRequest({ region: "us-west1", memory: "256MiB" }, async (req, res) => {
    corsHandler(req as any, res as any, async () => {
        if (req.method === "OPTIONS") { res.status(204).send(""); return; }
        if (req.method !== "PATCH") { res.status(405).json({ error: "Method Not Allowed. Use PATCH." }); return; }

        const authResult = await handleApiAuth(req, res);
        if (!authResult) return;

        const { portfolioId, hero, theme, seoMetadata } = req.body;
        if (!portfolioId) {
            res.status(400).json({ error: "Missing portfolioId." });
            return;
        }

        try {
            const docRef = db.collection("users").doc(authResult.uid).collection("portfolios").doc(portfolioId);
            const updates: any = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
            if (hero) updates.hero = hero;
            if (theme) updates.theme = theme;
            if (seoMetadata) updates.seoMetadata = seoMetadata;

            const batch = db.batch();
            batch.set(docRef, updates, { merge: true });
            batch.set(db.collection("public_portfolios").doc(portfolioId), updates, { merge: true });
            await batch.commit();

            res.status(200).json({ success: true, message: "Hero and settings updated successfully." });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });
});

// ── 4. Upload Assets ──────────────────────────────────────────────────────────
export const uploadPortfolioAsset = onRequest({ region: "us-west1", memory: "512MiB" }, async (req, res) => {
    corsHandler(req as any, res as any, async () => {
        if (req.method === "OPTIONS") { res.status(204).send(""); return; }
        if (req.method !== "POST") { res.status(405).json({ error: "Method Not Allowed. Use POST." }); return; }

        const authResult = await handleApiAuth(req, res);
        if (!authResult) return;

        const { image, path, mimeType } = req.body;
        if (!image || !path || !mimeType) {
            res.status(400).json({ error: "Missing image (base64), path, or mimeType." });
            return;
        }

        try {
            const bucket = admin.storage().bucket();
            // Prefix path with user ID to ensure security
            const securePath = `users/${authResult.uid}/portfolio_assets/${path}`;
            const file = bucket.file(securePath);
            const buffer = Buffer.from(image, 'base64');
            const token = uuidv4();

            await file.save(buffer, {
                metadata: {
                    contentType: mimeType,
                    metadata: {
                        firebaseStorageDownloadTokens: token
                    }
                }
            });

            const bucketName = bucket.name;
            const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(securePath)}?alt=media&token=${token}`;

            res.status(200).json({ success: true, downloadUrl });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });
});

import { onDocumentUpdated } from "firebase-functions/v2/firestore";

// ── 5. Omnichannel Cross-Platform Sync Trigger ────────────────────────────────
export const onPortfolioProjectsUpdated = onDocumentUpdated({ document: "users/{userId}/portfolios/{portfolioId}", region: "us-west1", memory: "256MiB" }, async (event) => {
    const newData = event.data?.after.data();
    const oldData = event.data?.before.data();
    if (!newData || !oldData) return;

    const newLen = Array.isArray(newData.projects) ? newData.projects.length : 0;
    const oldLen = Array.isArray(oldData.projects) ? oldData.projects.length : 0;

    // Only run if a project was added (length increased)
    if (newLen <= oldLen || newLen === 0) return;

    const latestProject = newData.projects[newData.projects.length - 1];

    // 1. Generate LinkedIn Summary
    let linkedinSummary = "";
    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const apiKey = process.env.GEMINI_API_KEY || "";
        if (apiKey) {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `Write a professional, engaging 2-paragraph LinkedIn post (with emojis and 3 hashtags) announcing this new developer side project:
Title: ${latestProject.title || "A new feature"}
Description: ${latestProject.description || "N/A"}
Tech Stack: ${(latestProject.techStack || []).join(", ")}`;

            const aiRes = await model.generateContent(prompt);
            linkedinSummary = aiRes.response.text().trim();
        }
    } catch (err) {
        console.error("LinkedIn gen failed", err);
    }

    if (linkedinSummary) {
        await event.data?.after.ref.update({ latestLinkedInPost: linkedinSummary });
    }

    // 2. Append to most recently updated resume (employmentHistory pseudo-entry)
    const resumesSnap = await db.collection("users").doc(event.params.userId).collection("resumes")
        .orderBy("updatedAt", "desc").limit(1).get();

    if (!resumesSnap.empty) {
        const resumeRef = resumesSnap.docs[0].ref;
        const resumeData = resumesSnap.docs[0].data();
        const history = resumeData.employmentHistory || [];

        history.push({
            id: uuidv4(),
            jobTitle: "Creator / Developer",
            employer: `Project: ${latestProject.title || "Side Project"}`,
            city: "Remote",
            startDate: new Date().toISOString().substring(0, 7),
            endDate: "Present",
            description: latestProject.description || "Developed and shipped this project."
        });

        await resumeRef.update({ employmentHistory: history, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
});
