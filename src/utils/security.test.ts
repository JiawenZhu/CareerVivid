import { getSafeRedirectTarget, isSafeUrl } from './security';

describe('isSafeUrl', () => {
  it('allows internal relative paths', () => {
    expect(isSafeUrl('/dashboard')).toBe(true);
    expect(isSafeUrl('/signin?redirect=/dashboard')).toBe(true);
  });

  it('allows configured HTTPS origins', () => {
    expect(isSafeUrl('https://careervivid.app/dashboard')).toBe(true);
    expect(isSafeUrl('https://app.stripe.com/dashboard')).toBe(true);
  });

  it('blocks open redirects and protocol-relative URLs', () => {
    expect(isSafeUrl('https://evil.example/phish')).toBe(false);
    expect(isSafeUrl('//evil.example/phish')).toBe(false);
  });

  it('blocks non-HTTP protocols even on allowed hosts', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('ftp://careervivid.app/file')).toBe(false);
  });

  it('returns a safe fallback for unsafe redirect targets', () => {
    expect(getSafeRedirectTarget('https://evil.example/phish')).toBe('/');
    expect(getSafeRedirectTarget('https://evil.example/phish', '/dashboard')).toBe('/dashboard');
  });
});
