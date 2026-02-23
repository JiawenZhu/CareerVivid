import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SUPPORTED_LANGUAGES } from '../constants'; // Ensure this path is correct based on your project structure

/**
 * SEOHelper Component
 * 
 * This component automatically updates the <link rel="canonical"> and <meta property="og:url">
 * tags in the document head whenever the route changes.
 * 
 * It ensures that:
 * 1. Self-referencing canonicals are set for all pages (e.g. /en/demo points to /en/demo).
 * 2. Search engines understand that these are distinct pages, not duplicates of the homepage.
 */
const SEOHelper = () => {
    // We use useLocation if inside Router context, or just window.location if not available yet (though it should be)
    // However, App.tsx handles its own routing state manually with window.history in some places.
    // Since App.tsx uses `path` state derived from `window.location`, we can just use `useEffect` hooked to `window.location.pathname`.
    // But React won't re-render purely on window changes unless state changes. 
    // Ideally, this component should be inside a Router. But looking at App.tsx, it seems to handle routing via a custom `path` state.
    // SO, we will make this component accept the current path as a prop OR use the native window events if placed outside.

    // BETTER APPROACH: 
    // Since `App.tsx` has a `path` state, we can just put this logic inside a `useEffect` in `App.tsx` directly 
    // or make this a custom hook `useCanonicalSEO(path)`.
    // Let's make it a component that takes `path` as a prop to be clean.

    // WAIT: `App.tsx` uses `window.location.pathname` via `getPathFromUrl`.
    // Let's try to be generic.

    useEffect(() => {
        const updateCanonical = () => {
            const canonicalUrl = window.location.origin + window.location.pathname;

            // Update Canonical Link
            let link = document.querySelector("link[rel='canonical']");
            if (!link) {
                link = document.createElement('link');
                link.setAttribute('rel', 'canonical');
                document.head.appendChild(link);
            }
            link.setAttribute('href', canonicalUrl);

            // Update Open Graph URL
            let ogUrl = document.querySelector("meta[property='og:url']");
            if (!ogUrl) {
                ogUrl = document.createElement('meta');
                ogUrl.setAttribute('property', 'og:url');
                document.head.appendChild(ogUrl);
            }
            ogUrl.setAttribute('content', canonicalUrl);

            // Optional: Debug log in dev
            if (import.meta.env.DEV) {
                console.log('SEO Updated:', canonicalUrl);
            }
        };

        // Run immediately
        updateCanonical();

        // Listen for popstate (browser back/forward)
        window.addEventListener('popstate', updateCanonical);

        // Create a custom observer for pushState/replaceState if the app manual routing doesn't trigger popstate
        // Check if we need to monkey-patch history or if App.tsx re-renders this component.
        // If we simply drop this component in App.tsx, it will re-render whenever App re-renders (which happens on route change).

        return () => {
            window.removeEventListener('popstate', updateCanonical);
        };
    }); // No dependency array = run on every render, which is what we want if App.tsx re-renders on route change.

    return null;
};

export default SEOHelper;
