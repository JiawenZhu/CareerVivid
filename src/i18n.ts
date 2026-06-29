
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { SUPPORTED_LANGUAGES } from './constants';
import { getInitialLanguagePreference } from './utils/languagePreference';

const supportedCodes = SUPPORTED_LANGUAGES.map(l => l.code);

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: getInitialLanguagePreference(),
    fallbackLng: 'en',
    supportedLngs: supportedCodes,
    load: 'languageOnly', // e.g. en-US -> en
    debug: false,

    ns: ['translation'],
    defaultNS: 'translation',

    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },

    detection: {
      order: ['path', 'localStorage', 'navigator', 'htmlTag'],
      lookupFromPathIndex: 0,
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false, // Disable suspense to prevent loading issues
    }
  });

export default i18n;
