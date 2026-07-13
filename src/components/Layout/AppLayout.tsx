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
            className="cv-product-density cv-design-page cv-design-grid flex min-h-screen"
            style={{ '--sidebar-width': `${activeSidebarWidth}px` } as React.CSSProperties}
        >
            <Sidebar />
            <main className="cv-product-density-main cv-design-page cv-design-grid flex min-w-0 flex-1 flex-col overflow-x-hidden transition-[padding-left] duration-200 ease-in-out md:pl-[var(--sidebar-width)]">
                <div className="cv-product-density-viewport flex min-h-0 flex-1 flex-col">{children}</div>
                <div className="cv-product-density-footer mt-auto">
                    <OpenSourceAttribution />
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
