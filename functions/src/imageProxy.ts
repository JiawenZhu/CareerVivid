import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { Buffer } from "buffer";

if (!admin.apps.length) {
  admin.initializeApp();
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const ALLOWED_IMAGE_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "careervivid.app",
  "www.careervivid.app",
  "images.unsplash.com",
  "plus.unsplash.com",
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
]);

const isAllowedHost = (hostname: string) =>
  ALLOWED_IMAGE_HOSTS.has(hostname) || hostname.endsWith(".googleusercontent.com");

const inferMimeType = (path: string, fallback = "image/png") => {
  const lower = path.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".png")) return "image/png";
  return fallback;
};

const parseFirebaseStorageUrl = (url: URL): { bucket: string; path: string } | null => {
  if (url.hostname !== "firebasestorage.googleapis.com") return null;
  const match = url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
  if (!match) return null;

  const objectPath = decodeURIComponent(match[2].split("/").join("/"));
  return {
    bucket: decodeURIComponent(match[1]),
    path: objectPath,
  };
};

const fetchRemoteImage = async (url: URL) => {
  const response = await fetch(url.toString(), {
    redirect: "follow",
    headers: {
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "user-agent": "CareerVivid Image Proxy/1.0",
    },
  });

  if (!response.ok) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      `Could not load image (${response.status}).`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = response.headers.get("content-type")?.split(";")[0] || inferMimeType(url.pathname);
  return { buffer, mimeType };
};

const readFirebaseStorageImage = async (url: URL) => {
  const parsed = parseFirebaseStorageUrl(url);
  if (!parsed) return null;

  try {
    const file = admin.storage().bucket(parsed.bucket).file(parsed.path);
    const [metadata] = await file.getMetadata();
    const [buffer] = await file.download();
    const mimeType = metadata.contentType || inferMimeType(parsed.path);
    return { buffer, mimeType };
  } catch (error) {
    console.warn("[resolveImageForAIEdit] Admin Storage read failed; falling back to URL fetch.", {
      bucket: parsed.bucket,
      path: parsed.path,
      error,
    });
    return null;
  }
};

export const resolveImageForAIEdit = functions
  .region("us-west1")
  .runWith({ timeoutSeconds: 60, memory: "512MB" })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in to edit images with AI.");
    }

    const imageUrl = typeof data?.imageUrl === "string" ? data.imageUrl.trim() : "";
    if (!imageUrl) {
      throw new functions.https.HttpsError("invalid-argument", "Missing image URL.");
    }

    let url: URL;
    try {
      url = new URL(imageUrl);
    } catch {
      throw new functions.https.HttpsError("invalid-argument", "Invalid image URL.");
    }

    if (url.protocol !== "https:" || !isAllowedHost(url.hostname)) {
      throw new functions.https.HttpsError("permission-denied", "This image source is not supported for AI editing.");
    }

    const resolved = (await readFirebaseStorageImage(url)) || (await fetchRemoteImage(url));
    const { buffer, mimeType } = resolved;

    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      throw new functions.https.HttpsError("resource-exhausted", "Use an image smaller than 8 MB.");
    }

    if (!mimeType.startsWith("image/")) {
      throw new functions.https.HttpsError("failed-precondition", "The selected file is not an image.");
    }

    return {
      base64: buffer.toString("base64"),
      mimeType,
      size: buffer.byteLength,
    };
  });
