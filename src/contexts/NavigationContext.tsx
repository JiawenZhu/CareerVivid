import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type NavPosition = 'side';
type SidebarMode = 'expanded' | 'collapsed';

interface NavigationContextType {
    navPosition: NavPosition;
    toggleNavPosition: () => void;
    sidebarMode: SidebarMode;
    toggleSidebarMode: () => void;
    sidebarWidth: number;
    setSidebarWidth: (width: number | ((prev: number) => number)) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [navPosition, setNavPosition] = useState<NavPosition>('side');
    const [sidebarMode, setSidebarMode] = useState<SidebarMode>('expanded');
    const [sidebarWidth, setSidebarWidthState] = useState<number>(256);

    useEffect(() => {
        const storedMode = localStorage.getItem('careervivid_sidebar_mode');
        if (storedMode === 'expanded' || storedMode === 'collapsed') {
            setSidebarMode(storedMode);
        }

        const storedWidth = localStorage.getItem('careervivid_sidebar_width');
        if (storedWidth) {
            const parsed = parseInt(storedWidth, 10);
            if (!isNaN(parsed) && parsed >= 240 && parsed <= 450) {
                setSidebarWidthState(parsed);
            }
        }
    }, []);

    useEffect(() => {
        setNavPosition('side');
        localStorage.setItem('careervivid_nav_layout', 'side');
    }, []);

    const toggleNavPosition = () => {
        setSidebarMode(prev => {
            const nextMode = prev === 'expanded' ? 'collapsed' : 'expanded';
            localStorage.setItem('careervivid_sidebar_mode', nextMode);
            return nextMode;
        });
    };

    const toggleSidebarMode = toggleNavPosition;

    const setSidebarWidth = (value: number | ((prev: number) => number)) => {
        setSidebarWidthState(prev => {
            const nextWidth = typeof value === 'function' ? value(prev) : value;
            const constrained = Math.max(240, Math.min(450, nextWidth));
            localStorage.setItem('careervivid_sidebar_width', constrained.toString());
            return constrained;
        });
    };

    return (
        <NavigationContext.Provider value={{ navPosition, toggleNavPosition, sidebarMode, toggleSidebarMode, sidebarWidth, setSidebarWidth }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};
