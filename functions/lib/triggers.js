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
Object.defineProperty(exports, "__esModule", { value: true });
exports.onApplicationCreated = exports.onPartnerApplicationUpdated = exports.onUserCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const emailTemplates_1 = require("./emailTemplates");
/**
 * Trigger: On User Created
 * Logic:
 * 1. Check if user has `referredBy` code.
 * 2. If yes, find the Academic Partner who owns that code.
 * 3. Verify Partner exists.
 * 4. Grant Student 30-day Premium Trial.
 * 5. Link Student to Partner via `academicPartnerId`.
 */
exports.onUserCreated = functions.region('us-west1').firestore
    .document('users/{userId}')
    .onCreate(async (snap, context) => {
    const newUser = snap.data();
    const userId = context.params.userId;
    if (!newUser) {
        console.log("No data for user " + userId);
        return null;
    }
    // --- NEW: Send Welcome Email ---
    try {
        if (newUser.email) {
            const userName = newUser.displayName || newUser.personalDetails?.firstName || "there";
            const emailHtml = (0, emailTemplates_1.generateNeoBrutalistEmail)({
                title: "Welcome to CareerVivid",
                userName: userName,
                messageLines: [
                    "We're thrilled to have you on board! Get ready to supercharge your career journey.",
                    "With CareerVivid, you can create stunning resumes, track your job applications, and prepare for interviews with AI."
                ],
                boxContent: {
                    title: "Get Started",
                    type: "success",
                    lines: [
                        "<strong>Complete your profile</strong> to get personalized recommendations.",
                        "<strong>Upload your resume</strong> to kickstart the AI analysis.",
                        "Explore our premium templates to stand out."
                    ]
                },
                mainButton: {
                    text: "Go to Dashboard",
                    url: "https://careervivid.app/dashboard"
                },
                footerText: "Let's build your future together!"
            });
            await admin.firestore().collection("mail").add({
                to: newUser.email,
                message: {
                    subject: "Welcome to CareerVivid! 🚀",
                    html: emailHtml,
                    text: "Welcome to CareerVivid! We're thrilled to have you on board. Go to https://careervivid.app/dashboard to get started."
                }
            });
            console.log(`Welcome email queued for ${newUser.email}`);
        }
    }
    catch (e) {
        console.error("Error sending welcome email:", e);
    }
    // --- Referral Logic ---
    if (!newUser.referredBy) {
        console.log(`User ${userId} created without referral.`);
        return null;
    }
    const referralCode = newUser.referredBy;
    console.log(`Processing referral ${referralCode} for user ${userId}`);
    try {
        // Find Academic Partner with this code
        const partnersSnapshot = await admin.firestore()
            .collection('users')
            .where('role', '==', 'academic_partner')
            .where('referralCode', '==', referralCode)
            .limit(1)
            .get();
        if (partnersSnapshot.empty) {
            console.warn(`Referral code ${referralCode} not found or invalid.`);
            return null;
        }
        const partnerDoc = partnersSnapshot.docs[0];
        const partnerId = partnerDoc.id;
        console.log(`Referral valid! Partner: ${partnerId}`);
        // Grant 30 Days Premium
        const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
        await admin.firestore().collection('users').doc(userId).update({
            plan: 'pro_monthly', // Give them full access (trial)
            stripeSubscriptionStatus: 'trialing', // Mark as trialing
            expiresAt: expiresAt,
            academicPartnerId: partnerId,
            promotions: {
                isPremium: true,
                trialSource: 'academic_referral'
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`User ${userId} granted Academic access via Partner ${partnerId}`);
    }
    catch (error) {
        console.error("Error processing referral trigger:", error);
    }
    return null; // Function must return null or promise
});
/**
 * Trigger: On Partner Application Updated
 * Logic:
 * 1. Listen for status change to 'approved'.
 * 2. If 'business' type and approved:
 * 3. Check if user exists.
 * 4. If NEW: Create user (pwd: careervivid123456) + assign role.
 * 5. If EXISTING: Update role.
 */
exports.onPartnerApplicationUpdated = functions.region('us-west1').firestore
    .document('partner_applications/{appId}')
    .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    // Only run if status changed to 'approved'
    if (newData.status === 'approved' && oldData.status !== 'approved') {
        const { email, name, type, organization } = newData;
        console.log(`Processing approval for ${type} partner: ${email}`);
        if (type !== 'business') {
            console.log('Not a business partner. Skipping auto-creation.');
            // Note: Academic partners might need manual role assignment or different logic
            return null;
        }
        try {
            // Check if user exists
            let userRecord;
            try {
                userRecord = await admin.auth().getUserByEmail(email);
                console.log(`User ${email} found with UID: ${userRecord.uid}`);
            }
            catch (e) {
                if (e.code === 'auth/user-not-found') {
                    // Create NEW User
                    console.log(`User ${email} not found. Creating new account...`);
                    userRecord = await admin.auth().createUser({
                        email: email,
                        emailVerified: true,
                        password: 'careervivid123456',
                        displayName: name,
                        disabled: false
                    });
                    console.log(`Created new user: ${userRecord.uid}`);
                }
                else {
                    throw e;
                }
            }
            // Prepare role update
            const uid = userRecord.uid;
            const userRef = admin.firestore().collection('users').doc(uid);
            const userSnap = await userRef.get();
            if (!userSnap.exists) {
                // Create Firestore doc for new user
                await userRef.set({
                    email: email,
                    displayName: name,
                    photoURL: userRecord.photoURL || null,
                    role: 'business_partner',
                    roles: ['business_partner'],
                    plan: 'free', // Default plan, maybe upgrade later?
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    organization: organization || ''
                });
                console.log(`Created Firestore profile for ${uid}`);
                // Update application with account creation success
                await admin.firestore().collection('partner_applications').doc(context.params.appId).update({
                    accountCreated: true,
                    accountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    createdUserId: uid,
                    accountCreationMessage: 'Account created successfully'
                });
            }
            else {
                // Update existing user
                const userData = userSnap.data();
                let currentRoles = userData?.roles || [];
                // Migration support
                if (userData?.role && !currentRoles.includes(userData.role)) {
                    currentRoles.push(userData.role);
                }
                if (!currentRoles.includes('business_partner')) {
                    currentRoles.push('business_partner');
                    await userRef.update({
                        roles: currentRoles,
                        role: 'business_partner', // Update legacy field too for safety
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`Updated existing user ${uid} with business_partner role`);
                    // Update application with role assignment success
                    await admin.firestore().collection('partner_applications').doc(context.params.appId).update({
                        accountCreated: true,
                        accountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        createdUserId: uid,
                        accountCreationMessage: 'Role added to existing account'
                    });
                }
                else {
                    console.log(`User ${uid} already has business_partner role`);
                    // Update application noting role already exists
                    await admin.firestore().collection('partner_applications').doc(context.params.appId).update({
                        accountCreated: true,
                        accountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        createdUserId: uid,
                        accountCreationMessage: 'User already has business_partner role'
                    });
                }
            }
        }
        catch (error) {
            console.error("Error in onPartnerApplicationUpdated:", error);
            // Update application with error status
            try {
                await admin.firestore().collection('partner_applications').doc(context.params.appId).update({
                    accountCreated: false,
                    accountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    accountCreationMessage: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            catch (updateError) {
                console.error("Failed to update application with error status:", updateError);
            }
        }
    }
    return null;
});
/**
 * Trigger: On Application Created
 * Automatically analyze resume match when a new application is submitted
 * This runs in the background and saves the analysis result to the application document
 */
exports.onApplicationCreated = functions
    .region('us-west1')
    .runWith({
    timeoutSeconds: 120, // AI analysis can take time
    memory: '512MB'
})
    .firestore
    .document('jobApplications/{applicationId}')
    .onCreate(async (snap, context) => {
    const application = snap.data();
    const applicationId = context.params.applicationId;
    console.log(`[AutoMatch] New application ${applicationId} - starting match analysis`);
    try {
        // 1. Get job posting details
        const jobDoc = await admin.firestore()
            .collection('jobPostings')
            .doc(application.jobPostingId)
            .get();
        if (!jobDoc.exists) {
            console.warn(`[AutoMatch] Job ${application.jobPostingId} not found, skipping analysis`);
            return null;
        }
        const job = jobDoc.data();
        // 2. Get the resume
        const resumeDoc = await admin.firestore()
            .collection('users')
            .doc(application.applicantUserId)
            .collection('resumes')
            .doc(application.resumeId)
            .get();
        if (!resumeDoc.exists) {
            console.warn(`[AutoMatch] Resume ${application.resumeId} not found, skipping analysis`);
            return null;
        }
        const resume = resumeDoc.data();
        // 3. Format resume text for analysis
        const resumeText = formatResumeForAnalysis(resume);
        // 4. Format job description
        const jobDescription = [
            `Job Title: ${job.jobTitle || 'Unknown'}`,
            `Company: ${job.companyName || 'Unknown'}`,
            `Description: ${job.description || ''}`,
            `Requirements: ${(job.requirements || []).join(', ')}`,
            `Responsibilities: ${(job.responsibilities || []).join(', ')}`,
            `Nice to Have: ${(job.niceToHave || []).join(', ')}`
        ].join('\n');
        // 5. Call Gemini for match analysis
        const analysis = await analyzeResumeMatchServerSide(resumeText, jobDescription);
        // 6. Save analysis result to the application document
        await admin.firestore()
            .collection('jobApplications')
            .doc(applicationId)
            .update({
            matchAnalysis: analysis,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[AutoMatch] ✅ Analysis complete for ${applicationId}: ${analysis.matchPercentage}% match`);
    }
    catch (error) {
        console.error(`[AutoMatch] ❌ Failed to analyze application ${applicationId}:`, error);
        // Don't throw - we don't want to retry on AI failures
    }
    return null;
});
/**
 * Format resume data into text for AI analysis
 */
function formatResumeForAnalysis(resume) {
    const parts = [];
    // Personal info
    if (resume.personalDetails) {
        const pd = resume.personalDetails;
        if (pd.jobTitle)
            parts.push(`Current Role: ${pd.jobTitle}`);
        if (pd.firstName && pd.lastName)
            parts.push(`Name: ${pd.firstName} ${pd.lastName}`);
    }
    // Professional summary
    if (resume.professionalSummary) {
        parts.push(`Summary: ${resume.professionalSummary}`);
    }
    // Skills
    if (resume.skills && resume.skills.length > 0) {
        const skillNames = resume.skills.map((s) => s.name || s).join(', ');
        parts.push(`Skills: ${skillNames}`);
    }
    // Employment history
    if (resume.employmentHistory && resume.employmentHistory.length > 0) {
        parts.push('Work Experience:');
        for (const job of resume.employmentHistory) {
            const jobLine = `- ${job.jobTitle || 'Role'} at ${job.employer || 'Company'} (${job.startDate || ''} - ${job.endDate || 'Present'})`;
            parts.push(jobLine);
            if (job.description) {
                parts.push(`  ${job.description.substring(0, 500)}`);
            }
        }
    }
    // Education
    if (resume.education && resume.education.length > 0) {
        parts.push('Education:');
        for (const edu of resume.education) {
            parts.push(`- ${edu.degree || 'Degree'} at ${edu.school || 'School'} (${edu.startDate || ''} - ${edu.endDate || ''})`);
        }
    }
    // Languages
    if (resume.languages && resume.languages.length > 0) {
        const langs = resume.languages.map((l) => l.name || l).join(', ');
        parts.push(`Languages: ${langs}`);
    }
    return parts.join('\n');
}
/**
 * Server-side resume match analysis using Gemini
 * Uses the Functions environment's API key
 */
async function analyzeResumeMatchServerSide(resumeText, jobDescription) {
    // Import Gemini AI
    const { GoogleGenerativeAI } = await Promise.resolve().then(() => __importStar(require('@google/generative-ai')));
    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.api_key;
    if (!apiKey) {
        console.error('[AutoMatch] GEMINI_API_KEY not configured');
        // Return a default result instead of failing
        return {
            totalKeywords: 0,
            matchedKeywords: [],
            missingKeywords: [],
            matchPercentage: 0,
            summary: 'Auto-analysis unavailable - API key not configured'
        };
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an expert recruiter analyzing a job application.

**Job Description:**
${jobDescription}

**Resume:**
${resumeText}

Analyze the match between this resume and the job description. Return your analysis as JSON with exactly this structure:
{
    "totalKeywords": <number of key requirements/skills from job>,
    "matchedKeywords": [<list of requirements/skills the candidate HAS>],
    "missingKeywords": [<list of requirements/skills the candidate is MISSING>],
    "matchPercentage": <0-100 percentage match>,
    "summary": "<2-3 sentence summary of the match quality>"
}

Only return valid JSON, no markdown or extra text.`;
    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        // Parse JSON from response (handle markdown code blocks)
        let jsonStr = responseText;
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.slice(7);
        }
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.slice(3);
        }
        if (jsonStr.endsWith('```')) {
            jsonStr = jsonStr.slice(0, -3);
        }
        const analysis = JSON.parse(jsonStr.trim());
        return analysis;
    }
    catch (error) {
        console.error('[AutoMatch] Gemini API error:', error);
        return {
            totalKeywords: 0,
            matchedKeywords: [],
            missingKeywords: [],
            matchPercentage: 0,
            summary: 'Auto-analysis failed'
        };
    }
}
//# sourceMappingURL=triggers.js.map