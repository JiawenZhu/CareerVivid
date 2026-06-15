import { GoogleGenAI } from "@google/genai";

export const DEFAULT_VERTEX_TEXT_MODEL = process.env.DEFAULT_VERTEX_TEXT_MODEL || "gemini-2.5-flash-lite";

export function resolveVertexModelName(model?: string): string {
  return model || DEFAULT_VERTEX_TEXT_MODEL;
}

export function getVertexLocationForModel(model?: string): string {
  if (model && (model.includes("gemini-3.5") || model.includes("gemini-3.1"))) {
    return "us-central1";
  }
  return process.env.GOOGLE_CLOUD_LOCATION || process.env.GCLOUD_LOCATION || "us-west1";
}

/**
 * Returns a configured GoogleGenAI instance.
 * Defaults to using Vertex AI (no API key needed) for server-side requests
 * using Application Default Credentials (ADC).
 * Optionally accepts a client-provided apiKey (e.g., from a user's CareerVivid session).
 */
export function getAIClient(apiKey?: string, location = getVertexLocationForModel()): GoogleGenAI {
  // If an explicit API key is provided and it's NOT a CareerVivid proxy key, use it directly
  if (apiKey && !apiKey.startsWith('cv_live_')) {
    return new GoogleGenAI({ apiKey });
  }
  
  // Otherwise, use Vertex AI with default credentials
  // This automatically uses the service account attached to the Cloud Function
  return new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "jastalk-firebase",
    location
  });
}
