import { useEffect, useState } from 'react';
import type { AgencyPrepEvent } from '../types';
import { listenAgencyPrepEvents } from '../services/agencyPrepEventsService';

/** Subscribe to the events subcollection for a single prep session. */
export const useAgencyPrepEvents = (sessionId: string | null) => {
  const [events, setEvents] = useState<AgencyPrepEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(sessionId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = listenAgencyPrepEvents(
      sessionId,
      (next) => {
        setEvents(next);
        setIsLoading(false);
      },
      (err) => {
        console.error('Failed to load agency prep events:', err);
        setError(err);
        setIsLoading(false);
      },
    );
    return () => unsubscribe();
  }, [sessionId]);

  return { events, isLoading, error };
};
