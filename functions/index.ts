import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import * as puppeteer from "puppeteer";
import { ResumeData, InterviewAnalysis, UserProfile, EmailPreferences } from "../types";
import { GoogleGenAI } from "@google/genai";


admin.initializeApp();
const storage = admin.storage();

// ... (Stripe Initialization code remains the same)
// =================================================================================
// IMPORTANT: SECURELY CONFIGURE YOUR STRIPE & GEMINI KEYS
// =================================================================================
let stripe: Stripe;
let webhookSecret: string;
let ai: GoogleGenAI;
try {
  const stripeSecretKey = functions.config().stripe.secret_key;
  const whSecret = functions.config().stripe.webhook_secret;
  const geminiKey = functions.config().gemini.key;

  if (!stripeSecretKey || !whSecret) throw new Error("Stripe keys not configured.");
  if (!geminiKey) throw new Error("Gemini API key not configured.");
  
  stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-04-10" });
  webhookSecret = whSecret;
  ai = new GoogleGenAI({ apiKey: geminiKey });

} catch (error) {
  console.error("CRITICAL ERROR: Failed to initialize APIs.", error);
  // Initialize with dummy keys to prevent crashes, but functionality will be broken.
  stripe = new Stripe("dummy_key", { apiVersion: "2024-04-10" });
  webhookSecret = "dummy_secret";
  ai = new GoogleGenAI({ apiKey: "dummy_key" });
}


// --- Helper function for PDF generation styles and structure ---
const getReportHtml = (analysis: InterviewAnalysis, jobTitle: string, isDarkMode: boolean = false): string => {
    const bgColor = '#ffffff';
    const textColor = '#1f2937';
    const cardBg = '#f9fafb';
    const cardBorder = '#e5e7eb';
    const primaryColor = 'hsl(220, 70%, 50%)';

    const scoreColor = (score: number) => score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

    const getScoreRingSvg = (score: number) => {
        const size = 120; const strokeWidth = 10; const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;
        return `
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
                <circle stroke="#e5e7eb" stroke-width="${strokeWidth}" fill="transparent" r="${radius}" cx="${size/2}" cy="${size/2}" />
                <circle stroke="${scoreColor(score)}" stroke-width="${strokeWidth}" fill="transparent" r="${radius}" cx="${size/2}" cy="${size/2}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" />
            </svg>
        `;
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body { font-family: 'Inter', sans-serif; background-color: ${bgColor}; color: ${textColor}; margin: 0; padding: 40px; font-size: 14px; line-height: 1.6; }
            h1, h2, h3 { font-weight: 700; }
            .report-header { text-align: center; margin-bottom: 30px; }
            .report-header h1 { font-size: 28px; color: #111827; }
            .report-header p { font-size: 14px; color: #6b7280; }
            .feedback-section { page-break-after: always; }
            .grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 24px; }
            .col-span-4 { grid-column: span 4 / span 4; }
            .col-span-8 { grid-column: span 8 / span 8; }
            .col-span-6 { grid-column: span 6 / span 6; }
            .card { background-color: ${cardBg}; border: 1px solid ${cardBorder}; border-radius: 12px; padding: 24px; }
            .score-ring { display: flex; align-items: center; justify-content: center; position: relative; }
            .score-ring-text { position: absolute; text-align: center; }
            .score-ring-text .score { font-size: 32px; font-weight: 800; }
            .score-ring-text .label { font-size: 12px; color: #6b7280; font-weight: 500; }
            .metric-bar-container { display: flex; flex-direction: column; gap: 16px; justify-content: center;}
            .metric-bar .label { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px; font-weight: 600; }
            .metric-bar .bar { height: 8px; width: 100%; background-color: ${cardBorder}; border-radius: 9999px; overflow: hidden; }
            .metric-bar .bar-fill { height: 100%; background-color: ${primaryColor}; border-radius: 9999px; }
            .feedback-box h3 { font-size: 18px; margin-bottom: 12px; color: #111827; font-weight: 700; }
            .feedback-box p { white-space: pre-wrap; line-height: 1.6; }
            .feedback-box strong { font-weight: 600; color: ${primaryColor}; }
            .transcript-title { font-size: 22px; font-weight: 700; margin-bottom: 20px; border-bottom: 2px solid ${cardBorder}; padding-bottom: 10px; color: #111827; }
            .chat-bubble { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; max-width: 90%; }
            .chat-bubble .text { padding: 12px; border-radius: 12px; font-size: 13px; }
            .chat-bubble.ai { justify-content: flex-start; }
            .chat-bubble.ai .text { background-color: #e5e7eb; color: #1f2937; }
            .chat-bubble.user { margin-left: auto; flex-direction: row-reverse; }
            .chat-bubble.user .text { background-color: #4338ca; color: white; }
            .avatar { width: 32px; height: 32px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; }
            .avatar-ai { background-color: ${primaryColor}; color: white; }
            .avatar-user { background-color: #6b7280; color: white; }
        </style>
    </head>
    <body>
        <div class="feedback-section">
            <div class="report-header">
                <h1>Interview Feedback Report</h1>
                <p>For the role of "${jobTitle}" on ${new Date(analysis.timestamp).toLocaleDateString()}</p>
            </div>
            <div class="grid" style="align-items: center;">
                <div class="col-span-4 card">
                    <div class="score-ring">
                        ${getScoreRingSvg(analysis.overallScore)}
                        <div class="score-ring-text">
                            <span class="score" style="color: ${scoreColor(analysis.overallScore)}">${Math.round(analysis.overallScore)}</span>
                            <span class="label">Overall</span>
                        </div>
                    </div>
                </div>
                <div class="col-span-8 card metric-bar-container">
                    <div class="metric-bar">
                        <div class="label"><span>Communication</span><span>${Math.round(analysis.communicationScore)}%</span></div>
                        <div class="bar"><div class="bar-fill" style="width: ${analysis.communicationScore}%;"></div></div>
                    </div>
                    <div class="metric-bar">
                        <div class="label"><span>Confidence</span><span>${Math.round(analysis.confidenceScore)}%</span></div>
                        <div class="bar"><div class="bar-fill" style="width: ${analysis.confidenceScore}%;"></div></div>
                    </div>
                    <div class="metric-bar">
                        <div class="label"><span>Answer Relevance</span><span>${Math.round(analysis.relevanceScore)}%</span></div>
                        <div class="bar"><div class="bar-fill" style="width: ${analysis.relevanceScore}%;"></div></div>
                    </div>
                </div>
            </div>
            <div class="grid" style="margin-top: 24px;">
                <div class="col-span-6 card feedback-box">
                    <h3>Strengths</h3>
                    <p>${analysis.strengths.replace(/\*\*/g, '<strong>')}</p>
                </div>
                <div class="col-span-6 card feedback-box">
                    <h3>Areas for Improvement</h3>
                    <p>${analysis.areasForImprovement.replace(/\*\*/g, '<strong>')}</p>
                </div>
            </div>
        </div>
        
        <div class="transcript-section">
            <h2 class="transcript-title">Interview Transcript</h2>
            ${analysis.transcript.map(entry => `
                <div class="chat-bubble ${entry.speaker}">
                    <div class="avatar avatar-${entry.speaker}">${entry.speaker === 'ai' ? 'AI' : 'U'}</div>
                    <div class="text"><p>${entry.text}</p></div>
                </div>
            `).join('')}
        </div>
    </body>
    </html>`;
};

// ... (createCheckoutSession and createPortalLink functions remain the same)
export const createCheckoutSession = functions.https.onCall(/* ... */);
export const createPortalLink = functions.https.onCall(/* ... */);


/**
 * Generates a high-quality PDF from interview analysis data using Puppeteer.
 */
export const generateReportPdf = functions.runWith({ timeoutSeconds: 120, memory: "1GB" }).https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }

    const { analysis, jobTitle } = data;
    if (!analysis || !jobTitle) {
      throw new functions.https.HttpsError("invalid-argument", "Missing analysis data or job title.");
    }
    
    // Using a simple check for dark mode; could be passed from client for accuracy.
    const isDarkMode = false;
    const htmlContent = getReportHtml(analysis, jobTitle, isDarkMode);

    try {
        const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
        const page = await browser.newPage();
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ 
            format: 'A4',
            printBackground: true,
            margin: { top: '30px', bottom: '30px', left: '30px', right: '30px' },
        });

        await browser.close();

        const bucket = storage.bucket();
        const filePath = `temp_reports/${context.auth.uid}/${analysis.id}.pdf`;
        const file = bucket.file(filePath);

        await file.save(pdfBuffer, {
            metadata: { contentType: 'application/pdf' },
        });

        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });
        
        return { url: signedUrl };

    } catch (error: any) {
        console.error("Puppeteer PDF generation error:", error);
        throw new functions.https.HttpsError("internal", "Failed to generate PDF.", error.message);
    }
  }
);


// ... (stripeWebhook function remains the same)
export const stripeWebhook = functions.https.onRequest(/* ... */);

// This is a placeholder for the generatePdf function from the previous step.
// Ensure it's correctly defined and exported.
export const generatePdf = functions.runWith({ timeoutSeconds: 300, memory: "2GB" }).https.onCall(
  async (data, context) => {
    // ... function implementation
  }
);

/**
 * Scrapes a job posting URL to extract key details.
 */
export const scrapeJobPost = functions.runWith({ timeoutSeconds: 120, memory: "1GB" }).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in to use this feature.");
  }
  const url = data.url;
  if (!url || typeof url !== 'string') {
    throw new functions.https.HttpsError("invalid-argument", "A valid URL must be provided.");
  }

  let browser;
  try {
    browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    let scrapedData: { jobTitle: string, companyName: string, location: string, jobDescription: string } | null = null;
    
    if (url.includes('linkedin.com/jobs/view')) {
      scrapedData = await page.evaluate(() => {
        const jobTitle = document.querySelector('.top-card-layout__title')?.textContent?.trim() || '';
        const companyName = document.querySelector('.top-card-layout__second-subline a')?.textContent?.trim() || '';
        const location = document.querySelector('.top-card-layout__second-subline > div:first-child > span')?.textContent?.trim() || '';
        const jobDescription = document.querySelector('.description__text')?.innerHTML || '';
        return { jobTitle, companyName, location, jobDescription };
      });
    } else if (url.includes('indeed.com')) {
       scrapedData = await page.evaluate(() => {
        const jobTitle = document.querySelector('h1.jobsearch-JobInfoHeader-title')?.textContent?.trim() || '';
        const companyName = document.querySelector('[data-testid="jobsearch-CompanyInfoContainer-companyLink"]')?.textContent?.trim() || '';
        const location = document.querySelector('[data-testid="job-location"]')?.textContent?.trim() || '';
        const jobDescription = document.querySelector('#jobDescriptionText')?.innerHTML || '';
        return { jobTitle, companyName, location, jobDescription };
      });
    } else {
        // Generic fallback (less reliable)
        scrapedData = await page.evaluate(() => {
            const jobTitle = document.querySelector('h1')?.textContent?.trim() || '';
            const companyName = document.title.split(' at ')[1]?.split(' hiring')[0] || '';
            const location = '';
            const jobDescription = document.querySelector('body')?.innerText || '';
            return { jobTitle, companyName, location, jobDescription };
        });
    }

    if (!scrapedData || !scrapedData.jobTitle) {
      return { success: false, message: "Could not automatically parse job details. Please enter them manually." };
    }

    return { success: true, data: scrapedData };

  } catch (error: any) {
    console.error("Error scraping job post:", error);
    throw new functions.https.HttpsError("internal", "An error occurred while trying to fetch job details.", error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});


/**
 * Formats a resume data object into a concise string for a prompt.
 */
const formatResumeForPrompt = (resume: ResumeData): string => {
    let context = `The candidate's job title is ${resume.personalDetails.jobTitle}. `;
    context += `Here is their summary: ${resume.professionalSummary}. `;
    context += `Their key skills are: ${resume.skills.map((s) => s.name).join(", ")}. `;
    if (resume.employmentHistory.length > 0) {
        context += `Their most recent role was ${resume.employmentHistory[0].jobTitle} at ${resume.employmentHistory[0].employer}.`;
    }
    return context;
};

/**
 * A scheduled function that runs daily to send practice interviews to users who opted in.
 * This requires the "Trigger Email" Firebase Extension to be installed and configured
 * to listen to the 'mail' collection.
 *
 * Required Firebase config variables:
 * - gemini.key: Your Gemini API key.
 * - app.url: The base URL of your web application (e.g., https://yourapp.com).
 */
export const scheduledInterviewSender = functions.pubsub.schedule("every 24 hours").onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    const appUrl = functions.config().app.url || 'https://careervivid.ai';

    console.log("Running scheduled interview sender job.");

    const usersSnapshot = await db.collection("users")
        .where("emailPreferences.enabled", "==", true)
        .get();

    if (usersSnapshot.empty) {
        console.log("No users with scheduled interviews enabled.");
        return null;
    }

    const promises = usersSnapshot.docs.map(async (userDoc) => {
        const user = userDoc.data() as UserProfile;
        const prefs = user.emailPreferences as EmailPreferences | undefined;

        if (!prefs || !user.email) {
            return;
        }

        const lastSent = prefs.lastSentAt ? (prefs.lastSentAt as admin.firestore.Timestamp).toDate() : null;
        let shouldSend = false;

        const frequencyMap: { [key in EmailPreferences['frequency']]: number } = {
            'daily': 24,
            'every_3_days': 72,
            'every_5_days': 120,
            'every_week': 168,
            'every_10_days': 240,
            'every_14_days': 336,
        };

        if (!lastSent) {
            shouldSend = true; // Send immediately if never sent before.
        } else {
            const diffHours = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
            const requiredHours = frequencyMap[prefs.frequency];
            if (requiredHours && diffHours >= requiredHours) {
                shouldSend = true;
            }
        }

        if (!shouldSend) {
            return;
        }

        try {
            console.log(`Preparing email for user: ${user.uid}`);
            let interviewPrompt = "";

            if (prefs.topicSource === "manual" && prefs.manualTopic) {
                interviewPrompt = `a mock interview for a ${prefs.manualTopic} role.`;
            } else { // Smart recommendation based on latest resume
                const resumesSnapshot = await db.collection("users").doc(user.uid).collection("resumes").orderBy("updatedAt", "desc").limit(1).get();
                if (!resumesSnapshot.empty) {
                    const latestResume = resumesSnapshot.docs[0].data() as ResumeData;
                    const resumeContext = formatResumeForPrompt(latestResume);
                    interviewPrompt = `a mock interview for a role that matches this resume profile: ${resumeContext}`;
                } else {
                    interviewPrompt = "a general behavioral mock interview."; // Fallback if no resume
                }
            }
            
            // Call Gemini API to get questions
            const fullPrompt = `Generate a list of 5 insightful interview questions for ${interviewPrompt}. Return only the questions as a numbered list.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
            });
            const questionsText = response.text;

            // Create email content
            const emailHtml = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h1 style="font-size: 24px; color: #111827;">Your Practice Interview is Ready!</h1>
                    <p style="color: #4b5563;">Hi there,</p>
                    <p style="color: #4b5563;">Here are some tailored interview questions to help you practice for your next opportunity. Topic: ${prefs.topicSource === 'manual' ? prefs.manualTopic : 'Smart Recommendation'}</p>
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-top: 20px; color: #1f2937; line-height: 1.6;">
                        ${questionsText.replace(/\n/g, '<br/>')}
                    </div>
                    <p style="color: #4b5563; margin-top: 20px;">Ready to practice? Click the link below to start your mock interview in the Interview Studio!</p>
                    <a href="${appUrl}/#/interview-studio" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold;">Start Practicing Now</a>
                    <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">To change your email preferences, visit your profile settings in the CareerVivid app.</p>
                </div>
            `;

            // Add document to 'mail' collection for the Trigger Email extension
            await db.collection("mail").add({
                to: [user.email],
                message: {
                    subject: "Your CareerVivid Practice Interview is Here!",
                    html: emailHtml,
                },
            });

            // Update the lastSentAt timestamp for the user
            await userDoc.ref.update({
                "emailPreferences.lastSentAt": admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`Successfully queued email for user: ${user.uid}`);

        } catch (error) {
            console.error(`Failed to process and send email for user ${user.uid}:`, error);
        }
    });

    await Promise.all(promises);
    console.log("Scheduled interview sender job finished.");
    return null;
});