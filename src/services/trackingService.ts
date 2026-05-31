import { db, analytics } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, increment, setDoc } from 'firebase/firestore';
import { TrackEventType } from '../types';
import { AI_CREDIT_COSTS } from '../config/creditCosts';



interface TrackMetadata {
  tokenUsage?: number;
  deductCredits?: number;
  [key: string]: any;
}

// Map event types to their weighted credit costs.
// Falls back to 1 credit for any unlisted event.
const EVENT_CREDIT_MAP: Partial<Record<TrackEventType, number>> = {
  'resume_generate_prompt': 0,
  'resume_suggestion': AI_CREDIT_COSTS.BULLET_EDIT,
  'resume_parse_text': 0,
  'resume_parse_file': 0,
  'resume_match_analysis': AI_CREDIT_COSTS.JOB_SEARCH,
  'portfolio_generation': AI_CREDIT_COSTS.PORTFOLIO_GENERATE,
  'portfolio_refinement': AI_CREDIT_COSTS.PORTFOLIO_REFINE,
  'job_parse_description': 0,
  'job_prep_generation': 0,
  'job_prep_regeneration': 0,
  'interview_analysis': AI_CREDIT_COSTS.TECH_INTERVIEW_VOICE,
  'question_generation': AI_CREDIT_COSTS.INTERVIEW_QUESTION_GEN,
  'image_generation': AI_CREDIT_COSTS.IMAGE_STANDARD,
  'image_generation_prompt': AI_CREDIT_COSTS.IMAGE_STANDARD,
  'ai_assistant_query': 0,
  'diagram_generation': 0,
};

const CREDIT_CONSUMING_EVENTS = Object.keys(EVENT_CREDIT_MAP) as TrackEventType[];
const isExtensionBuild = import.meta.env?.VITE_EXTENSION_BUILD === 'true';

export const trackUsage = async (userId: string, eventType: TrackEventType, metadata: TrackMetadata = {}) => {
  if (!userId) {
    if (import.meta.env.DEV) {
      console.debug('[TrackUsage] Called without userId! Event:', eventType);
    }
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
    if (!isExtensionBuild && analyticsInstance) {
      const { logEvent } = await import('firebase/analytics');
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
  if (CREDIT_CONSUMING_EVENTS.includes(eventType) && userId && !userId.startsWith('guest')) {
    try {
      const { incrementAIUsage } = await import('./aiUsageService');
      // Use explicit override → weighted cost from config → safe fallback of 1
      const deductAmount = metadata.deductCredits ?? EVENT_CREDIT_MAP[eventType] ?? 1;
      await incrementAIUsage(userId, deductAmount);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.debug(`Failed to deduct credit for ${eventType}:`, err);
      }
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
    if (import.meta.env.DEV) {
      console.debug(`Error tracking demo event (${eventType}):`, error);
    }
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
    if (import.meta.env.DEV) {
      console.debug(`Error tracking demo conversion (${eventType}):`, error);
    }
  }
};
