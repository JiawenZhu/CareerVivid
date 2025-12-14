import { PortfolioData } from '../types/portfolio';
import { GoogleGenAI } from "@google/genai";
import { trackUsage } from '../../../services/trackingService';

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || (window as any)?.ENV?.VITE_GOOGLE_API_KEY;

if (!apiKey) {
    console.warn("VITE_GOOGLE_API_KEY is not defined. Portfolio generation may not work.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SYSTEM_INSTRUCTION = `
You are an expert Portfolio Architect.
Your goal is to parse the user's input (which may be a text description, a Resume, or raw Code) and generate a structured JSON object for their portfolio website.

INPUT HANDLING STRATEGY:
1. **If Input is a Description**: Generate a creative portfolio matching the vibe (e.g., "Dark mode for a dev" -> create relevant mock projects).
2. **If Input is Code (HTML/React/JS)**: ANALYZE the code. Extract the developer's name, projects, skills, and bio directly from the code logic and comments. Map them to the schema.
3. **If Input is a Resume**: Extract the candidate's real details (Experience, Education, Skills) and populate the schema faithfully.

CRITICAL RULES:
1. Return ONLY valid JSON. No markdown, no explanations, no code blocks.
2. ALL fields must be present, even if empty.
3. Use realistic, professional content based on the prompt.
4. For thumbnailUrl, use Unsplash URLs: https://source.unsplash.com/800x600/?[keyword]

EXACT JSON SCHEMA - DO NOT DEVIATE:
{
  "templateId": "minimalist" | "visual" | "corporate",
  "title": string,
  "hero": {
    "headline": string,
    "subheadline": string,
    "ctaPrimaryLabel": string,
    "ctaPrimaryUrl": string,
    "ctaSecondaryLabel": string,
    "ctaSecondaryUrl": string
  },
  "about": string (2-3 paragraphs),
  "timeline": [
    {
      "id": string,
      "jobTitle": string,
      "employer": string,
      "startDate": string,
      "endDate": string,
      "city": string,
      "description": string
    }
  ],
  "education": [],
  "techStack": [
    {
      "id": string,
      "name": string,
      "level": "Expert" | "Advanced" | "Intermediate"
    }
  ],
  "projects": [
    {
      "id": string,
      "title": string,
      "description": string,
      "tags": string[],
      "thumbnailUrl": string,
      "demoUrl": string,
      "repoUrl": string
    }
  ],
  "socialLinks": [],
  "contactEmail": string,
  "theme": {
    "primaryColor": string (hex color),
    "darkMode": boolean
  }
}

EXAMPLES:
- For "minimalist" template: primaryColor="#2563eb", darkMode=false
- For "visual" template: primaryColor="#8b5cf6", darkMode=true  
- For "corporate" template: primaryColor="#0f172a", darkMode=false
`;

export const generatePortfolioFromPrompt = async (prompt: string, userId: string): Promise<PortfolioData> => {
    // If no AI client, fall back to basic generation
    if (!ai) {
        console.warn('[Portfolio] No AI client, using fallback generation');
        return generateFallbackPortfolio(prompt, userId);
    }

    try {
        console.log('[Portfolio] Generating with AI, prompt:', prompt);

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: { parts: [{ text: `User request: "${prompt}". Generate a complete portfolio JSON following the schema exactly.` }] },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json"
            },
        });

        const tokenUsage = response.usageMetadata?.totalTokenCount || 0;
        await trackUsage(userId, 'portfolio_generation', { tokenUsage });

        const text = response.text || "{}";
        console.log('[Portfolio] Raw AI response:', text.substring(0, 200));

        const aiData = JSON.parse(text);
        console.log('[Portfolio] AI generated data:', aiData);

        const now = Date.now();

        // Ensure all required IDs are present
        if (aiData.timeline) {
            aiData.timeline.forEach((item: any, idx: number) => {
                if (!item.id) item.id = `timeline_${idx}`;
            });
        }
        if (aiData.techStack) {
            aiData.techStack.forEach((item: any, idx: number) => {
                if (!item.id) item.id = `skill_${idx}`;
            });
        }
        if (aiData.projects) {
            aiData.projects.forEach((item: any, idx: number) => {
                if (!item.id) item.id = `project_${idx}`;
            });
        }

        // Merge AI data with required fields
        const portfolioData: PortfolioData = {
            id: crypto.randomUUID(),
            userId,
            createdAt: now,
            updatedAt: now,
            education: [],
            socialLinks: [],
            ...aiData
        };

        console.log('[Portfolio] Final portfolio data:', portfolioData);
        return portfolioData;
    } catch (error) {
        console.error('[Portfolio] AI generation error:', error);
        console.error('[Portfolio] Error details:', error instanceof Error ? error.message : String(error));
        // Fall back to basic generation on error
        return generateFallbackPortfolio(prompt, userId);
    }
};

// Fallback for when AI isn't available
function generateFallbackPortfolio(prompt: string, userId: string): PortfolioData {
    const lowerPrompt = prompt.toLowerCase();

    let templateId: 'minimalist' | 'visual' | 'corporate' = 'minimalist';
    if (lowerPrompt.includes('designer') || lowerPrompt.includes('creative')) {
        templateId = 'visual';
    } else if (lowerPrompt.includes('manager') || lowerPrompt.includes('executive')) {
        templateId = 'corporate';
    }

    const now = Date.now();

    return {
        id: crypto.randomUUID(),
        userId,
        title: `${prompt} Portfolio`,
        templateId,
        hero: {
            headline: 'Welcome to my Portfolio',
            subheadline: prompt,
            ctaPrimaryLabel: 'View My Work',
            ctaPrimaryUrl: '#projects',
            ctaSecondaryLabel: 'Contact Me',
            ctaSecondaryUrl: 'mailto:hello@example.com'
        },
        about: `I am passionate about ${prompt}. This is a generated portfolio.`,
        timeline: [
            { id: '1', jobTitle: 'Senior Role', employer: 'Tech Corp', startDate: '2021', endDate: 'Present', city: 'Remote', description: 'Leading key projects.' }
        ],
        education: [],
        techStack: [
            { id: '1', name: 'Communication', level: 'Expert' }
        ],
        projects: [
            { id: '1', title: 'Sample Project', description: 'A great project', tags: ['Tech'], thumbnailUrl: '', demoUrl: '', repoUrl: '' }
        ],
        socialLinks: [],
        contactEmail: '',
        theme: {
            primaryColor: '#2563eb',
            darkMode: false
        },
        createdAt: now,
        updatedAt: now
    };
}

