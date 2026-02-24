import { ResumeData, TranscriptEntry, InterviewAnalysis, JobApplicationData, ResumeMatchAnalysis } from '../types';
import { trackUsage } from './trackingService';
import { reportError } from './errorService';

// --- Configuration ---
const PROXY_URL = import.meta.env.VITE_GEMINI_PROXY_URL || 'https://us-west1-jastalk-firebase.cloudfunctions.net/geminiProxy';

// --- Proxy Helper ---
interface ProxyPayload {
    modelName?: string;
    contents: any;
    config?: any;
    systemInstruction?: any;
}

// --- Concurrency & Retry Logic ---

const MAX_CONCURRENT_REQUESTS = 3;

class RequestQueue {
    private queue: (() => Promise<void>)[] = [];
    private activeRequests = 0;

    async add<T>(operation: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const task = async () => {
                this.activeRequests++;
                try {
                    const result = await operation();
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.activeRequests--;
                    this.processNext();
                }
            };

            if (this.activeRequests < MAX_CONCURRENT_REQUESTS) {
                task();
            } else {
                this.queue.push(task);
            }
        });
    }

    private processNext() {
        if (this.queue.length > 0 && this.activeRequests < MAX_CONCURRENT_REQUESTS) {
            const nextTask = this.queue.shift();
            if (nextTask) nextTask();
        }
    }
}

const requestQueue = new RequestQueue();

const retryOperation = async <T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    try {
        return await operation();
    } catch (error: any) {
        if (retries > 0 && (error.message?.includes('429') || error.message?.includes('503'))) {
            // console.warn(`Retrying Gemini API request... Attempts left: ${retries}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryOperation(operation, retries - 1, delay * 2);
        }
        throw error;
    }
};

const callGeminiProxy = async (payload: ProxyPayload): Promise<{ text: string, response: any }> => {
    return requestQueue.add(() => retryOperation(async () => {
        try {
            // Normalize 'contents' to be Content[] as required by Gemini API
            let normalizedContents = payload.contents;
            if (typeof normalizedContents === 'string') {
                normalizedContents = [{ role: 'user', parts: [{ text: normalizedContents }] }];
            } else if (normalizedContents && typeof normalizedContents === 'object' && !Array.isArray(normalizedContents) && (normalizedContents as any).parts) {
                normalizedContents = [normalizedContents];
            }

            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        ...payload,
                        contents: normalizedContents
                    }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                // Throw specific errors for retry logic
                if (response.status === 429) throw new Error(`Gemini Rate Limit (429): ${errText}`);
                if (response.status === 503) throw new Error(`Gemini Service Overloaded (503): ${errText}`);
                throw new Error(`Proxy Error (${response.status}): ${errText}`);
            }

            if (!response.body) throw new Error("No response body received from proxy.");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            const END_MARKER = "__END_GEMINI__";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
            }
            buffer += decoder.decode();

            const parts = buffer.split(END_MARKER);
            if (parts.length < 2) {
                try {
                    const manualJson = JSON.parse(buffer);
                    if (manualJson.error) throw new Error(manualJson.error);
                } catch (e) { }

                console.warn("Gemini Proxy response missing end marker. Returning buffer as text.", buffer);
                return { text: buffer, response: {} };
            }

            const jsonStr = parts[1];
            try {
                return JSON.parse(jsonStr);
            } catch (e) {
                console.error("Failed to parse proxy payload JSON", jsonStr);
                throw new Error("Failed to parse AI response.");
            }

        } catch (error) {
            console.error("CallGeminiProxy failed:", error);
            throw error;
        }
    }));
};

// --- Function Implementations ---

// Note: Replaced Type.* with raw strings to avoid SDK dependency
const resumeSchema = {
    type: "OBJECT",
    properties: {
        personalDetails: {
            type: "OBJECT",
            description: "The user's personal contact information.",
            properties: {
                jobTitle: { type: "STRING", description: "The user's desired job title. Return an empty string if not found." },
                firstName: { type: "STRING", description: "The user's first name. Return an empty string if not found." },
                lastName: { type: "STRING", description: "The user's last name. Return an empty string if not found." },
                email: { type: "STRING", description: "The user's email address. Return an empty string if not found." },
                phone: { type: "STRING", description: "The user's phone number. Return an empty string if not found." },
                address: { type: "STRING", description: "The user's full street address (e.g., '123 Cloud Lane'). Return an empty string if not found." },
                city: { type: "STRING", description: "The user's city. Return an empty string if not found." },
                postalCode: { type: "STRING", description: "The user's postal or zip code. Return an empty string if not found." },
                country: { type: "STRING", description: "The user's country. Return an empty string if not found." },
            },
            required: ['jobTitle', 'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode', 'country']
        },
        professionalSummary: {
            type: "STRING",
            description: "A 3-5 sentence professional summary. Return an empty string if not found."
        },
        websites: {
            type: "ARRAY",
            description: "A list of websites or social links. Return an empty array if none are found.",
            items: {
                type: "OBJECT",
                properties: {
                    label: { type: "STRING", description: "The name of the website (e.g., LinkedIn, GitHub)." },
                    url: { type: "STRING", description: "The full URL." },
                },
                required: ['label', 'url']
            },
        },
        skills: {
            type: "ARRAY",
            description: "A list of skills. Return an empty array if none are found.",
            items: {
                type: "OBJECT",
                properties: {
                    name: { type: "STRING", description: "The name of the skill." },
                    level: { type: "STRING", description: "The user's proficiency level (e.g., Expert, Advanced, Intermediate). If not specified, infer a reasonable level like 'Advanced'." },
                },
                required: ['name', 'level']
            },
        },
        languages: {
            type: "ARRAY",
            description: "A list of languages spoken by the user. Return an empty array if none are found.",
            items: {
                type: "OBJECT",
                properties: {
                    name: { type: "STRING", description: "The name of the language (e.g., English, Spanish)." },
                    level: { type: "STRING", description: "The user's proficiency level (e.g., Native, Fluent). If not specified, infer a reasonable level like 'Proficient'." },
                },
                required: ['name', 'level']
            },
        },
        employmentHistory: {
            type: "ARRAY",
            description: "A list of past employment positions. Return an empty array if none are found.",
            items: {
                type: "OBJECT",
                properties: {
                    jobTitle: { type: "STRING" },
                    employer: { type: "STRING" },
                    city: { type: "STRING", description: "The city where the job was located. Return an empty string if not found." },
                    startDate: { type: "STRING", description: "e.g., 'Jan 2020' or '2020'" },
                    endDate: { type: "STRING", description: "e.g., 'Present' or 'Dec 2022'" },
                    description: { type: "STRING", description: "A few bullet points (use markdown for lists) or a short paragraph describing responsibilities and achievements." },
                },
                required: ['jobTitle', 'employer', 'city', 'startDate', 'endDate', 'description']
            },
        },
        education: {
            type: "ARRAY",
            description: "A list of educational qualifications. Return an empty array if none are found.",
            items: {
                type: "OBJECT",
                properties: {
                    school: { type: "STRING" },
                    degree: { type: "STRING" },
                    city: { type: "STRING", description: "The city where the school was located. Return an empty string if not found." },
                    startDate: { type: "STRING" },
                    endDate: { type: "STRING" },
                    description: { type: "STRING", description: "Optional details about the degree or coursework. Return an empty string if not found." },
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
        const contents = `The following resume is in ${language}. Parse it and extract all available information into a structured JSON format that strictly conforms to the provided schema. If a section (like 'languages') is not present in the text, return an empty array for it. If a simple field (like 'phone') is not present, return an empty string for it. Here is the resume text:\n\n---\n\n${resumeText}`;
        const config = {
            responseMimeType: "application/json",
            responseSchema: resumeSchema
        };

        const result = await callGeminiProxy({ modelName: 'gemini-2.5-flash', contents, config });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'resume_parse_text', { tokenUsage });

        const jsonText = result.text.trim();
        const parsedData = JSON.parse(jsonText);

        const addId = (list: any[]) => { if (list) list.forEach((item: any) => item.id = crypto.randomUUID()); };
        addId(parsedData.websites);
        addId(parsedData.skills);
        addId(parsedData.languages);
        addId(parsedData.employmentHistory);
        addId(parsedData.education);

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

        const result = await callGeminiProxy({ modelName: 'gemini-2.5-flash', contents, config });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'resume_parse_file', { tokenUsage });

        const jsonText = result.text.trim();
        const parsedData = JSON.parse(jsonText);

        const addId = (list: any[]) => { if (list) list.forEach((item: any) => item.id = crypto.randomUUID()); };
        addId(parsedData.websites);
        addId(parsedData.skills);
        addId(parsedData.languages);
        addId(parsedData.employmentHistory);
        addId(parsedData.education);

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
): Promise<{ improvedContent: string; explanation: string }> => {
    try {
        const schema = {
            type: "OBJECT",
            properties: {
                improvedContent: { type: "STRING", description: "The rewritten and improved text content." },
                explanation: { type: "STRING", description: "A brief, 1-2 sentence explanation of why this change is better or why it's important. Keep it professional and helpful." }
            },
            required: ["improvedContent", "explanation"]
        };

        let prompt;
        if (contextType === 'blog post') {
            prompt = `Role: You are an expert career coach...
Task: Rewrite and improve the following "${sectionName}" section.
Instructions:
1. Tone: Professional, authoritative, and actionable.
2. Structure: Use Markdown.
3. User Instruction: "${instruction}"
4. Language: ${language}

Current Content:
---
${currentText}
---

Return a JSON object with 'improvedContent' and 'explanation'.`;
        } else {
            prompt = `Rewrite the following "${sectionName}" section for a ${contextType} in ${language}. Follow the user's instruction: "${instruction}".
            
Current Text:
---
${currentText}
---
            
Return a JSON object with:
1. improvedContent: The improved text.
2. explanation: A brief explanation (1-2 sentences) of why this improvement is beneficial.`;
        }

        const result = await callGeminiProxy({
            modelName: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'resume_suggestion', { tokenUsage });

        return JSON.parse(result.text.trim());
    } catch (error) {
        console.error("Error improving section:", error);
        reportError(error as Error, { functionName: 'improveSection' });
        throw new Error("Failed to improve section with AI.");
    }
};

export const editProfilePhoto = async (userId: string, base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const contents = {
            parts: [
                { inlineData: { mimeType, data: base64Image } },
                { text: prompt }
            ]
        };

        const result = await callGeminiProxy({
            modelName: 'gemini-2.5-flash',
            contents,
            config: { responseModalities: ["IMAGE"] }
        });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 1000;
        await trackUsage(userId, 'image_generation', { tokenUsage });

        // Extract image from response
        const candidates = result.response?.candidates;
        if (candidates && candidates[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes = part.inlineData.data;
                    const outputMimeType = part.inlineData.mimeType || 'image/png';
                    return `data:${outputMimeType};base64,${base64ImageBytes}`;
                }
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

        const result = await callGeminiProxy({ modelName: 'gemini-2.5-flash', contents: fullPrompt, config });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        if (!userId.startsWith('guest_')) {
            await trackUsage(userId, 'resume_generate_prompt', { tokenUsage });
        }

        const jsonText = result.text.trim();
        const parsedData = JSON.parse(jsonText);

        const addId = (list: any[]) => { if (list) list.forEach((item: any) => item.id = crypto.randomUUID()); };
        addId(parsedData.websites);
        addId(parsedData.skills);
        addId(parsedData.languages);
        addId(parsedData.employmentHistory);
        addId(parsedData.education);

        return parsedData;
    } catch (error) {
        console.error("Error generating resume from prompt:", error);
        reportError(error as Error, { functionName: 'generateResumeFromPrompt' });
        throw new Error("Failed to generate resume with AI. Please try a different prompt.");
    }
};

export const generalChat = async (userId: string, history: { role: 'user' | 'model', parts: { text: string }[] }[], newMessage: string, language: string): Promise<string> => {
    const systemInstruction = `You are an expert AI assistant for the "CareerVivid" application...`;

    try {
        const result = await callGeminiProxy({
            modelName: 'gemini-2.5-flash',
            contents: [...history, { role: 'user', parts: [{ text: newMessage }] }],
            systemInstruction
        });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'ai_assistant_query', { tokenUsage });

        return result.text;
    } catch (error) {
        console.error("Error in general chat:", error);
        reportError(error as Error, { functionName: 'generalChat' });
        return "Sorry, I encountered an error. Please try again.";
    }
};

export const generateInterviewQuestions = async (userId: string, prompt: string): Promise<string[]> => {
    try {
        const fullPrompt = `Based on the following description, generate a list of 5-7 insightful interview questions...`;
        const result = await callGeminiProxy({
            modelName: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: "ARRAY", items: { type: "STRING" } },
            },
        });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'question_generation', { tokenUsage });

        return JSON.parse(result.text.trim()) as string[];
    } catch (error) {
        console.error("Error generating interview questions:", error);
        reportError(error as Error, { functionName: 'generateInterviewQuestions' });
        throw new Error("Failed to generate interview questions with AI.");
    }
};

export const generateDemoInterviewQuestions = async (prompt: string): Promise<string[]> => {
    try {
        const fullPrompt = `Based on the following description, generate a list of 2-3 insightful interview questions for a short demo interview. The questions should be relevant to the role described. Return ONLY a valid JSON array of strings, with no other text or explanation. Description: "${prompt}"`;
        const result = await callGeminiProxy({
            modelName: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: "ARRAY", items: { type: "STRING" } },
            },
        });

        return JSON.parse(result.text.trim()) as string[];
    } catch (error) {
        console.error("Error generating demo interview questions:", error);
        reportError(error as Error, { functionName: 'generateDemoInterviewQuestions' });
        throw new Error("Failed to generate interview questions with AI. Please try a different prompt.");
    }
};

export const analyzeInterviewTranscript = async (userId: string, transcript: TranscriptEntry[], prompt: string, durationInSeconds?: number): Promise<Omit<InterviewAnalysis, 'id' | 'timestamp' | 'transcript'>> => {
    try {
        const formattedTranscript = transcript.map(entry => `${entry.speaker === 'ai' ? 'Interviewer' : 'Candidate'}: ${entry.text}`).join('\n\n');

        const fullPrompt = `You are an expert interview coach. Your task is to analyze the following interview transcript and provide a structured, objective, and constructive feedback report in JSON format. The interview was for the role described as: '${prompt}'.
...
**Transcript:**
---
${formattedTranscript}
---
...
Your entire response MUST be a valid JSON object that conforms to the provided schema.`;

        const config = {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    overallScore: { type: "NUMBER", description: "A weighted average score from 0 to 100." },
                    communicationScore: { type: "NUMBER", description: "A score from 0 to 100 for communication skills." },
                    confidenceScore: { type: "NUMBER", description: "A score from 0 to 100 for confidence." },
                    relevanceScore: { type: "NUMBER", description: "A score from 0 to 100 for answer relevance." },
                    strengths: { type: "STRING", description: "A markdown-formatted string summarizing the candidate's strengths." },
                    areasForImprovement: { type: "STRING", description: "A markdown-formatted string with actionable tips for improvement." }
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

        const result = await callGeminiProxy({ modelName: 'gemini-2.5-flash', contents: fullPrompt, config });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        const metadata: { tokenUsage: number, durationInSeconds?: number } = { tokenUsage };
        if (durationInSeconds && durationInSeconds > 0) metadata.durationInSeconds = durationInSeconds;

        await trackUsage(userId, 'interview_analysis', metadata);

        return JSON.parse(result.text.trim());
    } catch (error) {
        console.error("Error analyzing transcript:", error);
        reportError(error as Error, { functionName: 'analyzeInterviewTranscript' });
        throw new Error("Failed to analyze interview transcript.");
    }
};

const resumeMatchSchema = {
    type: "OBJECT",
    properties: {
        totalKeywords: { type: "NUMBER", description: "The total number of unique, important keywords extracted from the job description." },
        matchedKeywords: { type: "ARRAY", description: "A list of keywords found in both the job description and the resume.", items: { type: "STRING" } },
        missingKeywords: { type: "ARRAY", description: "A list of important keywords from the job description that were NOT found in the resume.", items: { type: "STRING" } },
        matchPercentage: { type: "NUMBER", description: "A percentage score (0-100) representing the ratio of matched keywords to total keywords." },
        summary: { type: "STRING", description: "A brief, 2-3 sentence summary of the resume's strengths and weaknesses against the job description." },
    },
    required: ["totalKeywords", "matchedKeywords", "missingKeywords", "matchPercentage", "summary"]
};

export const analyzeResumeMatch = async (userId: string, resumeText: string, jobDescription: string): Promise<ResumeMatchAnalysis> => {
    try {
        const prompt = `Act as an expert recruiter scanning a resume for a job opening.
Job Description:
${jobDescription}
Resume:
${resumeText}
Return match stats in described JSON schema.`;

        const result = await callGeminiProxy({
            modelName: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: resumeMatchSchema,
            },
        });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'resume_match_analysis', { tokenUsage });

        return JSON.parse(result.text.trim());
    } catch (error) {
        console.error("Error analyzing resume match:", error);
        reportError(error as Error, { functionName: 'analyzeResumeMatch' });
        throw new Error("Failed to analyze the resume match with AI.");
    }
};

const jobParseSchema = {
    type: "OBJECT",
    properties: {
        jobTitle: { type: "STRING", description: "The job title. Return 'Untitled Job' if not found." },
        companyName: { type: "STRING", description: "The company name. Return 'Unknown Company' if not found." },
        location: { type: "STRING", description: "The job location (e.g., city, state, or 'Remote'). Return an empty string if not found." },
    },
    required: ["jobTitle", "companyName", "location"]
};

export const parseJobDescriptionFromText = async (userId: string, descriptionText: string): Promise<Partial<JobApplicationData>> => {
    try {
        const prompt = `Analyze the following job description text... ${descriptionText}`;
        const result = await callGeminiProxy({
            modelName: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: jobParseSchema,
            },
        });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'job_parse_description', { tokenUsage });

        return JSON.parse(result.text.trim());
    } catch (error) {
        console.error("Error parsing job description from text:", error);
        reportError(error as Error, { functionName: 'parseJobDescriptionFromText' });
        throw new Error("Failed to analyze the job description with AI.");
    }
};

const prepNotesSchema = {
    type: "OBJECT",
    properties: {
        prep_RoleOverview: { type: "STRING", description: "Detailed research..." },
        prep_MyStory: { type: "STRING", description: "A compelling 2-3 paragraph..." },
        prep_InterviewPrep: { type: "STRING", description: "A numbered list of 5-7 potential interview questions..." },
        prep_QuestionsForInterviewer: { type: "STRING", description: "A numbered list of 3-5 insightful questions..." },
        notes: { type: "STRING", description: "A bulleted list of general notes..." },
    },
    required: ["prep_RoleOverview", "prep_MyStory", "prep_InterviewPrep", "prep_QuestionsForInterviewer", "notes"]
};

export const generateJobPrepNotes = async (userId: string, job: JobApplicationData, resumeContext: string): Promise<Partial<JobApplicationData>> => {
    try {
        const prompt = `You are an expert career coach... [Job: ${job.jobTitle}]`;
        const result = await callGeminiProxy({
            modelName: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: prepNotesSchema,
            },
        });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'job_prep_generation', { tokenUsage });

        return JSON.parse(result.text.trim());
    } catch (error) {
        console.error("Error generating job prep notes:", error);
        reportError(error as Error, { functionName: 'generateJobPrepNotes' });
        throw new Error("Failed to generate AI preparation notes.");
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
        const prompt = `...Regenerate content for "${sectionName}"...`;

        const result = await callGeminiProxy({
            modelName: 'gemini-2.5-flash',
            contents: prompt,
        });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'job_prep_regeneration', { tokenUsage });

        return result.text.trim();
    } catch (error) {
        console.error("Error regenerating job prep section:", error);
        reportError(error as Error, { functionName: 'regenerateJobPrepSection' });
        throw new Error("Failed to regenerate section with AI.");
    }
};

export const generateExcalidrawDiagram = async (userId: string, prompt: string): Promise<any> => {
    try {
        const systemInstruction = `You are an Expert System Architect and UI Layout Engine.
Generate a professional, well-spaced diagram as RAW Excalidraw JSON — no markdown, no explanation, just the JSON object.

OUTPUT FORMAT: A single JSON object with exactly: {"type":"excalidraw","version":2,"elements":[...]}

ELEMENT RULES (follow precisely):

1. RECTANGLES — one per component:
{
  "type": "rectangle", "id": "<unique 20-char alphanumeric>",
  "x": <number>, "y": <number>, "width": 200, "height": 70,
  "backgroundColor": "#4dabf7", "fillStyle": "solid",
  "strokeColor": "#1971c2", "strokeWidth": 2, "roughness": 0,
  "roundness": {"type": 3}, "opacity": 100,
  "isDeleted": false, "boundElements": null, "locked": false
}
Use distinct, professional pastel colors per layer (e.g., #4dabf7 blue for clients, #69db7c green for services, #ffd43b yellow for storage, #ff8787 red for external, #a9e34b lime for queues).

2. TEXT LABELS — one per rectangle, as a STANDALONE text element (NOT bound):
{
  "type": "text", "id": "<unique 20-char alphanumeric>",
  "x": <rect_x + 10>, "y": <rect_y + 22>, "width": 180, "height": 26,
  "text": "<component name>", "fontSize": 16, "fontFamily": 1,
  "textAlign": "center", "verticalAlign": "middle",
  "strokeColor": "#1a1a2e", "backgroundColor": "transparent",
  "fillStyle": "solid", "opacity": 100,
  "isDeleted": false, "boundElements": null, "containerId": null, "locked": false
}
CRITICAL: Do NOT use containerId. Do NOT add boundElements on rectangles. Text must be standalone.

3. ARROWS — connecting rectangles:
{
  "type": "arrow", "id": "<unique 20-char alphanumeric>",
  "x": <startX>, "y": <startY>,
  "points": [[0, 0], [<dx>, <dy>]],
  "startBinding": {"elementId": "<source_rect_id>", "focus": 0, "gap": 8},
  "endBinding": {"elementId": "<target_rect_id>", "focus": 0, "gap": 8},
  "strokeColor": "#495057", "strokeWidth": 2, "roughness": 0,
  "opacity": 100, "isDeleted": false, "boundElements": null, "locked": false,
  "endArrowhead": "arrow", "startArrowhead": null
}

LAYOUT: Space nodes at least 320px apart horizontally, 180px vertically. No overlaps.
Generate 6-15 nodes for a meaningful diagram. Keep IDs strictly 20 alphanumeric chars.`;

        // Guard: cap prompt length to prevent abuse
        if (prompt.length > 1000) {
            throw new Error('Prompt is too long. Please keep it under 1000 characters.');
        }

        const result = await callGeminiProxy({
            modelName: 'gemini-3-flash-preview',
            contents: `Generate an Excalidraw diagram for: "${prompt.slice(0, 1000)}"`,
            systemInstruction,
        });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'diagram_generation', { tokenUsage });

        // Clean up any markdown wrapping the LLM might add despite instructions
        let rawJson = result.text.trim();
        if (rawJson.startsWith('```json')) {
            rawJson = rawJson.replace(/^```json\n?/, '');
        }
        if (rawJson.startsWith('```')) {
            rawJson = rawJson.replace(/^```[a-z]*\n?/, '');
        }
        if (rawJson.endsWith('```')) {
            rawJson = rawJson.replace(/\n?```$/, '');
        }

        const parsed = JSON.parse(rawJson);

        if (!parsed.elements || !Array.isArray(parsed.elements)) {
            throw new Error("AI response is missing a valid 'elements' array.");
        }

        // Security: whitelist only known-safe Excalidraw element types to prevent
        // injection of unknown types that might be processed unsafely by Excalidraw.
        const SAFE_ELEMENT_TYPES = new Set([
            'rectangle', 'ellipse', 'diamond', 'triangle',
            'line', 'arrow', 'text', 'image', 'freedraw', 'frame', 'embeddable',
        ]);
        parsed.elements = parsed.elements.filter(
            (el: any) => el && typeof el === 'object' && SAFE_ELEMENT_TYPES.has(el.type)
        );

        return parsed;
    } catch (error) {
        console.error("Error generating Excalidraw diagram:", error);
        reportError(error as Error, { functionName: 'generateExcalidrawDiagram' });
        throw new Error("Failed to generate diagram with AI. Please try a different prompt.");
    }
};