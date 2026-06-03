import { GenerateContentResponse } from "@google/genai";

const PROXY_URL = "https://us-west1-jastalk-firebase.cloudfunctions.net/geminiProxy";
const END_MARKER = "__END_GEMINI__";

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

/**
 * Calls the Cloud Function proxy to make Gemini API requests securely.
 * This hides the API key from the frontend code.
 */
export async function callGeminiProxy(payload: ProxyPayload): Promise<ProxyResponse> {
    const response = await fetch(PROXY_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            data: payload,
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
