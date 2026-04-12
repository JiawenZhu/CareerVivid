// CareerVivid Chrome Extension - Content Script
// Injected into job sites and ATS application pages.
// Responsibilities:
//   1. Detect which site/ATS we're on
//   2. Inject "Save Job" button on job listing pages
//   3. Inject "Autofill with CareerVivid" FAB on application form pages
//   4. Handle FILL_FORM messages from the background service worker
//   5. Extract job data for the popup

import { runAutofill, detectAdapter, getATSContext } from './autofill/AutoFillEngine';
import type { AutoFillProfile, AutoFillResult } from './types/autofill.types';

// ── Site Detection ────────────────────────────────────────────────────────────

const isLinkedIn = window.location.hostname.includes('linkedin.com');
const isIndeed = window.location.hostname.includes('indeed.com');

// ── Styles ────────────────────────────────────────────────────────────────────

// Injected into the page as a <style> tag to avoid CSP issues with inline styles
const CSS = `
  .cv-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #1f2937 0%, #000000 100%);
    color: white;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    text-decoration: none;
  }
  .cv-btn:hover { transform: translateY(-1px); background: linear-gradient(135deg, #374151 0%, #111827 100%); }
  .cv-btn.cv-btn-success { background: #10B981 !important; border-color: #059669; }
  .cv-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 20px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
    border: none;
    border-radius: 50px;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(99,102,241,0.4);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    letter-spacing: -0.01em;
  }
  .cv-fab:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(99,102,241,0.5); }
  .cv-fab:active { transform: translateY(0); }
  .cv-fab.cv-fab-loading { opacity: 0.8; cursor: wait; }
  .cv-fab.cv-fab-done { background: linear-gradient(135deg, #10B981 0%, #059669 100%); box-shadow: 0 8px 24px rgba(16,185,129,0.4); }
  .cv-fab-pulse {
    width: 8px; height: 8px; border-radius: 50%;
    background: rgba(255,255,255,0.9);
    animation: cv-pulse 1.5s ease-in-out infinite;
  }
  @keyframes cv-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.8); } }
  .cv-toast {
    position: fixed;
    bottom: 90px;
    right: 24px;
    z-index: 2147483647;
    padding: 12px 18px;
    background: #1f2937;
    color: white;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    animation: cv-slidein 0.3s ease;
    max-width: 280px;
  }
  @keyframes cv-slidein { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;

function injectStyles(): void {
  if (document.getElementById('cv-styles')) return;
  const style = document.createElement('style');
  style.id = 'cv-styles';
  style.textContent = CSS;
  document.head.appendChild(style);
}

// ── Job Data Extraction ───────────────────────────────────────────────────────

function extractJobData(): { title: string; company: string; location: string; description: string; url: string } | null {
  try {
    if (isLinkedIn) {
      const title = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim() ||
        document.querySelector('.jobs-unified-top-card__job-title')?.textContent?.trim();
      const company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() ||
        document.querySelector('.jobs-unified-top-card__company-name')?.textContent?.trim();
      const location = document.querySelector('.job-details-jobs-unified-top-card__primary-description-container')?.textContent?.trim() ||
        document.querySelector('.jobs-unified-top-card__primary-description-container')?.textContent?.trim();
      const description = document.querySelector('#job-details')?.textContent?.trim() || '';
      if (title && company) return { title, company, location: location || '', description, url: window.location.href };
    } else if (isIndeed) {
      const title = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim();
      const company = document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim();
      const location = document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.textContent?.trim();
      const description = document.querySelector('#jobDescriptionText')?.textContent?.trim() || '';
      if (title && company) return { title, company, location: location || '', description, url: window.location.href };
    } else {
      // Generic ATS extraction using Open Graph tags / page title
      const title = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        document.querySelector('h1')?.textContent?.trim() || '';
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') ||
        document.querySelector('[class*="description"]')?.textContent?.trim() || '';
      if (title) return { title, company: document.title, location: '', description, url: window.location.href };
    }
  } catch (e) {
    console.error('[CareerVivid] Job extraction error:', e);
  }
  return null;
}

// ── Toast Notifications ───────────────────────────────────────────────────────

function showToast(message: string, duration = 4000): void {
  const existing = document.getElementById('cv-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'cv-toast';
  toast.className = 'cv-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), duration);
}

// ── Floating Autofill Button (Application Pages) ──────────────────────────────

let fabEl: HTMLButtonElement | null = null;

function injectFAB(): void {
  const context = getATSContext();
  if (!context.isApplicationPage) return;
  if (document.getElementById('cv-autofill-fab')) return;

  const fab = document.createElement('button');
  fab.id = 'cv-autofill-fab';
  fab.className = 'cv-fab';
  fab.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
    <span>Autofill with CareerVivid</span>
  `;

  fab.addEventListener('click', handleAutofillClick);
  document.body.appendChild(fab);
  fabEl = fab;
}

async function handleAutofillClick(): Promise<void> {
  if (!fabEl) return;

  fabEl.classList.add('cv-fab-loading');
  fabEl.innerHTML = `<div class="cv-fab-pulse"></div><span>Filling form...</span>`;
  fabEl.disabled = true;

  // Retrieve profile from background via message
  chrome.runtime.sendMessage({ type: 'AUTOFILL_APPLICATION' }, (response) => {
    // The actual fill result comes back via FILL_COMPLETE message
    if (response?.error) {
      showToast(`❌ ${response.error}`);
      resetFAB();
    }
  });
}

function resetFAB(): void {
  if (!fabEl) return;
  fabEl.classList.remove('cv-fab-loading', 'cv-fab-done');
  fabEl.disabled = false;
  fabEl.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
    <span>Autofill with CareerVivid</span>
  `;
}

// ── Save Job Buttons (Listing Pages) ─────────────────────────────────────────

function createSaveButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'cv-btn';
  btn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
    <span>Save Job</span>
  `;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    btn.textContent = 'Saving...';
    const job = extractJobData();
    if (job) {
      chrome.runtime.sendMessage({ type: 'SAVE_JOB', job }, (res) => {
        if (res?.success) {
          btn.classList.add('cv-btn-success');
          btn.textContent = '✓ Saved';
        } else {
          btn.textContent = 'Error saving';
          setTimeout(() => btn.textContent = 'Save Job', 2000);
        }
      });
    } else {
      btn.textContent = 'No job data';
    }
  });
  return btn;
}

function injectSaveButton(): void {
  if (document.querySelector('.cv-btn')) return;

  if (isLinkedIn) {
    const applySection = document.querySelector('.jobs-apply-button--top-card') ||
      document.querySelector('.jobs-unified-top-card__action-container');
    if (applySection) {
      applySection.appendChild(createSaveButton());
    }
  } else if (isIndeed) {
    const applyBtn = document.querySelector('[data-testid="indeedApply-button"]') ||
      document.querySelector('#indeedApplyButton');
    if (applyBtn?.parentElement) {
      const container = document.createElement('div');
      container.style.cssText = 'display:flex;gap:8px;margin-top:12px;';
      container.appendChild(createSaveButton());
      applyBtn.parentElement.insertAdjacentElement('afterend', container);
    }
  }
}

// ── Message Listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {

    case 'EXTRACT_JOB_DATA':
      sendResponse({ job: extractJobData() });
      break;

    case 'GET_ATS_CONTEXT':
      sendResponse({ context: getATSContext() });
      break;

    // Background forwards the user's profile; we run the fill engine
    case 'FILL_FORM': {
      const profile: AutoFillProfile = message.profile;
      runAutofill(profile).then((result: AutoFillResult) => {
        // Update FAB to show success
        if (fabEl) {
          fabEl.classList.remove('cv-fab-loading');
          fabEl.classList.add('cv-fab-done');
          fabEl.disabled = false;
          fabEl.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>${result.filledCount} fields filled</span>
          `;
        }

        // Show a toast summary
        const parts = [`✅ ${result.filledCount} filled`];
        if (result.skippedCount > 0) parts.push(`⚠️ ${result.skippedCount} skipped`);
        if (result.errorCount > 0) parts.push(`❌ ${result.errorCount} errors`);
        showToast(parts.join('  ·  '));

        // Relay result back to popup for the results panel
        chrome.runtime.sendMessage({ type: 'FILL_COMPLETE', result });
        sendResponse({ success: true, result });
      });
      return true; // Keep channel open for async
    }

    // ── NEW: Extract all form questions for AI answer generation ──────────────
    // Returns { questions: [{ label, type, options? }] }
    case 'EXTRACT_FORM_QUESTIONS': {
      const adapter = detectAdapter();
      if (!adapter || !adapter.isApplicationPage()) {
        sendResponse({ questions: [] });
        break;
      }

      const fields = adapter.getFormFields();
      const questions = fields
        .filter(f => f.type !== 'file' && f.type !== 'unknown' && f.label)
        .map(f => {
          const q: { label: string; type: string; options?: string[] } = {
            label: f.label,
            type: f.type,
          };
          // Extract select options for dropdowns
          if (f.element instanceof HTMLSelectElement) {
            q.options = Array.from(f.element.options)
              .filter(o => o.value && o.value !== '')
              .map(o => o.text.trim());
          }
          return q;
        });

      sendResponse({ questions });
      break;
    }

    // ── NEW: Inject a single AI-generated answer into the matching field ──────
    case 'INJECT_ANSWER': {
      const { label: targetLabel, value } = message as { label: string; value: string };
      const adapter = detectAdapter();

      if (!adapter || !value) {
        sendResponse({ success: false });
        break;
      }

      // Find the field whose label matches (case-insensitive)
      const fields = adapter.getFormFields();
      const target = fields.find(f =>
        f.label.toLowerCase().trim() === targetLabel.toLowerCase().trim()
      );

      if (!target) {
        sendResponse({ success: false, reason: 'Field not found' });
        break;
      }

      // Use the adapter's fillField method (React-safe)
      adapter.fillField(target, value).then(() => {
        target.filled = true;
        target.filledValue = value;
        sendResponse({ success: true });
      }).catch((err: Error) => {
        sendResponse({ success: false, reason: err.message });
      });

      return true; // Keep channel open for async
    }

    default:
      break;
  }
  return true;
});


// ── Initialization & SPA Navigation Observer ──────────────────────────────────

function init(): void {
  injectStyles();
  injectSaveButton();
  injectFAB();
}

// Re-run on SPA navigation (LinkedIn, Indeed use pushState routing)
const observer = new MutationObserver(() => {
  injectSaveButton();
  injectFAB();
});

if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('load', init);
}

observer.observe(document.documentElement, { childList: true, subtree: true });
