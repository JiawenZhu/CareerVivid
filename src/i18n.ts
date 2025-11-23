
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { SUPPORTED_LANGUAGES } from './constants';

const supportedCodes = SUPPORTED_LANGUAGES.map(l => l.code);

// Helper to get language from hash before i18n init
const getLangFromHash = () => {
  if (typeof window === 'undefined') return undefined;
  const hash = window.location.hash;
  const path = hash.startsWith('#') ? hash.substring(1) : '/';
  const parts = path.split('/').filter(p => p);
  if (parts.length > 0 && supportedCodes.includes(parts[0])) {
      return parts[0];
  }
  return undefined;
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: getLangFromHash(), // Prioritize URL hash language
    fallbackLng: 'en',
    supportedLngs: supportedCodes,
    load: 'languageOnly', // e.g. en-US -> en
    debug: false,
    
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },

    detection: {
      order: ['path', 'navigator', 'htmlTag'],
      lookupFromPathIndex: 0,
      checkWhitelist: true
    },

    interpolation: {
      escapeValue: false, 
    },
    
    react: {
        useSuspense: true,
    }
  });

export default i18n;
