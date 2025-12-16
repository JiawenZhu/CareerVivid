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
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TranslationServiceClient } from "@google-cloud/translate";

const corsHandler = cors({ origin: true });

// Initialize the database connection
if (!admin.apps.length) {
  admin.initializeApp();
}

const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Export the new Proxy Function if needed
export { streamGeminiResponse as geminiProxy } from "./geminiProxy";

// Export Stripe payment functions
export { createCheckoutSession, stripeWebhook, cancelSubscription, applyDiscount } from "./stripe";

// Export Admin functions
export { grantAcademicPartnerRole } from "./admin";

// Export Triggers
export * from './scheduled';
export * from './email';
export * from './stripe';
export { onUserCreated } from "./triggers";
export { onEmailRequestCreated } from "./email";

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
  "https://careervivid.app/";

const PDF_PREVIEW_ROUTE =
  process.env.CAREERVIVID_PDF_ROUTE ||
  functionConfig.pdf_route ||
  "/pdf-preview";

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

  // Wait for all images to load explicitly
  await page.evaluate(async () => {
    await Promise.all(Array.from(document.images).map(img => {
      if (img.complete) return;
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));
  });

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
  .region('us-west1')
  .runWith({
    timeoutSeconds: 120,
    memory: "4GB"
  })
  .https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
      // Explicitly handle preflight requests if cors middleware misses it (safety net)
      if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.status(204).send('');
        return;
      }

      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      console.log("START: generateResumePdfHttp [STREAMING MODE V3 - HYBRID AUTH]");

      let userId: string | null = null;
      let resumeDataToUse: ResumeData | null = null;
      let templateIdToUse: string | null = null;
      let isPublicAccess = false;

      const authHeader = req.headers.authorization;

      // Case 1: Authenticated Request (Editor Mode)
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        try {
          const decodedToken = await admin.auth().verifyIdToken(idToken);
          userId = decodedToken.uid;
          resumeDataToUse = req.body.resumeData; // Use provided data (allows drafts)
          templateIdToUse = req.body.templateId;
        } catch (e) {
          console.error("Token verification failed:", e);
          res.status(401).send('Unauthorized');
          return;
        }
      }
      // Case 2: Unauthenticated Request (Public Shared Page)
      else {
        const bodyUserId = req.body.userId;
        const bodyResumeId = req.body.resumeId;

        if (!bodyUserId || !bodyResumeId) {
          res.status(401).send('Unauthorized: No token and missing public context.');
          return;
        }

        console.log(`Public PDF Request for User: ${bodyUserId}, Resume: ${bodyResumeId}`);
        isPublicAccess = true;
        userId = bodyUserId;

        // SECURITY: For public requests, we MUST fetch from DB. 
        // We cannot trust req.body.resumeData from an unauthenticated source.
        try {
          const doc = await admin.firestore()
            .collection("users")
            .doc(String(userId))
            .collection("resumes")
            .doc(String(bodyResumeId))
            .get();

          if (!doc.exists) {
            res.status(404).send('Resume not found');
            return;
          }

          const fetchedData = doc.data() as ResumeData;

          // Verify Permissions
          if (!fetchedData.shareConfig?.enabled) {
            res.status(403).send('Resume is not shared publicly.');
            return;
          }

          resumeDataToUse = { ...fetchedData, id: doc.id };
          templateIdToUse = fetchedData.templateId;

        } catch (err) {
          console.error("Error fetching public resume:", err);
          res.status(500).send("Failed to verify public resume.");
          return;
        }
      }

      if (!userId || !resumeDataToUse || !templateIdToUse) {
        res.status(400).send("Invalid Request Data");
        return;
      }

      // Check Premium Status (Common for both paths)
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();

      let isPremium = false;

      if (userData) {
        const plan = userData.plan || 'free';
        const isSprintValid = plan === 'pro_sprint' && userData.expiresAt
          ? (typeof userData.expiresAt.toMillis === 'function' ? userData.expiresAt.toMillis() : userData.expiresAt._seconds * 1000) > Date.now()
          : false;
        const isMonthlyActive = plan === 'pro_monthly' &&
          (userData.stripeSubscriptionStatus === 'active' || userData.stripeSubscriptionStatus === 'trialing');
        const hasLegacyPremium = userData.promotions?.isPremium === true;

        isPremium = isSprintValid || isMonthlyActive || hasLegacyPremium;
      }

      if (!isPremium) {
        // If public access, we don't show upgrade URL, just deny
        res.status(403).json({
          error: isPublicAccess
            ? 'The owner of this resume does not have a premium subscription required for high-quality PDF downloads.'
            : 'PDF export is a premium feature. Please upgrade.',
          upgradeUrl: isPublicAccess ? undefined : '/pricing'
        });
        return;
      }

      try {
        const pdfBuffer = await generatePdfBuffer(resumeDataToUse, templateIdToUse);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="resume_${resumeDataToUse.id}.pdf"`);
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
  .region('us-west1')
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
        const genAI = new GoogleGenerativeAI(geminiApiKey.value());
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        res.json({ result: text });
      } catch (error: any) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ error: error.message || "Unknown error" });
      }
    });
  });

// HTTP Function - Upload Image Proxy (Bypasses CORS)
export const uploadImageHttp = functions.region('us-west1').runWith({ timeoutSeconds: 60, memory: "512MB" }).https.onRequest(
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

export const getPublicResume = functions.region('us-west1').runWith({ timeoutSeconds: 60, memory: "256MB" }).https.onRequest((req, res) => {
  console.log("getPublicResume called");
  try {
    // WRAP EVERYTHING in CORS. If you don't, it crashes.
    corsHandler(req, res, async () => {
      console.log("Inside corsHandler");
      if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.status(204).send('');
        return;
      }
      try {
        const { userId, resumeId } = req.query;

        // Check for missing data
        if (!userId || !resumeId) {
          console.error("Missing parameters");
          return res.status(400).send({ error: "Missing userId or resumeId" });
        }

        console.log(`Fetching resume for User: ${userId}, Resume: ${resumeId}`);

        // Fetch from Firestore
        const doc = await admin.firestore()
          .collection("users")
          .doc(String(userId))
          .collection("resumes")
          .doc(String(resumeId))
          .get();

        if (!doc.exists) {
          console.error("Resume not found in database");
          return res.status(404).send({ error: "Resume not found" });
        }

        const data = doc.data();

        // Check if sharing is enabled
        if (!data || !data.shareConfig || !data.shareConfig.enabled) {
          console.error("Access denied: Sharing not enabled");
          return res.status(403).send({ error: "Access denied" });
        }

        // Fetch owner's subscription status
        let ownerIsPremium = false;
        try {
          const ownerDoc = await admin.firestore()
            .collection("users")
            .doc(String(userId))
            .get();

          if (ownerDoc.exists) {
            const ownerData = ownerDoc.data();

            // Check pro_sprint plan validity
            const isSprintValid = ownerData?.plan === 'pro_sprint' && ownerData?.expiresAt
              ? ownerData.expiresAt.toMillis() > Date.now()
              : false;

            // Check pro_monthly subscription status
            const isMonthlyActive = ownerData?.plan === 'pro_monthly' &&
              (ownerData?.stripeSubscriptionStatus === 'active' ||
                ownerData?.stripeSubscriptionStatus === 'trialing');

            // Check legacy premium flag (backward compatibility)
            const hasLegacyPremium = ownerData?.promotions?.isPremium === true;

            // Owner is premium if they have any valid premium status
            ownerIsPremium = isSprintValid || isMonthlyActive || hasLegacyPremium;
          }
        } catch (ownerError) {
          console.error("Error fetching owner premium status:", ownerError);
          // Continue with ownerIsPremium = false if fetch fails
        }

        console.log("Resume found successfully, ownerIsPremium:", ownerIsPremium);

        // Send the data back with ownerIsPremium flag
        return res.status(200).json({ ...data, id: doc.id, ownerIsPremium });

      } catch (error: any) {
        console.error("CRASH ERROR:", error);
        return res.status(500).send({ error: error.message });
      }
    });
  } catch (outerError: any) {
    console.error("Outer Error in getPublicResume:", outerError);
    res.status(500).send({ error: "Internal Server Error (Outer)" });
  }
});

export const updatePublicResume = functions.region('us-west1').runWith({ timeoutSeconds: 60, memory: "256MB" }).https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }
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

// --- Translation Function ---
export const translateText = functions.region('us-west1').https.onCall(async (data, context) => {
  // 1. Authentication Check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { content, targetLanguage, format } = data;

  // 2. Input Validation
  if (!content || !targetLanguage) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with "content" and "targetLanguage" arguments.'
    );
  }

  try {
    // 3. Initialize Client
    const translationClient = new TranslationServiceClient();
    const projectId = 'jastalk-firebase';
    const location = 'global';

    // 4. Construct Request
    const request = {
      parent: `projects/${projectId}/locations/${location}`,
      contents: Array.isArray(content) ? content : [content],
      mimeType: format === 'html' ? 'text/html' : 'text/plain', // Crucial for bold/italics
      sourceLanguageCode: 'en-US', // Assuming source is English
      targetLanguageCode: targetLanguage,
    };

    // 5. Call API
    const [response] = await translationClient.translateText(request);

    // 6. Return Results
    return {
      translations: response.translations?.map(t => t.translatedText) || []
    };

  } catch (error: any) {
    console.error("Translation Error:", error);
    if (error.code === 3 || error.message?.includes('invalid language')) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid target language code.');
    }
    throw new functions.https.HttpsError('internal', 'Translation failed.', error.message);
  }
});

// Export duplicateAndTranslateResume
export { duplicateAndTranslateResume } from './duplicateAndTranslateResume';

/**
 * Generate a secure custom authentication token for Interview Microservice handoff.
 * This allows users to be securely redirected to the external Interview Studio service.
 */
export const getInterviewAuthToken = functions.region('us-west1').https.onCall(async (data, context) => {
  // Verify user authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be logged in to generate an interview token"
    );
  }

  try {
    // Generate custom token using the user's UID
    const token = await admin.auth().createCustomToken(context.auth.uid);

    // Return token object
    return { token };
  } catch (error) {
    console.error("Error creating custom token:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate authentication token"
    );
  }
});
