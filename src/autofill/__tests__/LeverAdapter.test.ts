/**
 * Tests for LeverAdapter — URL detection, Strategy A / Strategy B field discovery,
 * and field filling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeverAdapter } from '../adapters/LeverAdapter';
import * as fillUtils from '../fillUtils';

vi.mock('../fillUtils', () => ({
  fillInputReactSafe: vi.fn().mockResolvedValue(undefined),
  fillSelectByValue: vi.fn().mockResolvedValue(undefined),
  fillTextarea: vi.fn().mockResolvedValue(undefined),
}));

const adapter = new LeverAdapter();

// ─────────────────────────────────────────────────────────────────────────────
// matchPatterns
// ─────────────────────────────────────────────────────────────────────────────
describe('LeverAdapter.matchPatterns', () => {
  it('matches jobs.lever.co', () => {
    const url = 'https://jobs.lever.co/acme/abc-123/apply';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(true);
  });

  it('matches app.lever.co', () => {
    const url = 'https://app.lever.co/postings/xyz-456';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(true);
  });

  it('does not match Greenhouse URLs', () => {
    const url = 'https://boards.greenhouse.io/acme/jobs/123';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(false);
  });

  it('does not match generic job boards', () => {
    const url = 'https://linkedin.com/jobs/view/123456';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isApplicationPage
// ─────────────────────────────────────────────────────────────────────────────
describe('LeverAdapter.isApplicationPage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns true when .application-page is present', () => {
    document.body.innerHTML = `<div class="application-page"></div>`;
    expect(adapter.isApplicationPage()).toBe(true);
  });

  it('returns true when [data-qa="apply-form"] is present', () => {
    document.body.innerHTML = `<form data-qa="apply-form"></form>`;
    expect(adapter.isApplicationPage()).toBe(true);
  });

  it('returns false when no markers are present and URL is generic', () => {
    document.body.innerHTML = '<div>Job listing</div>';
    // Default jsdom URL doesn't include /apply
    expect(adapter.isApplicationPage()).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getFormFields — Strategy A (.application-field wrappers)
// ─────────────────────────────────────────────────────────────────────────────
describe('LeverAdapter.getFormFields — Strategy A', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('discovers fields from .application-field wrappers', () => {
    document.body.innerHTML = `
      <div class="application-field">
        <label class="application-label">First Name</label>
        <input type="text" />
      </div>
      <div class="application-field">
        <label class="application-label">Last Name</label>
        <input type="text" />
      </div>
    `;
    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(2);
    expect(fields[0].label).toBe('First Name');
    expect(fields[1].label).toBe('Last Name');
  });

  it('discovers textarea fields in .application-field', () => {
    document.body.innerHTML = `
      <div class="application-field">
        <label class="application-label">Cover Letter</label>
        <textarea></textarea>
      </div>
    `;
    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(1);
    expect(fields[0].label).toBe('Cover Letter');
    expect(fields[0].type).toBe('textarea');
  });

  it('discovers select fields in .application-field', () => {
    document.body.innerHTML = `
      <div class="application-field">
        <label class="application-label">How did you hear about us?</label>
        <select>
          <option value="linkedin">LinkedIn</option>
          <option value="referral">Referral</option>
        </select>
      </div>
    `;
    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(1);
    expect(fields[0].type).toBe('select');
  });

  it('strips asterisks from label text', () => {
    document.body.innerHTML = `
      <div class="application-field">
        <label class="application-label">Email *</label>
        <input type="email" />
      </div>
    `;
    const fields = adapter.getFormFields();
    expect(fields[0].label).not.toContain('*');
    expect(fields[0].label).toBe('Email');
  });

  it('skips wrappers without an input element', () => {
    document.body.innerHTML = `
      <div class="application-field">
        <label class="application-label">Static Info</label>
        <p>Some read-only text</p>
      </div>
    `;
    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getFormFields — Strategy B (generic form fallback)
// ─────────────────────────────────────────────────────────────────────────────
describe('LeverAdapter.getFormFields — Strategy B fallback', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('falls back to generic <form> scan when no .application-field present', () => {
    document.body.innerHTML = `
      <form>
        <div>
          <label>First Name</label>
          <input type="text" />
        </div>
        <div>
          <label>Email</label>
          <input type="email" />
        </div>
      </form>
    `;
    const fields = adapter.getFormFields();
    expect(fields.length).toBeGreaterThan(0);
  });

  it('returns empty when no form and no .application-field', () => {
    document.body.innerHTML = '<div>No form here</div>';
    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(0);
  });

  it('skips hidden and submit inputs in fallback mode', () => {
    document.body.innerHTML = `
      <form>
        <div>
          <label>Name</label>
          <input type="text" />
        </div>
        <input type="hidden" value="csrf_token" />
        <input type="submit" value="Submit" />
      </form>
    `;
    const fields = adapter.getFormFields();
    // Only the text input should be found (hidden and submit excluded)
    expect(fields.every((f) => f.type !== 'unknown')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// fillField
// ─────────────────────────────────────────────────────────────────────────────
describe('LeverAdapter.fillField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls fillInputReactSafe for input elements', async () => {
    const input = document.createElement('input');
    input.type = 'text';
    const field = { label: 'First Name', element: input, type: 'text' as const, filled: false };
    await adapter.fillField(field, 'Jiawen');
    expect(fillUtils.fillInputReactSafe).toHaveBeenCalledWith(input, 'Jiawen');
  });

  it('calls fillTextarea for textarea elements', async () => {
    const ta = document.createElement('textarea');
    const field = { label: 'Cover Letter', element: ta, type: 'textarea' as const, filled: false };
    await adapter.fillField(field, 'I am a great fit...');
    expect(fillUtils.fillTextarea).toHaveBeenCalledWith(ta, 'I am a great fit...');
  });

  it('calls fillSelectByValue for select elements', async () => {
    const select = document.createElement('select');
    const field = { label: 'Source', element: select, type: 'select' as const, filled: false };
    await adapter.fillField(field, 'LinkedIn');
    expect(fillUtils.fillSelectByValue).toHaveBeenCalledWith(select, 'LinkedIn');
  });

  it('does nothing when value is empty', async () => {
    const input = document.createElement('input');
    const field = { label: 'Name', element: input, type: 'text' as const, filled: false };
    await adapter.fillField(field, '');
    expect(fillUtils.fillInputReactSafe).not.toHaveBeenCalled();
  });
});
