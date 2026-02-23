import { SUPPORTED_LANGUAGES } from '../constants';
import i18n from '../i18n';

// Returns path from pathname, stripping language prefix if present
// e.g., /zh/contact -> /contact
// e.g., /contact -> /contact
export const getPathFromUrl = () => {
    let path = window.location.pathname;

    // Remove leading slash for splitting
    if (path.startsWith('/')) path = path.substring(1);

    const parts = path.split('/');

    // Check if first part is a supported language code
    if (parts.length > 0 && SUPPORTED_LANGUAGES.some(l => l.code === parts[0])) {
        // It's a language prefix, remove it to get the actual route
        const langCode = parts[0];

        // For English, we want to STRIP it from URL if it appears (legacy support)
        // but the app should operate as if it's root
        if (langCode === 'en') {
            if (i18n.language !== 'en') {
                i18n.changeLanguage('en');
            }

            // Clean up the URL in the browser bar to remove /en
            // This technically acts as a client-side redirect
            const newPath = '/' + parts.slice(1).join('/');
            window.history.replaceState({}, '', newPath + window.location.search + window.location.hash);

            return newPath;
        }

        // Sync i18n if it differs (this handles direct URL access)
        if (i18n.language !== langCode) {
            i18n.changeLanguage(langCode);
        }
        return '/' + parts.slice(1).join('/');
    }

    // No language prefix
    // If we are at root or any other path without language prefix, assume English
    // But we only strictly switch language if we are SURE. 
    // Actually, for root-based English, any path WITHOUT a lang prefix IS English.
    if (i18n.language !== 'en' && !path.startsWith('assets/')) {
        // Don't switch for assets or other system paths if they leak here
        // i18n.changeLanguage('en'); 
        // BE CAREFUL: Changing language here might cause loops if not careful.
        // Let's trust i18n.init to pick up 'en' as default if no path prefix.
    }

    // Strip trailing slash if present (and not root)
    if (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
    }

    // No language prefix, return as is (with leading slash)
    return '/' + path;
};

// Navigation utility that uses History API and preserves language
export const navigate = (path: string) => {
    // If path already starts with a language code, use it as is
    const parts = path.split('/').filter(p => p);
    if (parts.length > 0 && SUPPORTED_LANGUAGES.some(l => l.code === parts[0])) {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
        return;
    }

    // Otherwise, check current language
    const rawLang = i18n.language || 'en';
    const currentLang = rawLang.substring(0, 2);

    // Normalize lang
    const normalizedLang = SUPPORTED_LANGUAGES.some(l => l.code === currentLang) ? currentLang : 'en';

    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : '/' + path;

    // IF English -> No Prefix (Root path)
    // IF Other -> Prepend /lang
    let fullPath;
    if (normalizedLang === 'en') {
        fullPath = cleanPath;
    } else {
        fullPath = `/${normalizedLang}${cleanPath}`;
    }

    window.history.pushState({}, '', fullPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
};
