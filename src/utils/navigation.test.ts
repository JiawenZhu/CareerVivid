import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LANGUAGE_STORAGE_KEY } from './languagePreference';

const { mockChangeLanguage } = vi.hoisted(() => ({
  mockChangeLanguage: vi.fn(),
}));

vi.mock('../i18n', () => ({
  default: {
    language: 'en',
    resolvedLanguage: 'en',
    changeLanguage: mockChangeLanguage,
  },
}));

describe('navigation language routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('keeps the stored language when navigating to authenticated workspace routes', async () => {
    const { navigate } = await import('./navigation');

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'zh');
    navigate('/dashboard');

    expect(window.location.pathname).toBe('/zh/dashboard');
    expect(mockChangeLanguage).toHaveBeenCalledWith('zh');
  });

  it('uses direct language-prefixed URLs as the new preference', async () => {
    const { getPathFromUrl } = await import('./navigation');

    window.history.replaceState({}, '', '/fr/job-tracker?view=board');

    expect(getPathFromUrl()).toBe('/job-tracker');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
    expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
  });

  it('normalizes English routes back to the canonical unprefixed path', async () => {
    const { navigate } = await import('./navigation');

    navigate('/en/dashboard?tab=jobs');

    expect(window.location.pathname).toBe('/dashboard');
    expect(window.location.search).toBe('?tab=jobs');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  });
});
