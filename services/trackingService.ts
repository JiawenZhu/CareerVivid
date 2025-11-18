import { db, analytics } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, increment, setDoc } from 'firebase/firestore';
import { TrackEventType } from '../types';
import { logEvent } from 'firebase/analytics';


interface TrackMetadata {
  tokenUsage?: number;
  [key: string]: any;
}

export const trackUsage = async (userId: string, eventType: TrackEventType, metadata: TrackMetadata = {}) => {
  if (!userId) {
    console.warn('trackUsage called without userId');
    return;
  }
  try {
    // Log to Firestore
    await addDoc(collection(db, 'usage_logs'), {
      userId,
      eventType,
      timestamp: serverTimestamp(),
      ...metadata,
    });

    // Log to Google Analytics
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

  } catch (error) {
    console.error("Error tracking usage:", error);
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