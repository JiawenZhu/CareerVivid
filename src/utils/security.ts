/**
 * Security utility for safe redirects and URL validation.
 */

/**
 * Validates if a URL is safe for redirection.
 * Auth redirects are only safe when they stay inside the current app origin.
 */
export const isSafeUrl = (url: string): boolean => {
  return url === '/' || getSafeRedirectTarget(url) !== '/';
};

export const getSafeRedirectTarget = (url: string): string => {
  if (!url) return '/';

  if (url.startsWith('//')) {
    return '/';
  }

  try {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://careervivid.app';
    const parsedUrl = new URL(url, currentOrigin);

    if (parsedUrl.origin !== currentOrigin) {
      return '/';
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch (e) {
    // If it's not a valid URL and not relative, it's unsafe
    return '/';
  }
};

/**
 * Safely redirects the browser to the specified URL.
 * Falls back to root if the URL is deemed unsafe.
 */
export const safeRedirect = (url: string): void => {
  const target = getSafeRedirectTarget(url);
  if (target === '/' && url !== '/') {
    console.error('Blocked unsafe redirect to:', url);
  }

  window.history.pushState({}, '', target);
  window.dispatchEvent(new PopStateEvent('popstate'));
};
