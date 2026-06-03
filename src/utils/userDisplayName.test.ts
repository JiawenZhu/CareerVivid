import { describe, expect, it } from 'vitest';
import { getEmailDisplayName, resolveUserDisplayName } from './userDisplayName';

describe('user display name helpers', () => {
  it('derives a default display name from the email local-part', () => {
    expect(getEmailDisplayName('peter00100712345@gmail.com')).toBe('peter00100712345');
  });

  it('keeps a manually saved profile display name first', () => {
    expect(resolveUserDisplayName({
      profileDisplayName: 'Peter Lee',
      email: 'peter00100712345@gmail.com',
      authDisplayName: 'Google Name',
    })).toBe('Peter Lee');
  });

  it('uses email before generic or provider-only names', () => {
    expect(resolveUserDisplayName({
      profileDisplayName: 'Community Member',
      email: 'peter00100712345@gmail.com',
      authDisplayName: 'Peter From Google',
    })).toBe('peter00100712345');
  });
});

