import { GoogleGenAI } from "@google/genai";

export const DEFAULT_VERTEX_TEXT_MODEL = "gemini-3.1-flash-lite";
export const DEFAULT_VERTEX_FLASH_MODEL = "gemini-2.5-flash";
export const DEFAULT_VERTEX_PRO_MODEL = "gemini-2.5-pro";

const VERTEX_MODEL_ALIASES: Record<string, string> = {
  "gemini-3.1-flash-lite": DEFAULT_VERTEX_TEXT_MODEL,
  "gemini-3.1-flash-lite-preview": DEFAULT_VERTEX_TEXT_MODEL,
  "gemini-2.5-flash-lite-preview": DEFAULT_VERTEX_TEXT_MODEL,
  "gemini-2.5-flash-lite-preview-09-2025": DEFAULT_VERTEX_TEXT_MODEL,
  "gemini-2.5-flash-preview": DEFAULT_VERTEX_FLASH_MODEL,
  "gemini-2.5-flash-preview-09-2025": DEFAULT_VERTEX_FLASH_MODEL,
  "gemini-2.5-flash-preview-05-20": DEFAULT_VERTEX_FLASH_MODEL,
  "gemini-3-flash-preview": DEFAULT_VERTEX_FLASH_MODEL,
  "gemini-3.1-flash-preview": DEFAULT_VERTEX_FLASH_MODEL,
  "gemini-2.5-pro-preview": DEFAULT_VERTEX_PRO_MODEL,
  "gemini-3.1-pro-preview": DEFAULT_VERTEX_PRO_MODEL,
};

export function resolveVertexModelName(model?: string): string {
  const requestedModel = model || DEFAULT_VERTEX_TEXT_MODEL;
  return VERTEX_MODEL_ALIASES[requestedModel] || requestedModel;
}

/**
 * Returns a configured GoogleGenAI instance.
 * Defaults to using Vertex AI (no API key needed) for server-side requests
 * using Application Default Credentials (ADC).
 * Optionally accepts a client-provided apiKey (e.g., from a user's CareerVivid session).
 */
export function getVertexLocationForModel(model?: string): string {
  const resolvedModel = resolveVertexModelName(model);
  if (resolvedModel.startsWith("gemini-3")) {
    return "global";
  }
  return process.env.GOOGLE_CLOUD_LOCATION || "us-west1";
}

export function getAIClient(apiKey?: string, location?: string): GoogleGenAI {
  // If an explicit API key is provided and it's NOT a CareerVivid proxy key, use it directly
  if (apiKey && !apiKey.startsWith('cv_live_')) {
    return new GoogleGenAI({ apiKey });
  }
  
  // Otherwise, use Vertex AI with default credentials
  // This automatically uses the service account attached to the Cloud Function
  return new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "jastalk-firebase",
    location: location || process.env.GOOGLE_CLOUD_LOCATION || "us-west1"
  });
}
