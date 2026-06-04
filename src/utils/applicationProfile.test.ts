import { describe, expect, it } from 'vitest';
import type { ApplicationProfile } from '../types';
import {
  createDefaultApplicationProfile,
  getApplicationProfileCompletionPercent,
  isSensitiveApplicationField,
  resolveSensitiveApplicationAnswer,
  validateApplicationProfile,
  withApplicationProfileCompletion,
} from './applicationProfile';

function readyProfile(): ApplicationProfile {
  const profile = createDefaultApplicationProfile('user-1');
  return withApplicationProfileCompletion({
    ...profile,
    workAuthorization: {
      legallyAuthorized: true,
      needsSponsorshipNow: false,
      needsSponsorshipFuture: false,
    },
    identity: {
      ...profile.identity,
      firstName: 'Jiawen',
      lastName: 'Zhu',
      email: 'jiawen@example.com',
      phone: '555-0100',
      country: 'United States',
    },
    relocationRemote: {
      ...profile.relocationRemote,
      willingToRelocate: true,
    },
    backgroundLegal: {
      backgroundCheckConsent: true,
      ageEligibilityAttested: true,
      workEligibilityAttested: true,
    },
    consent: {
      ...profile.consent,
      autoSubmitAuthorized: true,
    },
  });
}

describe('applicationProfile sensitive field handling', () => {
  it('detects legal, sponsorship, EEO, compensation, and relocation labels as sensitive', () => {
    expect(isSensitiveApplicationField('Will you require sponsorship in the future?')).toBe(true);
    expect(isSensitiveApplicationField('Voluntary EEO gender')).toBe(true);
    expect(isSensitiveApplicationField('Desired salary')).toBe(true);
    expect(isSensitiveApplicationField('Are you willing to relocate?')).toBe(true);
    expect(isSensitiveApplicationField('Tell us about a project you led')).toBe(false);
  });

  it('requires explicit saved answers for sensitive fields', () => {
    const profile = createDefaultApplicationProfile('user-1');
    const answer = resolveSensitiveApplicationAnswer('Will you now require sponsorship?', profile);

    expect(answer).toEqual(expect.objectContaining({
      answer: '',
      source: 'skipped',
      sensitive: true,
      requiresUser: true,
    }));
  });

  it('treats Prefer not to answer as an explicit EEO answer', () => {
    const profile = readyProfile();
    const answer = resolveSensitiveApplicationAnswer('Veteran status', profile);

    expect(answer).toEqual(expect.objectContaining({
      answer: 'Prefer not to answer',
      source: 'application_profile',
      requiresUser: false,
    }));
  });

  it('marks a complete profile ready only after consent and required fields are present', () => {
    const profile = readyProfile();
    const validation = validateApplicationProfile(profile);

    expect(validation.requiredReady).toBe(true);
    expect(validation.missingRequiredFields).toEqual([]);
    expect(getApplicationProfileCompletionPercent(profile)).toBe(100);
  });
});
