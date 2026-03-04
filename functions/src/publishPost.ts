import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import cors from "cors";

const db = admin.firestore();
const corsHandler = cors({ origin: true });

// ── Allowed values ────────────────────────────────────────────────────────────
const ALLOWED_TYPES = ["article", "whiteboard", "portfolio"] as const;
const ALLOWED_FORMATS = ["blocknote_json", "markdown", "mermaid"] as const;

type PostType = typeof ALLOWED_TYPES[number];
type DataFormat = typeof ALLOWED_FORMATS[number];

// ── Dual-Mode Auth Middleware ─────────────────────────────────────────────────
async function resolveAuth(req: any): Promise<{ uid: string; displayName: string | null; email: string | null } | null> {
    // Method 1: Firebase ID Token (standard SPA clients)
    const authHeader: string = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
        try {
            const token = authHeader.slice(7);
            const decoded = await admin.auth().verifyIdToken(token);
            const userRecord = await admin.auth().getUser(decoded.uid);
            return {
                uid: decoded.uid,
                displayName: userRecord.displayName || null,
                email: userRecord.email || null,
            };
        } catch {
            return null;
        }
    }

    // Method 2: API Key (AI agents / MCP)
    const apiKey: string = (req.headers["x-api-key"] || "").toString().trim();
    if (apiKey) {
        // Scan users/{uid}/private/apiKeys for a matching key
        // NOTE: This uses a collectionGroup query for efficiency.
        // The Firestore collection path is: users/{uid}/private -> document "apiKeys" with field "key"
        // We must query across all users' private subcollections.
        try {
            const snap = await db
                .collectionGroup("private")
                .where("key", "==", apiKey)
                .limit(1)
                .get();

            if (snap.empty) return null;

            // The parent of "private" doc is the user doc
            const privateDoc = snap.docs[0];
            // Path: users/{uid}/private/apiKeys → parent.parent is /users/{uid}
            const userDocRef = privateDoc.ref.parent.parent;
            if (!userDocRef) return null;

            const uid = userDocRef.id;
            const userRecord = await admin.auth().getUser(uid);
            return {
                uid,
                displayName: userRecord.displayName || null,
                email: userRecord.email || null,
            };
        } catch {
            return null;
        }
    }

    return null;
}

// ── Payload Validation ────────────────────────────────────────────────────────
interface ValidationError { field: string; message: string }

function validatePayload(body: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!body.type) {
        errors.push({ field: "type", message: `Required. Must be one of: ${ALLOWED_TYPES.join(", ")}.` });
    } else if (!ALLOWED_TYPES.includes(body.type)) {
        errors.push({ field: "type", message: `Invalid value "${body.type}". Must be one of: ${ALLOWED_TYPES.join(", ")}.` });
    }

    if (!body.dataFormat) {
        errors.push({ field: "dataFormat", message: `Required. Must be one of: ${ALLOWED_FORMATS.join(", ")}.` });
    } else if (!ALLOWED_FORMATS.includes(body.dataFormat)) {
        errors.push({ field: "dataFormat", message: `Invalid value "${body.dataFormat}". Must be one of: ${ALLOWED_FORMATS.join(", ")}.` });
    }

    if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
        errors.push({ field: "title", message: "Required. Must be a non-empty string." });
    } else if (body.title.length > 200) {
        errors.push({ field: "title", message: "Must be 200 characters or fewer." });
    }

    if (body.content === undefined || body.content === null) {
        errors.push({ field: "content", message: "Required. Provide the article body as a markdown string or BlockNote JSON object." });
    }

    if (body.tags !== undefined) {
        if (!Array.isArray(body.tags)) {
            errors.push({ field: "tags", message: "Must be an array of strings." });
        } else if (body.tags.length > 5) {
            errors.push({ field: "tags", message: "Maximum 5 tags allowed." });
        } else if (!body.tags.every((t: any) => typeof t === "string")) {
            errors.push({ field: "tags", message: "Each tag must be a string." });
        }
    }

    return errors;
}

// ── Main Function ─────────────────────────────────────────────────────────────
export const publishPost = onRequest(
    {
        region: "us-west1",
        memory: "256MiB",
        timeoutSeconds: 30,
    },
    async (req, res) => {
        corsHandler(req as any, res as any, async () => {
            // Preflight
            if (req.method === "OPTIONS") {
                res.status(204).send("");
                return;
            }

            if (req.method !== "POST") {
                res.status(405).json({ error: "Method Not Allowed. Use POST." });
                return;
            }

            // ── Authenticate ──────────────────────────────────────────────
            const author = await resolveAuth(req);
            if (!author) {
                res.status(401).json({
                    error: "Unauthorized.",
                    hint: "Provide a Firebase ID token in the Authorization: Bearer <token> header, or a CareerVivid API key in the x-api-key header."
                });
                return;
            }

            // ── Validate Payload ─────────────────────────────────────────
            const body = req.body || {};
            const validationErrors = validatePayload(body);
            if (validationErrors.length > 0) {
                res.status(400).json({
                    error: "Invalid payload. Please fix the following fields and retry.",
                    fields: validationErrors,
                    example: {
                        type: "article",
                        dataFormat: "markdown",
                        title: "How I Built a 3-Service Microarchitecture",
                        content: "# Introduction\n\nHere is my article body...",
                        tags: ["architecture", "typescript", "firebase"]
                    }
                });
                return;
            }

            // ── Fetch author profile for display name ────────────────────
            let authorName = author.displayName || "CareerVivid Community";
            try {
                const userDoc = await db.collection("users").doc(author.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data() as any;
                    authorName = userData.displayName || userData.name || authorName;
                }
            } catch { /* non-fatal */ }

            // ── Build & Save Document ────────────────────────────────────
            const type: PostType = body.type;
            const dataFormat: DataFormat = body.dataFormat;

            const now = admin.firestore.FieldValue.serverTimestamp();
            const postData: Record<string, any> = {
                type,
                dataFormat,
                title: body.title.trim(),
                content: body.content,
                tags: body.tags || [],
                authorId: author.uid,
                authorName,
                authorEmail: author.email || null,
                isPublic: true,
                metrics: { likes: 0, comments: 0, views: 0 },
                source: "api",          // distinguish from SPA-created posts
                createdAt: now,
                updatedAt: now,
            };

            // Optional fields forwarded from payload
            if (body.coverImage) postData.coverImage = body.coverImage;
            if (body.assetId) postData.assetId = body.assetId;

            const docRef = await db.collection("community_posts").add(postData);

            res.status(201).json({
                success: true,
                postId: docRef.id,
                url: `https://careervivid.app/community/post/${docRef.id}`,
                message: "Post published successfully. It will appear in the community feed shortly."
            });
        });
    }
);
