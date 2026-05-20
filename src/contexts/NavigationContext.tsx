import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type NavPosition = 'top' | 'side';

interface NavigationContextType {
    navPosition: NavPosition;
    toggleNavPosition: () => void;
    sidebarWidth: number;
    setSidebarWidth: (width: number | ((prev: number) => number)) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [navPosition, setNavPosition] = useState<NavPosition>('side');
    const [sidebarWidth, setSidebarWidthState] = useState<number>(256);

    useEffect(() => {
        const stored = localStorage.getItem('careervivid_nav_layout');
        if (stored === 'top' || stored === 'side') {
            setNavPosition(stored);
        }

        const storedWidth = localStorage.getItem('careervivid_sidebar_width');
        if (storedWidth) {
            const parsed = parseInt(storedWidth, 10);
            if (!isNaN(parsed) && parsed >= 240 && parsed <= 450) {
                setSidebarWidthState(parsed);
            }
        }
    }, []);

    const toggleNavPosition = () => {
        setNavPosition(prev => {
            const newPos = prev === 'top' ? 'side' : 'top';
            localStorage.setItem('careervivid_nav_layout', newPos);
            return newPos;
        });
    };

    const setSidebarWidth = (value: number | ((prev: number) => number)) => {
        setSidebarWidthState(prev => {
            const nextWidth = typeof value === 'function' ? value(prev) : value;
            const constrained = Math.max(240, Math.min(450, nextWidth));
            localStorage.setItem('careervivid_sidebar_width', constrained.toString());
            return constrained;
        });
    };

    return (
        <NavigationContext.Provider value={{ navPosition, toggleNavPosition, sidebarWidth, setSidebarWidth }}>
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
