import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, orderBy, getDocs, writeBatch } from 'firebase/firestore';
import { JobApplicationData } from '../types';

export const useJobTracker = () => {
    const { currentUser } = useAuth();
    const [jobApplications, setJobApplications] = useState<JobApplicationData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setJobApplications([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const trackerCol = collection(db, 'users', currentUser.uid, 'jobTracker');
        const q = query(trackerCol, orderBy('updatedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const appsFromDb = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    section: data.section || 'jobTracker', // Default to the main tracker
                } as JobApplicationData
            });
            setJobApplications(appsFromDb);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching job applications:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);
    
    const addJobApplication = useCallback(async (jobData: Omit<JobApplicationData, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
        if (!currentUser) throw new Error("User not logged in");
        try {
            const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'jobTracker'), {
                ...jobData,
                userId: currentUser.uid,
                section: 'jobTracker', // New applications always start in the main tracker
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error("Error adding job application:", error);
            throw error;
        }
    }, [currentUser]);

    const updateJobApplication = useCallback(async (id: string, updatedData: Partial<JobApplicationData>) => {
        if (!currentUser) return;
        try {
            const cleanData = JSON.parse(JSON.stringify(updatedData));
            delete cleanData.id;

            const appRef = doc(db, 'users', currentUser.uid, 'jobTracker', id);
            await updateDoc(appRef, {
                ...cleanData,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating job application:", error);
        }
    }, [currentUser]);
    
    const deleteJobApplication = useCallback(async (id: string) => {
        if (!currentUser) return;
        try {
            const appRef = doc(db, 'users', currentUser.uid, 'jobTracker', id);
            await deleteDoc(appRef);
        } catch (error) {
            console.error("Error deleting job application:", error);
        }
    }, [currentUser]);

    const deleteAllJobApplications = useCallback(async () => {
        if (!currentUser) return;
        try {
            const trackerCol = collection(db, 'users', currentUser.uid, 'jobTracker');
            const snapshot = await getDocs(trackerCol);
            if (snapshot.empty) return;

            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (error) {
            console.error("Error deleting all job applications:", error);
            throw error;
        }
    }, [currentUser]);

    return { jobApplications, isLoading, addJobApplication, updateJobApplication, deleteJobApplication, deleteAllJobApplications };
};