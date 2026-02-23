import { collection, getDocs, doc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { JobPosting } from '../types';

/**
 * Fetch user's saved job search history
 */
export const getUserJobHistory = async (userId: string): Promise<JobPosting[]> => {
    try {
        const historyRef = collection(db, 'users', userId, 'jobSearchHistory');
        const q = query(historyRef, orderBy('createdAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Map backend Job fields to frontend JobPosting fields
            return {
                id: doc.id,
                jobTitle: data.title || data.jobTitle || 'Untitled Position',
                companyName: data.company || data.companyName || 'Company Not Specified',
                location: data.location || 'Remote / Unspecified',
                description: data.description || '',
                url: data.url || '',
                source: 'google', // Set to 'google' to avoid showing Partner badge
                hrUserId: '', // Not applicable for Google search results
                department: '',
                locationType: 'remote' as const,
                employmentType: 'full-time' as const,
                responsibilities: [],
                requirements: [],
                niceToHave: [],
                salaryCurrency: 'USD',
                benefits: [],
                status: 'published' as const,
                viewCount: 0,
                applicationCount: 0,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
                ...data
            } as JobPosting;
        });
    } catch (error) {
        console.error('[getUserJobHistory] Error:', error);
        return [];
    }
};

/**
 * Delete a specific job from user's history (direct Firestore delete, no Cloud Function)
 */
export const deleteUserJob = async (userId: string, jobId: string): Promise<boolean> => {
    try {
        const jobRef = doc(db, 'users', userId, 'jobSearchHistory', jobId);
        await deleteDoc(jobRef);
        console.log(`[deleteUserJob] Deleted job ${jobId} from user ${userId} history`);
        return true;
    } catch (error) {
        console.error('[deleteUserJob] Error:', error);
        return false;
    }
};
