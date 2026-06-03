import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../firebase';
import type { RecruiterNote } from '../types';

const MAX_NOTES_PER_SESSION = 50;

/**
 * Subscribe to the notes subcollection for a single prep session.
 *
 * Rules restrict reads to the branch owner and admins. The candidate cannot
 * read these notes — they are agency-private.
 */
export const listenRecruiterNotes = (
  sessionId: string,
  onChange: (notes: RecruiterNote[]) => void,
  onError?: (error: Error) => void,
) => {
  const notesRef = collection(db, 'agencyPrepSessions', sessionId, 'notes');
  const notesQuery = query(notesRef, orderBy('createdAt', 'desc'), limit(MAX_NOTES_PER_SESSION));

  return onSnapshot(
    notesQuery,
    (snapshot) => {
      const notes = snapshot.docs.map((noteDoc) => ({
        id: noteDoc.id,
        ...noteDoc.data(),
      })) as RecruiterNote[];
      onChange(notes);
    },
    onError,
  );
};

/** Add a recruiter note via the addRecruiterNote callable. */
export const addRecruiterNote = async (sessionId: string, body: string): Promise<{ noteId: string }> => {
  const fn = httpsCallable<{ sessionId: string; body: string }, { noteId: string }>(functions, 'addRecruiterNote');
  const result = await fn({ sessionId, body });
  return result.data;
};

/** Update a recruiter note via the updateRecruiterNote callable. */
export const updateRecruiterNote = async (
  sessionId: string,
  noteId: string,
  body: string,
): Promise<void> => {
  const fn = httpsCallable<{ sessionId: string; noteId: string; body: string }, { ok: boolean }>(
    functions,
    'updateRecruiterNote',
  );
  await fn({ sessionId, noteId, body });
};

/** Delete a recruiter note via the deleteRecruiterNote callable. */
export const deleteRecruiterNote = async (sessionId: string, noteId: string): Promise<void> => {
  const fn = httpsCallable<{ sessionId: string; noteId: string }, { ok: boolean }>(functions, 'deleteRecruiterNote');
  await fn({ sessionId, noteId });
};
