import { describe, expect, it } from 'vitest';
import { getSafeRelativeRedirect } from './security';

describe('getSafeRelativeRedirect', () => {
  it('allows same-origin relative paths with query and hash', () => {
    expect(getSafeRelativeRedirect('/extension-welcome?from=auth#ready')).toBe('/extension-welcome?from=auth#ready');
  });

  it('normalizes same-origin absolute URLs to relative paths', () => {
    const sameOriginUrl = `${window.location.origin}/dashboard?source=signin`;
    expect(getSafeRelativeRedirect(sameOriginUrl)).toBe('/dashboard?source=signin');
  });

  it('blocks external redirects', () => {
    expect(getSafeRelativeRedirect('https://example.com/phish')).toBe('/dashboard');
    expect(getSafeRelativeRedirect('//example.com/phish')).toBe('/dashboard');
    expect(getSafeRelativeRedirect('javascript:alert(1)')).toBe('/dashboard');
  });

  it('uses the requested fallback for invalid targets', () => {
    expect(getSafeRelativeRedirect('https://example.com/phish', '/signin')).toBe('/signin');
  });
});
