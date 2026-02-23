
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

            // 2. Migrate Resume (Example - logic copied from Dashboard if exists)
            // Ideally we'd import useResumes and do similar logic
            // For now, focusing on the critical Portfolio part as requested
        };

        // Run migration logic
        migrateGuestData();

    }, [currentUser, createPortfolio]);
};
