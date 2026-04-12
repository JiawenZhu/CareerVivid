import * as functions from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const tailorResume = functions
    .region("us-west1")
    .runWith({
        timeoutSeconds: 120, // Longer timeout for full rewrite
        secrets: [geminiApiKey],
        memory: "1GB", // Slightly more memory for JSON processing
    })
    .https.onCall(async (data, context) => {
        // 1. Auth Check
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
        }

        const { resume, jobDescription, action = 'tailor', instruction = '' } = data;

        // 2. Validate Inputs
        // jobDescription is optional ONLY for 'condense' action
        if (!resume || (!jobDescription && action !== 'condense')) {
            throw new functions.https.HttpsError("invalid-argument", "Missing 'resume' or 'jobDescription'.");
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey.value());
        const aiModel = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        // Helper to estimate word count
        const countWords = (obj: any): number => {
            const str = JSON.stringify(obj);
            return str.replace(/[{},":\[\]]/g, " ").split(/\s+/).filter(w => w.length > 0).length;
        };

        const originalWordCount = countWords(resume);

        try {
            const resumeJson = JSON.stringify(resume, null, 2);
            let prompt = "";

            if (action === 'analyze') {
                prompt = `
                You are an expert ATS (Application Tracking System) analyzer.
                Compare the RESUME with the JOB DESCRIPTION.
                
                TARGET JOB DESCRIPTION:
                ${jobDescription}

                CURRENT RESUME:
                ${resumeJson}

                OUTPUT JSON FORMAT:
                {
                    "score": number, // 0-100 match score
                    "missingKeywords": string[], // Critical keywords from JD missing in resume
                    "suggestions": string[] // Quick 1-sentence tips
                }
                `;
            } else if (action === 'condense') {
                prompt = `
                You are an expert editor. The user's resume is too long (${originalWordCount} words).
                Your goal is to rewrite the resume content (Summary, Experience, Skills) to fit strictly within a 450-word limit without losing the core professional impact.
                
                RULES:
                1. Merge Bullets: Combine short, related bullet points into single, impactful sentences.
                2. Remove Fluff: Remove generic soft skills or filler words.
                3. Prioritize: Keep recent roles detailed, but summarize older roles (3+ years ago) into 1-2 lines.
                4. Reduce total word count to ~450 words.
                5. Do NOT invent fake experiences.

                CURRENT RESUME:
                ${resumeJson}

                OUTPUT JSON STRUCTURE:
                {
                    "tailoredResume": { ...resume structure ... },
                    "formattingChanges": {
                        "bodyScale": 0.85,
                        "lineHeight": 1.15,
                        "sectionGap": 0.5,
                        "paragraphGap": 0.15,
                        "pageMargin": 1.0
                    }
                }
                Merge the condensed content into "tailoredResume" and return the EXACT same structure as input resume, but with shorter text.
                `;
            } else if (action === 'refine') {
                prompt = `
                You are a resume writing assistant.
                The user wants to REFINE their resume based on specific instructions.

                USER INSTRUCTION: "${instruction}"
                
                JOB DESCRIPTION (Context):
                ${jobDescription}

                CURRENT RESUME:
                ${resumeJson}

                Instructions:
                1. Apply the user's specific feedback to the resume.
                2. Keep the rest of the content structure intact.
                3. Return the FULL updated resume JSON.

                OUTPUT JSON STRUCTURE:
                { "tailoredResume": { ...resume structure ... } }
                `;
            } else {
                // Default 'tailor' — full rewrite with ATS keyword injection (career-ops strategy)
                prompt = `You are an expert resume writer and ATS optimization specialist.
REWRITE the resume to maximize ATS keyword match with the Job Description.

TARGET JOB DESCRIPTION:
${jobDescription}

CURRENT RESUME:
${resumeJson}

=== ATS KEYWORD INJECTION RULES (career-ops strategy) ===
1. Extract the TOP 5 most important keywords/phrases from the JD that are NOT already prominent in the resume.
2. Distribute them deliberately:
   - 2 keywords woven naturally into the Professional Summary sentence
   - 2 keywords added to the first bullet point of the most recent work experience role
   - 1 keyword added to the Skills section (as a new skill item if missing)
3. Rewrite Summary and Experience bullets to highlight JD alignment — use strong action verbs.
4. Do NOT invent fake experiences or fabricate metrics.
5. Return the EXACT SAME JSON structure as the input resume.
6. Also return the list of injected keywords and an ATS coverage % estimate.

OUTPUT JSON STRUCTURE:
{
  "tailoredResume": { ...same structure as input resume... },
  "injectedKeywords": ["keyword1", "keyword2", ...],
  "keywordCoverage": <number 0-100, estimated % of JD keywords now present in resume>
}`;
            }

            if (action === 'ats_inject') {
                // Lightweight ATS keyword injection only (no full rewrite — faster, 1 credit)
                prompt = `You are an ATS optimization expert.
Perform TARGETED keyword injection on the resume to improve ATS match with the Job Description.
Do NOT rewrite the entire resume — only modify these 3 locations:
1. Professional Summary — add 2 missing JD keywords naturally into existing sentences
2. First bullet of the most recent work experience — embed 2 JD keywords via minor rewording
3. Skills section — add 1 missing JD keyword as a new entry

TARGET JOB DESCRIPTION:
${jobDescription}

CURRENT RESUME:
${resumeJson}

Rules:
- Changes must read naturally (not keyword-stuffed)
- Do NOT fabricate metrics or experiences
- Return the EXACT SAME JSON structure as input

OUTPUT JSON STRUCTURE:
{
  "tailoredResume": { ...same structure as input resume... },
  "injectedKeywords": ["keyword1", "keyword2", ...],
  "keywordCoverage": <number 0-100>
}`;
            }


            const result = await aiModel.generateContent(prompt);
            const response = await result.response;
            let generatedText = response.text().replace(/```json/g, "").replace(/```/g, "").trim();

            let parsedResult;
            try {
                parsedResult = JSON.parse(generatedText);

                // Normalization: Ensure we always return a consistent shape to frontend
                // If action is 'analyze', return { success: true, analysis: parsedResult }
                // If action is 'tailor'/'refine'/'condense', return { success: true, tailoredResume: parsedResult.tailoredResume, formattingChanges: parsedResult.formattingChanges }

                if (action === 'analyze') {
                    return { success: true, analysis: parsedResult };
                } else {
                    const resumeData = parsedResult.tailoredResume || parsedResult;

                    // If formatting changes were suggested (condense mode), merge them into the resume
                    if (parsedResult.formattingChanges) {
                        resumeData.formattingSettings = {
                            ...resumeData.formattingSettings,
                            ...parsedResult.formattingChanges
                        };
                    }

                    const newWordCount = countWords(resumeData);

                    return {
                        success: true,
                        tailoredResume: resumeData,
                        originalWordCount,
                        newWordCount,
                        // ATS keyword injection metadata (tailor + ats_inject actions)
                        injectedKeywords: parsedResult.injectedKeywords || [],
                        keywordCoverage: parsedResult.keywordCoverage || null,
                    };
                }


            } catch (e) {
                console.error("AI Response Parse Error", generatedText);
                throw new functions.https.HttpsError("internal", "AI produced invalid JSON.");
            }

        } catch (error: any) {
            console.error("Resume Tailoring Error:", error);
            if (error instanceof functions.https.HttpsError) throw error;
            throw new functions.https.HttpsError("internal", error.message || "Failed to process request");
        }
    });
