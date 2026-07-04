import React, { ReactNode, useEffect } from 'react';
import { useNavigation } from '../../contexts/NavigationContext';
import Sidebar from '../Navigation/Sidebar';
// LICENSE REQUIREMENT: This attribution badge must remain intact and visible per the repository license.
import OpenSourceAttribution from '../OpenSourceAttribution';

interface AppLayoutProps {
    children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const { sidebarMode, sidebarWidth } = useNavigation();
    const activeSidebarWidth = sidebarMode === 'collapsed' ? 72 : sidebarWidth;

    useEffect(() => {
        document.documentElement.classList.add('cv-product-density-root');
        document.body.classList.add('cv-product-density-body');

        if (window.scrollX !== 0) {
            window.scrollTo({ left: 0, top: window.scrollY });
        }

        return () => {
            document.documentElement.classList.remove('cv-product-density-root');
            document.body.classList.remove('cv-product-density-body');
        };
    }, []);

    return (
        <div
            className="cv-product-density flex min-h-screen bg-gray-50 dark:bg-gray-950"
            style={{ '--sidebar-width': `${activeSidebarWidth}px` } as React.CSSProperties}
        >
            <Sidebar />
            <main className="flex-1 overflow-x-hidden md:pl-[var(--sidebar-width)] flex flex-col min-w-0 bg-gray-50 transition-[padding-left] duration-200 ease-in-out dark:bg-gray-950">
                <div className="cv-product-density-viewport flex-1">{children}</div>
                <div className="cv-product-density-footer">
                    <OpenSourceAttribution />
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
