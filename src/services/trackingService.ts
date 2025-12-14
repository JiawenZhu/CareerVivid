import { db, analytics } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, increment, setDoc } from 'firebase/firestore';
import { TrackEventType } from '../types';
import { logEvent } from 'firebase/analytics';



interface TrackMetadata {
  tokenUsage?: number;
  [key: string]: any;
}

const CREDIT_CONSUMING_EVENTS: TrackEventType[] = [
  'resume_generate_prompt',
  'resume_suggestion',
  'interview_analysis',
  'question_generation',
  'job_prep_generation',
  'job_prep_regeneration',
  'job_parse_description',
  'resume_match_analysis',
  'portfolio_generation',
  'portfolio_refinement',
  'image_generation',
  'ai_assistant_query'
];

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
    // console.log(`[TrackUsage] Deducting credit for ${eventType}...`);
    try {
      const { incrementAIUsage } = await import('./aiUsageService');
      await incrementAIUsage(userId);
      // console.log(`[TrackUsage] Credit deducted successfully for ${eventType}`);
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