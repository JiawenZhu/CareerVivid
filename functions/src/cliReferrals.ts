/**
 * CLI Referrals API — Backend for `cv referral`
 *
 * Authentication: x-api-key header
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import { resolveAuth } from "./utils/authUtils.js";

const corsHandler = cors({ origin: true });
const db = admin.firestore();

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReferredUser {
    uid: string;
    email: string;
    signupDate: any;
}

interface ReferralStatsResult {
    code: string;
    totalReferred: number;
    maxReferrals: number;
    referredUsers: ReferredUser[];
}

/**
 * Generate a random 8-character alphanumeric referral code
 */
function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Ensure unique referral code and create it in Firestore
 */
async function ensureUniqueReferralCode(userId: string): Promise<string> {
    let code = generateReferralCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const codeDoc = await db.collection('referralCodes').doc(code).get();
        if (!codeDoc.exists) {
            // Code is unique, create it
            await db.collection('referralCodes').doc(code).set({
                code,
                userId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                usedCount: 0,
                maxUses: 5,
                referredUsers: []
            });

            // Update user profile with merge to create nested fields
            await db.collection('users').doc(userId).set({
                referralCode: code,
                referralStats: {
                    totalReferred: 0,
                    maxReferrals: 5,
                    referredUsers: []
                }
            }, { merge: true });

            return code;
        }
        code = generateReferralCode();
        attempts++;
    }

    throw new Error('Failed to generate unique referral code');
}

// ──────────────────────────────────────────────────────────────────────────────
// GET /cliReferralStats
// Returns: { code, totalReferred, maxReferrals, referredUsers }
// ──────────────────────────────────────────────────────────────────────────────

export const cliReferralStats = functions.region("us-west1").runWith({
    timeoutSeconds: 30,
    memory: "256MB",
}).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") {
            res.set("Access-Control-Allow-Origin", "*");
            res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
            res.set("Access-Control-Allow-Headers", "Content-Type, x-api-key");
            res.status(204).send("");
            return;
        }
        if (req.method !== "GET") { res.status(405).json({ error: "Method Not Allowed" }); return; }

        const user = await resolveAuth(req);
        if (!user) { res.status(401).json({ error: "Unauthorized. Invalid API key or missing authentication." }); return; }

        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data() || {};

            let code = userData.referralCode;
            if (!code) {
                // If the user doesn't have a referral code yet, mint one!
                code = await ensureUniqueReferralCode(user.uid);
                // Also initialize their referral stats locally to match what we just created
                userData.referralStats = {
                    totalReferred: 0,
                    maxReferrals: 5,
                    referredUsers: []
                };
            }

            const stats = userData.referralStats || {
                totalReferred: 0,
                maxReferrals: 5,
                referredUsers: []
            };

            // Get detailed referred users info from referralCodes collection
            let referredUsers: ReferredUser[] = [];
            if (code) {
                const codeDoc = await db.collection('referralCodes').doc(code).get();
                if (codeDoc.exists) {
                    const data = codeDoc.data();
                    referredUsers = data?.referredUsers || [];

                    // Format dates for CLI consumption
                    referredUsers = referredUsers.map(u => ({
                        ...u,
                        signupDate: u.signupDate?.toDate?.()?.toISOString() || null
                    }));
                }
            }

            const result: ReferralStatsResult = {
                code,
                totalReferred: stats.totalReferred || 0,
                maxReferrals: stats.maxReferrals || 5,
                referredUsers
            };

            res.json(result);
        } catch (err: any) {
            console.error("[cliReferralStats] Error:", err.message);
            res.status(500).json({ error: \`Failed to get referral stats: \${err.message}\` });
        }
    });
});
