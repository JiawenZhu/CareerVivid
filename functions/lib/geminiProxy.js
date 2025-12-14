"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamGeminiResponse = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const generative_ai_1 = require("@google/generative-ai");
const cors_1 = __importDefault(require("cors"));
const corsHandler = (0, cors_1.default)({ origin: true });
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
const END_MARKER = "__END_GEMINI__";
exports.streamGeminiResponse = (0, https_1.onRequest)({
    secrets: [geminiApiKey],
    timeoutSeconds: 300,
    region: "us-west1",
    memory: "1GiB",
    invoker: "public",
}, async (req, res) => {
    corsHandler(req, res, async () => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        if (req.method === "OPTIONS") {
            res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.status(204).end();
            return;
        }
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }
        const payload = req.body?.data ?? req.body ?? {};
        let { modelName = "gemini-2.5-flash", contents, config, systemInstruction, } = payload;
        if (!systemInstruction && config?.systemInstruction) {
            systemInstruction = config.systemInstruction;
            delete config.systemInstruction;
        }
        if (!contents) {
            res.status(400).send("Missing contents payload.");
            return;
        }
        try {
            const genAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey.value());
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: config,
                systemInstruction,
            });
            let result;
            const isImageMode = config?.responseModalities?.includes("IMAGE");
            if (isImageMode) {
                const response = await model.generateContent({ contents });
                result = { stream: [], response: Promise.resolve(response.response) }; // Mock stream interface
            }
            else {
                result = await model.generateContentStream({ contents });
            }
            res.setHeader("Content-Type", "text/plain");
            res.setHeader("Transfer-Encoding", "chunked");
            let aggregatedText = "";
            // Handle stream if it exists (for text)
            if (!isImageMode && result.stream) {
                for await (const chunk of result.stream) {
                    try {
                        const chunkText = chunk.text();
                        if (chunkText) {
                            aggregatedText += chunkText;
                            res.write(chunkText);
                        }
                    }
                    catch (e) {
                        // Ignore non-text chunks (like images in stream)
                    }
                }
            }
            const finalResponse = await result.response;
            const jsonResponse = typeof finalResponse.toJSON === "function"
                ? finalResponse.toJSON()
                : finalResponse;
            const payloadJson = JSON.stringify({
                response: jsonResponse,
                text: aggregatedText,
            });
            res.write(`\n${END_MARKER}${payloadJson}`);
            res.end();
        }
        catch (error) {
            console.error("Gemini Proxy Error:", error);
            if (!res.headersSent) {
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.status(500).json({ error: error.message || "Gemini proxy failed" });
            }
            else {
                res.end();
            }
        }
    });
});
//# sourceMappingURL=geminiProxy.js.map