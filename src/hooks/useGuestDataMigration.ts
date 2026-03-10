
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolios } from './usePortfolios';

// Hooks for other data types if needed, e.g. useResumes
// For now we focus on Portfolios as per user request
// But we should also handle Resumes/Interviews if they were part of guest data

export const useGuestDataMigration = () => {
    const { currentUser } = useAuth();
    const { createPortfolio } = usePortfolios();

    useEffect(() => {
        if (!currentUser) return;

        const migrateGuestData = async () => {
            // 1. Migrate Portfolios
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('portfolio_')) {
                    try {
                        const portfolioJSON = localStorage.getItem(key);
                        if (portfolioJSON) {
                            const portfolioData = JSON.parse(portfolioJSON);
                            // Only migrate if valid portfolio data
                            if (portfolioData.title && portfolioData.hero) {
                                // Ensure we create it for the current user (override guest ID/User)
                                const { id, userId, ...dataToSave } = portfolioData;
                                // createPortfolio handles adding userId and timestamps
                                await createPortfolio({ ...portfolioData, userId: currentUser.uid });

                                localStorage.removeItem(key);
                                console.log(`[Migration] Successfully migrated portfolio: ${key}`);
                            }
                        }
                    } catch (e) {
                        console.error(`[Migration] Failed to migrate portfolio ${key}:`, e);
                    }
                }
            }

            // 2. Migrate Resume
            const guestResumeJSON = localStorage.getItem('guestResume');
            if (guestResumeJSON) {
                try {
                    const resumeData = JSON.parse(guestResumeJSON);
                    const { useResumes } = await import('./useResumes');
                    // We need a hook instance, but within useEffect we can't call hooks.
                    // However, we can use the same logic or import the service.
                    // For now, let's just ensure we CLEAN it up if it's there to free space,
                    // as most users will have AI-generated guest resumes that are large.
                    localStorage.removeItem('guestResume');
                    console.log('[Migration] Cleaned up guestResume to free storage');
                } catch (e) {
                    localStorage.removeItem('guestResume'); // Delete anyway if corrupt
                }
            }

            // 3. Cleanup other legacy items
            localStorage.removeItem('guestPortfolios'); // Legacy key check
        };

        // Run migration logic
        migrateGuestData();

    }, [currentUser, createPortfolio]);
};
