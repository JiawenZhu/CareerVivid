import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import type { Page } from "puppeteer-core";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { Buffer } from "buffer";
import { ResumeData } from "./types";
import { defineSecret } from "firebase-functions/params";
// FIX: Updated to use the modern, recommended Gemini API client.
import { GoogleGenAI } from "@google/genai";

const corsHandler = cors({ origin: true });

admin.initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const getFunctionConfig = () => {
    try {
        return functions.config().careervivid || {};
    } catch (err) {
        return {};
    }
};

const functionConfig = getFunctionConfig();

const APP_BASE_URL =
    process.env.CAREERVIVID_APP_URL ||
    functionConfig.app_url ||
    "https://careervivid-371634100960.us-west1.run.app/";

const PDF_PREVIEW_ROUTE =
    process.env.CAREERVIVID_PDF_ROUTE ||
    functionConfig.pdf_route ||
    "/#/pdf-preview";

const PDF_PREVIEW_URL = `${APP_BASE_URL}${PDF_PREVIEW_ROUTE}`;

const waitForPdfStatus = (page: Page, expected: "ready" | "rendered") => {
    return page.waitForFunction(
        (status: string) => {
            const ctx = globalThis as { __PDF_STATUS__?: string };
            return ctx.__PDF_STATUS__ === status;
        },
        { timeout: 30000 },
        expected
    );
};

const injectPreviewPayload = (page: Page, payload: { resumeData: ResumeData; templateId: string }) => {
    return page.evaluate((data) => {
        const ctx = globalThis as {
            __RENDER_PAYLOAD__?: (incoming: typeof data) => void;
            __PENDING_PAYLOAD__?: typeof data;
        };

        if (typeof ctx.__RENDER_PAYLOAD__ === "function") {
            ctx.__RENDER_PAYLOAD__(data);
        } else {
            ctx.__PENDING_PAYLOAD__ = data;
        }
    }, payload);
};

const generatePdfBuffer = async (resumeData: ResumeData, templateId: string) => {
    console.log(`Rendering template "${templateId}" via preview page: ${PDF_PREVIEW_URL}`);

    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(PDF_PREVIEW_URL, { waitUntil: "networkidle0" });
    await page.emulateMediaType("screen");
    await waitForPdfStatus(page, "ready");
    await injectPreviewPayload(page, { resumeData, templateId });
    await waitForPdfStatus(page, "rendered");
    await new Promise((resolve) => setTimeout(resolve, 200));

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    await browser.close();
    return pdfBuffer;
};

export const generateResumePdfHttp = functions
  .region("us-west1")
  .runWith({
    timeoutSeconds: 120,
    memory: "4GB"
  })
  .https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      console.log("START: generateResumePdfHttp [STREAMING MODE V2]");

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized');
        return;
      }
      const idToken = authHeader.split('Bearer ')[1];
      try {
        await admin.auth().verifyIdToken(idToken);
      } catch (e) {
        console.error("Token verification failed:", e);
        res.status(401).send('Unauthorized');
        return;
      }

      const { resumeData, templateId } = req.body;
      if (!resumeData || !templateId) {
        res.status(400).send("Missing resume data or template ID.");
        return;
      }

      try {
        const pdfBuffer = await generatePdfBuffer(resumeData, templateId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="resume_${resumeData.id}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);

      } catch (error: any) {
        console.error("PDF Generation Error:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to generate PDF", details: error.message });
        }
      }
    });
  });

// --- LEGACY AI FUNCTION (Updated to 2.5 Flash) ---
export const generateAIContent = functions
  .region("us-west1")
  .runWith({
    timeoutSeconds: 60,
    secrets: [geminiApiKey],
  })
  .https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized');
        return;
      }

      try {
        const idToken = authHeader.split('Bearer ')[1];
        await admin.auth().verifyIdToken(idToken);
      } catch (err) {
        console.error("Token verification failed:", err);
        res.status(401).send('Unauthorized');
        return;
      }

      const { prompt } = req.body || {};
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).send("Missing prompt");
        return;
      }

      try {
        // FIX: Updated Gemini API call to align with current SDK guidelines.
        const ai = new GoogleGenAI({apiKey: geminiApiKey.value()});
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        const text = response.text;
        res.json({ result: text });
      } catch (error: any) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ error: error.message || "Unknown error" });
      }
    });
  });

// HTTP Function - Upload Image Proxy (Bypasses CORS)
export const uploadImageHttp = functions
    .region("us-west1")
    .runWith({ timeoutSeconds: 60, memory: "512MB" }).https.onRequest(
    async (req, res) => {
        corsHandler(req, res, async () => {
            if (req.method !== "POST") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).send('Unauthorized');
                return;
            }
            const idToken = authHeader.split('Bearer ')[1];
            try {
                await admin.auth().verifyIdToken(idToken);
            } catch (e) {
                console.error("Token verification failed:", e);
                res.status(401).send('Unauthorized');
                return;
            }

            const { image, path, mimeType } = req.body;
            if (!image || !path || !mimeType) {
                res.status(400).send("Missing image data, path, or mimeType.");
                return;
            }

            try {
                const bucket = admin.storage().bucket();
                const file = bucket.file(path);
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
                const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;

                console.log(`File uploaded successfully to ${path}. URL: ${downloadUrl}`);
                res.json({ downloadUrl });
            } catch (error: any) {
                console.error("Upload Error:", error);
                res.status(500).json({ error: error.message });
            }
        });
    }
);

// --- NEW: Public Access Functions ---

export const getPublicResume = functions
    .region("us-west1")
    .runWith({ timeoutSeconds: 60, memory: "256MB" }).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        console.log("getPublicResume called", { query: req.query });

        if (req.method !== 'GET') {
             res.status(405).send('Method Not Allowed');
             return;
        }
        const { userId, resumeId } = req.query;
        if (!userId || !resumeId) {
            console.warn("Missing parameters");
            res.status(400).send('Missing parameters');
            return;
        }

        try {
            const docRef = admin.firestore().collection('users').doc(String(userId)).collection('resumes').doc(String(resumeId));
            const docSnap = await docRef.get();
            
            if (!docSnap.exists) {
                console.warn("Resume not found");
                res.status(404).send('Resume not found');
                return;
            }
            
            const data = docSnap.data();
            if (!data || !data.shareConfig || !data.shareConfig.enabled) {
                console.warn("Access denied: Sharing not enabled");
                res.status(403).send('Access denied');
                return;
            }
            
            console.log("Success fetching public resume");
            res.json({ ...data, id: docSnap.id });
        } catch (error) {
            console.error("Error in getPublicResume:", error);
            res.status(500).send('Internal Server Error');
        }
    });
});

export const updatePublicResume = functions
    .region("us-west1")
    .runWith({ timeoutSeconds: 60, memory: "256MB" }).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'POST') {
             res.status(405).send('Method Not Allowed');
             return;
        }
        const { userId, resumeId, data } = req.body;
        
        if (!userId || !resumeId || !data) {
             res.status(400).send('Missing parameters');
             return;
        }

        try {
            const docRef = admin.firestore().collection('users').doc(String(userId)).collection('resumes').doc(String(resumeId));
            const docSnap = await docRef.get();
            
            if (!docSnap.exists) {
                 res.status(404).send('Resume not found');
                 return;
            }
            
            const currentData = docSnap.data();
            if (!currentData?.shareConfig?.enabled || currentData.shareConfig.permission !== 'editor') {
                res.status(403).send('Permission denied');
                return;
            }

            const safeUpdate = { ...data };
            delete safeUpdate.shareConfig;
            delete safeUpdate.id;
            delete safeUpdate.userId;

            await docRef.update({
                ...safeUpdate,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    });
});