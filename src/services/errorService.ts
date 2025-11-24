import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ErrorReport {
  userId: string | null;
  userEmail: string | null;
  message: string;
  stack?: string;
  url: string;
  timestamp: any;
  status: 'New';
  context?: Record<string, any>;
}

export const reportError = async (error: Error, context?: Record<string, any>) => {
  try {
    const currentUser = auth.currentUser;

    const report: ErrorReport = {
      userId: currentUser?.uid || null,
      userEmail: currentUser?.email || null,
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: serverTimestamp(),
      status: 'New',
      context: {
        ...context,
        userAgent: navigator.userAgent,
      },
    };

    await addDoc(collection(db, 'error_reports'), report);
    console.log('Error reported successfully.');

  } catch (loggingError) {
    console.error('Failed to report error:', loggingError);
    // Also log the original error so it's not lost
    console.error('Original error that failed to be reported:', error);
  }
};
