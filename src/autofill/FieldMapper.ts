/**
 * CareerVivid Auto-Apply — Field Mapper
 *
 * Maps form field labels (as discovered by ATS adapters) to user profile data.
 * Uses a normalized label matching strategy: labels are lowercased and
 * stripped of punctuation before lookup.
 *
 * For unknown fields not covered by the static map, falls back to a fuzzy
 * string similarity check against known keys.
 */

import type { AutoFillProfile, AutoFillWorkExperience, AutoFillEducation } from '../types/autofill.types';

type ProfileResolver = (profile: AutoFillProfile) => string;

/**
 * Static label → profile data mapping.
 * Keys are normalized (lowercase, no trailing punctuation, no asterisks).
 * Order matters: more specific entries should come before general ones.
 */
const FIELD_MAP: Record<string, ProfileResolver> = {
  // ── Personal ──────────────────────────────────────────────────────────────
  'first name':             (p) => p.firstName,
  'first_name':             (p) => p.firstName,
  'firstname':              (p) => p.firstName,
  'given name':             (p) => p.firstName,
  'given names':            (p) => p.firstName,
  'forename':               (p) => p.firstName,

  'last name':              (p) => p.lastName,
  'last_name':              (p) => p.lastName,
  'lastname':               (p) => p.lastName,
  'surname':                (p) => p.lastName,
  'family name':            (p) => p.lastName,

  'full name':              (p) => `${p.firstName} ${p.lastName}`,
  'name':                   (p) => `${p.firstName} ${p.lastName}`,
  'your name':              (p) => `${p.firstName} ${p.lastName}`,
  'legal name':             (p) => `${p.firstName} ${p.lastName}`,

  // ── Contact ───────────────────────────────────────────────────────────────
  'email':                  (p) => p.email,
  'email address':          (p) => p.email,
  'e-mail':                 (p) => p.email,
  'e-mail address':         (p) => p.email,
  'work email':             (p) => p.email,
  'personal email':         (p) => p.email,

  'phone':                  (p) => p.phone,
  'phone number':           (p) => p.phone,
  'mobile':                 (p) => p.phone,
  'mobile number':          (p) => p.phone,
  'cell':                   (p) => p.phone,
  'cell phone':             (p) => p.phone,
  'telephone':              (p) => p.phone,

  // ── Location ──────────────────────────────────────────────────────────────
  'city':                   (p) => p.city || '',
  'city of residence':      (p) => p.city || '',
  'state':                  (p) => p.state || '',
  'province':               (p) => p.state || '',
  'country':                (p) => p.country || '',
  'location':               (p) => [p.city, p.state, p.country].filter(Boolean).join(', '),

  // ── Online presence ───────────────────────────────────────────────────────
  'linkedin':               (p) => p.linkedinUrl || '',
  'linkedin url':           (p) => p.linkedinUrl || '',
  'linkedin profile':       (p) => p.linkedinUrl || '',
  'linkedin profile url':   (p) => p.linkedinUrl || '',

  'github':                 (p) => p.githubUrl || '',
  'github url':             (p) => p.githubUrl || '',
  'github profile':         (p) => p.githubUrl || '',

  'portfolio':              (p) => p.portfolioUrl || '',
  'portfolio url':          (p) => p.portfolioUrl || '',
  'personal website':       (p) => p.portfolioUrl || '',
  'website':                (p) => p.portfolioUrl || '',

  // ── Professional summary ──────────────────────────────────────────────────
  'summary':                (p) => p.summary,
  'professional summary':   (p) => p.summary,
  'about you':              (p) => p.summary,
  'about yourself':         (p) => p.summary,
  'bio':                    (p) => p.summary,
  'tell us about yourself': (p) => p.summary,
  'please tell us about yourself': (p) => p.summary,

  // ── Skills ────────────────────────────────────────────────────────────────
  'skills':                 (p) => p.skills.join(', '),
  'key skills':             (p) => p.skills.join(', '),
  'technical skills':       (p) => p.skills.join(', '),
  'technologies':           (p) => p.skills.join(', '),

  // ── Work experience (most recent role) ────────────────────────────────────
  'current employer':       (p) => p.workExperience[0]?.company || '',
  'current company':        (p) => p.workExperience[0]?.company || '',
  'employer':               (p) => p.workExperience[0]?.company || '',
  'company':                (p) => p.workExperience[0]?.company || '',

  'current title':          (p) => p.workExperience[0]?.title || '',
  'current job title':      (p) => p.workExperience[0]?.title || '',
  'job title':              (p) => p.workExperience[0]?.title || '',
  'title':                  (p) => p.workExperience[0]?.title || '',
  'position':               (p) => p.workExperience[0]?.title || '',

  // ── Education (most recent) ───────────────────────────────────────────────
  'highest education':      (p) => p.education[0]?.degree || '',
  'highest level of education': (p) => p.education[0]?.degree || '',
  'degree':                 (p) => p.education[0]?.degree || '',
  'education level':        (p) => p.education[0]?.degree || '',

  'school':                 (p) => p.education[0]?.school || '',
  'university':             (p) => p.education[0]?.school || '',
  'college':                (p) => p.education[0]?.school || '',
  'institution':            (p) => p.education[0]?.school || '',

  'field of study':         (p) => p.education[0]?.fieldOfStudy || '',
  'major':                  (p) => p.education[0]?.fieldOfStudy || '',
  'area of study':          (p) => p.education[0]?.fieldOfStudy || '',

  'graduation date':        (p) => formatDate(p.education[0]?.graduationDate),
  'graduation year':        (p) => p.education[0]?.graduationDate?.split('-')[0] || '',

  'gpa':                    (p) => p.education[0]?.gpa || '',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Format an ISO year-month string ("2020-05") → "May 2020" */
function formatDate(isoDate?: string): string {
  if (!isoDate) return '';
  const [year, month] = isoDate.split('-');
  if (!year) return '';
  if (!month) return year;
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Normalize a field label for lookup:
 * - Lowercase
 * - Remove trailing colons, asterisks (required-field markers), parens
 * - Collapse multiple spaces
 */
export function normalizeLabel(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\*/g, '')        // remove required-field asterisks
    .replace(/[*:()[\]]/g, '') // remove common punctuation
    .replace(/\s+/g, ' ')     // collapse whitespace
    .trim();
}

/**
 * Look up a value for a given form field label.
 * Returns `null` if no mapping is found.
 */
export function mapFieldToValue(rawLabel: string, profile: AutoFillProfile): string | null {
  const normalized = normalizeLabel(rawLabel);

  // Guard: empty label matches everything via key.includes('') — return null instead
  if (!normalized) return null;

  // 1. Exact match
  if (FIELD_MAP[normalized]) {
    return FIELD_MAP[normalized](profile) || null;
  }

  // 2. Partial / contains match (handles "your first name *" etc.)
  for (const [key, resolver] of Object.entries(FIELD_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      const value = resolver(profile);
      return value || null;
    }
  }

  return null;
}

/**
 * Build a quick human-readable preview of what will be auto-filled.
 * Used by the popup UI to display a confirmation before executing.
 */
export function previewFillPlan(
  fieldLabels: string[],
  profile: AutoFillProfile
): { label: string; value: string | null }[] {
  return fieldLabels.map((label) => ({
    label,
    value: mapFieldToValue(label, profile),
  }));
}
