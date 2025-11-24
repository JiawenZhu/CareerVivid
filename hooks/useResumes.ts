



import { useState, useEffect, useCallback } from 'react';
import { ResumeData, PersonalDetails } from '../types';
import { createBlankResume, DEFAULT_ICONS, DEFAULT_SECTION_TITLES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, orderBy, getDocs, writeBatch } from 'firebase/firestore';
import { navigate } from '../App';

export const useResumes = () => {
    const { currentUser } = useAuth();
    const [resumes, setResumes] = useState<ResumeData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setResumes([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const resumesCol = collection(db, 'users', currentUser.uid, 'resumes');
        const q = query(resumesCol, orderBy('updatedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const resumesFromDb: ResumeData[] = [];
            const blankResume = createBlankResume(); // Used as a fallback structure

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Hydrate the data from Firestore to ensure all required fields are present
                const hydratedData = {
                    ...blankResume, // Ensures all top-level fields exist
                    ...data,        // Overwrites defaults with DB data
                    id: doc.id,
                    section: data.section || 'resumes', // Default to 'resumes'
                    // Deep merge for personalDetails to ensure it's always an object
                    personalDetails: {
                        ...blankResume.personalDetails,
                        ...(data.personalDetails || {}),
                    },
                     // Ensure new fields exist for old resumes
                    sectionTitles: {
                        ...DEFAULT_SECTION_TITLES,
                        ...(data.sectionTitles || {}),
                    },
                    customIcons: {
                        ...DEFAULT_ICONS,
                        ...(data.customIcons || {}),
                    },
                    // Also ensure arrays are initialized if missing
                    websites: data.websites || [],
                    skills: data.skills || [],
                    employmentHistory: data.employmentHistory || [],
                    education: data.education || [],
                    languages: data.languages || [],
                    // Safely handle timestamp
                    updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString()
                };
                resumesFromDb.push(hydratedData as ResumeData);
            });
            setResumes(resumesFromDb);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching resumes:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);
    
    const getResumeById = useCallback((id: string): ResumeData | undefined => {
        return resumes.find(r => r.id === id);
    }, [resumes]);

    const addResume = useCallback(() => {
        navigate('/new');
    }, []);

    const addBlankResume = useCallback(async () => {
        if (!currentUser) return;
        try {
            const newResumeData = createBlankResume();

            // Pre-fill with user's profile data
            if (currentUser.displayName) {
                const nameParts = currentUser.displayName.split(' ');
                newResumeData.personalDetails.firstName = nameParts.shift() || '';
                newResumeData.personalDetails.lastName = nameParts.join(' ') || '';
            }
            if (currentUser.email) {
                newResumeData.personalDetails.email = currentUser.email;
            }
            if (currentUser.photoURL) {
                newResumeData.personalDetails.photo = currentUser.photoURL;
            }
            
            if (newResumeData.personalDetails.firstName) {
                newResumeData.title = `${newResumeData.personalDetails.firstName}'s Resume`;
            }


            const { id, ...dataToSave } = newResumeData;
            const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'resumes'), {
                ...dataToSave,
                section: 'resumes',
                updatedAt: serverTimestamp(),
            });
            navigate(`/edit/${docRef.id}`);
        } catch (error) {
            console.error("Error adding blank resume:", error);
        }
    }, [currentUser]);

    const addAIGeneratedResume = useCallback(async (aiData: Partial<ResumeData>, title: string) => {
        if (!currentUser) return;
        const blank = createBlankResume();
        const newResume: Omit<ResumeData, 'id' | 'updatedAt'> = {
            title: title || 'AI Generated Resume',
            templateId: 'Modern',
            personalDetails: { ...blank.personalDetails, ...aiData.personalDetails },
            professionalSummary: aiData.professionalSummary || '',
            websites: aiData.websites || [],
            skills: aiData.skills || [],
            employmentHistory: aiData.employmentHistory || [],
            education: aiData.education || [],
            languages: aiData.languages || [],
            sectionTitles: { ...DEFAULT_SECTION_TITLES },
            customIcons: { ...DEFAULT_ICONS },
            themeColor: '#000000',
            titleFont: 'Montserrat',
            bodyFont: 'Crimson Text',
            language: 'English',
            section: 'resumes',
        };
        try {
            const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'resumes'), {
                ...newResume,
                updatedAt: serverTimestamp(),
            });
            navigate(`/edit/${docRef.id}`);
        } catch (error) {
            console.error("Error adding AI resume:", error);
        }
    }, [currentUser]);

    const saveAIGeneratedResume = useCallback(async (resumeData: ResumeData) => {
        if (!currentUser) return;
        try {
            const { id, ...dataToSave } = resumeData;
            await addDoc(collection(db, 'users', currentUser.uid, 'resumes'), {
                ...dataToSave,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error saving AI resume:", error);
        }
    }, [currentUser]);

    const updateResume = useCallback(async (id: string, updatedData: Partial<ResumeData>) => {
        if (!currentUser) return;
        try {
            // Create a deep, serializable copy of the data to prevent circular reference errors from the Firestore SDK.
            // This also implicitly removes any fields that are not JSON-serializable (like functions or undefined).
            const cleanData = JSON.parse(JSON.stringify(updatedData));
    
            // The 'id' and 'updatedAt' fields are managed outside the document data and should not be in the update payload.
            delete cleanData.id;
            delete cleanData.updatedAt;
    
            const resumeRef = doc(db, 'users', currentUser.uid, 'resumes', id);
            await updateDoc(resumeRef, {
                ...cleanData,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating resume:", error);
            if (error instanceof TypeError && error.message.includes('circular structure')) {
                // This log will help debug if the issue persists by showing the problematic object.
                console.error("A circular reference was detected in the data being saved:", updatedData);
            }
        }
    }, [currentUser]);

    const deleteResume = useCallback(async (id: string) => {
        if (!currentUser) return;
        const resumeRef = doc(db, 'users', currentUser.uid, 'resumes', id);
        try {
            await deleteDoc(resumeRef);
            if (resumes.length === 1) {
                navigate('/new');
            } else {
                 navigate('/');
            }
        } catch (error) {
            console.error("Error deleting resume:", error);
        }
    }, [currentUser, resumes.length]);
    
    const duplicateResume = useCallback(async (id: string) => {
        if (!currentUser) return;
        const originalResume = getResumeById(id);
        if (originalResume) {
            const { id: originalId, ...resumeToCopy } = originalResume;
            try {
                const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'resumes'), {
                    ...resumeToCopy,
                    title: `${originalResume.title} (Copy)`,
                    updatedAt: serverTimestamp()
                });
                navigate(`/edit/${docRef.id}`);
            } catch (error) {
                console.error("Error duplicating resume:", error);
            }
        }
    }, [currentUser, getResumeById]);

    const deleteAllResumes = useCallback(async () => {
        if (!currentUser) return;
        try {
            const resumesCol = collection(db, 'users', currentUser.uid, 'resumes');
            const snapshot = await getDocs(resumesCol);
            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (error) {
            console.error("Error deleting all resumes:", error);
            throw error; // re-throw to be caught by the caller
        }
    }, [currentUser]);


    return { resumes, isLoading, getResumeById, addResume, updateResume, deleteResume, duplicateResume, addAIGeneratedResume, saveAIGeneratedResume, addBlankResume, deleteAllResumes };
};