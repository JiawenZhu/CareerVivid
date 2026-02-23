import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AICreditLimitModal from '../components/AICreditLimitModal';

export const useAICreditCheck = (): { checkCredit: () => boolean; CreditLimitModal: React.FC } => {
    const { aiUsage } = useAuth();
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

    const checkCredit = useCallback((): boolean => {
        // Fail safe: allow if data not loaded yet
        if (!aiUsage) return true;

        if (aiUsage.count >= aiUsage.limit) {
            setIsLimitModalOpen(true);
            return false;
        }

        return true;
    }, [aiUsage]);

    const CreditLimitModal = useCallback(() => (
        <AICreditLimitModal
            isOpen={isLimitModalOpen}
            onClose={() => setIsLimitModalOpen(false)}
            usage={aiUsage?.count || 0}
            limit={aiUsage?.limit || 10}
        />
    ), [isLimitModalOpen, aiUsage]);

    return {
        checkCredit,
        CreditLimitModal
    };
};
