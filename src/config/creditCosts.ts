/**
 * Centralized AI Credit Cost Configuration
 * Single source of truth for all AI feature pricing.
 * Users receive 300 credits/month on Pro Monthly plan.
 */
export const AI_CREDIT_COSTS = {
    // --- Resume ---
    RESUME_FULL_GENERATE: 5,     // Generate a full resume from a prompt
    RESUME_BULLET_EDIT: 1,       // AI-assisted bullet/suggestion edit
    RESUME_PARSE_TEXT: 1,        // Parse resume from pasted text
    RESUME_PARSE_FILE: 1,        // Parse resume from uploaded file
    RESUME_MATCH_ANALYSIS: 3,    // Match resume against a job description

    // --- Portfolio ---
    PORTFOLIO_GENERATE: 5,       // Full portfolio generation
    PORTFOLIO_REFINE: 2,         // AI refinement of an existing portfolio

    // --- Job Tracker ---
    JOB_MATCH_ANALYSIS: 3,       // Alias for resume_match_analysis in job context
    JOB_PARSE_DESCRIPTION: 1,    // Parse a raw job posting
    JOB_PREP_NOTES_SINGLE: 3,    // Generate prep notes for one section
    JOB_PREP_NOTES_ALL: 10,      // Generate all prep notes at once

    // --- Interview Studio ---
    INTERVIEW_STUDIO_SESSION: 10, // Initialize a new mock interview session
    INTERVIEW_QUESTION_GEN: 2,    // Generate interview questions

    // --- AI Image Generation ---
    IMAGE_STANDARD: 10,          // Standard image (gemini-2.5-flash-image)
    IMAGE_PRO: 20,               // Pro image (gemini-3-pro-image-preview)

    // --- Other AI Tools ---
    AI_ASSISTANT_QUERY: 1,       // General AI chat assistant
    DIAGRAM_GENERATION: 3,       // Generate a whiteboard/architecture diagram
} as const;

export type AICreditCostKey = keyof typeof AI_CREDIT_COSTS;
