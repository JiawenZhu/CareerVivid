/**
 * Tests for AshbyAdapter — URL detection, DOM-based page detection,
 * field discovery across Ashby's question wrapper structure, and field filling.
 *
 * DOM fixtures are minimal synthetic representations of real Ashby application
 * pages observed at jobs.ashbyhq.com in 2024–2025.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AshbyAdapter } from '../adapters/AshbyAdapter';
import * as fillUtils from '../fillUtils';

vi.mock('../fillUtils', () => ({
  fillFileInputReactSafe: vi.fn().mockResolvedValue(undefined),
  fillInputReactSafe: vi.fn().mockResolvedValue(undefined),
  fillSelectByValue:  vi.fn().mockResolvedValue(undefined),
  fillTextarea:       vi.fn().mockResolvedValue(undefined),
  clickRadioByLabel:  vi.fn().mockResolvedValue(undefined),
  isDemographicField: vi.fn().mockReturnValue(false),
}));

const adapter = new AshbyAdapter();

// ─────────────────────────────────────────────────────────────────────────────
// matchPatterns
// ─────────────────────────────────────────────────────────────────────────────
describe('AshbyAdapter.matchPatterns', () => {
  it('matches jobs.ashbyhq.com', () => {
    const url = 'https://jobs.ashbyhq.com/stripe/abc-123/application';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(true);
  });

  it('matches ashbyhq.com subdomains', () => {
    const url = 'https://app.ashbyhq.com/jobs/xyz';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(true);
  });

  it('does not match Greenhouse URLs', () => {
    const url = 'https://boards.greenhouse.io/acme/jobs/123';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(false);
  });

  it('does not match Lever URLs', () => {
    const url = 'https://jobs.lever.co/acme/apply';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(false);
  });

  it('does not match Workday URLs', () => {
    const url = 'https://acme.wd5.myworkdayjobs.com/careers/job/Apply';
    expect(adapter.matchPatterns.some((p) => p.test(url))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isApplicationPage
// ─────────────────────────────────────────────────────────────────────────────
describe('AshbyAdapter.isApplicationPage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns true when [data-ashby-application] is present', () => {
    document.body.innerHTML = `<div data-ashby-application="true"><form></form></div>`;
    expect(adapter.isApplicationPage()).toBe(true);
  });

  it('returns true when a class containing "ashby-application" is present', () => {
    document.body.innerHTML = `<form class="ashby-application-form"><input type="text" /></form>`;
    expect(adapter.isApplicationPage()).toBe(true);
  });

  it('returns true when [data-name="application-form"] is present', () => {
    document.body.innerHTML = `<div data-name="application-form"></div>`;
    expect(adapter.isApplicationPage()).toBe(true);
  });

  it('returns false when no Ashby markers are present', () => {
    document.body.innerHTML = `<form id="application_form"></form>`;
    // no Ashby markers, generic URL (about:blank)
    expect(adapter.isApplicationPage()).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getFormFields — Strategy A: question wrappers
// ─────────────────────────────────────────────────────────────────────────────
describe('AshbyAdapter.getFormFields', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('returns empty array when no form is present', () => {
    document.body.innerHTML = '<div>No form here</div>';
    expect(adapter.getFormFields()).toEqual([]);
  });

  it('discovers fields on modern Ashby pages without a form element', () => {
    document.body.innerHTML = `
      <main class="ashby-application-container">
        <div class="ashby-application-form-question">
          <div>Name *</div>
          <input id="_systemfield_name" name="_systemfield_name" type="text" placeholder="Type here..." />
        </div>
        <div class="ashby-application-form-question">
          <div>Email *</div>
          <input id="_systemfield_email" name="_systemfield_email" type="email" placeholder="hello@example.com..." />
        </div>
        <div class="ashby-application-form-question">
          <div>Resume *</div>
          <button>Upload File</button>
          <input id="_systemfield_resume" type="file" />
        </div>
        <div class="ashby-application-form-question">
          <div>Phone Number *</div>
          <input id="20f8883c-d278-427c-9465-dc614f612e1f" name="20f8883c-d278-427c-9465-dc614f612e1f" type="tel" placeholder="1-415-555-1234..." />
        </div>
        <div class="ashby-application-form-question">
          <div>Where are you currently located? *</div>
          <input role="combobox" placeholder="Start typing..." />
        </div>
        <div class="ashby-application-form-question">
          <div>Additional Information</div>
          <p>Please share anything else you want us to know.</p>
          <textarea id="f189fed2-624b-41a1-a76f-0c67a2611d1a" placeholder="Type here..."></textarea>
        </div>
      </main>
    `;

    const fields = adapter.getFormFields();
    const byLabel = Object.fromEntries(fields.map((field) => [field.label, field.type]));

    expect(byLabel.Name).toBe('text');
    expect(byLabel.Email).toBe('email');
    expect(byLabel.Resume).toBe('file');
    expect(byLabel['Phone Number']).toBe('tel');
    expect(byLabel['Where are you currently located?']).toBe('text');
    expect(byLabel['Additional Information']).toBe('textarea');
  });

  it('discovers fields via label[for] association', () => {
    document.body.innerHTML = `
      <div data-ashby-application="true">
        <form>
          <div class="ashby-question">
            <label for="first_name">First name *</label>
            <input id="first_name" type="text" />
          </div>
          <div class="ashby-question">
            <label for="email_address">Email address</label>
            <input id="email_address" type="email" />
          </div>
        </form>
      </div>
    `;

    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(2);
    expect(fields[0].label).toBe('First name');
    expect(fields[0].type).toBe('text');
    expect(fields[1].label).toBe('Email address');
    expect(fields[1].type).toBe('email');
  });

  it('discovers fields via wrapping label element', () => {
    document.body.innerHTML = `
      <div data-ashby-application="true">
        <form>
          <label>
            Phone number
            <input type="tel" />
          </label>
        </form>
      </div>
    `;

    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(1);
    expect(fields[0].label).toBe('Phone number');
    expect(fields[0].type).toBe('tel');
  });

  it('discovers fields via question wrapper class', () => {
    document.body.innerHTML = `
      <div data-ashby-application="true">
        <form>
          <div class="ashby-application-form-question">
            <label>LinkedIn URL</label>
            <input type="url" />
          </div>
          <div class="ashby-application-form-question">
            <label>Cover letter</label>
            <textarea></textarea>
          </div>
        </form>
      </div>
    `;

    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(2);
    expect(fields[0].label).toBe('LinkedIn URL');
    expect(fields[0].type).toBe('url');
    expect(fields[1].label).toBe('Cover letter');
    expect(fields[1].type).toBe('textarea');
  });

  it('discovers file upload inputs', () => {
    document.body.innerHTML = `
      <div data-ashby-application="true">
        <form>
          <div class="ashby-question">
            <label for="resume">Resume</label>
            <input id="resume" type="file" />
          </div>
          <div class="ashby-question">
            <label for="first_name">First name</label>
            <input id="first_name" type="text" />
          </div>
        </form>
      </div>
    `;

    const fields = adapter.getFormFields();
    // Both file input and text input should be found
    expect(fields).toHaveLength(2);
    expect(fields[0].label).toBe('Resume');
    expect(fields[0].type).toBe('file');
    expect(fields[1].label).toBe('First name');
  });

  it('discovers select fields', () => {
    document.body.innerHTML = `
      <div data-ashby-application="true">
        <form>
          <div class="ashby-question">
            <label for="country">Country</label>
            <select id="country">
              <option value="">Select...</option>
              <option value="us">United States</option>
              <option value="ca">Canada</option>
            </select>
          </div>
        </form>
      </div>
    `;

    const fields = adapter.getFormFields();
    expect(fields).toHaveLength(1);
    expect(fields[0].label).toBe('Country');
    expect(fields[0].type).toBe('select');
  });

  it('discovers radio groups as a single field entry', () => {
    document.body.innerHTML = `
      <div data-ashby-application="true">
        <form>
          <fieldset>
            <legend>Are you legally authorized to work in the US?</legend>
            <label><input type="radio" name="authorized" value="yes" /> Yes</label>
            <label><input type="radio" name="authorized" value="no" /> No</label>
          </fieldset>
        </form>
      </div>
    `;

    const fields = adapter.getFormFields();
    // Radio group should appear as exactly 1 field of type "radio"
    const radioFields = fields.filter((f) => f.type === 'radio');
    expect(radioFields).toHaveLength(1);
    expect(radioFields[0].label.toLowerCase()).toContain('authorized');
  });

  it('strips "required" and asterisks from labels', () => {
    document.body.innerHTML = `
      <div data-ashby-application="true">
        <form>
          <div class="ashby-question">
            <label for="fn">First name * required</label>
            <input id="fn" type="text" />
          </div>
        </form>
      </div>
    `;

    const fields = adapter.getFormFields();
    expect(fields[0].label).toBe('First name');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// fillField
// ─────────────────────────────────────────────────────────────────────────────
describe('AshbyAdapter.fillField', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls fillInputReactSafe for text inputs', async () => {
    const input = document.createElement('input');
    input.type = 'text';
    const field = { label: 'First name', element: input, type: 'text' as const, filled: false };

    await adapter.fillField(field, 'Jane');
    expect(fillUtils.fillInputReactSafe).toHaveBeenCalledWith(input, 'Jane');
  });

  it('calls fillInputReactSafe for email inputs', async () => {
    const input = document.createElement('input');
    input.type = 'email';
    const field = { label: 'Email', element: input, type: 'email' as const, filled: false };

    await adapter.fillField(field, 'jane@example.com');
    expect(fillUtils.fillInputReactSafe).toHaveBeenCalledWith(input, 'jane@example.com');
  });

  it('calls fillTextarea for textarea fields', async () => {
    const ta = document.createElement('textarea');
    const field = { label: 'Cover letter', element: ta, type: 'textarea' as const, filled: false };

    await adapter.fillField(field, 'I am excited to apply...');
    expect(fillUtils.fillTextarea).toHaveBeenCalledWith(ta, 'I am excited to apply...');
  });

  it('calls fillSelectByValue for select fields', async () => {
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
    const field = { label: 'First name', element: input, type: 'text' as const, filled: false };

    await adapter.fillField(field, '');
    expect(fillUtils.fillInputReactSafe).not.toHaveBeenCalled();
  });
});
