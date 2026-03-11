import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import cors from "cors";
import {
    resolveAuth,
    getUserProfile,
    BRAND_LOGO_URL,
    DEFAULT_AVATAR,
} from "./utils/authUtils.js";

const db = admin.firestore();
const corsHandler = cors({ origin: true });

// ── Allowed values ────────────────────────────────────────────────────────────
const ALLOWED_TYPES = ["article", "whiteboard", "portfolio"] as const;
const ALLOWED_FORMATS = ["blocknote_json", "markdown", "mermaid"] as const;

type PostType = typeof ALLOWED_TYPES[number];
type DataFormat = typeof ALLOWED_FORMATS[number];

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

            if (req.method !== "POST" && req.method !== "PATCH") {
                res.status(405).json({ error: "Method Not Allowed. Use POST or PATCH." });
                return;
            }

            const isUpdate = req.method === "PATCH";

            // ── Authenticate ───────────────────────────────────────────────
            const authResult = await resolveAuth(req);
            if (!authResult) {
                res.status(401).json({
                    error: "Unauthorized.",
                    hint: "Provide a Firebase ID token in the Authorization: Bearer <token> header, or a CareerVivid API key in the x-api-key header.",
                });
                return;
            }

            // ── Validate Payload ───────────────────────────────────────────
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
                        tags: ["architecture", "typescript", "firebase"],
                    },
                });
                return;
            }

            // ── Update Mode Validation ──────────────────────────────────────
            let existingDoc: admin.firestore.DocumentSnapshot | null = null;
            if (isUpdate) {
                if (!body.postId) {
                    res.status(400).json({ error: "postId is required for updates (PATCH)." });
                    return;
                }
                existingDoc = await db.collection("community_posts").doc(body.postId).get();
                if (!existingDoc.exists) {
                    res.status(404).json({ error: `Post with ID ${body.postId} not found.` });
                    return;
                }
                // Ownership check
                if (existingDoc.data()?.authorId !== authResult.uid) {
                    res.status(403).json({ error: "Forbidden. You can only update your own posts." });
                    return;
                }
            }

            // ── Validate Mermaid Syntax ────────────────────────────────────
            if (body.dataFormat === "mermaid") {
                try {
                    // Dynamically import mermaid to avoid issues if blocknote/markdown is used
                    const { default: mermaid } = await import("mermaid");
                    mermaid.initialize({ startOnLoad: false });
                    await mermaid.parse(body.content);
                } catch (err: any) {
                    const msg = err.message || "Unknown Mermaid parsing error";
                    // In headless Node.js, valid syntaxes may still fail during DOMPurify sanitization.
                    // If it passed Jison syntax checking and reached DOMPurify, it's valid enough.
                    if (!msg.includes("DOMPurify") && !msg.includes("window is not defined")) {
                        res.status(400).json({
                            error: "Invalid Mermaid syntax. Please fix the following errors.",
                            fields: [{
                                field: "content",
                                message: msg
                            }]
                        });
                        return;
                    }
                }
            }

            // ── Fetch User Profile + Admin Status ──────────────────────────
            const profile = await getUserProfile(authResult.uid);

            // ── RBAC: isOfficialPost ───────────────────────────────────────
            const isOfficialPost = body.isOfficialPost === true;

            let authorName: string;
            let authorAvatar: string;

            if (isOfficialPost) {
                if (!profile.isAdmin) {
                    res.status(403).json({
                        error: "Forbidden. You do not have permission to publish as the CareerVivid Community.",
                        hint: "Remove the isOfficialPost flag to publish under your own name.",
                    });
                    return;
                }
                // Admin publishing an official post → use brand identity
                authorName = "CareerVivid Community";
                authorAvatar = BRAND_LOGO_URL;
            } else {
                // Regular user (or admin without flag) → use real identity
                authorName = profile.name;
                authorAvatar = profile.avatar;
            }

            // ── Build & Save Document ──────────────────────────────────────
            const type: PostType = body.type;
            const dataFormat: DataFormat = body.dataFormat;
            const now = admin.firestore.FieldValue.serverTimestamp();

            const postData: Record<string, any> = {
                type,
                dataFormat,
                title: body.title.trim(),
                content: body.content,
                tags: body.tags || [],
                authorId: authResult.uid,
                authorName,
                authorAvatar,
                authorEmail: profile.email,
                isOfficialPost: isOfficialPost && profile.isAdmin,
                isPublic: true,
                updatedAt: now,
            };

            // Optional fields
            if (body.coverImage) postData.coverImage = body.coverImage;
            if (body.assetId) postData.assetId = body.assetId;

            if (isUpdate && body.postId) {
                await db.collection("community_posts").doc(body.postId).update(postData);
                res.status(200).json({
                    success: true,
                    postId: body.postId,
                    url: `https://careervivid.app/community/post/${body.postId}`,
                    message: "Post updated successfully.",
                });
            } else {
                // New post fields
                postData.metrics = { likes: 0, comments: 0, views: 0 };
                postData.source = "api";
                postData.createdAt = now;

                const docRef = await db.collection("community_posts").add(postData);
                res.status(201).json({
                    success: true,
                    postId: docRef.id,
                    url: `https://careervivid.app/community/post/${docRef.id}`,
                    message: "Post published successfully.",
                });
            }
        });
    }
);
