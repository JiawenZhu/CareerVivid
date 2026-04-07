/**
 * Config Manager — reads/writes ~/.careervividrc.json
 *
 * Stored fields:
 *   apiKey   — cv_live_... key
 *   apiUrl   — override for the publish endpoint (default: prod)
 */

import { homedir } from "os";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";

export const CONFIG_FILE = join(homedir(), ".careervividrc.json");

export const DEFAULT_API_URL = "https://careervivid.app/api";

export interface CareerVividConfig {
    apiKey?: string;
    apiUrl?: string;
    geminiKey?: string; // Gemini API key for the agent
    targetCompanies?: string;
}

export function loadConfig(): CareerVividConfig {
    if (!existsSync(CONFIG_FILE)) return {};
    try {
        const raw = readFileSync(CONFIG_FILE, "utf-8");
        return JSON.parse(raw) as CareerVividConfig;
    } catch {
        return {};
    }
}

export function saveConfig(config: CareerVividConfig): void {
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
}

export function getApiKey(): string | undefined {
    // Priority: env var > config file
    return process.env.CV_API_KEY || loadConfig().apiKey;
}

/** Gemini API key used by `cv agent`. Priority: GEMINI_API_KEY env var > geminiKey in config. */
export function getGeminiKey(): string | undefined {
    return process.env.GEMINI_API_KEY || loadConfig().geminiKey;
}

export function getApiUrl(): string {
    return process.env.CV_API_URL || loadConfig().apiUrl || DEFAULT_API_URL;
}

export function setConfigValue(key: keyof CareerVividConfig, value: string): void {
    const current = loadConfig();
    (current as Record<string, string>)[key] = value;
    saveConfig(current);
}
