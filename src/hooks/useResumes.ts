


import { useState, useEffect, useCallback } from 'react';
import { ResumeData, PersonalDetails } from '../types';
import { createBlankResume } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, orderBy, getDocs, writeBatch, getDoc } from 'firebase/firestore';
import { navigate } from '../utils/navigation';

export const useResumes = () => {
    const { currentUser } = useAuth();
    const [resumes, setResumes] = useState<ResumeData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!currentUser?.uid) {
            setResumes([]);
            setIsLoading(false);
            return;
        }

        // Only start loading if we don't have resumes or if the user changed
        // Optimization: If we already have resumes and the ID is same, we technically don't need to hard reset isLoading to true 
        // unless we want to ensure fresh data on mount. 
        // But for token refresh, we don't want to show loading spinner.
        // We can keep the onSnapshot active.

        // Actually, onSnapshot handles updates. If we unmount/remount this effect, we tear down the snapshot.
        // So we strictly want this effect ONLY to run when UID changes.

        setIsLoading(true);
        const resumesCol = collection(db, 'users', currentUser.uid, 'resumes');
        const q = query(resumesCol, orderBy('updatedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const resumesFromDb: ResumeData[] = [];
            const blankResume = createBlankResume();

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const hydratedData = {
                    ...blankResume,
                    ...data,
                    id: doc.id,
                    section: data.section || 'resumes',
                    personalDetails: {
                        ...blankResume.personalDetails,
                        ...(data.personalDetails || {}),
                    },
                    websites: data.websites || [],
                    skills: data.skills || [],
                    employmentHistory: data.employmentHistory || [],
                    education: data.education || [],
                    languages: data.languages || [],
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString())
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
    }, [currentUser?.uid]);

    const getResumeById = useCallback((id: string): ResumeData | undefined => {
        return resumes.find(r => r.id === id);
    }, [resumes]);

    const addResume = useCallback(() => {
        navigate('/new');
    }, []);

    const addBlankResume = useCallback(async () => {
        if (!currentUser) return;
        try {
            // Check resume limit before creating
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            const userData = userDoc.data();

            // Backward compatibility: Legacy premium users (promotions.isPremium) get unlimited resumes
            const hasLegacyPremium = userData?.promotions?.isPremium === true;
            const resumeLimit = hasLegacyPremium ? 999 : (userData?.resumeLimit || 2);

            if (resumes.length >= resumeLimit) {
                throw new Error('RESUME_LIMIT_REACHED');
            }

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
        } catch (error: any) {
            if (error.message === 'RESUME_LIMIT_REACHED') {
                alert('You have reached your resume storage limit. Please upgrade your plan to create more resumes.');
            } else {
                console.error("Error adding blank resume:", error);
            }
        }
    }, [currentUser, resumes.length]);

    const addAIGeneratedResume = useCallback(async (aiData: Partial<ResumeData>, title: string) => {
        if (!currentUser) return;
        try {
            // Check resume limit
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            const userData = userDoc.data();

            // Backward compatibility: Premium users get unlimited resumes
            const hasLegacyPremium = userData?.promotions?.isPremium === true;
            const resumeLimit = hasLegacyPremium ? 999 : (userData?.resumeLimit || 2);

            if (resumes.length >= resumeLimit) {
                throw new Error('RESUME_LIMIT_REACHED');
            }

            const emptyPersonalDetails: PersonalDetails = {
                jobTitle: '', photo: '', firstName: '', lastName: '', email: '', phone: '',
                address: '', city: '', postalCode: '', country: '',
            };
            const newResume: Omit<ResumeData, 'id' | 'updatedAt'> = {
                title: title || 'AI Generated Resume',
                templateId: 'Modern',
                personalDetails: { ...emptyPersonalDetails, ...aiData.personalDetails },
                professionalSummary: aiData.professionalSummary || '',
                websites: aiData.websites || [],
                skills: aiData.skills || [],
                employmentHistory: aiData.employmentHistory || [],
                education: aiData.education || [],
                languages: aiData.languages || [],
                themeColor: '#000000',
                titleFont: 'Montserrat',
                bodyFont: 'Crimson Text',
                language: 'English',
                section: 'resumes',
            };
            const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'resumes'), {
                ...newResume,
                updatedAt: serverTimestamp(),
            });
            navigate(`/edit/${docRef.id}`);
        } catch (error: any) {
            if (error.message === 'RESUME_LIMIT_REACHED') {
                alert('You have reached your resume storage limit. Please upgrade your plan to create more resumes.');
            } else {
                console.error("Error adding AI resume:", error);
            }
        }
    }, [currentUser, resumes.length]);

    const saveAIGeneratedResume = useCallback(async (resumeData: ResumeData) => {
        if (!currentUser) return;
        try {
            // Check resume limit
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            const userData = userDoc.data();

            // Backward compatibility: Premium users get unlimited resumes
            const hasLegacyPremium = userData?.promotions?.isPremium === true;
            const resumeLimit = hasLegacyPremium ? 999 : (userData?.resumeLimit || 2);

            if (resumes.length >= resumeLimit) {
                throw new Error('RESUME_LIMIT_REACHED');
            }

            const { id, ...dataToSave } = resumeData;
            await addDoc(collection(db, 'users', currentUser.uid, 'resumes'), {
                ...dataToSave,
                updatedAt: serverTimestamp(),
            });
        } catch (error: any) {
            if (error.message === 'RESUME_LIMIT_REACHED') {
                alert('You have reached your resume storage limit. Please upgrade your plan to create more resumes.');
            } else {
                console.error("Error saving AI resume:", error);
            }
        }
    }, [currentUser, resumes.length]);

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
            try {
                // Check resume limit
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                const userData = userDoc.data();

                // Determine limit based on plan
                let resumeLimit = userData?.resumeLimit || 2;
                const plan = userData?.plan;
                const hasLegacyPremium = userData?.promotions?.isPremium === true;

                if (plan === 'pro_monthly') {
                    resumeLimit = 9999;
                } else if (plan === 'pro_sprint') {
                    resumeLimit = 100;
                } else if (hasLegacyPremium) {
                    resumeLimit = Math.max(resumeLimit, 9999);
                }

                if (resumes.length >= resumeLimit) {
                    throw new Error('RESUME_LIMIT_REACHED');
                }

                const { id: originalId, ...resumeToCopy } = originalResume;
                const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'resumes'), {
                    ...resumeToCopy,
                    title: `${originalResume.title} (Copy)`,
                    updatedAt: serverTimestamp()
                });
                navigate(`/edit/${docRef.id}`);
            } catch (error: any) {
                if (error.message === 'RESUME_LIMIT_REACHED') {
                    alert('You have reached your resume storage limit. Please upgrade your plan to create more resumes.');
                } else {
                    console.error("Error duplicating resume:", error);
                }
            }
        }
    }, [currentUser, getResumeById, resumes.length]);

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