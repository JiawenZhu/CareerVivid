import i18n from '../i18n';
import {
    buildLocalizedPath,
    getLanguageFromPathname,
    getStoredLanguagePreference,
    normalizeLanguageCode,
    setStoredLanguagePreference,
    stripLanguagePrefix,
} from './languagePreference';

// Returns path from pathname, stripping language prefix if present
// e.g., /zh/contact -> /contact
// e.g., /contact -> /contact
export const getPathFromUrl = () => {
    let path = window.location.pathname;
    const langCode = getLanguageFromPathname(path);

    // Remove leading slash for splitting
    if (path.startsWith('/')) path = path.substring(1);

    const parts = path.split('/');

    // Check if first part is a supported language code
    if (parts.length > 0 && langCode) {
        // It's a language prefix, remove it to get the actual route
        setStoredLanguagePreference(langCode);

        // For English, we want to STRIP it from URL if it appears (legacy support)
        // but the app should operate as if it's root
        if (langCode === 'en') {
            if (normalizeLanguageCode(i18n.resolvedLanguage || i18n.language) !== 'en') {
                i18n.changeLanguage('en');
            }

            // Clean up the URL in the browser bar to remove /en
            // This technically acts as a client-side redirect
            const newPath = stripLanguagePrefix(window.location.pathname);
            window.history.replaceState({}, '', newPath + window.location.search + window.location.hash);

            return newPath;
        }

        // Sync i18n if it differs (this handles direct URL access)
        if (normalizeLanguageCode(i18n.resolvedLanguage || i18n.language) !== langCode) {
            i18n.changeLanguage(langCode);
        }
        return stripLanguagePrefix(window.location.pathname);
    }

    // No language prefix: keep the user's persisted choice so authenticated
    // workspace pages stay in the same language after redirects and reloads.
    const storedLanguage = getStoredLanguagePreference();
    if (storedLanguage && !path.startsWith('assets/') && normalizeLanguageCode(i18n.resolvedLanguage || i18n.language) !== storedLanguage) {
        i18n.changeLanguage(storedLanguage);
    }

    // Strip trailing slash if present (and not root)
    if (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
    }

    // No language prefix, return as is (with leading slash)
    return '/' + path;
};

// Navigation utility that uses History API and preserves language
export const navigate = (path: string, state: any = {}) => {
    const targetLanguage =
        getLanguageFromPathname(path) ||
        getStoredLanguagePreference() ||
        normalizeLanguageCode(i18n.resolvedLanguage || i18n.language) ||
        getLanguageFromPathname(window.location.pathname) ||
        'en';
    const normalizedLanguage = setStoredLanguagePreference(targetLanguage);

    if (normalizeLanguageCode(i18n.resolvedLanguage || i18n.language) !== normalizedLanguage) {
        i18n.changeLanguage(normalizedLanguage);
    }

    const fullPath = buildLocalizedPath(path, normalizedLanguage);
    window.history.pushState(state, '', fullPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
};
