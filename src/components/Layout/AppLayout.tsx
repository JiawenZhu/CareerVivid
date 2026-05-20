import React, { ReactNode } from 'react';
import { useNavigation } from '../../contexts/NavigationContext';
import Sidebar from '../Navigation/Sidebar';
// LICENSE REQUIREMENT: This attribution badge must remain intact and visible per the repository license.
import OpenSourceAttribution from '../OpenSourceAttribution';

interface AppLayoutProps {
    children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const { navPosition, sidebarWidth } = useNavigation();

    if (navPosition === 'side') {
        return (
            <div 
                className="flex min-h-screen bg-gray-50 dark:bg-gray-950"
                style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
            >
                <Sidebar />
                <main className="flex-1 overflow-x-hidden md:pl-[var(--sidebar-width)] flex flex-col min-w-0 bg-gray-50 dark:bg-gray-950">
                    <div className="flex-1">{children}</div>
                    <OpenSourceAttribution />
                </main>
            </div>
        );
    }

    // Top nav layout
    return (
        <div className="flex flex-col min-h-screen bg-transparent">
            <div className="flex-1">{children}</div>
            <OpenSourceAttribution />
        </div>
    );
};

export default AppLayout;
