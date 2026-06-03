import { collection, doc, getDocs, query, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { AgencyPrepSession } from '../types';

/**
 * Updates the positionTags field on a specific prep session in Firestore.
 */
export const updatePositionTags = async (sessionId: string, tags: string[]): Promise<void> => {
  const sessionRef = doc(db, 'agencyPrepSessions', sessionId);
  
  // Clean and trim the tags
  const cleanedTags = tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  await updateDoc(sessionRef, {
    positionTags: cleanedTags,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Queries all prep sessions for a branch and compiles a deduplicated list of all tags currently in use.
 * Used to power autocomplete inputs.
 */
export const getUsedTagsForBranch = async (branchId: string): Promise<string[]> => {
  try {
    const sessionsRef = collection(db, 'agencyPrepSessions');
    const q = query(sessionsRef, where('agencyBranchId', '==', branchId));
    const snap = await getDocs(q);
    
    const tagsSet = new Set<string>();
    snap.docs.forEach((doc) => {
      const data = doc.data() as AgencyPrepSession;
      if (data.positionTags && Array.isArray(data.positionTags)) {
        data.positionTags.forEach((tag) => {
          if (tag && typeof tag === 'string') {
            tagsSet.add(tag.trim());
          }
        });
      }
    });

    return Array.from(tagsSet).sort();
  } catch (error) {
    console.error('Failed to get used tags for branch:', error);
    return [];
  }
};
