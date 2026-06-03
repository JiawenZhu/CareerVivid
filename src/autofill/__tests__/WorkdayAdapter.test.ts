/**
 * Tests for WorkdayAdapter — URL detection, page detection via data-automation-id,
 * Strategy A (formField wrappers), Strategy B (fallback scanning), combobox handling,
 * date formatting, and radio group discovery.
 *
 * DOM fixtures mirror real Workday application pages as observed in 2024–2025
 * (myworkdayjobs.com, wd5.myworkdayjobs.com, branded career sites).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkdayAdapter } from '../adapters/WorkdayAdapter';
import * as fillUtils from '../fillUtils';

vi.mock('../fillUtils', () => ({
  fillInputReactSafe: vi.fn().mockResolvedValue(undefined),
  fillSelectByValue:  vi.fn().mockResolvedValue(undefined),
  fillTextarea:       vi.fn().mockResolvedValue(undefined),
  clickRadioByLabel:  vi.fn().mockResolvedValue(undefined),
}));

const adapter = new WorkdayAdapter();

// ─────────────────────────────────────────────────────────────────────────────
// matchPatterns
// ─────────────────────────────────────────────────────────────────────────────
describe('WorkdayAdapter.matchPatterns', () => {
  it('matches myworkdayjobs.com', () => {
    const url = 'https://salesforce.wd5.myworkdayjobs.com/External_Career_Site/job/Apply';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(true);
  });

  it('matches workdayjobs.com', () => {
    const url = 'https://acme.workdayjobs.com/en-US/External/job/Apply';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(true);
  });

  it('matches wd5.myworkdayjobs.com subdomain pattern', () => {
    const url = 'https://google.wd5.myworkdayjobs.com/careers/job/Apply';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(true);
  });

  it('does not match Greenhouse URLs', () => {
    const url = 'https://boards.greenhouse.io/acme/jobs/123';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(false);
  });

  it('does not match Ashby URLs', () => {
    const url = 'https://jobs.ashbyhq.com/stripe/abc/application';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isApplicationPage
// ─────────────────────────────────────────────────────────────────────────────
describe('WorkdayAdapter.isApplicationPage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // Reset the location pathname mock between tests
    Object.defineProperty(window, 'location', {
      value: { pathname: '/about:blank', hostname: 'localhost' },
      writable: true,
    });
  });

  it('returns true when [data-automation-id] elements are present and path contains /apply', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/External/job/Software-Engineer/apply', hostname: 'acme.wd5.myworkdayjobs.com' },
      writable: true,
    });
    document.body.innerHTML = `
      <div id="wd-body">
        <div data-automation-id="formField-firstName">
          <label data-automation-id="labelElement">First Name</label>
          <div data-automation-id="textInput"><input type="text" /></div>
        </div>
      </div>
    `;
    expect(adapter.isApplicationPage()).toBe(true);
  });

  it('returns true when #wd-body is present and path contains /apply', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/careers/job/title/apply', hostname: 'company.myworkdayjobs.com' },
      writable: true,
    });
    document.body.innerHTML = `<div id="wd-body"></div>`;
    expect(adapter.isApplicationPage()).toBe(true);
  });

  it('returns false when no Workday markers are present', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/about', hostname: 'example.com' },
      writable: true,
    });
    document.body.innerHTML = `<form id="some-form"><input type="text" /></form>`;
    expect(adapter.isApplicationPage()).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getFormFields — Strategy A: data-automation-id formField wrappers
// ─────────────────────────────────────────────────────────────────────────────
describe('WorkdayAdapter.getFormFields — Strategy A', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('discovers text input fields from formField wrappers', () => {
    document.body.innerHTML = `
      <div id="wd-body">
        <div data-automation-id="formField-firstName">
          <label data-automation-id="labelElement">First Name</label>
          <div data-automation-id="textInput"><input type="text" /></div>
        </div>
        <div data-automation-id="formField-lastName">
          <label data-automation-id="labelElement">Last Name</label>
          <div data-automation-id="textInput"><input type="text" /></div>
        </div>
      </div>
    `;

    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(2);
    expect(fields[0].label).toBe('First Name');
    expect(fields[0].type).toBe('text');
    expect(fields[1].label).toBe('Last Name');
    expect(fields[1].type).toBe('text');
  });

  it('discovers textarea fields', () => {
    document.body.innerHTML = `
      <div id="wd-body">
        <div data-automation-id="formField-coverLetter">
          <label data-automation-id="labelElement">Cover Letter</label>
          <textarea data-automation-id="textarea"></textarea>
        </div>
      </div>
    `;

    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(1);
    expect(fields[0].label).toBe('Cover Letter');
    expect(fields[0].type).toBe('textarea');
  });

  it('discovers native select inside combobox wrapper', () => {
    document.body.innerHTML = `
      <div id="wd-body">
        <div data-automation-id="formField-country">
          <label data-automation-id="labelElement">Country</label>
          <div data-automation-id="combobox">
            <select>
              <option value="">Select...</option>
              <option value="us">United States</option>
            </select>
          </div>
        </div>
      </div>
    `;

    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(1);
    expect(fields[0].label).toBe('Country');
    expect(fields[0].type).toBe('select');
    expect(fields[0].element).toBeInstanceOf(HTMLSelectElement);
  });

  it('discovers radio groups as a single radio field', () => {
    document.body.innerHTML = `
      <div id="wd-body">
        <div data-automation-id="formField-workAuth">
          <label data-automation-id="labelElement">Are you authorized to work in the US?</label>
          <div data-automation-id="radioBtn">
            <label><input type="radio" name="workAuth" value="yes" /> Yes</label>
          </div>
          <div data-automation-id="radioBtn">
            <label><input type="radio" name="workAuth" value="no" /> No</label>
          </div>
        </div>
      </div>
    `;

    const fields = adapter.getFormFields();
    const radioFields = fields.filter((f) => f.type === 'radio');
    expect(radioFields).toHaveLength(1);
    expect(radioFields[0].label.toLowerCase()).toContain('authorized');
  });

  it('returns empty array when no formField wrappers and no form exist', () => {
    document.body.innerHTML = '<div>Empty page</div>';
    expect(adapter.getFormFields()).toEqual([]);
  });

  it('strips "required" and asterisks from labels', () => {
    document.body.innerHTML = `
      <div id="wd-body">
        <div data-automation-id="formField-email">
          <label data-automation-id="labelElement">Email Address * required</label>
          <div data-automation-id="textInput"><input type="email" /></div>
        </div>
      </div>
    `;

    const fields = adapter.getFormFields();
    expect(fields[0].label).toBe('Email Address');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getFormFields — Strategy B: fallback scanning (no formField wrappers)
// ─────────────────────────────────────────────────────────────────────────────
describe('WorkdayAdapter.getFormFields — Strategy B fallback', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('falls back to scanning labeled inputs when no formField wrappers exist', () => {
    document.body.innerHTML = `
      <div id="wd-body">
        <form>
          <label for="phone">Phone</label>
          <input id="phone" type="tel" />
        </form>
      </div>
    `;

    const fields = adapter.getFormFields();
    expect(fields.length).toBeGreaterThan(0);
    const phoneField = fields.find((f) => f.label.toLowerCase().includes('phone'));
    expect(phoneField).toBeDefined();
    expect(phoneField?.type).toBe('tel');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// fillField
// ─────────────────────────────────────────────────────────────────────────────
describe('WorkdayAdapter.fillField', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls fillInputReactSafe for text inputs', async () => {
    const input = document.createElement('input');
    input.type = 'text';
    const field = { label: 'First Name', element: input, type: 'text' as const, filled: false };

    await adapter.fillField(field, 'Jane');
    expect(fillUtils.fillInputReactSafe).toHaveBeenCalledWith(input, 'Jane');
  });

  it('calls fillTextarea for textarea fields', async () => {
    const ta = document.createElement('textarea');
    const field = { label: 'Cover Letter', element: ta, type: 'textarea' as const, filled: false };

    await adapter.fillField(field, 'I am excited about this role...');
    expect(fillUtils.fillTextarea).toHaveBeenCalledWith(ta, 'I am excited about this role...');
  });

  it('calls fillSelectByValue for native select fields', async () => {
    const select = document.createElement('select');
    const field = { label: 'Country', element: select, type: 'select' as const, filled: false };

    await adapter.fillField(field, 'United States');
    expect(fillUtils.fillSelectByValue).toHaveBeenCalledWith(select, 'United States');
  });

  it('calls clickRadioByLabel for radio fields', async () => {
    const container = document.createElement('div');
    const field = { label: 'Work authorization', element: container, type: 'radio' as const, filled: false };

    await adapter.fillField(field, 'Yes');
    expect(fillUtils.clickRadioByLabel).toHaveBeenCalledWith(container, 'Yes');
  });

  it('does nothing when value is empty', async () => {
    const input = document.createElement('input');
    input.type = 'text';
    const field = { label: 'First Name', element: input, type: 'text' as const, filled: false };

    await adapter.fillField(field, '');
    expect(fillUtils.fillInputReactSafe).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Date formatting (Workday expects MM/DD/YYYY)
// ─────────────────────────────────────────────────────────────────────────────
describe('WorkdayAdapter date formatting', () => {
  it('fills date input and converts ISO format to MM/DD/YYYY', async () => {
    const input = document.createElement('input');
    input.type = 'date';
    const field = { label: 'Start Date', element: input, type: 'date' as const, filled: false };

    await adapter.fillField(field, '2023-05-01');
    // fillInputReactSafe is called with MM/DD/YYYY
    expect(fillUtils.fillInputReactSafe).toHaveBeenCalledWith(input, '05/01/2023');
  });

  it('fills date input and converts "Month YYYY" to MM/01/YYYY', async () => {
    const input = document.createElement('input');
    input.type = 'date';
    const field = { label: 'Graduation Date', element: input, type: 'date' as const, filled: false };

    await adapter.fillField(field, 'May 2020');
    expect(fillUtils.fillInputReactSafe).toHaveBeenCalledWith(input, '05/01/2020');
  });

  it('passes through already-formatted MM/DD/YYYY dates unchanged', async () => {
    const input = document.createElement('input');
    input.type = 'date';
    const field = { label: 'Start Date', element: input, type: 'date' as const, filled: false };

    await adapter.fillField(field, '01/15/2022');
    expect(fillUtils.fillInputReactSafe).toHaveBeenCalledWith(input, '01/15/2022');
  });
});
