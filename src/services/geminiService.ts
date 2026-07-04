import { ResumeData, TranscriptEntry, InterviewAnalysis, JobApplicationData, ResumeMatchAnalysis } from '../types';
import { generateSafeUUID } from '../constants';
import { trackUsage } from './trackingService';
import { reportError } from './errorService';
import { AI_CREDIT_COSTS } from '../config/creditCosts';

// --- Configuration ---
const PROXY_URL = import.meta.env.VITE_GEMINI_PROXY_URL || 'https://us-west1-jastalk-firebase.cloudfunctions.net/geminiProxy';
export const DEFAULT_TEXT_MODEL = 'gemini-3.1-flash-lite';
const IMAGE_MODEL_FALLBACK = 'gemini-2.5-flash-image';
const IMAGE_MODEL_PRIMARY = 'gemini-3-pro-image-preview';

const TEXT_MODEL_ALIASES: Record<string, string> = {
    'gemini-3.1-flash-lite': DEFAULT_TEXT_MODEL,
    'gemini-3.1-flash-lite-preview': DEFAULT_TEXT_MODEL,
    'gemini-2.5-flash-lite-preview': DEFAULT_TEXT_MODEL,
    'gemini-2.5-flash-lite-preview-09-2025': DEFAULT_TEXT_MODEL,
    'gemini-2.5-flash-preview': 'gemini-2.5-flash',
    'gemini-2.5-flash-preview-09-2025': 'gemini-2.5-flash',
    'gemini-2.5-flash-preview-05-20': 'gemini-2.5-flash',
    'gemini-3-flash-preview': 'gemini-2.5-flash',
    'gemini-3.1-flash-preview': 'gemini-2.5-flash',
    'gemini-2.5-pro-preview': 'gemini-2.5-pro',
    'gemini-3.1-pro-preview': 'gemini-2.5-pro',
};

const normalizeTextModelName = (modelName?: string): string | undefined =>
    modelName ? TEXT_MODEL_ALIASES[modelName] || modelName : modelName;

// --- Proxy Helper ---
export interface ProxyPayload {
    modelName?: string;
    contents: any;
    config?: any;
    systemInstruction?: any;
}

const extractSystemText = (parts?: { text?: string }[]) => {
    if (!Array.isArray(parts)) return '';
    return parts.map(part => part.text || '').filter(Boolean).join('\n');
};

const normalizeGeminiContents = (contents: any, systemInstruction?: any) => {
    const rawContents = Array.isArray(contents) ? contents : [contents];
    const systemTexts: string[] = [];

    const normalizedContents = rawContents.map(item => {
        if (typeof item === 'string') {
            return { role: 'user', parts: [{ text: item }] };
        }
        if (!item || typeof item !== 'object') {
            return { role: 'user', parts: [{ text: String(item ?? '') }] };
        }
        if (item.role === 'system' || item.role === 'developer') {
            const text = extractSystemText(item.parts);
            if (text) systemTexts.push(text);
            return null;
        }
        return {
            ...item,
            role: item.role === 'assistant' ? 'model' : item.role === 'model' ? 'model' : 'user'
        };
    }).filter(Boolean);

    const extraSystemText = systemTexts.join('\n\n');
    const normalizedSystemInstruction = extraSystemText
        ? [systemInstruction, extraSystemText].filter(Boolean).join('\n\n')
        : systemInstruction;

    return { normalizedContents, normalizedSystemInstruction };
};

// --- Concurrency & Retry Logic ---

const MAX_CONCURRENT_REQUESTS = 3;

/**
 * RequestQueue manages concurrent AI service requests using a Breadth-First-Search (BFS) 
 * approach to task scheduling. 
 * 
 * By using a FIFO (First-In, First-Out) queue, it ensures that requests are processed 
 * in the order they were received, preventing request starvation while strictly 
 * enforcing concurrency limits to stay within API rate thresholds.
 */
class RequestQueue {
    // Tasks are stored in a queue for FIFO (Breadth-First) processing
    private queue: (() => Promise<void>)[] = [];
    private activeRequests = 0;

    /**
     * Adds a new operation to the queue.
     * If fewer than MAX_CONCURRENT_REQUESTS are active, it executes immediately.
     * Otherwise, it's queued for sequential processing.
     */
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

    /**
     * Processes the next task in the queue.
     * This ensures constant-time O(1) retrieval of the next scheduled task.
     */
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

export const callGeminiProxy = async (payload: ProxyPayload): Promise<{ text: string, response: any }> => {
    return requestQueue.add(() => retryOperation(async () => {
        try {
            const normalizedModelName = normalizeTextModelName(payload.modelName);
            const { normalizedContents, normalizedSystemInstruction } = normalizeGeminiContents(
                payload.contents,
                payload.systemInstruction
            );

            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        ...payload,
                        modelName: normalizedModelName,
                        contents: normalizedContents,
                        systemInstruction: normalizedSystemInstruction
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

        const result = await callGeminiProxy({ modelName: DEFAULT_TEXT_MODEL, contents, config });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'resume_parse_text', { tokenUsage });

        const jsonText = result.text.trim();
        const parsedData = JSON.parse(jsonText);

        const addId = (list: any[]) => { if (list) list.forEach((item: any) => item.id = generateSafeUUID()); };
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

        const result = await callGeminiProxy({ modelName: DEFAULT_TEXT_MODEL, contents, config });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'resume_parse_file', { tokenUsage });

        const jsonText = result.text.trim();
        const parsedData = JSON.parse(jsonText);

        const addId = (list: any[]) => { if (list) list.forEach((item: any) => item.id = generateSafeUUID()); };
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
            modelName: DEFAULT_TEXT_MODEL,
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

const extractInlineImage = (response: any): string | null => {
    const candidates = response?.candidates;
    if (!candidates?.[0]?.content?.parts) return null;

    for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes = part.inlineData.data;
            const outputMimeType = part.inlineData.mimeType || 'image/png';
            if (base64ImageBytes) {
                return `data:${outputMimeType};base64,${base64ImageBytes}`;
            }
        }
    }

    return null;
};

const isImageModelFallbackError = (error: unknown): boolean => {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    return [
        '404',
        'not found',
        'model',
        'quota',
        'permission',
        'access',
        'location',
        'region',
        'unsupported',
        'unavailable',
        '500',
        'did not return an image',
        'no image'
    ].some(term => message.includes(term));
};

const isNetworkOrCorsError = (error: unknown): boolean => {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    return message.includes('failed to fetch') || message.includes('networkerror') || message.includes('cors');
};

export const editProfilePhoto = async (userId: string, base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    const runImageEdit = async (modelName: string) => {
        const contents = {
            parts: [
                { inlineData: { mimeType, data: base64Image } },
                { text: prompt }
            ]
        };

        const result = await callGeminiProxy({
            modelName,
            contents,
            config: { responseModalities: ["IMAGE", "TEXT"] }
        });

        const generatedImage = extractInlineImage(result.response);
        if (!generatedImage) {
            throw new Error("AI did not return an image.");
        }

        return { generatedImage, response: result.response };
    };

    try {
        let modelName = IMAGE_MODEL_PRIMARY;
        let fallbackUsed = false;
        let result: Awaited<ReturnType<typeof runImageEdit>>;

        try {
            result = await runImageEdit(modelName);
        } catch (primaryError) {
            if (!isImageModelFallbackError(primaryError)) {
                throw primaryError;
            }

            console.warn(`Primary image edit model failed; retrying with ${IMAGE_MODEL_FALLBACK}.`, primaryError);
            modelName = IMAGE_MODEL_FALLBACK;
            fallbackUsed = true;
            result = await runImageEdit(modelName);
        }

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 1000;
        await trackUsage(userId, 'image_generation', { tokenUsage, modelName, fallbackUsed });

        return result.generatedImage;

    } catch (error) {
        console.error("Error editing photo:", error);
        reportError(error as Error, { functionName: 'editProfilePhoto' });
        if (isNetworkOrCorsError(error)) {
            throw new Error("CareerVivid could not reach the AI image service from this origin. Try careervivid.app, or redeploy the Gemini proxy CORS update for local testing.");
        }
        throw new Error("AI image editing is temporarily unavailable. Try a smaller uploaded JPG/PNG, or try again in a few minutes.");
    }
};

export const generateImage = async (userId: string, prompt: string, modelType: 'standard' | 'pro' = 'standard'): Promise<string> => {
    const generateWithModel = async (modelName: string) => {
        const contents = {
            parts: [
                { text: prompt }
            ]
        };

        const result = await callGeminiProxy({
            modelName,
            contents,
            config: { responseModalities: ["IMAGE"] }
        });

        const generatedImage = extractInlineImage(result.response);
        if (!generatedImage) {
            throw new Error("AI did not return an image.");
        }

        return { generatedImage, response: result.response };
    };

    try {
        const requestedModel = modelType === 'pro' ? IMAGE_MODEL_PRIMARY : IMAGE_MODEL_FALLBACK;
        const requiredCredits = modelType === 'pro' ? 20 : 10;
        let apiModel = requestedModel;
        let fallbackUsed = false;
        let result: Awaited<ReturnType<typeof generateWithModel>>;

        try {
            result = await generateWithModel(apiModel);
        } catch (primaryError) {
            if (apiModel !== IMAGE_MODEL_PRIMARY || !isImageModelFallbackError(primaryError)) {
                throw primaryError;
            }
            console.warn(`Primary image generation model failed; retrying with ${IMAGE_MODEL_FALLBACK}.`, primaryError);
            apiModel = IMAGE_MODEL_FALLBACK;
            fallbackUsed = true;
            result = await generateWithModel(apiModel);
        }

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 1000;
        const billedCredits = fallbackUsed ? 10 : requiredCredits;
        await trackUsage(userId, 'image_generation_prompt', { tokenUsage, deductCredits: billedCredits, modelName: apiModel, fallbackUsed });

        return result.generatedImage;

    } catch (error) {
        console.error("Error generating image:", error);
        reportError(error as Error, { functionName: 'generateImage' });
        throw new Error("AI image generation is temporarily unavailable. Try a more specific prompt or try again in a few minutes.");
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

        const result = await callGeminiProxy({ modelName: DEFAULT_TEXT_MODEL, contents: fullPrompt, config });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        if (!userId.startsWith('guest_')) {
            await trackUsage(userId, 'resume_generate_prompt', { tokenUsage });
        }

        const jsonText = result.text.trim();
        const parsedData = JSON.parse(jsonText);

        const addId = (list: any[]) => { if (list) list.forEach((item: any) => item.id = generateSafeUUID()); };
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
            modelName: DEFAULT_TEXT_MODEL,
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
        const fullPrompt = `You are a senior interviewer designing the question set for a real interview. Use the context below to write questions that a candidate would actually be asked in this specific interview.

--- INTERVIEW CONTEXT ---
${prompt.trim()}
--- END CONTEXT ---

Write 5 to 7 interview questions that:
- Are specific to the role, seniority, company, and interview stage described in the context. If the context names a company or a stage (e.g. coding, system design, behavioral, values), tailor every question to it.
- Match the stated difficulty. Entry-level gets fundamentals; senior gets depth, trade-offs, and scale.
- Are a realistic mix for this stage, not five variations of the same question. Include at least one that probes depth with a follow-up built in ("...and how would you handle X?").
- Are answerable out loud in an interview — concrete and self-contained, not essay prompts or take-home tasks.
- Reference the candidate's background from the context when it is provided, to make questions feel targeted.

Do not number the questions or add preamble. Return ONLY a JSON array of question strings.`;
        const result = await callGeminiProxy({
            modelName: DEFAULT_TEXT_MODEL,
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: "ARRAY", items: { type: "STRING" } },
            },
        });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'question_generation', { tokenUsage });

        const parsed = JSON.parse(result.text.trim()) as string[];
        return Array.isArray(parsed) ? parsed.map(q => String(q).trim()).filter(Boolean) : [];
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
            modelName: DEFAULT_TEXT_MODEL,
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

        const fullPrompt = `You are an experienced interviewer writing an honest, calibrated feedback report after an interview. Judge the CANDIDATE only — the Interviewer lines are the questions asked. Base every judgment on what the candidate actually said in the transcript; never invent strengths or answers that are not there.

Role / interview context:
${prompt}

Scoring rubric — all scores are 0 to 100. Calibrate honestly against a real hiring bar, do not inflate:
- 85-100: strong hire — specific, structured, correct, with depth.
- 70-84: hire — solid answers with minor gaps.
- 50-69: mixed — partially answered, vague, or shallow in places.
- 30-49: weak — mostly vague, off-target, or missing key substance.
- 0-29: no signal — barely answered, evasive, or empty transcript.

Score each dimension:
- overallScore: your holistic hire/no-hire read, weighted toward relevance and substance.
- communicationScore: structure, clarity, and concision. Did they organize answers (e.g. STAR) and stay easy to follow?
- confidenceScore: composure and conviction WITHOUT arrogance. Hedging, rambling, or "I don't know" with no attempt lowers this.
- relevanceScore: did answers actually address the questions and the role, with concrete detail (metrics, examples, specifics) rather than generic filler?

If the transcript is empty or the candidate barely responded, score everything below 30 and say so plainly.

Feedback rules:
- strengths: 2-4 markdown bullets, each citing something specific the candidate actually said or did well. No generic praise.
- areasForImprovement: 2-4 markdown bullets, each an actionable fix tied to a concrete moment ("When asked about X, you said Y — instead, quantify the impact and name the trade-off"). Be direct and useful, not soft.

**Transcript:**
---
${formattedTranscript}
---

Return ONLY a valid JSON object conforming to the schema.`;

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

        const result = await callGeminiProxy({ modelName: DEFAULT_TEXT_MODEL, contents: fullPrompt, config });

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

/**
 * Scores a system design diagram (exported as a PNG data URL) against a design
 * brief. Returns the same shape as analyzeInterviewTranscript so it plugs into
 * the interview report + quest scoring. The four score fields carry
 * system-design semantics: communicationScore = diagram clarity,
 * confidenceScore = requirement coverage, relevanceScore = scalability & trade-offs.
 */
export const analyzeSystemDesignDiagram = async (
    userId: string,
    imageDataUrl: string,
    brief: string,
): Promise<Omit<InterviewAnalysis, 'id' | 'timestamp' | 'transcript'>> => {
    try {
        const base64Data = imageDataUrl.includes(',') ? imageDataUrl.split(',')[1] : imageDataUrl;
        const mimeType = imageDataUrl.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';

        const instruction = `You are a senior staff engineer conducting a system design interview. The candidate was given this brief:

---
${brief}
---

The attached image is the candidate's hand-drawn system design diagram (whiteboard). Evaluate it as you would in a real onsite. Judge only what is actually shown in the diagram plus any labels. Be objective and constructive.

Scoring (all 0-100):
- overallScore: weighted overall quality of the design.
- communicationScore: clarity and readability of the diagram — are components labeled, is data flow clear, is it organized?
- confidenceScore: requirement coverage — does the design address the core requirements in the brief (key components, data stores, APIs)?
- relevanceScore: scalability and trade-offs — does it handle scale, bottlenecks, failure modes, and show sensible engineering trade-offs?

If the diagram is empty or unreadable, score everything low (under 30) and say so.

strengths: markdown bullets on what the design does well.
areasForImprovement: markdown bullets with specific, actionable gaps (missing components, scaling concerns, unclear flows).

Return ONLY a JSON object matching the schema.`;

        const contents = {
            parts: [
                { text: instruction },
                { inlineData: { mimeType, data: base64Data } },
            ],
        };

        const config = {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    overallScore: { type: "NUMBER", description: "Weighted overall design quality, 0 to 100." },
                    communicationScore: { type: "NUMBER", description: "Diagram clarity and readability, 0 to 100." },
                    confidenceScore: { type: "NUMBER", description: "Requirement coverage, 0 to 100." },
                    relevanceScore: { type: "NUMBER", description: "Scalability and trade-offs, 0 to 100." },
                    strengths: { type: "STRING", description: "Markdown bullets on design strengths." },
                    areasForImprovement: { type: "STRING", description: "Markdown bullets on actionable gaps." },
                },
                required: ['overallScore', 'communicationScore', 'confidenceScore', 'relevanceScore', 'strengths', 'areasForImprovement'],
            },
        };

        const result = await callGeminiProxy({ modelName: DEFAULT_TEXT_MODEL, contents, config });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'interview_analysis', { tokenUsage });

        return JSON.parse(result.text.trim());
    } catch (error) {
        console.error("Error analyzing system design diagram:", error);
        reportError(error as Error, { functionName: 'analyzeSystemDesignDiagram' });
        throw new Error("Failed to analyze system design diagram.");
    }
};

export interface CodingSubmissionInput {
    language: 'javascript' | 'python';
    code: string;
    /** Challenge brief text (problem, requirements). */
    brief: string;
    /** Hidden + visible test outcomes from the in-browser runner. */
    passed: number;
    total: number;
    /** Up to 5 failing cases as short strings. */
    failures: string[];
}

/**
 * Scores a coding-round submission. Correctness is decided by the real test
 * run in the browser — the model is told the pass rate and must anchor
 * confidenceScore to it, grading only approach, clarity, and complexity on
 * top. Returns the same shape as analyzeInterviewTranscript so it plugs into
 * the interview report + quest scoring: communicationScore = code clarity,
 * confidenceScore = correctness (test pass rate), relevanceScore = efficiency
 * & approach.
 */
export const analyzeCodingSubmission = async (
    userId: string,
    submission: CodingSubmissionInput,
): Promise<Omit<InterviewAnalysis, 'id' | 'timestamp' | 'transcript'>> => {
    try {
        const passRate = submission.total > 0 ? Math.round((submission.passed / submission.total) * 100) : 0;
        const instruction = `You are a senior engineer grading a coding-interview submission. The candidate was given this brief:

---
${submission.brief}
---

The candidate submitted this ${submission.language} solution:

\`\`\`${submission.language}
${submission.code}
\`\`\`

The solution was ALREADY EXECUTED against a hidden test suite in a sandbox. Ground truth (do not second-guess it):
- Tests passed: ${submission.passed}/${submission.total} (${passRate}%)
${submission.failures.length ? `- Failing cases:\n${submission.failures.map((f) => `  - ${f}`).join('\n')}` : '- All tests passed.'}

Scoring (all 0-100):
- confidenceScore: correctness — anchor this to the test pass rate above (${passRate}%). Adjust at most ±10 for near-miss issues like unhandled edge cases the suite did not cover.
- communicationScore: code clarity — naming, structure, comments where they matter, idiomatic ${submission.language}.
- relevanceScore: approach and efficiency — algorithm choice, time/space complexity versus the requirements, avoidance of brute force where the brief asks for better.
- overallScore: weighted overall quality (correctness matters most).

strengths: markdown bullets on what the solution does well.
areasForImprovement: markdown bullets with specific, actionable feedback (complexity, edge cases, readability). Reference concrete lines or constructs from the code.

Return ONLY a JSON object matching the schema.`;

        const contents = { parts: [{ text: instruction }] };

        const config = {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    overallScore: { type: "NUMBER", description: "Weighted overall solution quality, 0 to 100." },
                    communicationScore: { type: "NUMBER", description: "Code clarity and readability, 0 to 100." },
                    confidenceScore: { type: "NUMBER", description: "Correctness anchored to test pass rate, 0 to 100." },
                    relevanceScore: { type: "NUMBER", description: "Approach and efficiency, 0 to 100." },
                    strengths: { type: "STRING", description: "Markdown bullets on solution strengths." },
                    areasForImprovement: { type: "STRING", description: "Markdown bullets on actionable gaps." },
                },
                required: ['overallScore', 'communicationScore', 'confidenceScore', 'relevanceScore', 'strengths', 'areasForImprovement'],
            },
        };

        const result = await callGeminiProxy({ modelName: DEFAULT_TEXT_MODEL, contents, config });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'interview_analysis', { tokenUsage });

        return JSON.parse(result.text.trim());
    } catch (error) {
        console.error("Error analyzing coding submission:", error);
        reportError(error as Error, { functionName: 'analyzeCodingSubmission' });
        throw new Error("Failed to analyze coding submission.");
    }
};

const granularCategorySchema = {
    type: "OBJECT",
    properties: {
        score: { type: "NUMBER", description: "Score (0-100) for this specific match category." },
        rating: { type: "STRING", description: "Rating: 'Great', 'Good', 'Fair', or 'Missing'." },
        impact: { type: "STRING", description: "Impact: 'High Impact', 'Medium Impact', or 'Low Impact'." },
        details: { type: "ARRAY", description: "Bullet points detailing match points, missing requirements, or improvements.", items: { type: "STRING" } }
    },
    required: ["score", "rating", "impact", "details"]
};

const resumeMatchSchema = {
    type: "OBJECT",
    properties: {
        totalKeywords: { type: "NUMBER", description: "The total number of unique, important keywords extracted from the job description." },
        matchedKeywords: { type: "ARRAY", description: "A list of keywords found in both the job description and the resume.", items: { type: "STRING" } },
        missingKeywords: { type: "ARRAY", description: "A list of important keywords from the job description that were NOT found in the resume.", items: { type: "STRING" } },
        matchPercentage: { type: "NUMBER", description: "A percentage score (0-100) representing the overall match score between resume and job." },
        summary: { type: "STRING", description: "A brief, 2-3 sentence summary of the resume's strengths and weaknesses against the job description." },
        verdict: { type: "STRING", description: "Overall AI text verdict summary (e.g. 'Great Fit! Your resume strongly aligns...')" },
        verdictCategory: { type: "STRING", description: "Overall verdict classification: 'Great', 'Good', 'Fair', or 'Missing'." },
        strongMatches: { type: "ARRAY", description: "2-3 short proof points showing why this candidate is a strong match.", items: { type: "STRING" } },
        experienceGaps: { type: "ARRAY", description: "1-3 practical gaps or weak evidence areas the candidate should address.", items: { type: "STRING" } },
        suggestedResumeAngle: { type: "STRING", description: "One concise resume positioning angle for this role." },
        recommendedAction: { type: "STRING", description: "One of: apply_now, tailor_first, network_first, skip_for_now." },
        qualifications: { 
            type: "OBJECT",
            properties: granularCategorySchema.properties,
            required: granularCategorySchema.required,
            description: "Breakdown of qualifications match (degrees, certifications, academic requirements, etc.)" 
        },
        responsibilities: { 
            type: "OBJECT",
            properties: granularCategorySchema.properties,
            required: granularCategorySchema.required,
            description: "Breakdown of responsibilities match (prior experience scope, seniority levels, project duties, role alignment)" 
        },
        keywords: { 
            type: "OBJECT",
            properties: granularCategorySchema.properties,
            required: granularCategorySchema.required,
            description: "Breakdown of keyword and tech skills match (hard tools, programming languages, software, and core methodologies)" 
        },
        jobTitle: { 
            type: "OBJECT",
            properties: granularCategorySchema.properties,
            required: granularCategorySchema.required,
            description: "Breakdown of job title and seniority level match (exact match, seniority hierarchy level, or translation of titles)" 
        }
    },
    required: [
        "totalKeywords", 
        "matchedKeywords", 
        "missingKeywords", 
        "matchPercentage", 
        "summary", 
        "verdict", 
        "verdictCategory", 
        "strongMatches",
        "experienceGaps",
        "suggestedResumeAngle",
        "recommendedAction",
        "qualifications", 
        "responsibilities", 
        "keywords", 
        "jobTitle"
    ]
};

export const analyzeResumeMatch = async (userId: string, resumeText: string, jobDescription: string): Promise<ResumeMatchAnalysis> => {
    try {
        // Truncate job description and resume content to ensure ultra-high execution speed
        const cleanJd = jobDescription.slice(0, 2500);
        const cleanResume = resumeText.slice(0, 4000);

        const prompt = `Act as an expert scanning engine. Analyze resume against job description.

Job Description (Core):
${cleanJd}

Resume:
${cleanResume}

Audit matches across these four categories in the response schema:
1. Qualifications: Degrees, study fields, certifications, licenses.
2. Responsibilities: Scope, project scale, seniority level, duties.
3. Keywords: Core tools, tech skills, software.
4. Job Title: Current/past titles compared with target seniority.

CRITICAL RULES FOR ULTRA-FAST RESPONSE:
- Keep overall summary and verdict to 1-2 short sentences.
- Limit 'details' lists under EACH category to exactly 2 key short points.
- Limit totalKeywords, matchedKeywords, and missingKeywords arrays to at most 6-8 core tech skills. Do not list large lists.
- Limit strongMatches to at most 3 proof points and experienceGaps to at most 3 practical gaps.
- recommendedAction must be exactly one of: apply_now, tailor_first, network_first, skip_for_now.
- suggestedResumeAngle must be one compact sentence a user can apply in resume tailoring.
- Be highly concise and brief.

Return JSON matching the schema.`;

        const result = await callGeminiProxy({
            modelName: DEFAULT_TEXT_MODEL,
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
        location: { type: "STRING", description: "The job location (e.g., 'Remote - US; New York City', or city/state). Return empty string if not found." },
        salaryRange: { type: "STRING", description: "Extract any visible salary boundaries or compensation ranges (e.g., '$120k - $150k'). Return empty string if not found." },
        jobPostURL: { type: "STRING", description: "The original marketing job post link if present in context or text. Return empty string if not found." },
        directApplicationURL: { type: "STRING", description: "The specific ATS hosting portal submission link (e.g., https://jobs.ashbyhq.com/..., Greenhouse, Lever, etc.) if present. Return empty string if not found." }
    },
    required: ["jobTitle", "companyName", "location", "salaryRange", "jobPostURL", "directApplicationURL"]
};

export const parseJobDescriptionFromText = async (
    userId: string, 
    descriptionText: string,
    metadataUrl?: string
): Promise<Partial<JobApplicationData> & { directApplicationURL?: string }> => {
    try {
        const prompt = `Analyze the following job description text to extract structural metadata. 
Original Job Post URL / Browser metadata URL context: ${metadataUrl || 'None provided'}

Job description text:
${descriptionText}

Please parse and return the structured JSON payload according to the schema. 
For 'jobPostURL', prioritize using the original browser metadata URL context provided (${metadataUrl || ''}) if it is valid. Otherwise, look for it in the text.
For 'directApplicationURL', look for any ATS hosting portals (like greenhouse.io, ashbyhq.com, lever.co, workday.com, etc.) in the text.`;

        const result = await callGeminiProxy({
            modelName: DEFAULT_TEXT_MODEL,
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
            modelName: DEFAULT_TEXT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: prepNotesSchema,
            },
        });

        const tokenUsage = result.response?.usageMetadata?.totalTokenCount || 0;
        // "Generate All Prep Notes" is a bulk operation — costs JOB_PREP_NOTES_ALL (10) credits.
        await trackUsage(userId, 'job_prep_generation', { tokenUsage, deductCredits: AI_CREDIT_COSTS.JOB_PREP_NOTES_ALL });

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
            modelName: DEFAULT_TEXT_MODEL,
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
            modelName: DEFAULT_TEXT_MODEL,
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
