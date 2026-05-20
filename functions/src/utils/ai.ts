import { GoogleGenAI } from "@google/genai";

/**
 * Returns a configured GoogleGenAI instance.
 * Defaults to using Vertex AI (no API key needed) for server-side requests
 * using Application Default Credentials (ADC).
 * Optionally accepts a client-provided apiKey (e.g., from a user's CareerVivid session).
 */
export function getAIClient(apiKey?: string): GoogleGenAI {
  // If an explicit API key is provided and it's NOT a CareerVivid proxy key, use it directly
  if (apiKey && !apiKey.startsWith('cv_live_')) {
    return new GoogleGenAI({ apiKey });
  }
  
  // Otherwise, use Vertex AI with default credentials
  // This automatically uses the service account attached to the Cloud Function
  return new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "jastalk-firebase",
    location: process.env.GOOGLE_CLOUD_LOCATION || "us-west1"
  });
}
