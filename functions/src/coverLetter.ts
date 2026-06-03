import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { getAIClient } from "./utils/ai";

export const generateCoverLetter = functions
    .region("us-west1")
    .runWith({
        timeoutSeconds: 60,
        memory: "512MB",
    })
    .https.onCall(async (data, context) => {
        // 1. Auth Check (Built-in)
        if (!context.auth) {
            throw new functions.https.HttpsError(
                "unauthenticated",
                "The function must be called while authenticated."
            );
        }

        const userId = context.auth.uid;
        const { resumeId, jobDescription, jobTitle = 'Untitled Position', companyName = 'Unknown Company' } = data;

        // 2. Validate Inputs
        if (!resumeId || !jobDescription) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "The function must be called with 'resumeId' and 'jobDescription'."
            );
        }

        try {
            // 3. Fetch Data
            const resumeDoc = await admin
                .firestore()
                .collection("users")
                .doc(userId)
                .collection("resumes")
                .doc(resumeId)
                .get();

            if (!resumeDoc.exists) {
                throw new functions.https.HttpsError("not-found", "Resume not found");
            }

            const resumeData = resumeDoc.data();
            const contact = resumeData?.personalDetails;
            const work = resumeData?.employmentHistory || [];
            const skills = resumeData?.skills || [];

            // Extract contact details with fallbacks
            const fullName = `${contact?.firstName || ''} ${contact?.lastName || ''}`.trim() || '[Your Name]';
            const email = contact?.email || '[Your Email Address]';
            const phone = contact?.phone || '[Your Phone Number]';
            const location = contact?.city ? `${contact.city}${contact.state ? ', ' + contact.state : ''}` : '[Your City, State]';
            const currentDate = formatCoverLetterDate();

            // Find LinkedIn from the resume websites array. Do not invent a placeholder if absent.
            const websites = resumeData?.websites || [];
            const linkedInLink = websites.find((link: any) =>
                String(link.label || "").toLowerCase().includes("linkedin") ||
                String(link.platform || "").toLowerCase().includes("linkedin") ||
                String(link.url || "").toLowerCase().includes("linkedin")
            );
            const linkedIn = normalizeUrl(linkedInLink?.url);
            const linkedInPromptLine = linkedIn ? `          - LinkedIn: ${linkedIn}` : "";
            const linkedInHeaderLine = linkedIn ? `             ${linkedIn}` : "";

            // 4. Construct Prompt
            const prompt = `
          You are an expert career coach and professional resume writer.
          Write a compelling, professional cover letter for ${fullName}.
          
          THE JOB:
          Role: ${jobTitle}
          Company: ${companyName}
          Description: ${jobDescription.substring(0, 3000)}

          THE CANDIDATE'S CONTACT INFO (use these EXACT values in the letter header):
          - Full Name: ${fullName}
          - Location: ${location}
          - Phone: ${phone}
          - Email: ${email}
${linkedInPromptLine}
          - Date: ${currentDate}

          THE CANDIDATE'S PROFILE:
          - Current Role: ${contact?.jobTitle || 'Professional'}
          - Key Skills: ${skills.map((s: any) => s.name).join(", ")}
          - Experience Highlights: ${work.map((w: any) => `${w.jobTitle} at ${w.employer}`).join("; ")}
          - Summary: ${resumeData?.professionalSummary}

          INSTRUCTIONS:
          1. Use a professional, confident tone.
          2. Tailor strictly to the "${jobTitle}" role at "${companyName}".
          3. Highlight relevant skills and experience that match the job description.
          4. Address the letter to "Hiring Manager" at ${companyName} if no name is provided.
          5. Format nicely with paragraphs.
          6. CRITICAL: Use the candidate's REAL contact info from above. Format the header like:
             ${fullName}
             ${location}
             ${phone} | ${email}
${linkedInHeaderLine}
             ${currentDate}
          7. Keep it under 400 words.
          8. If LinkedIn is absent above, skip the LinkedIn line entirely. Never output "[Your LinkedIn Profile URL]".
          9. CRITICAL: Use "${currentDate}" for the date. Never output "[Current Date]".
          10. CRITICAL: Do NOT invent fake experiences, companies, or dates. Only rephrase and highlight ACTUAL facts from the Current Resume.
        `;

            // 5. Call Gemini
            const ai = getAIClient();
            const result = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });
            const generatedText = normalizeCoverLetterContent(result.text || "", {
                currentDate,
                linkedIn,
            });

            // 6. Save to Firestore
            const coverLetterRef = admin
                .firestore()
                .collection("users")
                .doc(userId)
                .collection("coverLetters")
                .doc();

            const coverLetter = {
                id: coverLetterRef.id,
                userId,
                resumeId,
                jobTitle,
                companyName,
                jobDescription,
                content: generatedText,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            await coverLetterRef.set(coverLetter);

            // 7. Return Result
            return { success: true, coverLetter };

        } catch (error: any) {
            console.error("Cover Letter Generation Error:", error);
            // Re-throw valid HttpsErrors, wrap others
            if (error instanceof functions.https.HttpsError) {
                throw error;
            }
            throw new functions.https.HttpsError("internal", error.message || "Failed to generate cover letter");
        }
    });

function formatCoverLetterDate(): string {
    return new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Chicago",
        month: "numeric",
        day: "numeric",
        year: "numeric",
    }).format(new Date());
}

function normalizeUrl(url?: string): string {
    const value = String(url || "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    return `https://${value}`;
}

function normalizeCoverLetterContent(content: string, options: { currentDate: string; linkedIn: string }): string {
    let output = content.replace(/\[Current Date\]/gi, options.currentDate);

    if (options.linkedIn) {
        output = output.replace(/\[Your LinkedIn Profile URL\]/gi, options.linkedIn);
    } else {
        output = output
            .split("\n")
            .filter(line => !/\[Your LinkedIn Profile URL\]/i.test(line))
            .join("\n");
    }

    return output.replace(/\n{3,}/g, "\n\n").trim();
}
