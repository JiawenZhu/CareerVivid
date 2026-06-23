import { SUPPORTED_LANGUAGES } from '../constants';

export const LANGUAGE_STORAGE_KEY = 'i18nextLng';

const supportedLanguageCodes = SUPPORTED_LANGUAGES.map((language) => language.code);

const splitPath = (path: string): { pathname: string; search: string; hash: string } => {
  const match = String(path || '/').match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  return {
    pathname: match?.[1] || '/',
    search: match?.[2] || '',
    hash: match?.[3] || '',
  };
};

export const normalizeLanguageCode = (value?: string | null): string | undefined => {
  if (!value) return undefined;

  const raw = value.trim();
  if (!raw) return undefined;

  if (supportedLanguageCodes.includes(raw)) return raw;

  const shortCode = raw.toLowerCase().split(/[-_]/)[0];
  return supportedLanguageCodes.includes(shortCode) ? shortCode : undefined;
};

export const getLanguageFromPathname = (pathname: string): string | undefined => {
  const firstPart = String(pathname || '')
    .split('/')
    .filter(Boolean)[0];

  return normalizeLanguageCode(firstPart);
};

export const getStoredLanguagePreference = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;

  try {
    return normalizeLanguageCode(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return undefined;
  }
};

export const setStoredLanguagePreference = (language: string): string => {
  const normalizedLanguage = normalizeLanguageCode(language) || 'en';

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage);
    } catch {
      // Language persistence should never block navigation or rendering.
    }
  }

  return normalizedLanguage;
};

export const getInitialLanguagePreference = (pathname?: string): string => {
  const currentPathname = pathname || (typeof window !== 'undefined' ? window.location.pathname : '/');
  return getLanguageFromPathname(currentPathname) || getStoredLanguagePreference() || 'en';
};

export const stripLanguagePrefix = (pathname: string): string => {
  const parts = String(pathname || '/').split('/').filter(Boolean);

  if (parts.length > 0 && getLanguageFromPathname(pathname)) {
    const stripped = `/${parts.slice(1).join('/')}`;
    return stripped === '/' ? '/' : stripped.replace(/\/+$/, '');
  }

  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/, '') : normalized;
};

export const buildLocalizedPath = (path: string, language: string): string => {
  const normalizedLanguage = normalizeLanguageCode(language) || 'en';
  const { pathname, search, hash } = splitPath(path);
  const strippedPathname = stripLanguagePrefix(pathname);
  const basePath = strippedPathname === '/' ? '' : strippedPathname;
  const localizedPathname = normalizedLanguage === 'en' ? strippedPathname : `/${normalizedLanguage}${basePath}`;

  return `${localizedPathname}${search}${hash}`;
};
