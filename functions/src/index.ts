import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import cors from "cors";
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from "buffer";
import { ResumeData } from "./types";

const corsHandler = cors({ origin: true });

admin.initializeApp();

// HTML Generation Logic
const getResumeHtml = (resume: ResumeData, templateId: string): string => {
    const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;
    const { themeColor, titleFont, bodyFont } = resume;

    let body = '';
    let styles = `
        body { font-family: '${bodyFont}', sans-serif; margin: 0; padding: 0; background: white; color: #1f2937; font-size: 10pt; line-height: 1.5; }
        .page { width: 210mm; min-height: 296mm; padding: 15mm; box-sizing: border-box; position: relative; overflow: hidden; }
        h1, h2, h3, h4 { font-family: '${titleFont}', sans-serif; }
        a { color: inherit; text-decoration: none; }
        @page { margin: 0; size: A4; }
    `;

    if (templateId === 'Modern') {
        styles += `
            .header { text-align: left; margin-bottom: 2rem; border-bottom: 2px solid ${themeColor}; padding-bottom: 1rem; }
            .header h1 { font-size: 2.5rem; font-weight: 800; color: #111827; margin: 0; line-height: 1.2; }
            .header h2 { font-size: 1.25rem; font-weight: 400; color: ${themeColor}; margin: 0.25rem 0; }
            .header .contact-info { margin-top: 0.5rem; font-size: 0.85rem; color: #4b5563; display: flex; flex-wrap: wrap; gap: 0.75rem; }
            section { margin-bottom: 1.5rem; }
            section h3 { font-size: 0.9rem; font-weight: 700; text-transform: uppercase; color: #374151; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
            .job, .edu { margin-bottom: 1rem; }
            .job-header { display: flex; justify-content: space-between; align-items: baseline; }
            .job-title { font-size: 1rem; font-weight: 700; color: #1f2937; }
            .job-date { font-size: 0.85rem; font-weight: 500; color: #6b7280; }
            .job-company { font-size: 0.9rem; font-style: italic; color: #4b5563; margin-bottom: 0.25rem; }
            .job-desc { white-space: pre-wrap; font-size: 0.9rem; color: #374151; }
            .skills-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
            .skill-tag { background: #f3f4f6; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; color: #374151; }
        `;
        body = `
            <div class="header">
                <h1>${personalDetails.firstName} ${personalDetails.lastName}</h1>
                <h2>${personalDetails.jobTitle}</h2>
                <div class="contact-info">
                    ${personalDetails.email ? `<span>${personalDetails.email}</span>` : ''}
                    ${personalDetails.phone ? `<span>• ${personalDetails.phone}</span>` : ''}
                    ${personalDetails.city ? `<span>• ${personalDetails.city}, ${personalDetails.country}</span>` : ''}
                    ${websites.map(w => `<span>• <a href="${w.url}">${w.label}</a></span>`).join('')}
                </div>
            </div>
            ${professionalSummary ? `
            <section>
                <h3>Profile</h3>
                <p>${professionalSummary}</p>
            </section>` : ''}
            <section>
                <h3>Experience</h3>
                ${employmentHistory.map(job => `
                    <div class="job">
                        <div class="job-header">
                            <div class="job-title">${job.jobTitle}</div>
                            <div class="job-date">${job.startDate} - ${job.endDate}</div>
                        </div>
                        <div class="job-company">${job.employer}${job.city ? `, ${job.city}` : ''}</div>
                        <div class="job-desc">${job.description}</div>
                    </div>
                `).join('')}
            </section>
             <section>
                <h3>Education</h3>
                ${education.map(edu => `
                    <div class="edu">
                        <div class="job-header">
                            <div class="job-title">${edu.degree}</div>
                            <div class="job-date">${edu.startDate} - ${edu.endDate}</div>
                        </div>
                        <div class="job-company">${edu.school}${edu.city ? `, ${edu.city}` : ''}</div>
                        ${edu.description ? `<div class="job-desc">${edu.description}</div>` : ''}
                    </div>
                `).join('')}
            </section>
             <section>
                <h3>Skills</h3>
                <div class="skills-list">
                    ${skills.map(s => `<span class="skill-tag">${s.name}</span>`).join('')}
                </div>
            </section>
        `;
    } else {
         styles += `
            h1 { font-size: 2.5rem; margin-bottom: 0.2rem;}
            .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
            section h3 { font-size: 1.2rem; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-bottom: 0.75rem; color: ${themeColor}; }
            .job-title { font-weight: bold; }
         `;
         body = `
            <h1>${personalDetails.firstName} ${personalDetails.lastName}</h1>
            <h2 style="color: ${themeColor}; margin-top: 0;">${personalDetails.jobTitle}</h2>
            <div class="grid">
                <main>
                    <section>
                        <h3>SUMMARY</h3>
                        <p>${professionalSummary}</p>
                    </section>
                    <section>
                        <h3>EXPERIENCE</h3>
                        ${employmentHistory.map(job => `
                            <div style="margin-bottom: 1rem;">
                                <p class="job-title">${job.jobTitle}</p>
                                <p><strong>${job.employer}</strong> | ${job.startDate} - ${job.endDate}</p>
                                <div style="white-space: pre-wrap; font-size: 0.9rem;">${job.description}</div>
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
                            <div style="margin-bottom: 0.5rem;">
                                <p class="job-title">${edu.degree}</p>
                                <p>${edu.school}</p>
                                <p style="font-size: 0.8rem; color: #666;">${edu.startDate} - ${edu.endDate}</p>
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
        <link href="https://fonts.googleapis.com/css2?family=${titleFont.replace(/ /g, '+')}:wght@400;700&family=${bodyFont.replace(/ /g, '+')}:wght@400;700&display=swap" rel="stylesheet">
        <style>${styles}</style>
    </head>
    <body><div class="page">${body}</div></body>
    </html>`;
};

const generatePdfBuffer = async (resumeData: ResumeData, templateId: string) => {
    console.log("Generating HTML for PDF...");
    const htmlContent = getResumeHtml(resumeData, templateId);

    console.log("Launching Puppeteer (Chromium)...");
    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    
    // Set content and wait for network idle to ensure fonts load
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');
    
    console.log("Creating PDF buffer...");
    const pdfBuffer = await page.pdf({ 
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    await browser.close();
    console.log("PDF Generation complete. Buffer size:", pdfBuffer.length);
    return pdfBuffer;
};

// HTTP Function - Streaming Mode (No Storage Write)
export const generateResumePdfHttp = functions.runWith({ timeoutSeconds: 120, memory: "2GB" }).https.onRequest(
    async (req, res) => {
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
                
                // DIRECT STREAM - NO STORAGE
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="resume_${resumeData.id}.pdf"`);
                res.setHeader('Content-Length', pdfBuffer.length);
                
                console.log("Success! Streaming PDF response.");
                res.send(pdfBuffer);
        
            } catch (error: any) {
                console.error("PDF Generation Error:", error);
                if (!res.headersSent) {
                    res.status(500).json({ error: "Failed to generate PDF", details: error.message });
                }
            }
        });
    }
);

// HTTP Function - Upload Image Proxy (Bypasses CORS)
export const uploadImageHttp = functions.runWith({ timeoutSeconds: 60, memory: "512MB" }).https.onRequest(
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

                // Construct the download URL that matches what the client SDK returns.
                // Note: We need the bucket name. Admin SDK defaults to the default bucket if not specified,
                // but it's safer to get it from the bucket object.
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
