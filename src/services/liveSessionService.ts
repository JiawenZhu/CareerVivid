import { GoogleGenAI, Modality, Session, LiveServerMessage } from "@google/genai";

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || (window as any)?.ENV?.VITE_GOOGLE_API_KEY;

if (!apiKey) {
    console.warn("VITE_GOOGLE_API_KEY is not defined. Live interview features may not work.");
}

const liveAiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;

type ConnectOptions = Parameters<NonNullable<typeof liveAiClient>['live']['connect']>[0];

export const connectLiveInterviewSession = (options: ConnectOptions) => {
    if (!liveAiClient) {
        throw new Error("Live interview service is not initialized. Missing API key.");
    }
    return liveAiClient.live.connect(options);
};

export { Modality, Session, LiveServerMessage };
