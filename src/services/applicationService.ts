import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { JobApplication, JobApplicationStatus, StatusHistoryEntry } from '../types';

/**
 * Submit a job application
 */
export const submitApplication = async (
    jobId: string,
    userId: string,
    resumeId: string,
    coverLetter?: string
): Promise<string> => {
    const applicationsRef = collection(db, 'jobApplications');
    const now = Timestamp.now();

    const statusHistory: StatusHistoryEntry[] = [{
        status: 'submitted',
        timestamp: now,
        note: 'Application submitted'
    }];

    const applicationData: Partial<JobApplication> = {
        jobPostingId: jobId,
        applicantUserId: userId,
        resumeId,
        coverLetter,
        status: 'submitted',
        statusHistory,
        appliedAt: now,
        lastUpdated: now,
    };

    // Remove undefined fields
    const cleanData = Object.fromEntries(
        Object.entries(applicationData).filter(([_, v]) => v !== undefined)
    );

    const docRef = await addDoc(applicationsRef, cleanData);

    // Increment application count on job posting
    const jobRef = doc(db, 'jobPostings', jobId);
    const jobSnap = await getDoc(jobRef);
    if (jobSnap.exists()) {
        const currentCount = jobSnap.data().applicationCount || 0;
        await updateDoc(jobRef, {
            applicationCount: currentCount + 1,
        });
    }

    return docRef.id;
};

/**
 * Get all applications for a specific job
 */
export const getApplicationsForJob = async (jobId: string): Promise<JobApplication[]> => {
    const applicationsRef = collection(db, 'jobApplications');
    const q = query(
        applicationsRef,
        where('jobPostingId', '==', jobId)
        // orderBy('appliedAt', 'desc') // Removed to avoid index requirement
    );

    const snapshot = await getDocs(q);
    const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobApplication));

    // Client-side sort
    return apps.sort((a, b) => {
        const timeA = a.appliedAt?.toMillis ? a.appliedAt.toMillis() : 0;
        const timeB = b.appliedAt?.toMillis ? b.appliedAt.toMillis() : 0;
        return timeB - timeA;
    });
};

/**
 * Get all applications submitted by a specific user
 */
export const getApplicationsForUser = async (userId: string): Promise<JobApplication[]> => {
    const applicationsRef = collection(db, 'jobApplications');
    const q = query(
        applicationsRef,
        where('applicantUserId', '==', userId)
        // orderBy('appliedAt', 'desc') // Removed to avoid index requirement
    );

    const snapshot = await getDocs(q);
    const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobApplication));

    // Client-side sort
    return apps.sort((a, b) => {
        const timeA = a.appliedAt?.toMillis ? a.appliedAt.toMillis() : 0;
        const timeB = b.appliedAt?.toMillis ? b.appliedAt.toMillis() : 0;
        return timeB - timeA;
    });
};

/**
 * Update application status
 */
export const updateApplicationStatus = async (
    applicationId: string,
    newStatus: JobApplicationStatus,
    note?: string
): Promise<void> => {
    const appRef = doc(db, 'jobApplications', applicationId);
    const appSnap = await getDoc(appRef);

    if (!appSnap.exists()) {
        throw new Error('Application not found');
    }

    const currentData = appSnap.data() as JobApplication;
    const newHistoryEntry: StatusHistoryEntry = {
        status: newStatus,
        timestamp: Timestamp.now(),
        note,
    };

    await updateDoc(appRef, {
        status: newStatus,
        statusHistory: [...(currentData.statusHistory || []), newHistoryEntry],
        lastUpdated: Timestamp.now(),
    });

    // --- Sync to User's Job Tracker ---
    if (currentData.applicantUserId && currentData.jobPostingId) {
        try {
            const trackerRef = collection(db, 'users', currentData.applicantUserId, 'jobTracker');
            const q = query(trackerRef, where('jobPostingId', '==', currentData.jobPostingId));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const trackerDoc = snapshot.docs[0];
                let mappedStatus = null;

                // Map HR status to User Tracker status
                switch (newStatus) {
                    case 'interviewing':
                    case 'shortlisted':
                        mappedStatus = 'Interviewing';
                        break;
                    case 'rejected':
                        mappedStatus = 'Rejected';
                        break;
                    case 'accepted':
                        mappedStatus = 'Offered';
                        break;
                    // 'submitted' and 'reviewing' usually map to 'Applied' or 'To Apply'
                    // but we generally don't revert status backwards automatically unless explicit
                }

                if (mappedStatus) {
                    await updateDoc(trackerDoc.ref, {
                        applicationStatus: mappedStatus,
                        updatedAt: Timestamp.now()
                    });
                }
            }
        } catch (error) {
            console.error("Failed to sync status to user tracker:", error);
            // Non-blocking error, log and continue
        }
    }
};

/**
 * Add HR notes to an application
 */
export const addHRNotes = async (applicationId: string, notes: string): Promise<void> => {
    const appRef = doc(db, 'jobApplications', applicationId);
    await updateDoc(appRef, {
        hrNotes: notes,
        lastUpdated: Timestamp.now(),
    });
};

/**
 * Rate an application
 */
export const rateApplication = async (applicationId: string, rating: number): Promise<void> => {
    if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
    }

    const appRef = doc(db, 'jobApplications', applicationId);
    await updateDoc(appRef, {
        rating,
        lastUpdated: Timestamp.now(),
    });
};

/**
 * Get a single application by ID
 */
export const getApplication = async (id: string): Promise<JobApplication | null> => {
    const appRef = doc(db, 'jobApplications', id);
    const appSnap = await getDoc(appRef);

    if (!appSnap.exists()) {
        return null;
    }

    return { id: appSnap.id, ...appSnap.data() } as JobApplication;
};

/**
 * Save resume match analysis for an application
 */
export const saveMatchAnalysis = async (
    applicationId: string,
    matchAnalysis: any
): Promise<void> => {
    const appRef = doc(db, 'jobApplications', applicationId);
    await updateDoc(appRef, {
        matchAnalysis,
        lastUpdated: Timestamp.now(),
    });
};
