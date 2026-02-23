import React, { useState, useCallback } from 'react';
import { navigate } from '../../../utils/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import useLongPress from '../../../hooks/useLongPress';
import QuickAuthModal from '../../../components/QuickAuthModal';
import { PortfolioData } from '../types/portfolio';

interface UsePortfolioAdminAccessProps {
    data: PortfolioData;
    onEdit?: (fieldId: string) => void;
    editField?: string;
}

export const usePortfolioAdminAccess = ({ data, onEdit, editField = 'hero.avatarUrl' }: UsePortfolioAdminAccessProps) => {
    const { currentUser } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);

    // Inject styles for mobile long-press handling
    React.useEffect(() => {
        const styleId = 'long-press-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                [data-long-press-target="true"] {
                    -webkit-touch-callout: none !important;
                    -webkit-user-select: none !important;
                    user-select: none !important;
                    -webkit-tap-highlight-color: transparent !important;
                }
                [data-long-press-target="true"] img {
                    pointer-events: none !important; /* Prevents iOS image preview/save menu */
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    // Admin Access Logic
    const isPublicView = !onEdit;

    const handleAdminAccess = useCallback(() => {
        console.log('[usePortfolioAdminAccess] Long press triggered. isPublicView:', isPublicView);
        if (!isPublicView) return;

        if (currentUser) {
            console.log('[usePortfolioAdminAccess] User logged in. Navigating to edit.');
            // Already logged in - Redirect to Edit Page
            if (data.id) {
                const pathParts = window.location.pathname.split('/');
                const slug = pathParts[2] || 'user';
                navigate(`/portfolio/${slug}/edit/${data.id}`);
            }
        } else {
            console.log('[usePortfolioAdminAccess] User not logged in. Showing Modal.');
            // Not logged in - Show Quick Auth Modal
            setShowAuthModal(true);
        }
    }, [isPublicView, currentUser, data.id]);

    const longPressProps = useLongPress(handleAdminAccess, () => {
        if (onEdit) onEdit(editField);
    }, {
        shouldPreventDefault: true,
        delay: 2000 // 2 Seconds as requested
    });

    const AdminAccessModal = useCallback(() => (
        <QuickAuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={(isNewUser) => {
                setShowAuthModal(false);
                if (currentUser || isNewUser) {
                    if (data.id) {
                        const pathParts = window.location.pathname.split('/');
                        const slug = pathParts[2] || 'user';
                        navigate(`/portfolio/${slug}/edit/${data.id}`);
                    } else {
                        navigate('/dashboard');
                    }
                }
            }}
            title="Admin Access"
            subtitle="Sign in to edit this portfolio."
        />
    ), [showAuthModal, currentUser, data.id]);

    return {
        longPressProps,
        AdminAccessModal,
        setShowAuthModal
    };
};

