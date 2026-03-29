/**
 * CareerVivid Auto-Apply — AutoFill Engine
 *
 * Orchestrates the complete auto-fill workflow:
 *   1. Detect which ATS adapter applies to the current page
 *   2. Confirm this is an application form (not a job listing)
 *   3. Scan the page for form fields
 *   4. Map each field label to the user's profile data
 *   5. Fill each field and collect results
 *
 * The engine is platform-agnostic and relies on adapter implementations
 * (GreenhouseAdapter, LeverAdapter, etc.) for DOM interaction.
 */

import type { ATSAdapter, AutoFillProfile, AutoFillResult, FormField, ATSContext } from '../types/autofill.types';
import { mapFieldToValue } from './FieldMapper';
import { GreenhouseAdapter } from './adapters/GreenhouseAdapter';
import { LeverAdapter } from './adapters/LeverAdapter';

/**
 * Registry of all available ATS adapters.
 * Adapters are tried in order; the first match wins.
 * Add new adapters here as they are implemented.
 */
const ADAPTER_REGISTRY: ATSAdapter[] = [
  new LeverAdapter(),
  new GreenhouseAdapter(),
];

/**
 * Detect which ATS adapter (if any) applies to the current page.
 * Returns `null` if no adapter matches the current hostname OR DOM markers.
 */
export function detectAdapter(): ATSAdapter | null {
  const currentUrl = window.location.href;

  // 1. Try URL-based detection (fastest)
  for (const adapter of ADAPTER_REGISTRY) {
    if (adapter.matchPatterns.some((pattern) => pattern.test(currentUrl))) {
      return adapter;
    }
  }

  // 2. Fallback to DOM-based detection (for branded subdomains like careers.airbnb.com)
  for (const adapter of ADAPTER_REGISTRY) {
    if (adapter.isApplicationPage()) {
      return adapter;
    }
  }

  return null;
}

/**
 * Get full ATS context for the current page (used by popup to show status).
 */
export function getATSContext(): ATSContext {
  const adapter = detectAdapter();
  if (!adapter) {
    return { platform: null, isApplicationPage: false, isJobListingPage: false };
  }
  const isApplicationPage = adapter.isApplicationPage();
  return {
    platform: adapter.name,
    isApplicationPage,
    isJobListingPage: !isApplicationPage,
  };
}

/**
 * Core autofill execution function.
 * Runs through all detected form fields, maps them to profile data,
 * and fills them using the adapter's fillField method.
 *
 * @param profile  The user's normalized AutoFillProfile
 * @returns        An AutoFillResult summarizing what was filled/skipped
 */
export async function runAutofill(profile: AutoFillProfile): Promise<AutoFillResult> {
  const adapter = detectAdapter();

  if (!adapter) {
    return buildResult('Unknown', [], 'No adapter detected for this page');
  }

  if (!adapter.isApplicationPage()) {
    return buildResult(adapter.name, [], 'Not an application form page');
  }

  // Discover all form fields on the page
  const fields = adapter.getFormFields();

  // Skip file-type fields (resume uploads) — user handles these manually
  const fillableFields = fields.filter((f) => f.type !== 'file' && f.type !== 'unknown');

  // Fill each field
  const filledFields: FormField[] = [];
  let errorCount = 0;

  for (const field of fillableFields) {
    try {
      const value = mapFieldToValue(field.label, profile);
      if (value) {
        await adapter.fillField(field, value);
        field.filled = true;
        field.filledValue = value;
        filledFields.push(field);
      } else {
        field.skipReason = 'No mapping found for this field label';
      }
    } catch (err) {
      field.skipReason = `Fill error: ${(err as Error).message}`;
      errorCount++;
    }
  }

  const filledCount = filledFields.length;
  const skippedCount = fillableFields.length - filledCount - errorCount;

  return {
    platform: adapter.name,
    filledCount,
    skippedCount,
    errorCount,
    fields: fillableFields,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build a minimal result object (used for error/no-op cases).
 */
function buildResult(platform: string, fields: FormField[], skipReason?: string): AutoFillResult {
  return {
    platform,
    filledCount: 0,
    skippedCount: 0,
    errorCount: 0,
    fields,
    timestamp: new Date().toISOString(),
  };
}
