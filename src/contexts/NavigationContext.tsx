import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type NavPosition = 'top' | 'side';

interface NavigationContextType {
    navPosition: NavPosition;
    toggleNavPosition: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [navPosition, setNavPosition] = useState<NavPosition>('top');

    useEffect(() => {
        const stored = localStorage.getItem('careervivid_nav_layout');
        if (stored === 'top' || stored === 'side') {
            setNavPosition(stored);
        }
    }, []);

    const toggleNavPosition = () => {
        setNavPosition(prev => {
            const newPos = prev === 'top' ? 'side' : 'top';
            localStorage.setItem('careervivid_nav_layout', newPos);
            return newPos;
        });
    };

    return (
        <NavigationContext.Provider value={{ navPosition, toggleNavPosition }}>
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
