const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

/** Returns a normalized http(s) URL, or null for unsafe and malformed values. */
export const toSafeExternalUrl = (value: string | undefined | null): string | null => {
  if (!value) return null;

  try {
    const url = new URL(value);
    return HTTP_PROTOCOLS.has(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

/** Restricts post-auth navigation to a route owned by the current web origin. */
export const toSafeInternalPath = (value: string | null, fallback: string): string => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;

  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
};
