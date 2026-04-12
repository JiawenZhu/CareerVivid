import * as functions from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * AI Portfolio Editor Cloud Function
 *
 * Accepts the current portfolioData + a free-text user instruction.
 * Returns a partial patch of only the fields that changed, plus a human-readable
 * summary of what was modified.
 *
 * Uses Gemini 2.5 Flash with strict JSON output mode for reliable structured responses.
 */
export const editPortfolio = functions
    .region("us-west1")
    .runWith({
        timeoutSeconds: 120,
        secrets: [geminiApiKey],
        memory: "512MB",
    })
    .https.onCall(async (data, context) => {
        // 1. Auth Check
        if (!context.auth) {
            throw new functions.https.HttpsError(
                "unauthenticated",
                "You must be signed in to use AI Portfolio Editor."
            );
        }

        const { portfolioData, instruction, action = 'edit', resumeData } = data;

        // 2. Init AI Client
        const genAI = new GoogleGenerativeAI(geminiApiKey.value());

        // 3. Route to correct handler
        if (action === 'generate_from_resume') {
            return handleGenerateFromResume(genAI, resumeData, portfolioData);
        }

        // Standard edit path
        if (!portfolioData || !instruction?.trim()) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "Missing portfolioData or instruction."
            );
        }

        // 4. Build a safe, stripped-down context for the AI (exclude internal IDs / timestamps)
        const safeContext = {
            hero: portfolioData.hero,
            about: portfolioData.about,
            timeline: portfolioData.timeline,
            education: portfolioData.education,
            techStack: portfolioData.techStack,
            projects: portfolioData.projects,
            socialLinks: portfolioData.socialLinks,
            contactEmail: portfolioData.contactEmail,
            sectionLabels: portfolioData.sectionLabels,
        };

        const systemPrompt = `
You are an expert portfolio content editor AI. You help users update their personal portfolio websites.
The user will give you their current portfolio data and an instruction describing what they want to change.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences) in this exact format:
{
  "patch": { /* only the top-level fields that changed, matching the portfolioData structure */ },
  "summary": "A short human-readable sentence (max 40 words) describing what you changed.",
  "changedSections": ["hero", "techStack"] /* list of top-level keys you modified */
}

RULES:
- Only include fields in "patch" that actually changed. Do NOT include unchanged fields.
- For array fields (timeline, projects, techStack, education, socialLinks), return the ENTIRE updated array.
- For scalar fields (about, contactEmail), return just the new string value.
- For nested objects (hero), return just the hero object with all its sub-fields.
- If the instruction asks to ADD an item, generate a new entry with a unique id (e.g. "ai_${Date.now()}").
- If the instruction asks to DELETE an entry, return the array without that entry.
- If the instruction is unclear or impossible, return: {"patch": {}, "summary": "I wasn't sure what to change. Please be more specific.", "changedSections": []}
- Maintain the same data types and structure as the original.

PORTFOLIO DATA SCHEMA:
- hero: { headline, subheadline, ctaPrimaryLabel, ctaPrimaryUrl, ctaSecondaryLabel, ctaSecondaryUrl, backgroundImage? }
- about: string (bio/about me paragraph)
- timeline: Array<{ id, jobTitle, employer, city, startDate, endDate, description }>
- education: Array<{ id, degree, school, startDate, endDate, description }>
- techStack: Array<{ id, name, rating? }>
- projects: Array<{ id, title, description, url?, githubUrl?, thumbnailUrl?, techUsed? }>
- socialLinks: Array<{ id, label, url, icon? }>
- contactEmail: string
- sectionLabels: { about, timeline, techStack, projects, contact }
`;

        const userPrompt = `
CURRENT PORTFOLIO DATA:
${JSON.stringify(safeContext, null, 2)}

USER INSTRUCTION:
"${instruction.trim()}"

Remember: Respond ONLY with the JSON object. No markdown, no explanation outside the JSON.
`;

        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.4,
                },
            });

            const result = await model.generateContent([
                { text: systemPrompt },
                { text: userPrompt },
            ]);

            const responseText = result.response.text().trim();
            let parsed: { patch: any; summary: string; changedSections: string[] };

            try {
                parsed = JSON.parse(responseText);
            } catch (parseError) {
                console.error("[editPortfolio] Failed to parse AI response:", responseText);
                throw new functions.https.HttpsError(
                    "internal",
                    "The AI returned an invalid response. Please try again."
                );
            }

            // Validate structure
            if (typeof parsed !== "object" || !parsed.patch || !parsed.summary) {
                throw new functions.https.HttpsError(
                    "internal",
                    "Unexpected AI response format."
                );
            }

            return {
                success: true,
                patch: parsed.patch,
                summary: parsed.summary,
                changedSections: parsed.changedSections || [],
            };
        } catch (error: any) {
            console.error("[editPortfolio] Error:", error);
            if (error instanceof functions.https.HttpsError) throw error;
            throw new functions.https.HttpsError(
                "internal",
                `AI processing failed: ${error.message}`
            );
        }
    });

/**
 * Generate a full PortfolioData patch from a ResumeData object.
 * Maps resume sections (experience, education, skills, projects) →
 * portfolio sections (timeline, techStack, projects, hero, about).
 */
async function handleGenerateFromResume(genAI: GoogleGenerativeAI, resumeData: any, currentPortfolio: any) {
    if (!resumeData) {
        throw new functions.https.HttpsError("invalid-argument", "Missing resumeData for generation.");
    }

    const systemPrompt = `
You are an expert at converting resume data into portfolio website content.
Given a structured resume JSON, produce a rich PortfolioData patch that populates the portfolio with real content.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences) in this exact format:
{
  "patch": {
    "hero": { "headline": "...", "subheadline": "...", "ctaPrimaryLabel": "View Work", "ctaPrimaryUrl": "#projects", "ctaSecondaryLabel": "Contact Me", "ctaSecondaryUrl": "#contact" },
    "about": "A compelling 3-4 sentence first-person bio based on the resume summary and experience.",
    "timeline": [{ "id": "tl_1", "jobTitle": "...", "employer": "...", "city": "...", "startDate": "...", "endDate": "...", "description": "..." }],
    "education": [{ "id": "edu_1", "degree": "...", "school": "...", "startDate": "...", "endDate": "...", "description": "" }],
    "techStack": [{ "id": "ts_1", "name": "React" }, { "id": "ts_2", "name": "TypeScript" }],
    "projects": [{ "id": "proj_1", "title": "...", "description": "...", "techUsed": ["React", "Firebase"], "url": "", "githubUrl": "" }],
    "contactEmail": "email from resume if available",
    "sectionLabels": { "about": "About Me", "timeline": "Experience", "techStack": "Skills", "projects": "Projects", "contact": "Contact" }
  },
  "summary": "Generated portfolio from [Name]'s resume — populated all sections from resume data.",
  "changedSections": ["hero", "about", "timeline", "education", "techStack", "projects", "contactEmail", "sectionLabels"]
}

RULES:
- Use the candidate's ACTUAL name, job title, employers, degrees, and projects from the resume.
- For hero.headline: use the candidate's full name.
- For hero.subheadline: use their most recent job title or personal brand statement.
- For about: write a compelling 3-4 sentence narrative in first person.
- For timeline: map work experience entries. Give each a unique id "tl_N".
- For education: map education entries. Give each a unique id "edu_N".
- For techStack: extract all technical skills as individual items. Give each a unique id "ts_N". Max 20 items.
- For projects: map any projects section. If none, create 1-2 based on work experience highlights. Give each a unique id "proj_N".
- Preserve the existing portfolio theme and contactEmail unless resume provides a better email.
`;

    const userPrompt = `
RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

CURRENT PORTFOLIO (preserve theme/templateId):
${JSON.stringify({ templateId: currentPortfolio?.templateId, theme: currentPortfolio?.theme }, null, 2)}

Respond ONLY with the JSON object.
`;

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.5,
        },
    });

    const result = await model.generateContent([
        { text: systemPrompt },
        { text: userPrompt },
    ]);

    const responseText = result.response.text().trim();
    let parsed: { patch: any; summary: string; changedSections: string[] };

    try {
        parsed = JSON.parse(responseText);
    } catch {
        console.error("[editPortfolio:generate_from_resume] Parse error:", responseText);
        throw new functions.https.HttpsError("internal", "AI returned invalid JSON for portfolio generation.");
    }

    return {
        success: true,
        patch: parsed.patch,
        summary: parsed.summary,
        changedSections: parsed.changedSections || [],
    };
}
