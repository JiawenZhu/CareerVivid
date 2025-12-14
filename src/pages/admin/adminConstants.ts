export const GEMINI_PRO_AVG_COST_PER_TOKEN = 0.00000875;
export const GEMINI_FLASH_AVG_COST_PER_TOKEN = 0.000000875;
export const IMAGE_GENERATION_COST = 0.0013;
export const LIVE_AUDIO_COST_PER_SECOND = 0.0004;

export const COST_MAP: Record<string, { perToken?: number, perEvent?: number, perSecond?: number }> = {
    // Pro Models (per token)
    'resume_parse_text': { perToken: GEMINI_PRO_AVG_COST_PER_TOKEN },
    'resume_parse_file': { perToken: GEMINI_PRO_AVG_COST_PER_TOKEN },
    'resume_generate_prompt': { perToken: GEMINI_PRO_AVG_COST_PER_TOKEN },
    'interview_analysis': { perToken: GEMINI_PRO_AVG_COST_PER_TOKEN, perSecond: LIVE_AUDIO_COST_PER_SECOND },

    // Flash Models (per token)
    'resume_suggestion': { perToken: GEMINI_FLASH_AVG_COST_PER_TOKEN },
    'ai_assistant_query': { perToken: GEMINI_FLASH_AVG_COST_PER_TOKEN },
    'question_generation': { perToken: GEMINI_FLASH_AVG_COST_PER_TOKEN },
    'job_parse_description': { perToken: GEMINI_FLASH_AVG_COST_PER_TOKEN },
    'job_prep_generation': { perToken: GEMINI_FLASH_AVG_COST_PER_TOKEN },
    'job_prep_regeneration': { perToken: GEMINI_FLASH_AVG_COST_PER_TOKEN },
    'portfolio_generation': { perToken: GEMINI_FLASH_AVG_COST_PER_TOKEN },
    'portfolio_refinement': { perToken: GEMINI_FLASH_AVG_COST_PER_TOKEN },

    // Image Models (per event)
    'image_generation': { perEvent: IMAGE_GENERATION_COST },

    // Events without direct token cost
    'sign_in': {}, 'sign_out': {}, 'interview_start': {}, 'resume_download': {}, 'checkout_session_start': {},
};
