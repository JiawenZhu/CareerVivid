import { db, analytics } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, increment, setDoc } from 'firebase/firestore';
import { TrackEventType } from '../types';
import { logEvent } from 'firebase/analytics';
import { AI_CREDIT_COSTS } from '../config/creditCosts';



interface TrackMetadata {
  tokenUsage?: number;
  deductCredits?: number;
  [key: string]: any;
}

// Map event types to their weighted credit costs.
// Falls back to 1 credit for any unlisted event.
const EVENT_CREDIT_MAP: Partial<Record<TrackEventType, number>> = {
  'resume_generate_prompt': AI_CREDIT_COSTS.RESUME_FULL_GENERATE,
  'resume_suggestion': AI_CREDIT_COSTS.RESUME_BULLET_EDIT,
  'resume_parse_text': AI_CREDIT_COSTS.RESUME_PARSE_TEXT,
  'resume_parse_file': AI_CREDIT_COSTS.RESUME_PARSE_FILE,
  'resume_match_analysis': AI_CREDIT_COSTS.RESUME_MATCH_ANALYSIS,
  'portfolio_generation': AI_CREDIT_COSTS.PORTFOLIO_GENERATE,
  'portfolio_refinement': AI_CREDIT_COSTS.PORTFOLIO_REFINE,
  'job_parse_description': AI_CREDIT_COSTS.JOB_PARSE_DESCRIPTION,
  'job_prep_generation': AI_CREDIT_COSTS.JOB_PREP_NOTES_SINGLE,
  'job_prep_regeneration': AI_CREDIT_COSTS.JOB_PREP_NOTES_SINGLE,
  'interview_analysis': AI_CREDIT_COSTS.INTERVIEW_STUDIO_SESSION,
  'question_generation': AI_CREDIT_COSTS.INTERVIEW_QUESTION_GEN,
  'image_generation': AI_CREDIT_COSTS.IMAGE_STANDARD,
  'image_generation_prompt': AI_CREDIT_COSTS.IMAGE_STANDARD, // overridden by deductCredits in call
  'ai_assistant_query': AI_CREDIT_COSTS.AI_ASSISTANT_QUERY,
  'diagram_generation': AI_CREDIT_COSTS.DIAGRAM_GENERATION,
};

const CREDIT_CONSUMING_EVENTS = Object.keys(EVENT_CREDIT_MAP) as TrackEventType[];

export const trackUsage = async (userId: string, eventType: TrackEventType, metadata: TrackMetadata = {}) => {
  if (!userId) {
    console.error('[TrackUsage] Called without userId! Event:', eventType);
    return;
  }
  // console.log(`[TrackUsage] Called for ${eventType}, User: ${userId}`);

  // 1. Log to Firestore (Non-blocking / Silenced error)
  try {
    await addDoc(collection(db, 'usage_logs'), {
      userId,
      eventType,
      timestamp: serverTimestamp(),
      ...metadata,
    });
  } catch (error) {
    // Silently fail logging if permissions/network fail, so we don't block the app features
    // console.warn("Background logging failed:", error); 
  }

  // 2. Log to Google Analytics (Non-blocking)
  try {
    const analyticsInstance = await analytics;
    if (analyticsInstance) {
      if (metadata.tokenUsage) {
        logEvent(analyticsInstance, 'token_usage', {
          category: eventType,
          value: metadata.tokenUsage,
        });
      }
      if (eventType === 'resume_download') {
        logEvent(analyticsInstance, 'resume_download', {
          format: metadata.format,
        });
      }
    }
  } catch (e) { }

  // 3. Deduct AI Credit (Critical Path)
  if (CREDIT_CONSUMING_EVENTS.includes(eventType)) {
    try {
      const { incrementAIUsage } = await import('./aiUsageService');
      // Use explicit override → weighted cost from config → safe fallback of 1
      const deductAmount = metadata.deductCredits ?? EVENT_CREDIT_MAP[eventType] ?? 1;
      await incrementAIUsage(userId, deductAmount);
    } catch (err) {
      console.error(`Failed to deduct credit for ${eventType}:`, err);
    }
  }
};

export const trackDemoEvent = async (eventType: 'totalResumeGenerations' | 'totalInterviewStarts') => {
  try {
    const analyticsRef = doc(db, 'analytics', 'demo_page_events');
    // Atomically increment the counter for the given event type.
    // The { merge: true } option creates the document if it doesn't exist.
    await setDoc(analyticsRef, {
      [eventType]: increment(1),
    }, { merge: true });
  } catch (error) {
    console.error(`Error tracking demo event (${eventType}):`, error);
    // This is a non-critical background task, so we don't throw an error to the user.
  }
};

export const trackDemoConversion = async (eventType: 'convertedResumeUsers' | 'convertedInterviewUsers') => {
  try {
    const analyticsRef = doc(db, 'analytics', 'demo_page_events');
    await setDoc(analyticsRef, {
      [eventType]: increment(1),
    }, { merge: true });
  } catch (error) {
    console.error(`Error tracking demo conversion (${eventType}):`, error);
  }
};