import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { JobPosting } from '../types';

/**
 * Create a new job posting
 */
export const createJobPosting = async (data: Partial<JobPosting>): Promise<string> => {
    const jobPostingsRef = collection(db, 'jobPostings');
    const now = Timestamp.now();

    const jobData: Partial<JobPosting> = {
        ...data,
        status: data.status || 'draft',
        viewCount: 0,
        applicationCount: 0,
        createdAt: now,
        updatedAt: now,
    };

    // Remove undefined fields to prevent Firestore errors
    const cleanJobData = Object.fromEntries(
        Object.entries(jobData).filter(([_, v]) => v !== undefined)
    );

    const docRef = await addDoc(jobPostingsRef, cleanJobData);
    return docRef.id;
};

/**
 * Update an existing job posting
 */
export const updateJobPosting = async (id: string, data: Partial<JobPosting>): Promise<void> => {
    const jobRef = doc(db, 'jobPostings', id);
    const updateData = {
        ...data,
        updatedAt: Timestamp.now(),
    };

    // Remove undefined fields
    const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
    );

    await updateDoc(jobRef, cleanUpdateData);
};

/**
 * Get a single job posting by ID
 */
export const getJobPosting = async (id: string): Promise<JobPosting | null> => {
    const jobRef = doc(db, 'jobPostings', id);
    const jobSnap = await getDoc(jobRef);

    if (!jobSnap.exists()) {
        return null;
    }

    return { id: jobSnap.id, ...jobSnap.data() } as JobPosting;
};

/**
 * Get all job postings for a specific HR user
 */
export const getJobPostingsByHR = async (hrUserId: string): Promise<JobPosting[]> => {
    const jobPostingsRef = collection(db, 'jobPostings');
    const q = query(
        jobPostingsRef,
        where('hrUserId', '==', hrUserId),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobPosting));
};

/**
 * Get all published job postings (for marketplace)
 */
export const getAllPublishedJobs = async (): Promise<JobPosting[]> => {
    const jobPostingsRef = collection(db, 'jobPostings');
    const q = query(
        jobPostingsRef,
        where('status', '==', 'published')
        // Removing orderBy to prevent "requires index" error. Sorting client-side instead.
    );

    const snapshot = await getDocs(q);
    const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobPosting));

    // Client-side sort by publishedAt descending
    return jobs.sort((a, b) => {
        const timeA = a.publishedAt?.toMillis?.() || 0;
        const timeB = b.publishedAt?.toMillis?.() || 0;
        return timeB - timeA;
    });
};

/**
 * Delete a job posting
 */
export const deleteJobPosting = async (id: string): Promise<void> => {
    const jobRef = doc(db, 'jobPostings', id);
    await deleteDoc(jobRef);
};

/**
 * Publish a job posting
 */
export const publishJobPosting = async (id: string): Promise<void> => {
    const jobRef = doc(db, 'jobPostings', id);
    await updateDoc(jobRef, {
        status: 'published',
        publishedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
};

/**
 * Increment view count for a job posting
 */
export const incrementJobViewCount = async (id: string): Promise<void> => {
    const jobRef = doc(db, 'jobPostings', id);
    const jobSnap = await getDoc(jobRef);

    if (jobSnap.exists()) {
        const currentCount = jobSnap.data().viewCount || 0;
        await updateDoc(jobRef, {
            viewCount: currentCount + 1,
        });
    }
};
