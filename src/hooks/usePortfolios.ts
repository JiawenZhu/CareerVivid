import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, orderBy, writeBatch } from 'firebase/firestore';
import { navigate } from '../App';
import { PortfolioData } from '../features/portfolio/types/portfolio';

export const usePortfolios = () => {
    const { currentUser } = useAuth();
    const [portfolios, setPortfolios] = useState<PortfolioData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setPortfolios([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const portfoliosCol = collection(db, 'users', currentUser.uid, 'portfolios');
        const q = query(portfoliosCol, orderBy('updatedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const portfoliosFromDb: PortfolioData[] = [];

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const toMillis = (val: any) => {
                    if (!val) return Date.now();
                    if (typeof val === 'number') return val;
                    if (typeof val.toMillis === 'function') return val.toMillis();
                    if (val instanceof Date) return val.getTime();
                    return Date.now();
                };

                const hydratedData: PortfolioData = {
                    id: docSnap.id,
                    userId: data.userId || currentUser.uid,
                    title: data.title || 'Untitled Portfolio',
                    templateId: data.templateId || 'minimalist',
                    section: data.section || 'portfolios', // Default to 'portfolios' folder
                    mode: data.mode || 'portfolio', // Default to portfolio mode
                    linkInBio: data.linkInBio, // Include linkInBio data if present
                    hero: data.hero || { headline: '', subheadline: '', ctaPrimaryLabel: '', ctaPrimaryUrl: '', ctaSecondaryLabel: '', ctaSecondaryUrl: '' },
                    about: data.about || '',
                    timeline: data.timeline || [],
                    education: data.education || [],
                    techStack: data.techStack || [],
                    projects: data.projects || [],
                    socialLinks: data.socialLinks || [],
                    contactEmail: data.contactEmail || '',
                    theme: data.theme || { primaryColor: '#2563eb', darkMode: false },
                    createdAt: toMillis(data.createdAt),
                    updatedAt: toMillis(data.updatedAt),
                };
                portfoliosFromDb.push(hydratedData);
            });

            setPortfolios(portfoliosFromDb);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching portfolios:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const getPortfolioById = useCallback((id: string): PortfolioData | undefined => {
        return portfolios.find(p => p.id === id);
    }, [portfolios]);

    const createPortfolio = useCallback(async (portfolioData: PortfolioData) => {
        if (!currentUser) return;
        try {
            const { id, ...dataToSave } = portfolioData;
            const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'portfolios'), {
                ...dataToSave,
                userId: currentUser.uid,
                section: 'portfolios',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            console.log('[usePortfolios] Created portfolio:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error("Error creating portfolio:", error);
            throw error;
        }
    }, [currentUser]);

    const updatePortfolio = useCallback(async (id: string, updatedData: Partial<PortfolioData>) => {
        if (!currentUser) return;
        try {
            const cleanData = JSON.parse(JSON.stringify(updatedData));
            delete cleanData.id;
            delete cleanData.createdAt;
            delete cleanData.updatedAt;

            const portfolioRef = doc(db, 'users', currentUser.uid, 'portfolios', id);
            await updateDoc(portfolioRef, {
                ...cleanData,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating portfolio:", error);
        }
    }, [currentUser]);

    const deletePortfolio = useCallback(async (id: string) => {
        if (!currentUser) return;
        const portfolioRef = doc(db, 'users', currentUser.uid, 'portfolios', id);
        try {
            await deleteDoc(portfolioRef);
            console.log('[usePortfolios] Deleted portfolio:', id);
        } catch (error) {
            console.error("Error deleting portfolio:", error);
        }
    }, [currentUser]);

    const duplicatePortfolio = useCallback(async (id: string) => {
        if (!currentUser) return;
        const originalPortfolio = getPortfolioById(id);
        if (originalPortfolio) {
            try {
                const { id: originalId, createdAt, updatedAt, ...portfolioToCopy } = originalPortfolio;
                const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'portfolios'), {
                    ...portfolioToCopy,
                    title: `${originalPortfolio.title} (Copy)`,
                    section: originalPortfolio.section || 'portfolios',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                navigate(`/portfolio/edit/${docRef.id}`);
            } catch (error) {
                console.error("Error duplicating portfolio:", error);
            }
        }
    }, [currentUser, getPortfolioById]);

    const deleteAllPortfolios = useCallback(async () => {
        if (!currentUser) return;
        try {
            const portfoliosCol = collection(db, 'users', currentUser.uid, 'portfolios');
            const batch = writeBatch(db);
            const snapshot = await onSnapshot(portfoliosCol, (snap) => {
                snap.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error deleting all portfolios:", error);
            throw error;
        }
    }, [currentUser]);

    return {
        portfolios,
        isLoading,
        getPortfolioById,
        createPortfolio,
        updatePortfolio,
        deletePortfolio,
        duplicatePortfolio,
        deleteAllPortfolios
    };
};
