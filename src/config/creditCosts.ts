/**
 * Centralized AI Credit Cost Configuration
 * Single source of truth for all AI feature pricing.
 * Users receive 300 credits/month on Pro Monthly plan.
 */
// --- Tier Limits (Monthly) ---
export const FREE_PLAN_CREDIT_LIMIT = 50;    // 100 on signup, 50 recurring/mo
export const PRO_PLAN_CREDIT_LIMIT = 666;   // $6/mo
export const PRO_MAX_PLAN_CREDIT_LIMIT = 888; // $8/mo
export const ENTERPRISE_PLAN_CREDIT_LIMIT = 1200; // $12/seat (Pooled)

export const AI_CREDIT_COSTS = {
    // --- Developer Tools ---
    CLI_PUBLISH: 0,              // Markdown/Mermaid via CLI
    REACTFLOW_CONVERSION: 5,     // Snapshot to ReactFlow
    ARCHITECTURE_AUTO_GEN: 10,   // Architecture Auto-Gen
    CODE_REVIEW: 5,              // Automated Code Review (Portfolio Review)

    // --- Portfolio & Content ---
    PORTFOLIO_GENERATE: 5,
    PORTFOLIO_REFINE: 2,
    BLOG_COVER_STANDARD: 10,
    BLOG_COVER_PRO: 20,
    BULLET_EDIT: 2,              // AI Bullet refinement (Bullet/Refinement Edit)

    // --- Interview Studio ---
    TECH_INTERVIEW_VOICE: 15,    // Technical System Design Voice Interview
    INTERVIEW_QUESTION_GEN: 2,

    // --- AI Image Generation ---
    IMAGE_STANDARD: 10,
    IMAGE_PRO: 20,
} as const;

export type AICreditCostKey = keyof typeof AI_CREDIT_COSTS;
