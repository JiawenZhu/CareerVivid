import { Modality, Session, LiveServerMessage } from "@google/genai";

type ConnectOptions = never;

export const connectLiveInterviewSession = (options: ConnectOptions) => {
    void options;
    throw new Error("Use the authenticated Vertex token interview session. Browser API-key live sessions are disabled.");
};

export { Modality, Session, LiveServerMessage };
