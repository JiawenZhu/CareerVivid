/**
 * CareerVivid Auto-Apply — Greenhouse ATS Adapter
 *
 * Greenhouse uses standard HTML forms with predictable structure:
 * - Labels are in <label> elements associated via `for` attribute or DOM proximity
 * - Inputs are standard <input>, <textarea>, <select> elements
 * - Multi-section forms (personal info, work history, education, custom Qs)
 *
 * This makes Greenhouse the most reliable adapter for Phase 1.
 *
 * Supported URL patterns:
 *   - boards.greenhouse.io/[company]/jobs/[id]
 *   - [company].greenhouse.io/[path]
 *   - Any URL containing "greenhouse.io" on an application page
 */

import type { ATSAdapter, FormField, FieldType } from '../../types/autofill.types';
import { fillInputReactSafe, fillSelectByValue, fillTextarea } from '../fillUtils';

export class GreenhouseAdapter implements ATSAdapter {
  name = 'Greenhouse';

  matchPatterns = [
    /greenhouse\.io/i,
    /boards\.greenhouse\.io/i,
  ];

  isApplicationPage(): boolean {
    // Greenhouse application pages have a form with id="application_form"
    // or a recognizable apply button in the URL/DOM
    return (
      !!document.querySelector('#application_form') ||
      !!document.querySelector('[data-provides="greenhouse-apply"]') ||
      window.location.pathname.includes('/jobs/') ||
      window.location.pathname.includes('/apply')
    );
  }

  getFormFields(): FormField[] {
    const fields: FormField[] = [];
    const form = document.querySelector<HTMLFormElement>('#application_form') ||
      document.querySelector<HTMLFormElement>('form.application');
    if (!form) return fields;

    // Iterate all labeled inputs in the form
    const inputs = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input:not([type="hidden"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select'
      )
    );

    for (const el of inputs) {
      const label = this._getLabel(el, form);
      if (!label) continue;

      const type = this._getType(el);
      fields.push({ label, element: el, type, filled: false });
    }

    return fields;
  }

  async fillField(field: FormField, value: string): Promise<void> {
    if (!value) return;
    const el = field.element;

    if (el instanceof HTMLInputElement) {
      if (el.type === 'email' || el.type === 'tel' || el.type === 'url' || el.type === 'text' || el.type === 'date') {
        await fillInputReactSafe(el, value);
      }
    } else if (el instanceof HTMLTextAreaElement) {
      await fillTextarea(el, value);
    } else if (el instanceof HTMLSelectElement) {
      await fillSelectByValue(el, value);
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Find the label text for an input element.
   * Greenhouse uses multiple patterns:
   *   1. <label for="input-name"> — standard; resolved via `id` match
   *   2. Parent <label> wrapping the input (implicit association)
   *   3. Sibling <label> before the input
   *   4. `aria-label` or `placeholder` as fallbacks
   */
  private _getLabel(
    el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    form: HTMLFormElement
  ): string {
    // Pattern 1: label[for] linking via element id
    if (el.id) {
      const label = form.querySelector<HTMLLabelElement>(`label[for="${el.id}"]`);
      if (label) return this._cleanLabel(label.innerText ?? label.textContent ?? '');
    }

    // Pattern 2: parent <label> wrapping the input
    const parentLabel = el.closest('label');
    if (parentLabel) return this._cleanLabel(parentLabel.innerText ?? parentLabel.textContent ?? '');

    // Pattern 3: nearest preceding sibling label
    let sibling = el.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === 'LABEL') return this._cleanLabel((sibling as HTMLElement).innerText ?? (sibling as HTMLElement).textContent ?? '');
      sibling = sibling.previousElementSibling;
    }

    // Pattern 4: parent container may have a span/div label above the input
    const container = el.parentElement;
    if (container) {
      const textEl = container.querySelector('span, div, p, label');
      if (textEl && ((textEl as HTMLElement).innerText ?? (textEl as HTMLElement).textContent ?? '').length < 80) {
        return this._cleanLabel((textEl as HTMLElement).innerText ?? (textEl as HTMLElement).textContent ?? '');
      }
    }

    // Pattern 5: aria-label or placeholder as last resort
    return el.getAttribute('aria-label') || el.getAttribute('placeholder') || '';
  }

  private _cleanLabel(raw: string): string {
    // Remove "Required" text, asterisks, collapse whitespace
    return raw.replace(/required/gi, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  }

  private _getType(el: HTMLElement): FieldType {
    if (el instanceof HTMLSelectElement) return 'select';
    if (el instanceof HTMLTextAreaElement) return 'textarea';
    if (el instanceof HTMLInputElement) {
      const typeAttr = el.type.toLowerCase();
      if (['email', 'tel', 'url', 'date', 'text'].includes(typeAttr)) return typeAttr as FieldType;
    }
    return 'unknown';
  }
}
