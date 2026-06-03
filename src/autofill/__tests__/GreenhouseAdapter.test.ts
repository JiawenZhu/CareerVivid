/**
 * Tests for GreenhouseAdapter — DOM discovery, label extraction, and field filling.
 * Uses synthetic DOM structures that mirror real Greenhouse application pages.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GreenhouseAdapter } from '../adapters/GreenhouseAdapter';
import * as fillUtils from '../fillUtils';

// Spy on the fill utilities so we can verify they're called without real DOM events
vi.mock('../fillUtils', () => ({
  fillInputReactSafe: vi.fn().mockResolvedValue(undefined),
  fillSelectByValue: vi.fn().mockResolvedValue(undefined),
  fillTextarea: vi.fn().mockResolvedValue(undefined),
}));

const adapter = new GreenhouseAdapter();

// ─────────────────────────────────────────────────────────────────────────────
// isApplicationPage
// ─────────────────────────────────────────────────────────────────────────────
describe('GreenhouseAdapter.isApplicationPage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns true when #application_form is present', () => {
    document.body.innerHTML = `<form id="application_form"></form>`;
    expect(adapter.isApplicationPage()).toBe(true);
  });

  it('returns true when [data-provides="greenhouse-apply"] is present', () => {
    document.body.innerHTML = `<div data-provides="greenhouse-apply"></div>`;
    expect(adapter.isApplicationPage()).toBe(true);
  });

  it('returns false when no recognizable Greenhouse markers are in DOM and URL is generic', () => {
    document.body.innerHTML = `<div>Hello world</div>`;
    // Default jsdom URL is about:blank — no /jobs/ or /apply in pathname
    expect(adapter.isApplicationPage()).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// matchPatterns
// ─────────────────────────────────────────────────────────────────────────────
describe('GreenhouseAdapter.matchPatterns', () => {
  it('matches boards.greenhouse.io', () => {
    const url = 'https://boards.greenhouse.io/acme/jobs/123';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(true);
  });

  it('matches custom greenhouse.io subdomains', () => {
    const url = 'https://acme.greenhouse.io/apply';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(true);
  });

  it('does not match non-Greenhouse URLs', () => {
    const url = 'https://jobs.lever.co/acme/apply';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getFormFields
// ─────────────────────────────────────────────────────────────────────────────
describe('GreenhouseAdapter.getFormFields', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('returns empty array when no form is present', () => {
    document.body.innerHTML = '<div>No form here</div>';
    expect(adapter.getFormFields()).toEqual([]);
  });

  it('discovers labeled text inputs inside #application_form', () => {
    document.body.innerHTML = `
      <form id="application_form">
        <label for="fn">First Name</label>
        <input id="fn" type="text" />
        <label for="em">Email</label>
        <input id="em" type="email" />
      </form>
    `;
    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(2);
    expect(fields[0].label).toBe('First Name');
    expect(fields[0].type).toBe('text');
    expect(fields[1].label).toBe('Email');
    expect(fields[1].type).toBe('email');
  });

  it('discovers textarea fields', () => {
    document.body.innerHTML = `
      <form id="application_form">
        <label for="bio">Summary</label>
        <textarea id="bio"></textarea>
      </form>
    `;
    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(1);
    expect(fields[0].label).toBe('Summary');
    expect(fields[0].type).toBe('textarea');
  });

  it('discovers select fields', () => {
    document.body.innerHTML = `
      <form id="application_form">
        <label for="edu">Highest Education</label>
        <select id="edu">
          <option value="bs">Bachelor's</option>
          <option value="ms">Master's</option>
        </select>
      </form>
    `;
    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(1);
    expect(fields[0].label).toBe('Highest Education');
    expect(fields[0].type).toBe('select');
  });

  it('skips hidden inputs', () => {
    document.body.innerHTML = `
      <form id="application_form">
        <label for="vis">Name</label>
        <input id="vis" type="text" />
        <input type="hidden" name="token" value="abc123" />
      </form>
    `;
    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(1);
    expect(fields[0].type).toBe('text');
  });

  it('skips submit inputs', () => {
    document.body.innerHTML = `
      <form id="application_form">
        <label for="nm">Name</label>
        <input id="nm" type="text" />
        <input type="submit" value="Apply" />
      </form>
    `;
    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(1);
  });

  it('uses parent label wrapping (implicit association)', () => {
    document.body.innerHTML = `
      <form id="application_form">
        <label>
          Phone Number
          <input type="tel" />
        </label>
      </form>
    `;
    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(1);
    expect(fields[0].label).toContain('Phone Number');
  });

  it('strips "Required" text and asterisks from labels', () => {
    document.body.innerHTML = `
      <form id="application_form">
        <label for="fn">First Name * Required</label>
        <input id="fn" type="text" />
      </form>
    `;
    const fields = adapter.getFormFields();
    expect(fields[0].label).not.toContain('Required');
    expect(fields[0].label).not.toContain('*');
  });

  it('falls back to aria-label when no label element found', () => {
    document.body.innerHTML = `
      <form id="application_form">
        <input type="text" aria-label="LinkedIn Profile" />
      </form>
    `;
    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(1);
    expect(fields[0].label).toBe('LinkedIn Profile');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// fillField
// ─────────────────────────────────────────────────────────────────────────────
describe('GreenhouseAdapter.fillField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls fillInputReactSafe for text input', async () => {
    const input = document.createElement('input');
    input.type = 'text';
    const field = { label: 'Name', element: input, type: 'text' as const, filled: false };
    await adapter.fillField(field, 'Jiawen Zhu');
    expect(fillUtils.fillInputReactSafe).toHaveBeenCalledWith(input, 'Jiawen Zhu');
  });

  it('calls fillInputReactSafe for email input', async () => {
    const input = document.createElement('input');
    input.type = 'email';
    const field = { label: 'Email', element: input, type: 'email' as const, filled: false };
    await adapter.fillField(field, 'test@example.com');
    expect(fillUtils.fillInputReactSafe).toHaveBeenCalledWith(input, 'test@example.com');
  });

  it('calls fillTextarea for textarea', async () => {
    const ta = document.createElement('textarea');
    const field = { label: 'Summary', element: ta, type: 'textarea' as const, filled: false };
    await adapter.fillField(field, 'My bio here.');
    expect(fillUtils.fillTextarea).toHaveBeenCalledWith(ta, 'My bio here.');
  });

  it('calls fillSelectByValue for select element', async () => {
    const select = document.createElement('select');
    const field = { label: 'Education', element: select, type: 'select' as const, filled: false };
    await adapter.fillField(field, "Bachelor's");
    expect(fillUtils.fillSelectByValue).toHaveBeenCalledWith(select, "Bachelor's");
  });

  it('does nothing when value is empty string', async () => {
    const input = document.createElement('input');
    input.type = 'text';
    const field = { label: 'Name', element: input, type: 'text' as const, filled: false };
    await adapter.fillField(field, '');
    expect(fillUtils.fillInputReactSafe).not.toHaveBeenCalled();
  });
});
