import { GoogleGenAI } from "@google/genai";
import { PortfolioData } from "../types/portfolio";
import { trackUsage } from "../../../services/trackingService";

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || (window as any)?.ENV?.VITE_GOOGLE_API_KEY;

if (!apiKey) {
    console.warn("VITE_GOOGLE_API_KEY is not defined. AI Refinement may not work.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const GEMINI_MODEL = 'gemini-1.5-flash';

const REFINEMENT_INSTRUCTION = `
You are an expert Frontend Developer and UI/UX Designer.
Your goal is to MODIFY existing portfolio data based on a user's refinement request.

INPUT:
1. Current Portfolio Data (JSON)
2. User Instruction (e.g., "Change the background to dark", "Add a contact section")

RULES:
1. Return ONLY the fully updated valid JSON. No markdown, no explanations.
2. Maintain the structure strictly.
3. If the user asks for a style change (e.g. "dark mode"), update the 'theme' or 'colors' if available, or choose a more appropriate 'theme' value.
4. If the user asks for content changes, update the relevant strings.
5. If the user asks to ADD BUTTONS, use the 'hero.buttons' array. Each button has { id, label, url, variant ('primary'|'secondary'|'outline'|'ghost'), style?: { backgroundColor: '...', color: '...' } }.
   - Example: "Add a red button" -> style: { backgroundColor: 'red', color: 'white' }.
6. If the user asks for ANIMATIONS (e.g., "fade in", "slide up"), set 'theme.animations' = { enabled: true, type: 'fade'|'slide'|'zoom', duration: 'normal' }.
7. If the user asks for COOL EFFECTS (Matrix, Confetti, Tilt, Typewriter, Spin), set 'linkInBio.customStyle.effects':
   - "Confetti on click" -> { confetti: true }
   - "Matrix rain" -> { matrix: true }
   - "Typewriter name" -> { typewriter: true }
   - "Tilt buttons" -> { tilt: true }
   - "Spin avatar on hover" -> { spinAvatar: true }
8. If the user changes FONTS, set 'theme.fontFamily' (e.g., 'Inter', 'Playfair Display', 'Fira Code').
8. If the user asks for CUSTOM STYLING, you can provide 'theme.customCss' or 'style' props on buttons.
`;

export async function refinePortfolio(
    currentData: PortfolioData,
    instruction: string,
    imageContext?: string
): Promise<PortfolioData> {
    if (!ai) {
        throw new Error("AI Client not initialized (Missing API Key)");
    }

    try {
        let prompt = `
        CURRENT DATA:
        ${JSON.stringify(currentData, null, 2)}

        USER INSTRUCTION:
        "${instruction}"
        `;

        if (imageContext) {
            prompt += `\n[Context: User uploaded a reference image, but currently we are processing text intent only. Use the text instruction primarily]`;
        }

        prompt += `\nReturn the updated JSON:`;

        const generate = async (modelName: string) => {
            return await ai.models.generateContent({
                model: modelName,
                contents: { parts: [{ text: prompt }] },
                config: {
                    systemInstruction: REFINEMENT_INSTRUCTION,
                    responseMimeType: "application/json"
                },
            });
        };

        let response;
        const modelsToTry = [
            'gemini-3.0-flash',     // Newest Flash (if available)
            'gemini-2.5-flash',     // Current Standard GA
            'gemini-2.5-pro',       // Current Pro GA
            'gemini-2.0-flash',     // Previous Stable
            'gemini-1.5-flash-002'  // Long Term Support (if active)
        ];

        let lastError;
        for (const model of modelsToTry) {
            try {
                // console.log(`Attempting refinement with ${model}...`);
                response = await generate(model);
                break; // Success!
            } catch (e: any) {
                console.warn(`${model} failed:`, e.message);
                lastError = e;
                continue; // Try next
            }
        }

        if (!response) {
            throw new Error(`All Gemini models failed. Last error: ${lastError?.message || 'Unknown'}`);
        }

        const tokenUsage = response.usageMetadata?.totalTokenCount || 0;
        if (currentData.userId) {
            await trackUsage(currentData.userId, 'portfolio_refinement', { tokenUsage });
        }

        const text = response.text || "{}";
        const updatedData = JSON.parse(text);

        // Merge with ID logic to ensure we don't lose the ID or crucial metadata
        return {
            ...currentData,
            ...updatedData,
            id: currentData.id,
            userId: currentData.userId,
            updatedAt: Date.now()
        };

    } catch (error) {
        console.error("Refinement Error:", error);
        throw error;
    }
}
