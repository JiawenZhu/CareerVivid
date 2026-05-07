/**
 * Security utility for safe redirects and URL validation.
 */

const ALLOWED_DOMAINS = [
  'careervivid.app',
  'stripe.com',
  'clerk.com',
];

/**
 * Validates if a URL is safe for redirection.
 * A URL is considered safe if it is a relative path OR belongs to an allowed domain.
 */
export const isSafeUrl = (url: string): boolean => {
  if (!url) return false;

  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    return ALLOWED_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch (e) {
    return false;
  }
};

export const getSafeRedirectTarget = (url: string): string => {
  if (!url) return '/';

  // Relative URLs (starting with / but not //) are generally safe
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    const isAllowedDomain = ALLOWED_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );
    return isAllowedDomain ? parsedUrl.toString() : '/';
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
  if (isSafeUrl(url)) {
    window.location.assign(getSafeRedirectTarget(url));
  } else {
    console.error('Blocked unsafe redirect to:', url);
    window.location.assign('/');
  }
};
