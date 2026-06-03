import { describe, expect, it } from 'vitest';
import {
  buildAgencyPrepSessionId,
  getAgencyReadinessSummary,
  normalizeAgencySlug,
  resolveAgencyPrepStatus,
} from './agencyPartnerUtils';

describe('agencyPartnerUtils', () => {
  it('normalizes agency branch names into stable invite slugs', () => {
    expect(normalizeAgencySlug('Spherion Staffing & Recruiting - Savoy')).toBe('spherion-staffing-and-recruiting-savoy');
    expect(normalizeAgencySlug('  Express / Champaign  ')).toBe('express-champaign');
    expect(normalizeAgencySlug('!!!')).toBe('agency-branch');
  });

  it('builds slash-safe deterministic prep session ids', () => {
    expect(buildAgencyPrepSessionId('branch/a', 'user/b')).toBe('branch_a_user_b');
  });

  it('resolves prep status from resume score and consent', () => {
    expect(resolveAgencyPrepStatus({ hasResume: false })).toBe('started');
    expect(resolveAgencyPrepStatus({ hasResume: true })).toBe('resume_imported');
    expect(resolveAgencyPrepStatus({ hasResume: true, latestScore: 73 })).toBe('reviewed');
    expect(resolveAgencyPrepStatus({ hasResume: true, latestScore: 88 })).toBe('ready');
    expect(resolveAgencyPrepStatus({ hasResume: true, latestScore: 88, consentToShare: true })).toBe('shared');
  });

  it('summarizes readiness without exposing resume content', () => {
    expect(getAgencyReadinessSummary()).toContain('has not selected a resume');
    expect(getAgencyReadinessSummary(92, 11)).toContain('92');
    expect(getAgencyReadinessSummary(70, 0)).toContain('still preparing');
  });
});

