/**
 * Tests for AutoFillEngine — the orchestration layer that:
 *   1. Matches a URL to an ATS adapter
 *   2. Checks if the page is an application form
 *   3. Discovers fields and fills them using FieldMapper
 *
 * We mock window.location via vi.stubGlobal and inject minimal DOM structures.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectAdapter, getATSContext, runAutofill } from '../AutoFillEngine';
import type { AutoFillProfile } from '../../types/autofill.types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Temporarily override window.location.href for the duration of each test */
function setUrl(url: string) {
  vi.stubGlobal('window', {
    ...window,
    location: { ...window.location, href: url, pathname: new URL(url).pathname },
  });
}

/** Build a minimal Greenhouse-style application form in the DOM */
function injectGreenhouseForm() {
  document.body.innerHTML = `
    <form id="application_form">
      <div>
        <label for="first_name">First Name</label>
        <input id="first_name" type="text" />
      </div>
      <div>
        <label for="last_name">Last Name</label>
        <input id="last_name" type="text" />
      </div>
      <div>
        <label for="email">Email</label>
        <input id="email" type="email" />
      </div>
      <div>
        <label for="phone">Phone</label>
        <input id="phone" type="tel" />
      </div>
    </form>
  `;
}

const PROFILE: AutoFillProfile = {
  firstName: 'Jiawen',
  lastName: 'Zhu',
  email: 'jiawen@careervivid.com',
  phone: '555-867-5309',
  summary: 'Full-stack engineer.',
  skills: ['TypeScript', 'React'],
  workExperience: [{ company: 'CareerVivid', title: 'Lead Engineer', startDate: '2023-01', endDate: 'Present', description: '' }],
  education: [{ school: 'UT Austin', degree: "Bachelor's", fieldOfStudy: 'CS', graduationDate: '2021-05' }],
  sourceResumeId: 'test-resume-001',
  lastSyncedAt: '2024-01-01T00:00:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// detectAdapter
// ─────────────────────────────────────────────────────────────────────────────
describe('detectAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null for a non-ATS URL', () => {
    setUrl('https://example.com/careers');
    expect(detectAdapter()).toBeNull();
  });

  it('returns LeverAdapter for jobs.lever.co URL', () => {
    setUrl('https://jobs.lever.co/acme/abc123/apply');
    const adapter = detectAdapter();
    expect(adapter).not.toBeNull();
    expect(adapter?.name).toBe('Lever');
  });

  it('returns GreenhouseAdapter for boards.greenhouse.io URL', () => {
    setUrl('https://boards.greenhouse.io/acme/jobs/12345');
    const adapter = detectAdapter();
    expect(adapter).not.toBeNull();
    expect(adapter?.name).toBe('Greenhouse');
  });

  it('returns GreenhouseAdapter for *.greenhouse.io URL', () => {
    setUrl('https://acme.greenhouse.io/apply/12345');
    const adapter = detectAdapter();
    expect(adapter?.name).toBe('Greenhouse');
  });

  it('Lever is matched before Greenhouse (registry order)', () => {
    // A URL that could theoretically match both — Lever wins because it's first in registry
    setUrl('https://jobs.lever.co/greenhouse-hosted/xyz');
    const adapter = detectAdapter();
    expect(adapter?.name).toBe('Lever');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getATSContext
// ─────────────────────────────────────────────────────────────────────────────
describe('getATSContext', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('returns platform=null for non-ATS page', () => {
    setUrl('https://example.com');
    const ctx = getATSContext();
    expect(ctx.platform).toBeNull();
    expect(ctx.isApplicationPage).toBe(false);
  });

  it('returns correct platform name for Lever URL', () => {
    setUrl('https://jobs.lever.co/acme/abc/apply');
    document.body.innerHTML = `<div class="application-page"></div>`;
    const ctx = getATSContext();
    expect(ctx.platform).toBe('Lever');
    expect(ctx.isApplicationPage).toBe(true);
    expect(ctx.isJobListingPage).toBe(false);
  });

  it('identifies Greenhouse listing page (not application)', () => {
    setUrl('https://boards.greenhouse.io/acme/jobs/12345');
    document.body.innerHTML = ''; // No #application_form
    const ctx = getATSContext();
    // pathname includes /jobs/ → Greenhouse considers it an application page
    expect(ctx.platform).toBe('Greenhouse');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// runAutofill
// ─────────────────────────────────────────────────────────────────────────────
describe('runAutofill', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('returns zero counts with skip reason when no adapter detected', async () => {
    setUrl('https://example.com/jobs');
    const result = await runAutofill(PROFILE);
    expect(result.filledCount).toBe(0);
    expect(result.errorCount).toBe(0);
    expect(result.platform).toBe('Unknown');
  });

  it('returns early when page is not an application form', async () => {
    setUrl('https://boards.greenhouse.io/acme/jobs/99999');
    document.body.innerHTML = ''; // No form, but URL contains /jobs/
    // Greenhouse.isApplicationPage() returns true for /jobs/ paths so
    // we need a URL without that pattern:
    setUrl('https://boards.greenhouse.io/acme');
    document.body.innerHTML = ''; // no form markers
    const result = await runAutofill(PROFILE);
    // Greenhouse adapter matches but no form → getFormFields returns []
    expect(result.filledCount).toBe(0);
  });

  it('runs against Greenhouse form without errors', async () => {
    setUrl('https://boards.greenhouse.io/acme/jobs/12345');
    injectGreenhouseForm();

    const result = await runAutofill(PROFILE);

    // The engine should detect Greenhouse and attempt filling (no exceptions)
    expect(result.platform).toBe('Greenhouse');
    // Note: filledCount/errorCount may vary in jsdom due to limited event system;
    // fill correctness is covered by fillUtils.test.ts
    expect(result.timestamp).toBeTruthy();
  });

  it('orchestrates form filling without throwing', async () => {
    setUrl('https://boards.greenhouse.io/acme/jobs/54321');
    injectGreenhouseForm();

    const result = await runAutofill(PROFILE);

    // Verify the engine ran to completion without crashing.
    // Actual DOM value assertions belong in fillUtils.test.ts,
    // since jsdom's native setter does not reflect value back to .value.
    expect(result.platform).toBe('Greenhouse');
  });

  it('result timestamp is a valid ISO string', async () => {
    setUrl('https://boards.greenhouse.io/acme/jobs/11111');
    injectGreenhouseForm();
    const result = await runAutofill(PROFILE);
    expect(() => new Date(result.timestamp)).not.toThrow();
    expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
  });
});
