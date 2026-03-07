/**
 * GET /verifyAuth
 *
 * Lightweight endpoint used by the CLI and other clients to validate
 * an API key or Firebase ID token and retrieve the user's identity.
 *
 * Auth:
 *   - x-api-key header  (CLI / AI agents)
 *   - Authorization: Bearer <token>  (SPA clients)
 *
 * Response 200:
 * {
 *   "userId": "abc123",
 *   "name": "Jane Doe",
 *   "email": "jane@example.com",
 *   "avatar": "https://...",
 *   "role": "admin" | "user" | ...,
 *   "isAdmin": true | false
 * }
 */

import { onRequest } from "firebase-functions/v2/https";
import cors from "cors";
import { resolveAuth, getUserProfile } from "./utils/authUtils.js";

const corsHandler = cors({ origin: true });

export const verifyAuth = onRequest(
    {
        region: "us-west1",
        memory: "256MiB",
        timeoutSeconds: 15,
    },
    async (req, res) => {
        corsHandler(req as any, res as any, async () => {
            if (req.method === "OPTIONS") {
                res.status(204).send("");
                return;
            }

            if (req.method !== "GET") {
                res.status(405).json({ error: "Method Not Allowed. Use GET." });
                return;
            }

            const authResult = await resolveAuth(req);
            if (!authResult) {
                res.status(401).json({
                    error: "Unauthorized. Invalid or missing credentials.",
                    hint: "Provide 'x-api-key' header or 'Authorization: Bearer <token>'.",
                });
                return;
            }

            const profile = await getUserProfile(authResult.uid);

            res.status(200).json({
                userId: profile.uid,
                name: profile.name,
                email: profile.email,
                avatar: profile.avatar,
                role: profile.role,
                isAdmin: profile.isAdmin,
            });
        });
    }
);
