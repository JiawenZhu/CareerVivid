import { useEffect, useState } from 'react';
import type { RecruiterNote } from '../types';
import { listenRecruiterNotes } from '../services/recruiterNotesService';

/** Subscribe to recruiter notes for a single prep session. */
export const useRecruiterNotes = (sessionId: string | null) => {
  const [notes, setNotes] = useState<RecruiterNote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(sessionId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setNotes([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = listenRecruiterNotes(
      sessionId,
      (next) => {
        setNotes(next);
        setIsLoading(false);
      },
      (err) => {
        console.error('Failed to load recruiter notes:', err);
        setError(err);
        setIsLoading(false);
      },
    );
    return () => unsubscribe();
  }, [sessionId]);

  return { notes, isLoading, error };
};
