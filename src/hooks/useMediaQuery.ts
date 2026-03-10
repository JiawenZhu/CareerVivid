import { useState, useEffect } from 'react';

/**
 * Custom hook that returns true if the media query matches.
 * @param query The media query string (e.g., '(min-width: 768px)')
 * @returns boolean
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState<boolean>(() => {
        // Initial check on mount
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const media = window.matchMedia(query);
        const listener = () => setMatches(media.matches);

        // Update matches state on change
        media.addEventListener('change', listener);
        
        // Final check to handle potential race conditions during initial render
        setMatches(media.matches);

        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
}
