/**
 * CareerVivid Auto-Apply — Lever ATS Adapter
 *
 * Lever has one of the simpler, most predictable form structures of all major ATS:
 * - Application page URL: jobs.lever.co/[company]/[jobId]/apply
 * - Forms use <div class="application-field"> wrappers
 * - Labels are <label> elements with class "application-label"
 * - Inputs are standard HTML elements (no React-only inputs)
 *
 * This adapter is the simplest and most reliable in the Phase 1 set.
 */

import type { ATSAdapter, FormField, FieldType } from '../../types/autofill.types';
import { fillInputReactSafe, fillSelectByValue, fillTextarea } from '../fillUtils';

export class LeverAdapter implements ATSAdapter {
  name = 'Lever';

  matchPatterns = [
    /jobs\.lever\.co/i,
    /app\.lever\.co/i,
  ];

  isApplicationPage(): boolean {
    return (
      window.location.pathname.includes('/apply') ||
      !!document.querySelector('.application-page') ||
      !!document.querySelector('[data-qa="apply-form"]')
    );
  }

  getFormFields(): FormField[] {
    const fields: FormField[] = [];

    // Strategy A: Lever's structured application-field divs
    const fieldWrappers = document.querySelectorAll<HTMLElement>(
      '.application-field, [class*="application-field"], .field-group'
    );

    for (const wrapper of Array.from(fieldWrappers)) {
      const label = this._extractLabel(wrapper);
      const input = wrapper.querySelector<HTMLElement>('input, textarea, select');
      if (label && input) {
        fields.push({ label, element: input, type: this._getType(input), filled: false });
      }
    }

    // Strategy B: Fallback — any remaining labeled inputs not in a .application-field
    if (fields.length === 0) {
      const form = document.querySelector<HTMLFormElement>('form');
      if (!form) return fields;

      const inputs = Array.from(form.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]):not([type="submit"]), textarea, select'
      ));

      for (const el of inputs) {
        const label = this._getClosestLabel(el);
        if (label) {
          fields.push({ label, element: el, type: this._getType(el), filled: false });
        }
      }
    }

    return fields;
  }

  async fillField(field: FormField, value: string): Promise<void> {
    if (!value) return;
    const el = field.element;

    if (el instanceof HTMLInputElement) {
      await fillInputReactSafe(el, value);
    } else if (el instanceof HTMLTextAreaElement) {
      await fillTextarea(el, value);
    } else if (el instanceof HTMLSelectElement) {
      await fillSelectByValue(el, value);
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _extractLabel(wrapper: HTMLElement): string {
    // Lever-specific label class
    const label = wrapper.querySelector<HTMLElement>('.application-label, label, [class*="label"]');
    if (label) {
      return (label.innerText ?? label.textContent ?? '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
    }
    return '';
  }

  private _getClosestLabel(el: HTMLElement): string {
    // Walk up the DOM tree to find a label
    let parent = el.parentElement;
    for (let i = 0; i < 4 && parent; i++) {
      const label = parent.querySelector<HTMLElement>('label, [class*="label"]');
      if (label && !label.contains(el)) {
        return (label.innerText ?? label.textContent ?? '').replace(/\*/g, '').trim();
      }
      parent = parent.parentElement;
    }

    return (
      el.getAttribute('aria-label') ||
      el.getAttribute('placeholder') ||
      el.getAttribute('name') ||
      ''
    );
  }

  private _getType(el: HTMLElement): FieldType {
    if (el instanceof HTMLSelectElement) return 'select';
    if (el instanceof HTMLTextAreaElement) return 'textarea';
    if (el instanceof HTMLInputElement) {
      return (el.type as FieldType) || 'text';
    }
    return 'unknown';
  }
}
