import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";

const corsHandler = cors({ origin: true });
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const END_MARKER = "__END_GEMINI__";

export const streamGeminiResponse = onRequest(
  {
    secrets: [geminiApiKey],
    timeoutSeconds: 300,
    region: "us-west1",
    memory: "1GiB",
    invoker: "public",
  },
  async (req, res) => {
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
      let {
        modelName = "gemini-2.5-flash",
        contents,
        config,
        systemInstruction,
      } = payload;

      if (!systemInstruction && config?.systemInstruction) {
        systemInstruction = config.systemInstruction;
        delete config.systemInstruction;
      }

      if (!contents) {
        res.status(400).send("Missing contents payload.");
        return;
      }

      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey.value());
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: config,
          systemInstruction,
        });

        const result = await model.generateContentStream({ contents });
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Transfer-Encoding", "chunked");

        let aggregatedText = "";
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            aggregatedText += chunkText;
            res.write(chunkText);
          }
        }

        const finalResponse = await result.response;
        const jsonResponse =
          typeof (finalResponse as any).toJSON === "function"
            ? (finalResponse as any).toJSON()
            : finalResponse;

        const payloadJson = JSON.stringify({
          response: jsonResponse,
          text: aggregatedText,
        });

        res.write(`\n${END_MARKER}${payloadJson}`);
        res.end();
      } catch (error: any) {
        console.error("Gemini Proxy Error:", error);
        if (!res.headersSent) {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.status(500).json({ error: error.message || "Gemini proxy failed" });
        } else {
          res.end();
        }
      }
    });
  }
);
