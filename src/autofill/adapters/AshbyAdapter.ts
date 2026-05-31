/**
 * CareerVivid Job Application Assistant — Ashby ATS Adapter
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
  fillFileInputReactSafe,
  fillInputReactSafe,
  fillSelectByValue,
  fillTextarea,
  clickRadioByLabel,
  isDemographicField,
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
    if (document.querySelector('[class*="ashby-embed"]')) return true;
    if (document.querySelector('[class*="ashby_"]')) return true;

    // Tertiary: URL path contains /application (Ashby's apply page convention)
    const path = window.location.pathname;
    const isAshbyHost = /ashby/i.test(window.location.hostname);
    if (isAshbyHost && path.includes('/application')) return true;

    // Quaternary: Look for Ashby's characteristic form question structure
    if (document.querySelector('[data-name="application-form"]')) return true;
    if (document.querySelector('form[data-testid="application-form"]')) return true;

    // Check if there's any form or application container inside an ashby element
    if (document.querySelector('[class*="ashby"] form')) return true;

    return false;
  }

  // ─── Field Discovery ───────────────────────────────────────────────────────

  getFormFields(): FormField[] {
    const fields: FormField[] = [];

    // Ashby sometimes renders application fields without a native <form>.
    // Scan the application root directly so div-rendered forms still work.
    const root = this._findApplicationRoot();
    if (!root) return fields;

    // Collect all interactive elements (skip hidden + submit)
    const interactiveElements = Array.from(
      root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input:not([type="hidden"]):not([type="submit"]),' +
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

      const label = this._resolveLabel(el, root);
      if (!label) continue;

      const type = this._resolveType(el);
      fields.push({ label, element: el, type, filled: false });
    }

    // Strategy B: Handle radio groups separately (e.g., work authorization yes/no)
    const radioGroups = this._discoverRadioGroups(root);
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

    return fields.filter(f => !isDemographicField(f.label));
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

  async fillFileField(field: FormField, file: File): Promise<void> {
    if (field.element instanceof HTMLInputElement) {
      await fillFileInputReactSafe(field.element, file);
    }
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  /**
   * Locate the Ashby application root.
   * Modern Ashby pages can render fields in div containers without a native
   * <form>, so the root may be a marker div, main element, or document body.
   */
  private _findApplicationRoot(): HTMLElement | null {
    const explicitRoot =
      document.querySelector<HTMLElement>('[data-ashby-application]') ||
      document.querySelector<HTMLElement>('[data-name="application-form"]') ||
      document.querySelector<HTMLElement>('form[data-testid="application-form"]');

    if (explicitRoot) return explicitRoot;

    const ashbyRoots = Array.from(
      document.querySelectorAll<HTMLElement>('[class*="ashby-application"]')
    );
    const rootWithMostFields = ashbyRoots
      .map((root) => ({
        root,
        fieldCount: root.querySelectorAll('input, textarea, select').length,
      }))
      .sort((a, b) => b.fieldCount - a.fieldCount)[0];

    const main = document.querySelector<HTMLElement>('main');
    const mainFieldCount = main?.querySelectorAll('input, textarea, select').length || 0;

    if (rootWithMostFields?.fieldCount && rootWithMostFields.fieldCount >= mainFieldCount) {
      return rootWithMostFields.root;
    }

    return main || document.body || null;
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
    const questionWrapper = el.closest('[class*="ashby-application-form-question"], [class*="question"], [class*="field"], [class*="form-group"]');
    if (questionWrapper) {
      const labelEl = questionWrapper.querySelector<HTMLElement>('label, [class*="label"]');
      if (labelEl && labelEl !== el) {
        return this._cleanLabel(labelEl.innerText || labelEl.textContent || '');
      }

      // Also check for <p> or <span> that acts as a label above the input
      const textEl = questionWrapper.querySelector<HTMLElement>('p, span, div');
      const text = this._shortText(textEl);
      if (textEl && textEl !== el && text) {
        return this._cleanLabel(text);
      }
    }

    // Pattern 4: walk up DOM tree looking for a nearby label
    let ancestor = el.parentElement;
    let depth = 0;
    while (ancestor && depth < 4) {
      const labelEl = ancestor.querySelector<HTMLElement>('label, [class*="label"]');
      if (labelEl && !labelEl.contains(el)) {
        const text = this._shortText(labelEl);
        if (text) return this._cleanLabel(text);
      }

      const ownText = this._directText(ancestor);
      if (ownText) {
        return this._cleanLabel(ownText);
      }
      ancestor = ancestor.parentElement;
      depth++;
    }

    // Pattern 5: Fallback to ARIA / placeholder / normalized system ids
    return this._cleanLabel(
      el.getAttribute('aria-label') ||
      el.getAttribute('placeholder') ||
      this._systemFieldLabel(el) ||
      el.getAttribute('name') ||
      ''
    );
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

  private _shortText(el: Element | null): string {
    if (!(el instanceof HTMLElement)) return '';
    const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    return text.length > 0 && text.length <= 120 ? text : '';
  }

  private _directText(el: Element | null): string {
    if (!(el instanceof HTMLElement)) return '';
    const text = Array.from(el.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > 0 && text.length <= 120 ? text : '';
  }

  private _systemFieldLabel(el: HTMLElement): string {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
      return '';
    }

    const raw = el.id || el.getAttribute('name') || '';
    const systemFieldMatch = raw.match(/_systemfield_([a-z0-9_]+)/i);
    const fieldName = systemFieldMatch?.[1] || raw;

    if (!fieldName || /^[0-9a-f-]{20,}$/i.test(fieldName)) return '';

    return fieldName
      .replace(/^_+/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\b(cv)\b/gi, 'CV')
      .trim();
  }

  private _resolveType(el: HTMLElement): FieldType {
    if (el instanceof HTMLSelectElement) return 'select';
    if (el instanceof HTMLTextAreaElement) return 'textarea';
    if (el instanceof HTMLInputElement) {
      const t = el.type.toLowerCase() as FieldType;
      if (['email', 'tel', 'url', 'date', 'text', 'number', 'file'].includes(t)) return t;
    }
    return 'unknown';
  }
}
