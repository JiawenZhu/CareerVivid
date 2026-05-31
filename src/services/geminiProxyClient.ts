import { GenerateContentResponse } from "@google/genai";

const PROXY_URL = "https://us-west1-jastalk-firebase.cloudfunctions.net/geminiProxy";
const END_MARKER = "__END_GEMINI__";
const DEFAULT_TEXT_MODEL = "gemini-3.1-flash-lite";
const MODEL_ALIASES: Record<string, string> = {
    "gemini-3.1-flash-lite": DEFAULT_TEXT_MODEL,
    "gemini-3.1-flash-lite-preview": DEFAULT_TEXT_MODEL,
    "gemini-2.5-flash-lite-preview": DEFAULT_TEXT_MODEL,
    "gemini-2.5-flash-lite-preview-09-2025": DEFAULT_TEXT_MODEL,
    "gemini-2.5-flash-preview": "gemini-2.5-flash",
    "gemini-2.5-flash-preview-09-2025": "gemini-2.5-flash",
    "gemini-2.5-flash-preview-05-20": "gemini-2.5-flash",
    "gemini-3-flash-preview": "gemini-2.5-flash",
    "gemini-3.1-flash-preview": "gemini-2.5-flash",
    "gemini-2.5-pro-preview": "gemini-2.5-pro",
    "gemini-3.1-pro-preview": "gemini-2.5-pro",
};

interface ProxyPayload {
    modelName?: string;
    contents: any;
    config?: any;
    systemInstruction?: string;
}

interface ProxyResponse {
    response: GenerateContentResponse;
    text: string;
}

function normalizeGeminiPayload(payload: ProxyPayload): ProxyPayload {
    const rawContents = Array.isArray(payload.contents) ? payload.contents : [payload.contents];
    const systemTexts: string[] = [];
    const contents = rawContents.map((item) => {
        if (typeof item === "string") {
            return { role: "user", parts: [{ text: item }] };
        }
        if (!item || typeof item !== "object") {
            return { role: "user", parts: [{ text: String(item ?? "") }] };
        }
        if (item.role === "system" || item.role === "developer") {
            const text = Array.isArray(item.parts)
                ? item.parts.map((part: { text?: string }) => part.text || "").filter(Boolean).join("\n")
                : "";
            if (text) systemTexts.push(text);
            return null;
        }
        return {
            ...item,
            role: item.role === "assistant" ? "model" : item.role === "model" ? "model" : "user",
        };
    }).filter(Boolean);

    const extraSystemText = systemTexts.join("\n\n");
    return {
        ...payload,
        modelName: payload.modelName ? MODEL_ALIASES[payload.modelName] || payload.modelName : payload.modelName,
        contents,
        systemInstruction: extraSystemText
            ? [payload.systemInstruction, extraSystemText].filter(Boolean).join("\n\n")
            : payload.systemInstruction,
    };
}

/**
 * Calls the Cloud Function proxy to make Gemini API requests securely.
 * This hides the API key from the frontend code.
 */
export async function callGeminiProxy(payload: ProxyPayload): Promise<ProxyResponse> {
    const normalizedPayload = normalizeGeminiPayload(payload);
    const response = await fetch(PROXY_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            data: normalizedPayload,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini proxy request failed: ${response.status} ${errorText}`);
    }

    // The proxy streams the text response, followed by END_MARKER and the full JSON payload
    const fullText = await response.text();
    const markerIndex = fullText.indexOf(END_MARKER);

    if (markerIndex === -1) {
        throw new Error("Invalid proxy response format");
    }

    const streamedText = fullText.substring(0, markerIndex);
    const jsonPayload = fullText.substring(markerIndex + END_MARKER.length);

    try {
        const parsedPayload: ProxyResponse = JSON.parse(jsonPayload);
        return parsedPayload;
    } catch (error) {
        console.error("Failed to parse proxy response JSON:", jsonPayload);
        throw new Error("Failed to parse proxy response");
    }
}
