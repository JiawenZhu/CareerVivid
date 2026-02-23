import { useEffect, useRef } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface UseAnalyticsProps {
    portfolioId: string | undefined;
    ownerId: string | undefined;
    enabled: boolean;
}

export const useAnalytics = ({ portfolioId, ownerId, enabled }: UseAnalyticsProps) => {
    const hasLoggedView = useRef(false);

    // Helper: Get or Create Visitor ID
    const getVisitorId = () => {
        let vid = localStorage.getItem('cv_visitor_id');
        if (!vid) {
            vid = crypto.randomUUID();
            localStorage.setItem('cv_visitor_id', vid);
        }
        return vid;
    };

    // Track Page View
    useEffect(() => {
        if (!enabled || !portfolioId || !ownerId || hasLoggedView.current) return;

        const logView = async () => {
            try {
                // Get Source from URL
                const urlParams = new URLSearchParams(window.location.search);
                const source = urlParams.get('ref') || 'direct';
                const visitorId = getVisitorId();

                // Log Event
                await addDoc(collection(db, 'users', ownerId, 'portfolios', portfolioId, 'stats'), {
                    type: 'view',
                    source: source,
                    timestamp: serverTimestamp(),
                    visitorId: visitorId,
                    userAgent: navigator.userAgent,
                });

                hasLoggedView.current = true;
                console.log('[Analytics] View logged:', { source, visitorId });
            } catch (error) {
                console.error('[Analytics] Failed to log view:', error);
            }
        };

        logView();
    }, [portfolioId, ownerId, enabled]);

    // Track Click
    const trackClick = async (targetId: string, label: string) => {
        if (!enabled || !portfolioId || !ownerId) return;

        try {
            const visitorId = getVisitorId();
            await addDoc(collection(db, 'users', ownerId, 'portfolios', portfolioId, 'stats'), {
                type: 'click',
                targetId: targetId,
                label: label,
                timestamp: serverTimestamp(),
                visitorId: visitorId
            });
            console.log('[Analytics] Click logged:', { targetId, label });
        } catch (error) {
            console.error('[Analytics] Failed to log click:', error);
        }
    };

    return { trackClick };
};
