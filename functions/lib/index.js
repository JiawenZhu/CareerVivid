"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInterviewAuthToken = exports.duplicateAndTranslateResume = exports.translateText = exports.updatePublicResume = exports.getPublicResume = exports.uploadImageHttp = exports.generateAIContent = exports.generateResumePdfHttp = exports.onEmailRequestCreated = exports.onApplicationCreated = exports.onPartnerApplicationUpdated = exports.onUserCreated = exports.jobs = exports.grantAcademicPartnerRole = exports.applyDiscount = exports.cancelSubscription = exports.stripeWebhook = exports.createCheckoutSession = exports.geminiProxy = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const chromium_1 = __importDefault(require("@sparticuz/chromium"));
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const cors_1 = __importDefault(require("cors"));
const uuid_1 = require("uuid");
const buffer_1 = require("buffer");
const params_1 = require("firebase-functions/params");
const generative_ai_1 = require("@google/generative-ai");
const translate_1 = require("@google-cloud/translate");
const corsHandler = (0, cors_1.default)({ origin: true });
// Initialize the database connection
if (!admin.apps.length) {
    admin.initializeApp();
}
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
// Export the new Proxy Function if needed
var geminiProxy_1 = require("./geminiProxy");
Object.defineProperty(exports, "geminiProxy", { enumerable: true, get: function () { return geminiProxy_1.streamGeminiResponse; } });
// Export Stripe payment functions
var stripe_1 = require("./stripe");
Object.defineProperty(exports, "createCheckoutSession", { enumerable: true, get: function () { return stripe_1.createCheckoutSession; } });
Object.defineProperty(exports, "stripeWebhook", { enumerable: true, get: function () { return stripe_1.stripeWebhook; } });
Object.defineProperty(exports, "cancelSubscription", { enumerable: true, get: function () { return stripe_1.cancelSubscription; } });
Object.defineProperty(exports, "applyDiscount", { enumerable: true, get: function () { return stripe_1.applyDiscount; } });
// Export Admin functions
var admin_1 = require("./admin");
Object.defineProperty(exports, "grantAcademicPartnerRole", { enumerable: true, get: function () { return admin_1.grantAcademicPartnerRole; } });
// Export Triggers
__exportStar(require("./scheduled"), exports);
__exportStar(require("./email"), exports);
exports.jobs = __importStar(require("./jobs"));
__exportStar(require("./stripe"), exports);
var triggers_1 = require("./triggers");
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return triggers_1.onUserCreated; } });
Object.defineProperty(exports, "onPartnerApplicationUpdated", { enumerable: true, get: function () { return triggers_1.onPartnerApplicationUpdated; } });
Object.defineProperty(exports, "onApplicationCreated", { enumerable: true, get: function () { return triggers_1.onApplicationCreated; } });
var email_1 = require("./email");
Object.defineProperty(exports, "onEmailRequestCreated", { enumerable: true, get: function () { return email_1.onEmailRequestCreated; } });
const getFunctionConfig = () => {
    try {
        return functions.config().careervivid || {};
    }
    catch (err) {
        return {};
    }
};
const functionConfig = getFunctionConfig();
const APP_BASE_URL = process.env.CAREERVIVID_APP_URL ||
    functionConfig.app_url ||
    "https://careervivid.app/";
const PDF_PREVIEW_ROUTE = process.env.CAREERVIVID_PDF_ROUTE ||
    functionConfig.pdf_route ||
    "/pdf-preview";
const PDF_PREVIEW_URL = `${APP_BASE_URL}${PDF_PREVIEW_ROUTE}`;
const waitForPdfStatus = (page, expected) => {
    return page.waitForFunction((status) => {
        const ctx = globalThis;
        return ctx.__PDF_STATUS__ === status;
    }, { timeout: 30000 }, expected);
};
const injectPreviewPayload = (page, payload) => {
    return page.evaluate((data) => {
        const ctx = globalThis;
        if (typeof ctx.__RENDER_PAYLOAD__ === "function") {
            ctx.__RENDER_PAYLOAD__(data);
        }
        else {
            ctx.__PENDING_PAYLOAD__ = data;
        }
    }, payload);
};
const generatePdfBuffer = async (resumeData, templateId) => {
    console.log(`Rendering template "${templateId}" via preview page: ${PDF_PREVIEW_URL}`);
    const executablePath = await chromium_1.default.executablePath();
    const browser = await puppeteer_core_1.default.launch({
        args: chromium_1.default.args,
        defaultViewport: chromium_1.default.defaultViewport,
        executablePath,
        headless: chromium_1.default.headless,
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
            if (img.complete)
                return;
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
exports.generateResumePdfHttp = functions
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
        let userId = null;
        let resumeDataToUse = null;
        let templateIdToUse = null;
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
            }
            catch (e) {
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
                const fetchedData = doc.data();
                // Verify Permissions
                if (!fetchedData.shareConfig?.enabled) {
                    res.status(403).send('Resume is not shared publicly.');
                    return;
                }
                resumeDataToUse = { ...fetchedData, id: doc.id };
                templateIdToUse = fetchedData.templateId;
            }
            catch (err) {
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
        }
        catch (error) {
            console.error("PDF Generation Error:", error);
            if (!res.headersSent) {
                res.status(500).json({ error: "Failed to generate PDF", details: error.message });
            }
        }
    });
});
// --- LEGACY AI FUNCTION (Updated to 2.5 Flash) ---
exports.generateAIContent = functions
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
        }
        catch (err) {
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
            const genAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey.value());
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            res.json({ result: text });
        }
        catch (error) {
            console.error("AI Generation Error:", error);
            res.status(500).json({ error: error.message || "Unknown error" });
        }
    });
});
// HTTP Function - Upload Image Proxy (Bypasses CORS)
exports.uploadImageHttp = functions.region('us-west1').runWith({ timeoutSeconds: 60, memory: "512MB" }).https.onRequest(async (req, res) => {
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
        }
        catch (e) {
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
            const buffer = buffer_1.Buffer.from(image, 'base64');
            const token = (0, uuid_1.v4)();
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
        }
        catch (error) {
            console.error("Upload Error:", error);
            res.status(500).json({ error: error.message });
        }
    });
});
// --- NEW: Public Access Functions ---
exports.getPublicResume = functions.region('us-west1').runWith({ timeoutSeconds: 60, memory: "256MB" }).https.onRequest((req, res) => {
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
                }
                catch (ownerError) {
                    console.error("Error fetching owner premium status:", ownerError);
                    // Continue with ownerIsPremium = false if fetch fails
                }
                console.log("Resume found successfully, ownerIsPremium:", ownerIsPremium);
                // Send the data back with ownerIsPremium flag
                return res.status(200).json({ ...data, id: doc.id, ownerIsPremium });
            }
            catch (error) {
                console.error("CRASH ERROR:", error);
                return res.status(500).send({ error: error.message });
            }
        });
    }
    catch (outerError) {
        console.error("Outer Error in getPublicResume:", outerError);
        res.status(500).send({ error: "Internal Server Error (Outer)" });
    }
});
exports.updatePublicResume = functions.region('us-west1').runWith({ timeoutSeconds: 60, memory: "256MB" }).https.onRequest(async (req, res) => {
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
        }
        catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    });
});
// --- Translation Function ---
exports.translateText = functions.region('us-west1').https.onCall(async (data, context) => {
    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { content, targetLanguage, format } = data;
    // 2. Input Validation
    if (!content || !targetLanguage) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with "content" and "targetLanguage" arguments.');
    }
    try {
        // 3. Initialize Client
        const translationClient = new translate_1.TranslationServiceClient();
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
    }
    catch (error) {
        console.error("Translation Error:", error);
        if (error.code === 3 || error.message?.includes('invalid language')) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid target language code.');
        }
        throw new functions.https.HttpsError('internal', 'Translation failed.', error.message);
    }
});
// Export duplicateAndTranslateResume
var duplicateAndTranslateResume_1 = require("./duplicateAndTranslateResume");
Object.defineProperty(exports, "duplicateAndTranslateResume", { enumerable: true, get: function () { return duplicateAndTranslateResume_1.duplicateAndTranslateResume; } });
/**
 * Generate a secure custom authentication token for Interview Microservice handoff.
 * This allows users to be securely redirected to the external Interview Studio service.
 */
exports.getInterviewAuthToken = functions.region('us-west1').https.onCall(async (data, context) => {
    // Verify user authentication
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in to generate an interview token");
    }
    try {
        // Generate custom token using the user's UID
        const token = await admin.auth().createCustomToken(context.auth.uid);
        // Return token object
        return { token };
    }
    catch (error) {
        console.error("Error creating custom token:", error);
        throw new functions.https.HttpsError("internal", "Failed to generate authentication token");
    }
});
//# sourceMappingURL=index.js.map