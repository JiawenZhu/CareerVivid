import { describe, expect, it } from 'vitest';
import { toSafeExternalUrl, toSafeInternalPath } from './safeUrl';

describe('safe URL helpers', () => {
  it('allows normalized http(s) URLs only', () => {
    expect(toSafeExternalUrl('https://jobs.example.com/apply?role=engineer')).toBe('https://jobs.example.com/apply?role=engineer');
    expect(toSafeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(toSafeExternalUrl('data:text/html,unsafe')).toBeNull();
    expect(toSafeExternalUrl('not a URL')).toBeNull();
  });

  it('keeps post-auth navigation on the current origin', () => {
    expect(toSafeInternalPath('/dashboard?from=extension', '/extension-welcome')).toBe('/dashboard?from=extension');
    expect(toSafeInternalPath('https://attacker.example', '/extension-welcome')).toBe('/extension-welcome');
    expect(toSafeInternalPath('//attacker.example', '/extension-welcome')).toBe('/extension-welcome');
  });
});
