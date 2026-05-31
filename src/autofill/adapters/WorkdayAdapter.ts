/**
 * CareerVivid Job Application Assistant — Workday ATS Adapter
 *
 * Workday powers ~35% of Fortune 500 job applications: Google, Salesforce,
 * Cisco, Adobe, JPMorgan, Target, Nike, Deloitte, Accenture, and thousands more.
 *
 * Workday form structure (as of 2024–2025):
 *   - URLs: [company].wd5.myworkdayjobs.com/[site]/job/[title]/apply
 *            [company].myworkdayjobs.com/[site]/job/[title]/apply/interstitial
 *   - Workday is a React SPA with multi-step wizard forms
 *   - Fields are rendered inside shadow-like divs with data-automation-id attributes
 *   - Labels: elements with [data-automation-id="labelElement"] or nearby <label>
 *   - Inputs: standard HTML elements but controlled by Workday's React runtime
 *   - Multi-step: only the current visible step's fields should be filled
 *   - File uploads: [data-automation-id="file-upload-drop-zone"] (always skipped)
 *
 * Workday data-automation-id values we target:
 *   - "formField-*" : outer wrapper for each question
 *   - "labelElement" : the visible label text
 *   - "textInput"    : text inputs
 *   - "textarea"     : text area inputs
 *   - "combobox"     : select/combobox fields
 *   - "radioBtn"     : radio button option
 *   - "datePicker"   : date inputs
 *
 * Multi-step handling:
 *   Workday renders one "page" at a time inside a single SPA shell.
 *   We use MutationObserver to re-scan when Workday navigates to the next step.
 */

import type { ATSAdapter, FormField, FieldType } from '../../types/autofill.types';
import {
  fillInputReactSafe,
  fillSelectByValue,
  fillTextarea,
  clickRadioByLabel,
  isDemographicField,
} from '../fillUtils';

export class WorkdayAdapter implements ATSAdapter {
  name = 'Workday';

  matchPatterns = [
    /myworkdayjobs\.com/i,
    /workdayjobs\.com/i,
    /wd\d+\.myworkdayjobs\.com/i,
  ];

  // ─── Page Detection ────────────────────────────────────────────────────────

  isApplicationPage(): boolean {
    const path = window.location.pathname;

    // Workday application paths contain /apply
    if (!path.includes('/apply') && !path.includes('/interstitial')) {
      // Some Workday instances use a different path structure
      if (!path.match(/\/job\//i)) return false;
    }

    // Confirm Workday's React shell is loaded via data-automation-id markers
    if (document.querySelector('[data-automation-id]')) return true;

    // Fallback: Workday always injects a div#wd-body
    if (document.getElementById('wd-body')) return true;
    if (document.getElementById('OKTA_SIGN_IN')) return false; // login page, not form

    return path.includes('/apply') || path.includes('/interstitial');
  }

  // ─── Field Discovery ───────────────────────────────────────────────────────

  getFormFields(): FormField[] {
    const fields: FormField[] = [];

    // Strategy A: Walk Workday's data-automation-id="formField" wrappers
    // This is the most reliable approach as it maps 1:1 to visible form questions
    const formFieldWrappers = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-automation-id^="formField"]'
      )
    );

    if (formFieldWrappers.length > 0) {
      for (const wrapper of formFieldWrappers) {
        const field = this._extractFieldFromWrapper(wrapper);
        if (field) fields.push(field);
      }
      return fields.filter(f => !isDemographicField(f.label));
    }

    // Strategy B: Workday sometimes uses a different structure on embedded career sites.
    // Fall back to scanning visible labeled inputs directly.
    const form = document.querySelector<HTMLElement>(
      '[data-automation-id="applicationForm"], form, #wd-body'
    );
    if (!form) return fields;

    const inputs = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input:not([type="hidden"]):not([type="submit"]):not([type="file"]):not([type="radio"]),' +
        'textarea,' +
        'select'
      )
    );

    for (const el of inputs) {
      const label = this._resolveLabel(el);
      if (!label) continue;
      fields.push({ label, element: el, type: this._resolveType(el), filled: false });
    }

    // Strategy B also handles radio groups
    const radioGroups = this._discoverRadioGroups(form);
    fields.push(...radioGroups);

    return fields.filter(f => !isDemographicField(f.label));
  }

  // ─── Field Filling ─────────────────────────────────────────────────────────

  async fillField(field: FormField, value: string): Promise<void> {
    if (!value) return;
    const el = field.element;

    if (field.type === 'radio') {
      await clickRadioByLabel(el as HTMLElement, value);
      return;
    }

    if (el instanceof HTMLInputElement) {
      const t = el.type.toLowerCase();
      if (['text', 'email', 'tel', 'url', 'number'].includes(t)) {
        await fillInputReactSafe(el, value);
      } else if (t === 'date') {
        // Workday date pickers often prefer MM/DD/YYYY format
        const dateValue = this._formatDateForWorkday(value);
        await fillInputReactSafe(el, dateValue);
      }
    } else if (el instanceof HTMLTextAreaElement) {
      await fillTextarea(el, value);
    } else if (el instanceof HTMLSelectElement) {
      await fillSelectByValue(el, value);
    } else {
      // Workday combobox — not a native <select>, uses a custom div
      // Try clicking to open, then finding a matching option
      await this._fillWorkdayCombobox(el, value);
    }
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  /**
   * Extract a FormField from a Workday [data-automation-id^="formField"] wrapper.
   *
   * The wrapper contains:
   *   - [data-automation-id="labelElement"]  → the label
   *   - [data-automation-id="textInput"]     → text input
   *   - [data-automation-id="textarea"]      → textarea
   *   - [data-automation-id="combobox"]      → custom select
   *   - [data-automation-id="radioBtn"]      → radio button
   *   - input[type="text/email/tel/url"]      → standard input (fallback)
   */
  private _extractFieldFromWrapper(wrapper: HTMLElement): FormField | null {
    // Extract label
    const labelEl = wrapper.querySelector<HTMLElement>(
      '[data-automation-id="labelElement"], label, [class*="Label"]'
    );
    if (!labelEl) return null;

    const label = this._cleanLabel(labelEl.innerText || labelEl.textContent || '');
    if (!label) return null;

    // Radio group
    const firstRadio = wrapper.querySelector<HTMLInputElement>('[data-automation-id="radioBtn"] input, input[type="radio"]');
    if (firstRadio) {
      return {
        label,
        element: wrapper,   // pass the whole container so clickRadioByLabel can scan
        type: 'radio',
        filled: false,
      };
    }

    // Combobox (Workday custom select)
    const combobox = wrapper.querySelector<HTMLElement>('[data-automation-id="combobox"]');
    if (combobox) {
      // Check if there's an underlying <select> (Workday sometimes uses native selects)
      const nativeSelect = combobox.querySelector<HTMLSelectElement>('select');
      if (nativeSelect) {
        return { label, element: nativeSelect, type: 'select', filled: false };
      }
      return { label, element: combobox, type: 'select', filled: false };
    }

    // Textarea
    const textarea = wrapper.querySelector<HTMLTextAreaElement>(
      '[data-automation-id="textarea"], textarea'
    );
    if (textarea) {
      return { label, element: textarea, type: 'textarea', filled: false };
    }

    // Date picker input
    const dateInput = wrapper.querySelector<HTMLInputElement>(
      '[data-automation-id="datePicker"] input, input[data-automation-id*="date"]'
    );
    if (dateInput) {
      return { label, element: dateInput, type: 'date', filled: false };
    }

    // Standard text input (Workday often wraps in [data-automation-id="textInput"])
    const textInputWrapper = wrapper.querySelector<HTMLElement>('[data-automation-id="textInput"]');
    const input = textInputWrapper
      ? textInputWrapper.querySelector<HTMLInputElement>('input')
      : wrapper.querySelector<HTMLInputElement>(
          'input:not([type="hidden"]):not([type="submit"]):not([type="file"]):not([type="radio"]):not([type="checkbox"])'
        );

    if (input) {
      return { label, element: input, type: this._resolveType(input), filled: false };
    }

    return null;
  }

  /**
   * Fill a Workday custom combobox/autocomplete widget.
   * Workday uses a custom React component that requires:
   *   1. Click the combobox to open the dropdown
   *   2. Type into the search input
   *   3. Click the matching option
   *
   * As a fallback, we try to find a native <select> inside.
   */
  private async _fillWorkdayCombobox(container: HTMLElement, value: string): Promise<void> {
    // Check for native select first (simpler path)
    const nativeSelect = container.querySelector<HTMLSelectElement>('select');
    if (nativeSelect) {
      await fillSelectByValue(nativeSelect, value);
      return;
    }

    // Try Workday's internal input for the combobox
    const comboInput = container.querySelector<HTMLInputElement>('input[type="text"]');
    if (comboInput) {
      // Click to open, type value, wait for options to render
      comboInput.click();
      await new Promise((r) => setTimeout(r, 150));
      await fillInputReactSafe(comboInput, value);
      await new Promise((r) => setTimeout(r, 300));

      // Try to click a matching option in the dropdown
      const optionList = document.querySelector<HTMLElement>(
        '[data-automation-id="dropDownItem"], [role="option"], [class*="option"]'
      );
      if (optionList) {
        const options = document.querySelectorAll<HTMLElement>(
          '[data-automation-id="dropDownItem"], [role="option"]'
        );
        const valueLower = value.toLowerCase();
        for (const opt of Array.from(options)) {
          const text = (opt.innerText || opt.textContent || '').toLowerCase();
          if (text.includes(valueLower) || valueLower.includes(text)) {
            opt.click();
            await new Promise((r) => setTimeout(r, 100));
            return;
          }
        }
      }
    }
  }

  /**
   * Discover radio groups in the fallback (Strategy B) scanning mode.
   */
  private _discoverRadioGroups(form: HTMLElement): FormField[] {
    const groups: FormField[] = [];
    const seenNames = new Set<string>();

    const radioInputs = Array.from(
      form.querySelectorAll<HTMLInputElement>('input[type="radio"]')
    );

    for (const radio of radioInputs) {
      const name = radio.getAttribute('name') || radio.getAttribute('data-automation-id') || '';
      if (!name || seenNames.has(name)) continue;
      seenNames.add(name);

      const container: HTMLElement =
        radio.closest('fieldset') ||
        radio.closest('[role="radiogroup"]') ||
        radio.closest('[data-automation-id^="formField"]') ||
        radio.parentElement as HTMLElement;

      const legend = container?.querySelector<HTMLElement>(
        'legend, [data-automation-id="labelElement"], label'
      );
      const label = legend
        ? this._cleanLabel(legend.innerText || legend.textContent || '')
        : name.replace(/[-_]/g, ' ');

      if (label && container) {
        groups.push({ label, element: container, type: 'radio', filled: false });
      }
    }

    return groups;
  }

  /**
   * Fallback label resolution for Strategy B (non-formField-wrapped inputs).
   */
  private _resolveLabel(
    el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  ): string {
    // 1. Explicit label[for] association
    if (el.id) {
      const label = document.querySelector<HTMLLabelElement>(`label[for="${el.id}"]`);
      if (label) return this._cleanLabel(label.innerText || label.textContent || '');
    }

    // 2. Wrapping label
    const parentLabel = el.closest('label');
    if (parentLabel) {
      return this._cleanLabel(parentLabel.innerText || parentLabel.textContent || '');
    }

    // 3. Workday labelElement in ancestor
    let ancestor = el.parentElement;
    let depth = 0;
    while (ancestor && depth < 5) {
      const labelEl = ancestor.querySelector<HTMLElement>('[data-automation-id="labelElement"]');
      if (labelEl) {
        return this._cleanLabel(labelEl.innerText || labelEl.textContent || '');
      }
      ancestor = ancestor.parentElement;
      depth++;
    }

    // 4. aria-label or placeholder
    return (
      el.getAttribute('aria-label') ||
      el.getAttribute('placeholder') ||
      el.getAttribute('name') ||
      ''
    );
  }

  /**
   * Workday dates are typically MM/DD/YYYY.
   * Accepts ISO format (YYYY-MM-DD) or "Month YYYY" and converts.
   */
  private _formatDateForWorkday(value: string): string {
    // Already MM/DD/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;

    // ISO: YYYY-MM-DD → MM/DD/YYYY
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[2]}/${iso[3]}/${iso[1]}`;

    // "Month YYYY" → use first of month
    const monthYear = value.match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (monthYear) {
      const months: Record<string, string> = {
        january: '01', february: '02', march: '03', april: '04',
        may: '05', june: '06', july: '07', august: '08',
        september: '09', october: '10', november: '11', december: '12',
      };
      const m = months[monthYear[1].toLowerCase()];
      if (m) return `${m}/01/${monthYear[2]}`;
    }

    return value;
  }

  private _cleanLabel(raw: string): string {
    return raw
      .replace(/required/gi, '')
      .replace(/[*:]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private _resolveType(el: HTMLElement): FieldType {
    if (el instanceof HTMLSelectElement) return 'select';
    if (el instanceof HTMLTextAreaElement) return 'textarea';
    if (el instanceof HTMLInputElement) {
      const t = el.type.toLowerCase() as FieldType;
      if (['email', 'tel', 'url', 'date', 'text', 'number'].includes(t)) return t;
    }
    return 'unknown';
  }
}
