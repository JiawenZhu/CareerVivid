import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { JobApplicationData } from '../types';

/**
 * Service to manage User's Job Applications (Tracker)
 * Designed to be safe for use in Extension Context (if auth token is present)
 */

export const userJobService = {
    /**
     * Add a new job application for the user
     */
    async addJob(userId: string, data: Partial<JobApplicationData>): Promise<string> {
        const jobAppsRef = collection(db, 'jobApplications');
        const now = new Date(); // Use JS Date for adding, Firestore SDK converts

        const jobData = {
            ...data,
            userId,
            status: data.status || 'applied',
            dateApplied: data.dateApplied || now,
            createdAt: now,
            updatedAt: now,
        };

        // Clean undefined
        const cleanData = Object.fromEntries(
            Object.entries(jobData).filter(([_, v]) => v !== undefined)
        );

        const docRef = await addDoc(jobAppsRef, cleanData);
        return docRef.id;
    },

    /**
     * Get recent jobs for mini-dashboard
     */
    async getRecentJobs(userId: string, limitCount: number = 3): Promise<JobApplicationData[]> {
        const jobAppsRef = collection(db, 'jobApplications');
        const q = query(
            jobAppsRef,
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc'),
            // limit(limitCount) // Note: limit might fail without index on userId+updatedAt
        );

        const snapshot = await getDocs(q);
        const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobApplicationData));

        // Manual limit if needed
        return jobs.slice(0, limitCount);
    }
};
