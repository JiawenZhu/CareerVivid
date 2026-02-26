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
        const isImageMode = config?.responseModalities?.includes("IMAGE") || modelName.startsWith("imagen") || modelName.includes("-image");
        const isImagenPredict = modelName.startsWith("imagen");

        if (isImageMode && isImagenPredict) {
          // Imagen models and specific image-preview models use the predict endpoint REST API
          const fetchFn = globalThis.fetch;
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${geminiApiKey.value()}`;

          // Format content into instances array
          const promptText = typeof contents === 'string' ? contents : JSON.stringify(contents);
          const bodyPayload = {
            instances: [{ prompt: promptText }],
            parameters: { sampleCount: 1 }
          };

          const fetchRes = await fetchFn(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyPayload)
          });

          const data = await fetchRes.json();
          if (!fetchRes.ok) {
            throw new Error(data.error?.message || "Imagen API Error");
          }

          const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
          const mimeType = data.predictions?.[0]?.mimeType || "image/png";

          if (!base64Image) {
            throw new Error("No image data returned from model API.");
          }

          // Return in the format expected by the frontend based on SDK response
          const mockedResponse = {
            candidates: [{
              content: {
                parts: [{
                  inlineData: { mimeType, data: base64Image }
                }]
              }
            }]
          };

          res.setHeader("Content-Type", "text/plain");
          res.setHeader("Transfer-Encoding", "chunked");
          res.write(`\n${END_MARKER}${JSON.stringify({ response: mockedResponse, text: "" })}`);
          res.end();
          return;
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey.value());
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: config,
          systemInstruction,
        });

        let result;
        if (isImageMode) {
          const response = await model.generateContent({ contents });
          result = { stream: [], response: Promise.resolve(response.response) }; // Mock stream interface
        } else {
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
            } catch (e) {
              // Ignore non-text chunks (like images in stream)
            }
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
