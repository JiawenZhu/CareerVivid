/**
 * Centralized AI Credit Cost Configuration
 * Single source of truth for all AI feature pricing.
 *
 * Plan overview:
 *  - Free:       100 AI credits / month  (Gemini models only)
 *  - Pro:      1,000 AI credits / month
 *  - Max:     10,000 AI credits / month
 *  - Enterprise: 5,000 AI credits / seat / month (pooled)
 */

// --- Tier Limits (Monthly) ---
export const FREE_PLAN_CREDIT_LIMIT = 100;        // Free tier: 100 credits/mo
export const PRO_PLAN_CREDIT_LIMIT = 1000;        // Pro: $9/mo → 1,000 credits
export const PRO_MAX_PLAN_CREDIT_LIMIT = 10000;   // Max: $29/mo → 10,000 credits
export const ENTERPRISE_PLAN_CREDIT_LIMIT = 5000; // Enterprise: $12/seat (pooled)

// --- CLI Agent costs (per AI round-trip) ---
export const CLI_AGENT_COSTS = {
    'gemini-3.1-flash-lite-preview': 0.5, // Fastest — best value
    'gemini-2.5-flash': 1,                // Default — balanced
    'gemini-3.1-pro-preview': 2,          // Deep reasoning
} as const;

export const AI_CREDIT_COSTS = {
    // --- CLI Agent (per turn) ---
    CLI_AGENT_FLASH_LITE: 0.5,   // gemini-3.1-flash-lite-preview
    CLI_AGENT_FLASH: 1,          // gemini-2.5-flash
    CLI_AGENT_PRO: 2,            // gemini-3.1-pro-preview

    // --- Job Tools ---
    JOB_SEARCH: 1,               // Search & score jobs against resume
    RESUME_TAILOR: 5,            // AI resume tailoring
    JOB_PREP_NOTES_ALL: 10,      // Targeted job prep notes

    // --- Developer Tools ---
    CLI_PUBLISH: 0,              // Markdown/Mermaid via CLI (free)
    REACTFLOW_CONVERSION: 5,     // Snapshot to ReactFlow
    ARCHITECTURE_AUTO_GEN: 10,   // Architecture Auto-Gen
    CODE_REVIEW: 5,              // Automated Code Review

    // --- Portfolio & Content ---
    PORTFOLIO_GENERATE: 5,
    PORTFOLIO_REFINE: 2,
    BLOG_COVER_STANDARD: 10,
    BLOG_COVER_PRO: 20,
    BULLET_EDIT: 2,              // AI Bullet refinement

    // --- Interview Studio ---
    TECH_INTERVIEW_VOICE: 15,    // Technical System Design Voice Interview
    INTERVIEW_QUESTION_GEN: 2,

    // --- AI Image Generation ---
    IMAGE_STANDARD: 10,
    IMAGE_PRO: 20,
} as const;

export type AICreditCostKey = keyof typeof AI_CREDIT_COSTS;
