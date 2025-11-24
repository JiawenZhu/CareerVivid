import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { ResumeData, TranscriptEntry, InterviewAnalysis, JobApplicationData, ResumeMatchAnalysis } from '../types';
import { trackUsage } from './trackingService';
import { reportError } from './errorService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const resumeSchema = {
    type: Type.OBJECT,
    properties: {
        personalDetails: {
            type: Type.OBJECT,
            description: "The user's personal contact information.",
            properties: {
                jobTitle: { type: Type.STRING, description: "The user's desired job title. Return an empty string if not found." },
                firstName: { type: Type.STRING, description: "The user's first name. Return an empty string if not found." },
                lastName: { type: Type.STRING, description: "The user's last name. Return an empty string if not found." },
                email: { type: Type.STRING, description: "The user's email address. Return an empty string if not found." },
                phone: { type: Type.STRING, description: "The user's phone number. Return an empty string if not found." },
                address: { type: Type.STRING, description: "The user's full street address (e.g., '123 Cloud Lane'). Return an empty string if not found." },
                city: { type: Type.STRING, description: "The user's city. Return an empty string if not found." },
                postalCode: { type: Type.STRING, description: "The user's postal or zip code. Return an empty string if not found." },
                country: { type: Type.STRING, description: "The user's country. Return an empty string if not found." },
            },
            required: ['jobTitle', 'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode', 'country']
        },
        professionalSummary: {
            type: Type.STRING,
            description: "A 3-5 sentence professional summary. Return an empty string if not found."
        },
        websites: {
            type: Type.ARRAY,
            description: "A list of websites or social links. Return an empty array if none are found.",
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING, description: "The name of the website (e.g., LinkedIn, GitHub)." },
                    url: { type: Type.STRING, description: "The full URL." },
                },
                required: ['label', 'url']
            },
        },
        skills: {
            type: Type.ARRAY,
            description: "A list of skills. Return an empty array if none are found.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the skill." },
                    level: { type: Type.STRING, description: "The user's proficiency level (e.g., Expert, Advanced, Intermediate). If not specified, infer a reasonable level like 'Advanced'." },
                },
                required: ['name', 'level']
            },
        },
        languages: {
            type: Type.ARRAY,
            description: "A list of languages spoken by the user. Return an empty array if none are found.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the language (e.g., English, Spanish)." },
                    level: { type: Type.STRING, description: "The user's proficiency level (e.g., Native, Fluent). If not specified, infer a reasonable level like 'Proficient'." },
                },
                required: ['name', 'level']
            },
        },
        employmentHistory: {
            type: Type.ARRAY,
            description: "A list of past employment positions. Return an empty array if none are found.",
            items: {
                type: Type.OBJECT,
                properties: {
                    jobTitle: { type: Type.STRING },
                    employer: { type: Type.STRING },
                    city: { type: Type.STRING, description: "The city where the job was located. Return an empty string if not found." },
                    startDate: { type: Type.STRING, description: "e.g., 'Jan 2020' or '2020'" },
                    endDate: { type: Type.STRING, description: "e.g., 'Present' or 'Dec 2022'" },
                    description: { type: Type.STRING, description: "A few bullet points (use markdown for lists) or a short paragraph describing responsibilities and achievements." },
                },
                required: ['jobTitle', 'employer', 'city', 'startDate', 'endDate', 'description']
            },
        },
        education: {
            type: Type.ARRAY,
            description: "A list of educational qualifications. Return an empty array if none are found.",
            items: {
                type: Type.OBJECT,
                properties: {
                    school: { type: Type.STRING },
                    degree: { type: Type.STRING },
                    city: { type: Type.STRING, description: "The city where the school was located. Return an empty string if not found." },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    description: { type: Type.STRING, description: "Optional details about the degree or coursework. Return an empty string if not found." },
                },
                required: ['school', 'degree', 'city', 'startDate', 'endDate', 'description']
            },
        },
    },
    required: [
        'personalDetails',
        'professionalSummary',
        'websites',
        'skills',
        'languages',
        'employmentHistory',
        'education',
    ],
};

export const parseResume = async (userId: string, resumeText: string, language: string): Promise<Partial<ResumeData>> => {
    try {
        let response: GenerateContentResponse;
        const contents = `The following resume is in ${language}. Parse it and extract all available information into a structured JSON format that strictly conforms to the provided schema. If a section (like 'languages') is not present in the text, return an empty array for it. If a simple field (like 'phone') is not present, return an empty string for it. Here is the resume text:\n\n---\n\n${resumeText}`;
        const config = {
            responseMimeType: "application/json",
            responseSchema: resumeSchema
        };

        try {
            response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents, config });
        } catch (error) {
            console.warn("gemini-3-pro-preview failed for resume parsing, falling back to gemini-2.5-flash.", error);
            response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents, config });
        }

        const tokenUsage = response.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'resume_parse_text', { tokenUsage });

        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);
        
        // Add IDs to array items
        if (parsedData.websites) parsedData.websites.forEach((item: any) => item.id = crypto.randomUUID());
        if (parsedData.skills) parsedData.skills.forEach((item: any) => item.id = crypto.randomUUID());
        if (parsedData.languages) parsedData.languages.forEach((item: any) => item.id = crypto.randomUUID());
        if (parsedData.employmentHistory) parsedData.employmentHistory.forEach((item: any) => item.id = crypto.randomUUID());
        if (parsedData.education) parsedData.education.forEach((item: any) => item.id = crypto.randomUUID());

        return parsedData;

    } catch (error) {
        console.error("Error parsing resume with AI:", error);
        reportError(error as Error, { functionName: 'parseResume' });
        throw new Error("Failed to parse resume with AI. Please check the format or try again.");
    }
};

export const parseResumeFromFile = async (userId: string, fileData: string, mimeType: string, language: string): Promise<Partial<ResumeData>> => {
    const base64Data = fileData.split(',')[1];
    try {
        let response: GenerateContentResponse;
        const contents = { 
            parts: [
                { text: `The following resume document is in ${language}. Parse it and extract all available information into a structured JSON format that strictly conforms to the provided schema. If a section (like 'languages') is not present in the document, return an empty array for it. If a simple field (like 'phone') is not present, return an empty string for it.` },
                { inlineData: { mimeType, data: base64Data } }
            ]
        };
        const config = {
            responseMimeType: "application/json",
            responseSchema: resumeSchema
        };

        try {
            response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents, config });
        } catch (error) {
            console.warn("gemini-3-pro-preview failed for file parsing, falling back to gemini-2.5-flash.", error);
            response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents, config });
        }

        const tokenUsage = response.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'resume_parse_file', { tokenUsage });

        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);
        
        // Add IDs to array items
        if (parsedData.websites) parsedData.websites.forEach((item: any) => item.id = crypto.randomUUID());
        if (parsedData.skills) parsedData.skills.forEach((item: any) => item.id = crypto.randomUUID());
        if (parsedData.languages) parsedData.languages.forEach((item: any) => item.id = crypto.randomUUID());
        if (parsedData.employmentHistory) parsedData.employmentHistory.forEach((item: any) => item.id = crypto.randomUUID());
        if (parsedData.education) parsedData.education.forEach((item: any) => item.id = crypto.randomUUID());

        return parsedData;

    } catch (error) {
        console.error("Error parsing resume from file:", error);
        reportError(error as Error, { functionName: 'parseResumeFromFile' });
        throw new Error("Failed to parse resume from file with AI. Please check the file format or try again.");
    }
};


export const improveSection = async (
    userId: string, 
    sectionName: string, 
    currentText: string, 
    instruction: string, 
    language: string,
    contextType: string = 'resume'
): Promise<string> => {
    try {
        let prompt;
        
        if (contextType === 'blog post') {
            prompt = `Role: You are an expert career coach and professional content writer for a high-quality career blog.
Task: Rewrite and improve the following "${sectionName}" section.

Instructions:
1. Tone: Professional, authoritative, inspiring, and actionable. Avoid generic fluff.
2. Structure: Use Markdown formatting. Use ## for main section headers and ### for subsections. Use bullet points for readability.
3. Emphasis: Use **bolding** for key concepts.
4. Links: If the user asks to include links or if you reference external tools/resources, format them as clickable Markdown links: [Link Text](URL).
5. User Instruction: "${instruction}"
6. Language: ${language}

Current Content:
---
${currentText}
---

Return only the improved content text.`;
        } else {
            prompt = `Rewrite the following "${sectionName}" section for a ${contextType} in ${language}. Follow the user's instruction. Return only the improved text, without any additional formatting or explanation.\n\nInstruction: "${instruction}"\n\nCurrent Text:\n---\n${currentText}`;
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        const tokenUsage = response.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'resume_suggestion', { tokenUsage });

        return response.text.trim();
    } catch (error) {
        console.error("Error improving section:", error);
        reportError(error as Error, { functionName: 'improveSection' });
        throw new Error("Failed to improve section with AI.");
    }
};

export const editProfilePhoto = async (userId: string, base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const imagePart = {
            inlineData: {
                mimeType: mimeType,
                data: base64Image,
            },
        };
        const textPart = {
            text: prompt,
        };

        // FIX: Removed unsupported `responseModalities` config for image generation.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [imagePart, textPart],
            },
        });
        
        const tokenUsage = response.usageMetadata?.totalTokenCount || 1000;
        await trackUsage(userId, 'image_generation', { tokenUsage });


        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes = part.inlineData.data;
                const outputMimeType = part.inlineData.mimeType || 'image/png';
                return `data:${outputMimeType};base64,${base64ImageBytes}`;
            }
        }

        throw new Error("AI did not return an image.");

    } catch (error) {
        console.error("Error editing photo:", error);
        reportError(error as Error, { functionName: 'editProfilePhoto' });
        throw new Error("Failed to edit photo with AI.");
    }
};

export const generateResumeFromPrompt = async (userId: string, prompt: string): Promise<Partial<ResumeData>> => {
    try {
        const fullPrompt = `Generate a complete, professional resume based on the following description: "${prompt}". The resume should be tailored for this role and must include a professional summary, a list of 8-10 relevant technical and soft skills, 2-3 detailed example employment history entries with 3-4 achievement-oriented bullet points each, and a relevant education entry. Use realistic but placeholder personal details (e.g., John Doe, anytown, etc.). Respond with a structured JSON object that strictly conforms to the provided schema. Ensure all required fields are populated.`;
        
        const generationSchema = {
            ...resumeSchema,
            required: [
                'personalDetails',
                'professionalSummary',
                'skills',
                'employmentHistory',
                'education'
            ]
        };

        const config = {
            responseMimeType: "application/json",
            responseSchema: generationSchema
        };

        let response: GenerateContentResponse;
        try {
             response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: fullPrompt, config });
        } catch (error) {
            console.warn("gemini-3-pro-preview failed for resume generation, falling back to gemini-2.5-flash.", error);
            response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: fullPrompt, config });
        }

        const tokenUsage = response.usageMetadata?.totalTokenCount || 0;
        // Only track usage for logged-in users, not guests on the demo page.
        if (!userId.startsWith('guest_')) {
            await trackUsage(userId, 'resume_generate_prompt', { tokenUsage });
        }

        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);
        
        if (parsedData.websites) parsedData.websites.forEach((item: any) => item.id = crypto.randomUUID());
        if (parsedData.skills) parsedData.skills.forEach((item: any) => item.id = crypto.randomUUID());
        if (parsedData.languages) parsedData.languages.forEach((item: any) => item.id = crypto.randomUUID());
        if (parsedData.employmentHistory) parsedData.employmentHistory.forEach((item: any) => item.id = crypto.randomUUID());
        if (parsedData.education) parsedData.education.forEach((item: any) => item.id = crypto.randomUUID());

        return parsedData;

    } catch (error) {
        console.error("Error generating resume from prompt:", error);
        reportError(error as Error, { functionName: 'generateResumeFromPrompt' });
        throw new Error("Failed to generate resume with AI. Please try a different prompt.");
    }
};


export const generalChat = async (userId: string, history: { role: 'user' | 'model', parts: { text: string }[] }[], newMessage: string, language: string): Promise<string> => {
    const systemInstruction = `You are an expert AI assistant for the "CareerVivid" application...`; // Truncated for brevity

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [ ...history, { role: 'user', parts: [{ text: newMessage }] } ],
            config: { systemInstruction },
        });

        const tokenUsage = response.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'ai_assistant_query', { tokenUsage });

        return response.text;
    } catch (error) {
        console.error("Error in general chat:", error);
        reportError(error as Error, { functionName: 'generalChat' });
        return "Sorry, I encountered an error. Please try again.";
    }
};

export const generateInterviewQuestions = async (userId: string, prompt: string): Promise<string[]> => {
    try {
        const fullPrompt = `Based on the following description, generate a list of 5-7 insightful interview questions...`; // Truncated
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
        });

        const tokenUsage = response.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'question_generation', { tokenUsage });

        return JSON.parse(response.text.trim()) as string[];
    } catch (error) {
        console.error("Error generating interview questions:", error);
        reportError(error as Error, { functionName: 'generateInterviewQuestions' });
        throw new Error("Failed to generate interview questions with AI.");
    }
};

export const generateDemoInterviewQuestions = async (prompt: string): Promise<string[]> => {
    try {
        const fullPrompt = `Based on the following description, generate a list of 2-3 insightful interview questions for a short demo interview. The questions should be relevant to the role described. Return ONLY a valid JSON array of strings, with no other text or explanation. Description: "${prompt}"`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
        });
        
        return JSON.parse(response.text.trim()) as string[];
    } catch (error) {
        console.error("Error generating demo interview questions:", error);
        reportError(error as Error, { functionName: 'generateDemoInterviewQuestions' });
        throw new Error("Failed to generate interview questions with AI. Please try a different prompt.");
    }
};

export const analyzeInterviewTranscript = async (userId: string, transcript: TranscriptEntry[], prompt: string, durationInSeconds?: number): Promise<Omit<InterviewAnalysis, 'id'|'timestamp'|'transcript'>> => {
    try {
        const formattedTranscript = transcript.map(entry => `${entry.speaker === 'ai' ? 'Interviewer' : 'Candidate'}: ${entry.text}`).join('\n\n');
        
        const fullPrompt = `You are an expert interview coach. Your task is to analyze the following interview transcript and provide a structured, objective, and constructive feedback report in JSON format. The interview was for the role described as: '${prompt}'.

Analyze the candidate's performance based on the following criteria:
1.  **Communication:** Clarity of speech, articulation, confidence, and avoidance of filler words.
2.  **Confidence:** Tone of voice, decisiveness in answers, and overall professional demeanor.
3.  **Answer Relevance:** How well the candidate's answers directly address the interviewer's questions and align with the job role.

**Transcript:**
---
${formattedTranscript}
---

**Instructions for your JSON response:**
1.  Provide a numerical score from 0 to 100 for each of the three criteria (Communication, Confidence, Answer Relevance). The score must be a number, not a string.
2.  Calculate an 'overallScore' which is the weighted average of the other scores (Communication: 30%, Confidence: 30%, Relevance: 40%). This must also be a number.
3.  Write a 'strengths' summary highlighting what the candidate did well. Use markdown for formatting, like using "**" for bolding key terms.
4.  Write an 'areasForImprovement' summary providing specific, actionable advice. Use markdown for formatting.
5.  Your entire response MUST be a valid JSON object that conforms to the provided schema. Do not include any text, markdown, or explanations outside of the JSON object.`;

        const config = {
            responseMimeType: "application/json",
            responseSchema: { 
                type: Type.OBJECT,
                properties: {
                    overallScore: { type: Type.NUMBER, description: "A weighted average score from 0 to 100." },
                    communicationScore: { type: Type.NUMBER, description: "A score from 0 to 100 for communication skills." },
                    confidenceScore: { type: Type.NUMBER, description: "A score from 0 to 100 for confidence." },
                    relevanceScore: { type: Type.NUMBER, description: "A score from 0 to 100 for answer relevance." },
                    strengths: { type: Type.STRING, description: "A markdown-formatted string summarizing the candidate's strengths." },
                    areasForImprovement: { type: Type.STRING, description: "A markdown-formatted string with actionable tips for improvement." }
                },
                required: [
                    'overallScore', 
                    'communicationScore', 
                    'confidenceScore', 
                    'relevanceScore', 
                    'strengths', 
                    'areasForImprovement'
                ]
            },
        };

        let response: GenerateContentResponse;
        try {
            response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: fullPrompt, config });
        } catch (error) {
            console.warn("gemini-3-pro-preview failed for interview analysis, falling back to gemini-2.5-flash.", error);
            response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: fullPrompt, config });
        }

        const tokenUsage = response.usageMetadata?.totalTokenCount || 0;
        const metadata: { tokenUsage: number, durationInSeconds?: number } = { tokenUsage };
        if (durationInSeconds && durationInSeconds > 0) {
            metadata.durationInSeconds = durationInSeconds;
        }
        await trackUsage(userId, 'interview_analysis', metadata);

        const jsonText = response.text.trim();
        const analysis = JSON.parse(jsonText);
        return analysis;

    } catch (error) {
        console.error("Error analyzing transcript:", error);
        reportError(error as Error, { functionName: 'analyzeInterviewTranscript' });
        throw new Error("Failed to analyze interview transcript.");
    }
};

// --- NEW FUNCTION FOR RESUME MATCHING ---

const resumeMatchSchema = {
    type: Type.OBJECT,
    properties: {
        totalKeywords: { type: Type.NUMBER, description: "The total number of unique, important keywords extracted from the job description." },
        matchedKeywords: { type: Type.ARRAY, description: "A list of keywords found in both the job description and the resume.", items: { type: Type.STRING } },
        missingKeywords: { type: Type.ARRAY, description: "A list of important keywords from the job description that were NOT found in the resume.", items: { type: Type.STRING } },
        matchPercentage: { type: Type.NUMBER, description: "A percentage score (0-100) representing the ratio of matched keywords to total keywords." },
        summary: { type: Type.STRING, description: "A brief, 2-3 sentence summary of the resume's strengths and weaknesses against the job description." },
    },
    required: ["totalKeywords", "matchedKeywords", "missingKeywords", "matchPercentage", "summary"]
};


export const analyzeResumeMatch = async (
    userId: string,
    resumeText: string,
    jobDescription: string
): Promise<ResumeMatchAnalysis> => {
    try {
        const prompt = `Act as an expert recruiter scanning a resume for a job opening.
1.  First, analyze the following JOB DESCRIPTION and extract the 10-15 most important and relevant keywords or skills. These should be specific technologies, qualifications, or responsibilities.
2.  Next, analyze the provided RESUME TEXT to see which of those keywords are present.
3.  Finally, return a structured JSON object that strictly conforms to the provided schema. Calculate the matchPercentage as (matchedKeywords.length / totalKeywords.length) * 100.

**JOB DESCRIPTION:**
---
${jobDescription}
---

**RESUME TEXT:**
---
${resumeText}
---
`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: resumeMatchSchema,
            },
        });
        
        const tokenUsage = response.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'resume_match_analysis', { tokenUsage });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error analyzing resume match:", error);
        reportError(error as Error, { functionName: 'analyzeResumeMatch' });
        throw new Error("Failed to analyze the resume match with AI. The job description might be too short or in an unusual format.");
    }
};


// --- NEW FUNCTIONS FOR JOB TRACKER ---

const jobParseSchema = {
    type: Type.OBJECT,
    properties: {
        jobTitle: { type: Type.STRING, description: "The job title. Return 'Untitled Job' if not found." },
        companyName: { type: Type.STRING, description: "The company name. Return 'Unknown Company' if not found." },
        location: { type: Type.STRING, description: "The job location (e.g., city, state, or 'Remote'). Return an empty string if not found." },
    },
    required: ["jobTitle", "companyName", "location"]
};

export const parseJobDescriptionFromText = async (
    userId: string,
    descriptionText: string
): Promise<Partial<JobApplicationData>> => {
    try {
        const prompt = `Analyze the following job description text and extract the Job Title, Company Name, and Location. Respond in a structured JSON format that strictly conforms to the schema. Job Description:\n\n---\n\n${descriptionText}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: jobParseSchema,
            },
        });
        
        const tokenUsage = response.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'job_parse_description', { tokenUsage });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error parsing job description from text:", error);
        reportError(error as Error, { functionName: 'parseJobDescriptionFromText' });
        throw new Error("Failed to analyze the job description with AI. A manual entry has been created for you to edit.");
    }
};

const prepNotesSchema = {
    type: Type.OBJECT,
    properties: {
        prep_RoleOverview: { type: Type.STRING, description: "Detailed research on the company and role. Structure the response using Markdown with the following headings: `### Company Overview`, `### Role Responsibilities`, and `### Key Qualifications Alignment`. Provide 2-3 paragraphs or bullet points under each." },
        prep_MyStory: { type: Type.STRING, description: "A compelling 2-3 paragraph narrative connecting the candidate's resume experience to the key requirements of the job. This should be a 'tell me about yourself' pitch tailored for this role." },
        prep_InterviewPrep: { type: Type.STRING, description: "A numbered list of 5-7 potential interview questions. For each question, provide a detailed example answer using the STAR method. Format each STAR answer clearly with Markdown headings for `**Situation:**`, `**Task:**`, `**Action:**`, and `**Result:**`." },
        prep_QuestionsForInterviewer: { type: Type.STRING, description: "A numbered list of 3-5 insightful questions for the candidate to ask the interviewer about the role, team, or company." },
        notes: { type: Type.STRING, description: "A bulleted list of general notes or key takeaways for the candidate to remember for their interview." },
    },
    required: ["prep_RoleOverview", "prep_MyStory", "prep_InterviewPrep", "prep_QuestionsForInterviewer", "notes"]
};

export const generateJobPrepNotes = async (
    userId: string,
    job: JobApplicationData,
    resumeContext: string
): Promise<Partial<JobApplicationData>> => {
    try {
        const prompt = `You are an expert career coach. Based on the provided job application details and the candidate's resume, generate comprehensive preparation notes. The notes should be structured, insightful, and directly help the candidate succeed in their interview.

**Job Details:**
- Job Title: ${job.jobTitle}
- Company: ${job.companyName}
- Location: ${job.location || 'N/A'}
- Job Description: ${job.jobDescription || 'Not provided.'}

**Candidate's Resume:**
---
${resumeContext}
---

Generate the notes in the required JSON format. Ensure all text content uses clear Markdown for structure and readability.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: prepNotesSchema,
            },
        });
        
        const tokenUsage = response.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'job_prep_generation', { tokenUsage });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating job prep notes:", error);
        reportError(error as Error, { functionName: 'generateJobPrepNotes' });
        throw new Error("Failed to generate AI preparation notes. Please try again.");
    }
};

export const regenerateJobPrepSection = async (
    userId: string,
    sectionName: string,
    job: JobApplicationData,
    resumeContext: string,
    instruction: string
): Promise<string> => {
     try {
        let formattingInstruction = '';
        if (sectionName === 'Company & Role Research') {
            formattingInstruction = "Structure the response using Markdown with headings like `### Company Overview` and `### Role Responsibilities`.";
        } else if (sectionName === 'Interview Prep Q&A') {
            formattingInstruction = "Format the questions as a numbered list, and format each STAR answer with `**Situation:**`, `**Task:**`, `**Action:**`, and `**Result:**` headings.";
        } else if (sectionName === 'Questions for Them') {
            formattingInstruction = "Format the output as a numbered list.";
        } else if (sectionName === 'General Notes') {
            formattingInstruction = "Format the output as a bulleted list.";
        }

        const prompt = `You are an expert career coach. Regenerate the content for the "${sectionName}" section of interview preparation notes based on the user's instruction.

**User Instruction:** "${instruction}"

**Formatting:** ${formattingInstruction || 'Use clear paragraphs.'}

**Original Context:**
- Job Title: ${job.jobTitle}
- Company: ${job.companyName}
- Job Description: ${job.jobDescription || 'Not provided.'}
- Candidate's Resume:
---
${resumeContext}
---

Return only the newly generated text for this specific section, without any extra formatting or explanation.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        const tokenUsage = response.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'job_prep_regeneration', { tokenUsage });

        return response.text.trim();
    } catch (error) {
        console.error("Error regenerating job prep section:", error);
        reportError(error as Error, { functionName: 'regenerateJobPrepSection' });
        throw new Error("Failed to regenerate section with AI.");
    }
};