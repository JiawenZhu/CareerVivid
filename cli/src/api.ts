/**
 * API client — thin fetch wrapper around the CareerVivid API.
 *
 * All functions throw on network errors; on HTTP errors they return
 * a structured ApiError for clean CLI error messages.
 */

import { getApiKey, getApiUrl, DEFAULT_API_URL } from "./config.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PostType = "article" | "whiteboard";
export type DataFormat = "markdown" | "mermaid";

export interface PublishPayload {
    type: PostType;
    dataFormat: DataFormat;
    title: string;
    content: string;
    tags?: string[];
    coverImage?: string;
    isOfficialPost?: boolean;
}

export interface PublishResult {
    success: boolean;
    postId: string;
    url: string;
    message: string;
    title?: string;
}

export interface VerifyResult {
    userId: string;
    name: string;
    email: string | null;
    avatar: string;
    role: string;
    isAdmin: boolean;
}

export interface ApiError {
    isError: true;
    statusCode: number;
    message: string;
    fields?: { field: string; message: string }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CLI_VERSION = "1.10.0";

function requireApiKey(): string {
    const key = getApiKey();
    if (!key) {
        throw new Error(
            "No API key configured.\n\n" +
            "  Human users:  cv login\n" +
            "  AI agents:    cv auth set-key <key>\n" +
            "  Environment:  export CV_API_KEY=cv_live_...\n\n" +
            "  Get your key at: https://careervivid.app/#/developer"
        );
    }
    return key;
}

function getVerifyUrl(): string {
    // The verify endpoint lives at a fixed Cloud Function URL, separate from the publish endpoint.
    // Use env override if set.
    return (
        process.env.CV_VERIFY_URL ||
        "https://us-west1-jastalk-firebase.cloudfunctions.net/verifyAuth"
    );
}

async function apiRequest<T>(
    method: "GET" | "POST" | "PATCH",
    path: string,
    body?: unknown,
    key?: string
): Promise<T | ApiError> {
    const apiKey = key ?? requireApiKey();
    const baseUrl = getApiUrl().replace(/\/+$/, "");
    const url = `${baseUrl}${path === "" ? "" : "/" + path}`;

    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "User-Agent": `careervivid-cli/${CLI_VERSION}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch { parsed = { message: text }; }

    if (!response.ok) {
        return {
            isError: true,
            statusCode: response.status,
            message: parsed.error || parsed.message || `HTTP ${response.status}`,
            fields: parsed.fields,
        } as ApiError;
    }

    return parsed as T;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function publishPost(
    payload: PublishPayload,
    dryRun = false
): Promise<PublishResult | ApiError> {
    if (dryRun) {
        if (!payload.title || payload.title.trim() === "") {
            return { isError: true, statusCode: 0, message: "Title is required." };
        }
        if (!payload.content || payload.content.trim() === "") {
            return { isError: true, statusCode: 0, message: "Content is required." };
        }
        return {
            success: true,
            postId: "dry-run-no-id",
            url: "https://careervivid.app/community (dry-run — not published)",
            message: "Dry run passed. No post was created.",
        };
    }
    return apiRequest<PublishResult>("POST", "publish", payload);
}

export async function getPost(
    postId: string
): Promise<PublishResult | ApiError> {
    return apiRequest<PublishResult>("GET", `publish/${postId}`);
}

export async function updatePost(
    postId: string,
    payload: Partial<PublishPayload>
): Promise<PublishResult | ApiError> {
    return apiRequest<PublishResult>("PATCH", "publish", { ...payload, postId });
}

/**
 * Verify an API key against the /verifyAuth endpoint.
 * Optionally accepts a specific key (for set-key validation).
 */
export async function verifyKey(key?: string): Promise<VerifyResult | ApiError> {
    const apiKey = key ?? getApiKey();
    if (!apiKey) {
        return {
            isError: true,
            statusCode: 0,
            message: "No API key provided.",
        };
    }

    const verifyUrl = getVerifyUrl();
    try {
        const response = await fetch(verifyUrl, {
            method: "GET",
            headers: {
                "x-api-key": apiKey,
                "User-Agent": `careervivid-cli/${CLI_VERSION}`,
            },
        });

        const text = await response.text();
        let parsed: any = {};
        try { parsed = JSON.parse(text); } catch { parsed = { message: text }; }

        if (!response.ok) {
            return {
                isError: true,
                statusCode: response.status,
                message: parsed.error || parsed.message || `HTTP ${response.status}`,
            };
        }

        return parsed as VerifyResult;
    } catch (err: any) {
        return {
            isError: true,
            statusCode: 0,
            message: `Network error: ${err.message}`,
        };
    }
}

/**
 * @deprecated Use verifyKey() instead for richer identity information.
 */
export async function pingAuth(): Promise<{ ok: boolean; error?: string }> {
    const result = await verifyKey();
    if (isApiError(result)) {
        return { ok: false, error: result.message };
    }
    return { ok: true };
}

export async function initPortfolio(title?: string, templateId?: string): Promise<{ success: boolean; portfolioId: string; url: string } | ApiError> {
    return apiRequest<{ success: boolean; portfolioId: string; url: string }>("POST", "portfolio/init", { title, templateId });
}

export async function updatePortfolioProjects(portfolioId: string, projects: any[], techStack?: string[]): Promise<{ success: boolean; message: string } | ApiError> {
    return apiRequest<{ success: boolean; message: string }>("PATCH", "portfolio/projects", { portfolioId, projects, techStack });
}

export async function updatePortfolioHero(portfolioId: string, hero?: any, theme?: any, seoMetadata?: any): Promise<{ success: boolean; message: string } | ApiError> {
    return apiRequest<{ success: boolean; message: string }>("PATCH", "portfolio/hero", { portfolioId, hero, theme, seoMetadata });
}

export async function uploadPortfolioAsset(image: string, path: string, mimeType: string): Promise<{ success: boolean; downloadUrl: string } | ApiError> {
    return apiRequest<{ success: boolean; downloadUrl: string }>("POST", "portfolio/assets", { image, path, mimeType });
}

export function isApiError(v: unknown): v is ApiError {
    return typeof v === "object" && v !== null && (v as any).isError === true;
}
