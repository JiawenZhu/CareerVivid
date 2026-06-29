import * as admin from "firebase-admin";
import { randomUUID } from "crypto";
import { FieldValue } from "firebase-admin/firestore";

import { getAIClient } from "./utils/ai";

interface CreateResumeFromBaseContentInput {
    uid: string;
    title: string;
    baseContent: string;
    creationSource?: "cli" | "voice" | "web" | "mobile" | "coach";
    model?: string;
}

interface CreateResumeFromBaseContentResult {
    resumeId: string;
}

function getDb(): admin.firestore.Firestore {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    return admin.firestore();
}

function stripJsonFence(value: string): string {
    return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

function ensureArrayItemIds(resumeData: Record<string, unknown>) {
    const listFields = ["websites", "skills", "languages", "employmentHistory", "education"];
    for (const field of listFields) {
        const value = resumeData[field];
        if (!Array.isArray(value)) {
            resumeData[field] = [];
            continue;
        }
        for (const item of value) {
            if (item && typeof item === "object") {
                const record = item as Record<string, unknown>;
                if (typeof record.id !== "string" || !record.id.trim()) {
                    record.id = randomUUID();
                }
            }
        }
    }
}

export async function buildStructuredResumeFromText(
    title: string,
    baseContent: string,
    model = "gemini-2.5-flash"
): Promise<Record<string, unknown>> {
    const prompt = `You are CareerVivid's professional resume generation engine.
Convert the following free-form description, imported resume text, or live resume coach conversation into a structured JSON resume object that matches the CareerVivid web resume schema.

If the input is a resume coach conversation, treat Coach lines as extraction prompts
and User lines as source answers. Do not copy the coach questions into the resume.
Use each answer to infer the right resume section:
- contact and target role -> personalDetails and title
- work history and responsibilities -> employmentHistory
- achievements and metrics -> employmentHistory descriptions and professionalSummary
- projects and links -> websites and relevant descriptions
- education, certifications, languages, awards -> education, languages, skills, or descriptions
- target roles and emphasis -> professionalSummary, skills order, and wording

The transcript may contain speech-to-text mistakes. Correct obvious ASR and spelling errors before writing the resume:
- "battery in computer science" likely means "bachelor's degree in computer science"
- school, company, and product names may be approximate; normalize only when the intended name is clear
- fix filler words, repeated fragments, and partial phrases
- keep real technical terms, product names, company names, and metrics when present
- do not invent specific emails, phone numbers, URLs, employers, schools, dates, or metrics that the user did not provide

When the transcript is short, still create a useful starter resume from the available
answers instead of rejecting it. Leave unknown fields empty rather than inventing
specific employers, dates, schools, emails, phone numbers, or URLs.

Write concise, achievement-oriented resume content. Use markdown bullet lists in employmentHistory.description when there is enough detail. The resulting content should be the same source of truth for the CareerVivid web resume and the iOS resume editor; iOS will map this web schema into a native mobile editing format.

INPUT:
${baseContent}

OUTPUT MUST BE VALID JSON ONLY with this exact structure:
{
  "title": ${JSON.stringify(title)},
  "templateId": "Modern",
  "personalDetails": {
    "jobTitle": "",
    "photo": "",
    "firstName": "",
    "lastName": "",
    "email": "",
    "phone": "",
    "address": "",
    "city": "",
    "postalCode": "",
    "country": ""
  },
  "professionalSummary": "Professional summary here...",
  "websites": [{"label": "LinkedIn", "url": "", "showUrl": true, "platform": "linkedin"}],
  "skills": [{"name": "Skill 1", "level": "Intermediate"}],
  "employmentHistory": [
    {
      "jobTitle": "",
      "employer": "",
      "city": "",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "description": "Use bullet points with metrics when possible."
    }
  ],
  "education": [
    {
      "degree": "",
      "school": "",
      "city": "",
      "startDate": "",
      "endDate": "YYYY",
      "description": ""
    }
  ],
  "languages": [],
  "themeColor": "#625bd5",
  "titleFont": "Montserrat",
  "bodyFont": "Crimson Text",
  "language": "English",
  "section": "resumes"
}`;

    const ai = getAIClient();
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            temperature: 0.2,
        },
    });
    const cleaned = stripJsonFence(response.text || "");
    return JSON.parse(cleaned) as Record<string, unknown>;
}

export async function createResumeFromBaseContent(input: CreateResumeFromBaseContentInput): Promise<CreateResumeFromBaseContentResult> {
    const resumeData = await buildStructuredResumeFromText(input.title, input.baseContent, input.model);
    ensureArrayItemIds(resumeData);

    resumeData.updatedAt = FieldValue.serverTimestamp();
    resumeData.createdAt = FieldValue.serverTimestamp();
    resumeData.creationSource = input.creationSource || "cli";
    if (!resumeData.title) {
        resumeData.title = input.title;
    }

    const ref = await getDb().collection("users").doc(input.uid).collection("resumes").add(resumeData);
    return { resumeId: ref.id };
}
