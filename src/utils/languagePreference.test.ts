import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildLocalizedPath,
  getInitialLanguagePreference,
  getLanguageFromPathname,
  getStoredLanguagePreference,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguageCode,
  setStoredLanguagePreference,
  stripLanguagePrefix,
} from './languagePreference';

describe('languagePreference', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('normalizes supported language variants', () => {
    expect(normalizeLanguageCode('zh-CN')).toBe('zh');
    expect(normalizeLanguageCode('en-US')).toBe('en');
    expect(normalizeLanguageCode('ko')).toBe('ko');
    expect(normalizeLanguageCode('unknown')).toBeUndefined();
  });

  it('uses URL language before stored language during initialization', () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'ja');

    expect(getInitialLanguagePreference('/zh/dashboard')).toBe('zh');
    expect(getInitialLanguagePreference('/dashboard')).toBe('ja');
  });

  it('persists only supported language values', () => {
    expect(setStoredLanguagePreference('fr-FR')).toBe('fr');
    expect(getStoredLanguagePreference()).toBe('fr');

    expect(setStoredLanguagePreference('unsupported')).toBe('en');
    expect(getStoredLanguagePreference()).toBe('en');
  });

  it('detects and strips language prefixes from routes', () => {
    expect(getLanguageFromPathname('/de/job-tracker')).toBe('de');
    expect(stripLanguagePrefix('/de/job-tracker')).toBe('/job-tracker');
    expect(stripLanguagePrefix('/dashboard')).toBe('/dashboard');
  });

  it('builds localized app paths while preserving query and hash', () => {
    expect(buildLocalizedPath('/dashboard?tab=jobs#queue', 'zh')).toBe('/zh/dashboard?tab=jobs#queue');
    expect(buildLocalizedPath('/zh/dashboard?tab=jobs#queue', 'fr')).toBe('/fr/dashboard?tab=jobs#queue');
    expect(buildLocalizedPath('/en/dashboard?tab=jobs', 'en')).toBe('/dashboard?tab=jobs');
    expect(buildLocalizedPath('/dashboard', 'en')).toBe('/dashboard');
  });
});
