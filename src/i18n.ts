
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { SUPPORTED_LANGUAGES } from './constants';

const supportedCodes = SUPPORTED_LANGUAGES.map(l => l.code);

// Helper to get language from URL path before i18n init
const getLangFromPath = () => {
  if (typeof window === 'undefined') return undefined;
  const path = window.location.pathname;
  const parts = path.split('/').filter(p => p);
  if (parts.length > 0 && supportedCodes.includes(parts[0])) {
    return parts[0];
  }
  // If no prefix found, we assume English (root path)
  // This helps i18n init with 'en' immediately instead of waiting for fallback
  return 'en';
  return undefined;
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: getLangFromPath(), // Prioritize URL path language
    fallbackLng: 'en',
    supportedLngs: supportedCodes,
    load: 'languageOnly', // e.g. en-US -> en
    debug: false,

    ns: ['translation'],
    defaultNS: 'translation',

    backend: {
      loadPath: '/locales/{{lng}}/translation.json?v=' + new Date().getTime(),
    },

    detection: {
      order: ['path', 'navigator', 'htmlTag'],
      lookupFromPathIndex: 0
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false, // Disable suspense to prevent loading issues
    }
  });

export default i18n;
