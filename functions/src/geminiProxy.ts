import { onRequest } from "firebase-functions/v2/https";
import {
  DEFAULT_VERTEX_TEXT_MODEL,
  getAIClient,
  getVertexLocationForModel,
  resolveVertexModelName,
} from "./utils/ai";
import { secureCorsHandler } from "./utils/corsUtils.js";

const corsHandler = secureCorsHandler;
const END_MARKER = "__END_GEMINI__";
const DEFAULT_TEXT_MODEL = DEFAULT_VERTEX_TEXT_MODEL;

type GeminiContent = {
  role?: string;
  parts?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

const extractTextParts = (parts: Array<Record<string, unknown>> | undefined): string => {
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .filter(Boolean)
    .join("\n");
};

const appendSystemInstruction = (
  systemInstruction: unknown,
  systemTexts: string[]
): unknown => {
  const extraSystemText = systemTexts.filter(Boolean).join("\n\n");
  if (!extraSystemText) return systemInstruction;
  if (!systemInstruction) return extraSystemText;
  if (typeof systemInstruction === "string") {
    return `${systemInstruction}\n\n${extraSystemText}`;
  }
  if (
    typeof systemInstruction === "object" &&
    systemInstruction !== null &&
    Array.isArray((systemInstruction as GeminiContent).parts)
  ) {
    return {
      ...(systemInstruction as GeminiContent),
      parts: [
        ...((systemInstruction as GeminiContent).parts ?? []),
        { text: extraSystemText },
      ],
    };
  }
  return `${JSON.stringify(systemInstruction)}\n\n${extraSystemText}`;
};

const normalizeGeminiPayload = (
  contents: unknown,
  systemInstruction: unknown
): { contents: unknown; systemInstruction: unknown } => {
  const items = Array.isArray(contents) ? contents : [contents];
  const systemTexts: string[] = [];
  const normalizedContents = items
    .map((item): GeminiContent | null => {
      if (typeof item === "string") {
        return { role: "user", parts: [{ text: item }] };
      }

      if (!item || typeof item !== "object") {
        return { role: "user", parts: [{ text: String(item ?? "") }] };
      }

      const content = item as GeminiContent;
      const role = content.role;
      if (role === "system" || role === "developer") {
        const text = extractTextParts(content.parts);
        if (text) systemTexts.push(text);
        return null;
      }

      return {
        ...content,
        role: role === "assistant" ? "model" : role === "model" ? "model" : "user",
      };
    })
    .filter((item): item is GeminiContent => item !== null);

  return {
    contents: normalizedContents,
    systemInstruction: appendSystemInstruction(systemInstruction, systemTexts),
  };
};

export const streamGeminiResponse = onRequest(
  {
    timeoutSeconds: 300,
    region: "us-west1",
    memory: "1GiB",
    invoker: "public",
  },
  async (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
      }

      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const payload = req.body?.data ?? req.body ?? {};
      let {
        modelName = DEFAULT_TEXT_MODEL,
        contents,
        config,
        systemInstruction,
      } = payload;

      modelName = resolveVertexModelName(
        typeof modelName === "string" ? modelName : DEFAULT_TEXT_MODEL
      );

      if (!systemInstruction && config?.systemInstruction) {
        systemInstruction = config.systemInstruction;
        delete config.systemInstruction;
      }

      if (!contents) {
        res.status(400).send("Missing contents payload.");
        return;
      }

      const normalizedPayload = normalizeGeminiPayload(contents, systemInstruction);
      contents = normalizedPayload.contents;
      systemInstruction = normalizedPayload.systemInstruction;

      try {
        const isImageMode = config?.responseModalities?.includes("IMAGE") || modelName.startsWith("imagen") || modelName.includes("-image");
        const isImagenPredict = modelName.startsWith("imagen");
        const aiLocation = getVertexLocationForModel(modelName);

        if (isImageMode && isImagenPredict) {
          const ai = getAIClient(undefined, aiLocation);
          const promptText = typeof contents === 'string' ? contents : JSON.stringify(contents);
          
          const response = await ai.models.generateImages({
            model: modelName,
            prompt: promptText,
            config: {
              numberOfImages: 1
            }
          });

          const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
          const mimeType = response.generatedImages?.[0]?.image?.mimeType || "image/png";

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

        const ai = getAIClient(undefined, aiLocation);
        const finalConfig = { ...config };
        if (systemInstruction) {
          finalConfig.systemInstruction = systemInstruction;
        }

        let result: any;
        if (isImageMode) {
          result = await ai.models.generateContent({ 
            model: modelName, 
            contents, 
            config: finalConfig 
          });
        } else {
          result = await ai.models.generateContentStream({ 
            model: modelName, 
            contents, 
            config: finalConfig 
          });
        }

        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Transfer-Encoding", "chunked");

        let aggregatedText = "";
        let jsonResponse: any;

        if (isImageMode) {
          aggregatedText = result.text || "";
          jsonResponse = result;
          if (aggregatedText) res.write(aggregatedText);
        } else {
          for await (const chunk of result) {
            try {
              const chunkText = chunk.text;
              if (chunkText) {
                aggregatedText += chunkText;
                res.write(chunkText);
              }
            } catch (e) {
              // Ignore non-text chunks
            }
          }
          // Mock the response structure for the client
          jsonResponse = {
            candidates: [{
              content: {
                parts: [{ text: aggregatedText }]
              }
            }]
          };
        }

        const payloadJson = JSON.stringify({
          response: jsonResponse,
          text: aggregatedText,
        });

        res.write(`\n${END_MARKER}${payloadJson}`);
        res.end();
      } catch (error: any) {
        console.error("Gemini Proxy Error:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: error.message || "Gemini proxy failed" });
        } else {
          res.end();
        }
      }
    });
  }
);
