/**
 * Shared authentication utilities for CareerVivid Cloud Functions.
 *
 * Provides:
 *   - resolveAuth: Accepts Firebase ID token OR x-api-key header
 *   - getUserProfile: Fetches user document + admin status
 */

import * as admin from "firebase-admin";

const db = admin.firestore();

export const BRAND_LOGO_URL =
    "https://firebasestorage.googleapis.com/v0/b/careervivid-prod.appspot.com/o/brand%2Flogo-avatar.png?alt=media";

export const DEFAULT_AVATAR =
    "https://ui-avatars.com/api/?name=Anonymous+Developer&background=3b82f6&color=fff";

// ── Auth resolution ───────────────────────────────────────────────────────────

export async function resolveAuth(req: any): Promise<{ uid: string } | null> {
    // Method 1: Firebase ID Token (standard SPA clients)
    const authHeader: string = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
        try {
            const token = authHeader.slice(7);
            const decoded = await admin.auth().verifyIdToken(token);
            return { uid: decoded.uid };
        } catch {
            return null;
        }
    }

    // Method 2: API Key (AI agents / MCP / CLI)
    const apiKey: string = (req.headers["x-api-key"] || "").toString().trim();
    if (apiKey) {
        try {
            const snap = await db
                .collectionGroup("private")
                .where("key", "==", apiKey)
                .limit(1)
                .get();

            if (snap.empty) return null;

            const privateDoc = snap.docs[0];
            const userDocRef = privateDoc.ref.parent.parent;
            if (!userDocRef) return null;

            return { uid: userDocRef.id };
        } catch (err: any) {
            console.error("resolveAuth collectionGroup error:", err.message);
            return null;
        }
    }

    return null;
}

// ── User Profile ──────────────────────────────────────────────────────────────

export interface UserProfile {
    uid: string;
    name: string;
    email: string | null;
    avatar: string;
    role: string;
    isAdmin: boolean;
}

export async function getUserProfile(uid: string): Promise<UserProfile> {
    // Fetch user document + admin document in parallel
    const [userDoc, adminDoc] = await Promise.all([
        db.collection("users").doc(uid).get(),
        db.collection("admins").doc(uid).get(),
    ]);

    const isAdmin = adminDoc.exists;

    let authRecord: admin.auth.UserRecord | null = null;
    try {
        console.log(`[DEBUG authUtils] Fetching Firebase Auth record for UID: ${uid}`);
        authRecord = await admin.auth().getUser(uid);
        console.log(`[DEBUG authUtils] Auth record retrieved: displayName=${authRecord.displayName}, email=${authRecord.email}`);
    } catch (err) {
        console.error(`[DEBUG authUtils] getUserProfile auth fetch error for UID ${uid}:`, err);
    }

    const data = userDoc.exists ? (userDoc.data() as any) : {};
    console.log(`[DEBUG authUtils] Firestore data present: ${userDoc.exists}, name=${data.displayName || data.name}`);

    let email = data.email || null;
    if (!email && authRecord) {
        email = authRecord.email || null;
    }

    let name = data.displayName || data.name;
    if (!name && authRecord) {
        name = authRecord.displayName;
    }

    // Fallback block if name is still empty
    if (!name) {
        if (email) {
            name = email.split('@')[0];
        } else {
            name = "Developer"; // Slightly cleaner than "Anonymous Developer" or just the fallback below
        }
    }

    console.log(`[DEBUG authUtils] Final resolved name before fallback: ${name}`);
    name = name || "Community Member";

    let avatar = data.photoURL || data.avatar;
    if (!avatar && authRecord) {
        avatar = authRecord.photoURL;
    }
    if (!avatar) {
        avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff`;
    }

    const role = isAdmin ? "admin" : data.role || "user";

    return { uid, name, email, avatar, role, isAdmin };
}
