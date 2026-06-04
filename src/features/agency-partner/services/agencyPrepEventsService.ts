import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type { AgencyPrepEvent } from '../types';

const MAX_EVENTS_PER_SESSION = 100;

/**
 * Subscribe to the events subcollection for a single prep session. Returns an
 * unsubscribe function.
 *
 * The Firestore rules restrict reads to the candidate-owner, agency-owner,
 * and admins. Events are append-only and written server-side only.
 */
export const listenAgencyPrepEvents = (
  sessionId: string,
  onChange: (events: AgencyPrepEvent[]) => void,
  onError?: (error: Error) => void,
) => {
  const eventsRef = collection(db, 'agencyPrepSessions', sessionId, 'events');
  const eventsQuery = query(eventsRef, orderBy('createdAt', 'desc'), limit(MAX_EVENTS_PER_SESSION));

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      const events = snapshot.docs.map((eventDoc) => ({
        id: eventDoc.id,
        ...eventDoc.data(),
      })) as AgencyPrepEvent[];
      onChange(events);
    },
    onError,
  );
};
