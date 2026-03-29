/**
 * Tests for FieldMapper — the pure label-to-profile value mapping module.
 * No DOM required; all functions are pure or use only string operations.
 */

import { describe, it, expect } from 'vitest';
import { normalizeLabel, mapFieldToValue, previewFillPlan } from '../FieldMapper';
import type { AutoFillProfile } from '../../types/autofill.types';

// ─────────────────────────────────────────────────────────────────────────────
// Shared test profile fixture
// ─────────────────────────────────────────────────────────────────────────────
const PROFILE: AutoFillProfile = {
  firstName: 'Jiawen',
  lastName: 'Zhu',
  email: 'jiawen@careervivid.com',
  phone: '555-867-5309',
  city: 'Austin',
  state: 'TX',
  country: 'USA',
  linkedinUrl: 'https://linkedin.com/in/jiawenzhu',
  githubUrl: 'https://github.com/jiawenzhu',
  portfolioUrl: 'https://careervivid.com/jiawenzhu',
  summary: 'Full-stack engineer passionate about developer tools.',
  skills: ['TypeScript', 'React', 'Node.js'],
  workExperience: [
    { company: 'CareerVivid', title: 'Lead Engineer', startDate: '2023-01', endDate: 'Present', description: '' },
    { company: 'Previous Corp', title: 'Engineer', startDate: '2021-06', endDate: '2022-12', description: 'Backend development.' },
  ],
  education: [
    {
      school: 'University of Texas',
      degree: "Bachelor's",
      fieldOfStudy: 'Computer Science',
      graduationDate: '2021-05',
      gpa: '3.8',
    },
  ],
  sourceResumeId: 'test-resume-001',
  lastSyncedAt: '2024-01-01T00:00:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// normalizeLabel
// ─────────────────────────────────────────────────────────────────────────────
describe('normalizeLabel', () => {
  it('lowercases the input', () => {
    expect(normalizeLabel('First Name')).toBe('first name');
  });

  it('removes asterisks (required-field markers)', () => {
    expect(normalizeLabel('Email *')).toBe('email');
  });

  it('removes trailing colons', () => {
    expect(normalizeLabel('Phone:')).toBe('phone');
  });

  it('removes parentheses', () => {
    expect(normalizeLabel('Name (required)')).toBe('name required');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeLabel('First   Name')).toBe('first name');
  });

  it('trims leading/trailing whitespace', () => {
    expect(normalizeLabel('  email  ')).toBe('email');
  });

  it('handles combined noise', () => {
    expect(normalizeLabel('  First Name * (Legal) :  ')).toBe('first name legal');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mapFieldToValue — personal fields
// ─────────────────────────────────────────────────────────────────────────────
describe('mapFieldToValue — personal fields', () => {
  it('maps "first name" → firstName', () => {
    expect(mapFieldToValue('first name', PROFILE)).toBe('Jiawen');
  });

  it('maps "First Name *" (with noise) → firstName', () => {
    expect(mapFieldToValue('First Name *', PROFILE)).toBe('Jiawen');
  });

  it('maps "given name" → firstName', () => {
    expect(mapFieldToValue('given name', PROFILE)).toBe('Jiawen');
  });

  it('maps "last name" → lastName', () => {
    expect(mapFieldToValue('last name', PROFILE)).toBe('Zhu');
  });

  it('maps "surname" → lastName', () => {
    expect(mapFieldToValue('surname', PROFILE)).toBe('Zhu');
  });

  it('maps "full name" → "FirstName LastName"', () => {
    expect(mapFieldToValue('full name', PROFILE)).toBe('Jiawen Zhu');
  });

  it('maps "name" → "FirstName LastName"', () => {
    expect(mapFieldToValue('name', PROFILE)).toBe('Jiawen Zhu');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mapFieldToValue — contact fields
// ─────────────────────────────────────────────────────────────────────────────
describe('mapFieldToValue — contact fields', () => {
  it('maps "email" → email', () => {
    expect(mapFieldToValue('email', PROFILE)).toBe('jiawen@careervivid.com');
  });

  it('maps "e-mail address" → email', () => {
    expect(mapFieldToValue('e-mail address', PROFILE)).toBe('jiawen@careervivid.com');
  });

  it('maps "phone" → phone', () => {
    expect(mapFieldToValue('phone', PROFILE)).toBe('555-867-5309');
  });

  it('maps "mobile number" → phone', () => {
    expect(mapFieldToValue('mobile number', PROFILE)).toBe('555-867-5309');
  });

  it('maps "telephone" → phone', () => {
    expect(mapFieldToValue('telephone', PROFILE)).toBe('555-867-5309');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mapFieldToValue — location
// ─────────────────────────────────────────────────────────────────────────────
describe('mapFieldToValue — location', () => {
  it('maps "city" → city', () => {
    expect(mapFieldToValue('city', PROFILE)).toBe('Austin');
  });

  it('maps "state" → state', () => {
    expect(mapFieldToValue('state', PROFILE)).toBe('TX');
  });

  it('maps "country" → country', () => {
    expect(mapFieldToValue('country', PROFILE)).toBe('USA');
  });

  it('maps "location" → composite city, state, country', () => {
    expect(mapFieldToValue('location', PROFILE)).toBe('Austin, TX, USA');
  });

  it('omits empty location parts', () => {
    const noState = { ...PROFILE, state: undefined };
    expect(mapFieldToValue('location', noState)).toBe('Austin, USA');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mapFieldToValue — online presence
// ─────────────────────────────────────────────────────────────────────────────
describe('mapFieldToValue — online presence', () => {
  it('maps "linkedin" → linkedinUrl', () => {
    expect(mapFieldToValue('linkedin', PROFILE)).toBe('https://linkedin.com/in/jiawenzhu');
  });

  it('maps "github url" → githubUrl', () => {
    expect(mapFieldToValue('github url', PROFILE)).toBe('https://github.com/jiawenzhu');
  });

  it('maps "portfolio url" → portfolioUrl', () => {
    expect(mapFieldToValue('portfolio url', PROFILE)).toBe('https://careervivid.com/jiawenzhu');
  });

  it('maps "personal website" → portfolioUrl', () => {
    expect(mapFieldToValue('personal website', PROFILE)).toBe('https://careervivid.com/jiawenzhu');
  });

  it('returns null when linkedinUrl is empty', () => {
    const noLinkedin = { ...PROFILE, linkedinUrl: '' };
    expect(mapFieldToValue('linkedin', noLinkedin)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mapFieldToValue — skills & summary
// ─────────────────────────────────────────────────────────────────────────────
describe('mapFieldToValue — skills & summary', () => {
  it('maps "skills" → comma-joined skills', () => {
    expect(mapFieldToValue('skills', PROFILE)).toBe('TypeScript, React, Node.js');
  });

  it('maps "technical skills" → comma-joined skills', () => {
    expect(mapFieldToValue('technical skills', PROFILE)).toBe('TypeScript, React, Node.js');
  });

  it('maps "summary" → summary text', () => {
    expect(mapFieldToValue('summary', PROFILE)).toBe(PROFILE.summary);
  });

  it('maps "tell us about yourself" → summary text', () => {
    expect(mapFieldToValue('tell us about yourself', PROFILE)).toBe(PROFILE.summary);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mapFieldToValue — work experience (most recent)
// ─────────────────────────────────────────────────────────────────────────────
describe('mapFieldToValue — work experience', () => {
  it('maps "company" → most recent company', () => {
    expect(mapFieldToValue('company', PROFILE)).toBe('CareerVivid');
  });

  it('maps "job title" → most recent title', () => {
    expect(mapFieldToValue('job title', PROFILE)).toBe('Lead Engineer');
  });

  it('maps "current title" → most recent title', () => {
    expect(mapFieldToValue('current title', PROFILE)).toBe('Lead Engineer');
  });

  it('returns empty string when workExperience is empty', () => {
    const noWork = { ...PROFILE, workExperience: [] };
    expect(mapFieldToValue('company', noWork)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mapFieldToValue — education
// ─────────────────────────────────────────────────────────────────────────────
describe('mapFieldToValue — education', () => {
  it('maps "degree" → most recent degree', () => {
    expect(mapFieldToValue('degree', PROFILE)).toBe("Bachelor's");
  });

  it('maps "school" → most recent school', () => {
    expect(mapFieldToValue('school', PROFILE)).toBe('University of Texas');
  });

  it('maps "university" → most recent school', () => {
    expect(mapFieldToValue('university', PROFILE)).toBe('University of Texas');
  });

  it('maps "major" → fieldOfStudy', () => {
    expect(mapFieldToValue('major', PROFILE)).toBe('Computer Science');
  });

  it('maps "graduation year" → year only', () => {
    expect(mapFieldToValue('graduation year', PROFILE)).toBe('2021');
  });

  it('maps "graduation date" → formatted month year', () => {
    // "2021-05" → "May 2021"
    const result = mapFieldToValue('graduation date', PROFILE);
    expect(result).toMatch(/May 2021/);
  });

  it('maps "gpa" → gpa string', () => {
    expect(mapFieldToValue('gpa', PROFILE)).toBe('3.8');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mapFieldToValue — unknown fields
// ─────────────────────────────────────────────────────────────────────────────
describe('mapFieldToValue — unknown fields', () => {
  it('returns null for completely unknown label', () => {
    expect(mapFieldToValue('favorite pizza topping', PROFILE)).toBeNull();
  });

  it('returns null for empty label', () => {
    expect(mapFieldToValue('', PROFILE)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// previewFillPlan
// ─────────────────────────────────────────────────────────────────────────────
describe('previewFillPlan', () => {
  it('returns correct label→value pairs for known labels', () => {
    const plan = previewFillPlan(['first name', 'email', 'phone'], PROFILE);
    expect(plan).toEqual([
      { label: 'first name', value: 'Jiawen' },
      { label: 'email', value: 'jiawen@careervivid.com' },
      { label: 'phone', value: '555-867-5309' },
    ]);
  });

  it('returns null value for unmapped labels', () => {
    const plan = previewFillPlan(['favorite color'], PROFILE);
    expect(plan[0].value).toBeNull();
  });

  it('returns an empty array for empty input', () => {
    expect(previewFillPlan([], PROFILE)).toEqual([]);
  });
});
