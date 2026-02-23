import { GoogleGenAI } from "@google/genai";
import { trackUsage } from './trackingService';

const GEMINI_MODEL = 'gemini-3-flash';
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || (window as any)?.ENV?.VITE_GOOGLE_API_KEY;

if (!apiKey) {
    console.warn("VITE_GOOGLE_API_KEY is not defined. Portfolio generation may not work.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SYSTEM_INSTRUCTION = `
You are an expert Portfolio Architect. 
Your goal is to take a user's prompt (e.g., "I am a senior designer") and generate a structured JSON object for their personal website.

RULES:
1. Return ONLY valid JSON. No markdown formatting.
2. Choose a 'theme' based on the role ('minimal' for devs, 'visual' for designers, 'corporate' for execs).
3. Create realistic, professional placeholder content.
4. For images, use high-quality Unsplash source URLs (e.g. 'https://source.unsplash.com/random/800x600?tech').

JSON SCHEMA:
{
  "theme": "minimal" | "visual" | "corporate",
  "hero": { "headline": string, "subheadline": string, "ctaText": string },
  "about": { "bio": string, "skills": string[] },
  "projects": [ { "id": string, "title": string, "description": string, "imageUrl": string, "tags": string[] } ],
  "socials": { "github": string, "linkedin": string, "email": string }
}
`;

export async function generatePortfolio(userId: string, prompt: string): Promise<any> {
    if (!ai) {
        throw new Error("Portfolio generation service is not initialized. Missing API key.");
    }

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: { parts: [{ text: prompt }] },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json"
            },
        });

        const tokenUsage = response.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'portfolio_generation', { tokenUsage });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Error:", error);
        throw error;
    }
}
