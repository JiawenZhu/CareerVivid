/**
 * CareerVivid Auto-Apply — Ashby ATS Adapter
 *
 * Ashby is a modern ATS used by high-growth startups: Stripe, Ramp, Notion,
 * Anduril, Brex, Rippling, Linear, Scale AI, Perplexity, and hundreds more.
 *
 * Ashby form structure (as of 2024–2025):
 *   - Application pages: jobs.ashbyhq.com/[company]/[jobId]/application
 *   - Custom career sites: careers.[company].com powered by Ashby embed
 *   - Form container: <div data-ashby-application> or role="main" with Ashby markers
 *   - Fields are React-rendered inside <div class="ashby-application-form-question"> wrappers
 *   - Labels: <label> elements inside each question wrapper
 *   - Inputs: standard <input>, <textarea>, <select> elements (React-controlled)
 *   - File uploads: <input type="file"> for resume (skipped by engine)
 *
 * Detection strategy:
 *   1. URL pattern match: jobs.ashbyhq.com or /application in pathname on ashbyhq.com
 *   2. DOM marker: presence of [data-ashby-application] or ashby-specific class names
 */

import type { ATSAdapter, FormField, FieldType } from '../../types/autofill.types';
import {
  fillInputReactSafe,
  fillSelectByValue,
  fillTextarea,
  clickRadioByLabel,
} from '../fillUtils';

export class AshbyAdapter implements ATSAdapter {
  name = 'Ashby';

  matchPatterns = [
    /ashbyhq\.com/i,
    /jobs\.ashby\.com/i,
  ];

  // ─── Page Detection ────────────────────────────────────────────────────────

  isApplicationPage(): boolean {
    // Primary: Ashby marks its application container with data-ashby-application
    if (document.querySelector('[data-ashby-application]')) return true;

    // Secondary: Ashby embeds a form with this class pattern
    if (document.querySelector('._ashby-application-form_')) return true;
    if (document.querySelector('[class*="ashby-application"]')) return true;

    // Tertiary: URL path contains /application (Ashby's apply page convention)
    const path = window.location.pathname;
    if (path.includes('/application')) return true;

    // Quaternary: Look for Ashby's characteristic form question structure
    if (document.querySelector('[data-name="application-form"]')) return true;
    if (document.querySelector('form[data-testid="application-form"]')) return true;

    return false;
  }

  // ─── Field Discovery ───────────────────────────────────────────────────────

  getFormFields(): FormField[] {
    const fields: FormField[] = [];

    // Strategy A: Ashby wraps each question in a div with a data-field attribute
    // or a recognizable class. Walk all labeled inputs in the form.
    const form = this._findApplicationForm();
    if (!form) return fields;

    // Collect all interactive elements (skip hidden + submit)
    const interactiveElements = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input:not([type="hidden"]):not([type="submit"]):not([type="file"]),' +
        'textarea,' +
        'select'
      )
    );

    const seenElements = new Set<HTMLElement>();

    for (const el of interactiveElements) {
      if (seenElements.has(el)) continue;
      seenElements.add(el);

      // Skip radio/checkbox group members — handled at group level below
      if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')) {
        continue;
      }

      const label = this._resolveLabel(el, form);
      if (!label) continue;

      const type = this._resolveType(el);
      fields.push({ label, element: el, type, filled: false });
    }

    // Strategy B: Handle radio groups separately (e.g., work authorization yes/no)
    const radioGroups = this._discoverRadioGroups(form);
    for (const group of radioGroups) {
      if (!seenElements.has(group.container)) {
        seenElements.add(group.container);
        fields.push({
          label: group.label,
          element: group.container,
          type: 'radio',
          filled: false,
        });
      }
    }

    return fields;
  }

  // ─── Field Filling ─────────────────────────────────────────────────────────

  async fillField(field: FormField, value: string): Promise<void> {
    if (!value) return;
    const el = field.element;

    if (field.type === 'radio') {
      // el is the container div for the radio group
      await clickRadioByLabel(el as HTMLElement, value);
      return;
    }

    if (el instanceof HTMLInputElement) {
      const t = el.type.toLowerCase();
      if (['text', 'email', 'tel', 'url', 'number', 'date'].includes(t)) {
        await fillInputReactSafe(el, value);
      }
    } else if (el instanceof HTMLTextAreaElement) {
      await fillTextarea(el, value);
    } else if (el instanceof HTMLSelectElement) {
      await fillSelectByValue(el, value);
    }
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  /**
   * Locate the Ashby application form element.
   * Ashby uses a single <form> on the application page, sometimes inside a
   * specific container div. We try the data attribute first, then fall back
   * to the first <form> on the page.
   */
  private _findApplicationForm(): HTMLFormElement | null {
    // Most reliable: form inside the Ashby application container
    const container =
      document.querySelector('[data-ashby-application]') ||
      document.querySelector('[data-name="application-form"]') ||
      document.querySelector('[class*="ashby-application"]') ||
      document.querySelector('form[data-testid="application-form"]') ||
      document.body;

    if (container instanceof HTMLFormElement) return container;

    const form = container?.querySelector<HTMLFormElement>('form');
    if (form) return form;

    // Last resort: first form on the page
    return document.querySelector<HTMLFormElement>('form');
  }

  /**
   * Resolve the human-readable label for an input element.
   *
   * Ashby uses these label patterns (in priority order):
   *   1. <label for="inputId"> linked via element's id attribute
   *   2. Wrapping <label> element (implicit association)
   *   3. Sibling <label> or <span[class*="label"]> preceding the input
   *   4. Closest ancestor with a data-label / aria-label attribute
   *   5. Input's own aria-label or placeholder as last resort
   */
  private _resolveLabel(
    el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    form: HTMLElement
  ): string {
    // Pattern 1: <label for="id">
    if (el.id) {
      const label = form.querySelector<HTMLLabelElement>(`label[for="${el.id}"]`);
      if (label) return this._cleanLabel(label.innerText || label.textContent || '');
    }

    // Pattern 2: wrapping <label>
    const parentLabel = el.closest('label');
    if (parentLabel) {
      return this._cleanLabel(parentLabel.innerText || parentLabel.textContent || '');
    }

    // Pattern 3: Ashby's question wrapper — look for a <label> or <span> sibling
    // Ashby typically uses a structure like:
    //   <div class="...question...">
    //     <label>First name *</label>
    //     <input ... />
    //   </div>
    const questionWrapper = el.closest('[class*="question"], [class*="field"], [class*="form-group"]');
    if (questionWrapper) {
      const labelEl = questionWrapper.querySelector<HTMLElement>('label, [class*="label"]');
      if (labelEl && labelEl !== el) {
        return this._cleanLabel(labelEl.innerText || labelEl.textContent || '');
      }

      // Also check for <p> or <span> that acts as a label above the input
      const textEl = questionWrapper.querySelector<HTMLElement>('p, span, div');
      if (textEl && textEl !== el && (textEl.innerText || '').length < 100) {
        return this._cleanLabel(textEl.innerText || textEl.textContent || '');
      }
    }

    // Pattern 4: walk up DOM tree looking for a nearby label
    let ancestor = el.parentElement;
    let depth = 0;
    while (ancestor && depth < 4) {
      const labelEl = ancestor.querySelector<HTMLElement>('label');
      if (labelEl && !labelEl.contains(el)) {
        return this._cleanLabel(labelEl.innerText || labelEl.textContent || '');
      }
      ancestor = ancestor.parentElement;
      depth++;
    }

    // Pattern 5: Fallback to ARIA / placeholder
    return el.getAttribute('aria-label') ||
           el.getAttribute('placeholder') ||
           el.getAttribute('name') ||
           '';
  }

  /**
   * Discover radio button groups as logical field units.
   * Ashby groups radio buttons in a fieldset or div with a group label.
   */
  private _discoverRadioGroups(
    form: HTMLElement
  ): { label: string; container: HTMLElement }[] {
    const groups: { label: string; container: HTMLElement }[] = [];
    const seenNames = new Set<string>();

    const radioInputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[type="radio"]'));

    for (const radio of radioInputs) {
      const name = radio.getAttribute('name') || '';
      if (!name || seenNames.has(name)) continue;
      seenNames.add(name);

      // Find the container for this group (fieldset preferred, then closest div)
      const container: HTMLElement =
        radio.closest('fieldset') ||
        radio.closest('[role="radiogroup"]') ||
        radio.closest('[class*="radio-group"], [class*="radioGroup"]') ||
        radio.parentElement?.parentElement ||
        radio.parentElement as HTMLElement;

      // Extract group label from <legend> or a heading element
      const legend = container?.querySelector<HTMLElement>('legend, [class*="legend"], label');
      const label = legend
        ? this._cleanLabel(legend.innerText || legend.textContent || '')
        : name.replace(/[-_]/g, ' ');

      if (label && container) {
        groups.push({ label, container });
      }
    }

    return groups;
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
