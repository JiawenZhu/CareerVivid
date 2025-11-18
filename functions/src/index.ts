import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import * as puppeteer from "puppeteer";
import { ResumeData, InterviewAnalysis, UserProfile, EmailPreferences } from "../../types";
import { GoogleGenAI } from "@google/genai";


admin.initializeApp();
const storage = admin.storage();

// =================================================================================
// IMPORTANT: SECURELY CONFIGURE YOUR STRIPE & GEMINI KEYS
// Use Firebase CLI:
// firebase functions:config:set stripe.secret_key="sk_..."
// firebase functions:config:set stripe.webhook_secret="whsec_..."
// firebase functions:config:set gemini.key="AIza..."
// firebase functions:config:set app.url="https://your-app-url.com"
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

const getResumeHtml = (resume: ResumeData, templateId: string): string => {
    // This is a simplified server-side re-implementation of the React templates.
    // It's not exhaustive but covers the structure and makes the PDF text-based.
    const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;
    const { themeColor, titleFont, bodyFont } = resume;

    let body = '';
    let styles = `
        body { font-family: '${bodyFont}', sans-serif; margin: 0; padding: 0; background: white; color: #1f2937; font-size: 10pt; line-height: 1.5; }
        .page { width: 210mm; height: 297mm; padding: 1in; box-sizing: border-box; }
        h1, h2, h3, h4 { font-family: '${titleFont}', sans-serif; }
        a { color: inherit; text-decoration: none; }
    `;

    // A few template implementations
    if (templateId === 'Modern') {
        styles += `
            .header { text-align: left; margin-bottom: 2rem; }
            .header h1 { font-size: 3rem; font-weight: bold; color: #111827; margin: 0; }
            .header h2 { font-size: 1.5rem; font-weight: 300; color: ${themeColor}; margin: 0.25rem 0; }
            .header .contact-info { margin-top: 1rem; font-size: 0.9rem; color: #4b5563; }
            section h3 { font-size: 0.9rem; font-weight: bold; text-transform: uppercase; color: #6b7280; letter-spacing: 0.1em; margin-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25rem; }
            .job, .edu { margin-bottom: 1.25rem; }
            .job-title { font-size: 1.1rem; font-weight: bold; }
            .job-meta { font-size: 0.9rem; font-style: italic; color: #4b5563; margin-bottom: 0.25rem; }
            .job-desc { white-space: pre-wrap; font-size: 0.9rem; }
        `;
        body = `
            <div class="header">
                <h1>${personalDetails.firstName} ${personalDetails.lastName}</h1>
                <h2>${personalDetails.jobTitle}</h2>
                <div class="contact-info">
                    ${personalDetails.email} &bull; ${personalDetails.phone} &bull; ${personalDetails.city}, ${personalDetails.country}
                </div>
            </div>
            <section>
                <h3>Profile</h3>
                <p>${professionalSummary}</p>
            </section>
            <section>
                <h3>Experience</h3>
                ${employmentHistory.map(job => `
                    <div class="job">
                        <p class="job-title">${job.jobTitle}</p>
                        <p class="job-meta">${job.employer}, ${job.city} (${job.startDate} - ${job.endDate})</p>
                        <div class="job-desc">${job.description}</div>
                    </div>
                `).join('')}
            </section>
             <section>
                <h3>Education</h3>
                ${education.map(edu => `
                    <div class="edu">
                        <p class="job-title">${edu.degree}</p>
                        <p class="job-meta">${edu.school}, ${edu.city} (${edu.startDate} - ${edu.endDate})</p>
                    </div>
                `).join('')}
            </section>
             <section>
                <h3>Skills</h3>
                <p>${skills.map(s => s.name).join(', ')}</p>
            </section>
        `;
    } else { // Fallback/Default Template (similar to Professional)
         styles += `
            h1 { font-size: 2.5rem; }
            .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
            section h3 { font-size: 1.2rem; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-bottom: 0.75rem; }
            .job-title { font-weight: bold; }
         `;
         body = `
            <h1>${personalDetails.firstName} ${personalDetails.lastName}</h1>
            <h2 style="color: ${themeColor};">${personalDetails.jobTitle}</h2>
            <div class="grid">
                <main>
                    <section>
                        <h3>PROFESSIONAL SUMMARY</h3>
                        <p>${professionalSummary}</p>
                    </section>
                    <section>
                        <h3>WORK EXPERIENCE</h3>
                        ${employmentHistory.map(job => `
                            <div>
                                <p class="job-title">${job.jobTitle}</p>
                                <p>${job.employer} (${job.startDate} - ${job.endDate})</p>
                                <div style="white-space: pre-wrap;">${job.description}</div>
                            </div>
                        `).join('')}
                    </section>
                </main>
                <aside>
                    <section>
                        <h3>CONTACT</h3>
                        <p>${personalDetails.email}</p>
                        <p>${personalDetails.phone}</p>
                        <p>${personalDetails.address}</p>
                    </section>
                    <section>
                        <h3>SKILLS</h3>
                        <ul>${skills.map(s => `<li>${s.name}</li>`).join('')}</ul>
                    </section>
                     <section>
                        <h3>EDUCATION</h3>
                        ${education.map(edu => `
                            <div>
                                <p class="job-title">${edu.degree}</p>
                                <p>${edu.school}</p>
                            </div>
                        `).join('')}
                    </section>
                </aside>
            </div>
         `;
    }


    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=${titleFont.replace(/ /g, '+')}:wght@400;700&family=${bodyFont.replace(/ /g, '+')}:wght@400;700&display=swap" rel="stylesheet">
        <style>${styles}</style>
    </head>
    <body><div class="page">${body}</div></body>
    </html>`;
};


export const generateResumePdf = functions.runWith({ timeoutSeconds: 120, memory: "1GB" }).https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }

    const { resumeData, templateId } = data;
    if (!resumeData || !templateId) {
      throw new functions.https.HttpsError("invalid-argument", "Missing resume data or template ID.");
    }

    const htmlContent = getResumeHtml(resumeData, templateId);

    try {
        const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
        const page = await browser.newPage();
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // Emulate screen media type for better font rendering
        await page.emulateMediaType('screen');
        
        const pdfBuffer = await page.pdf({ 
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
        });

        await browser.close();

        const bucket = storage.bucket();
        const filePath = `temp_reports/${context.auth.uid}/resume_${resumeData.id}.pdf`;
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
        console.error("Puppeteer PDF generation error for resume:", error);
        throw new functions.https.HttpsError("internal", "Failed to generate resume PDF.", error.message);
    }
  }
);
// Other functions would go here (Stripe, etc.)