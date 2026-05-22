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

const isLinkedIn = window.location.hostname === 'linkedin.com' || window.location.hostname.endsWith('.linkedin.com');
const isIndeed = window.location.hostname === 'indeed.com' || window.location.hostname.endsWith('.indeed.com');

let extensionContextInvalidated = false;
let isUserAuthenticated = false;

type CareerVividAuthPayload = {
  token: string;
  uid: string;
  refreshToken?: string | null;
  expirationTime?: number | null;
  apiKey?: string | null;
};

function sendRuntimeMessage<T = any>(
  message: any,
  callback?: (response: T | undefined) => void
): boolean {
  if (extensionContextInvalidated) return false;

  try {
    if (!chrome?.runtime?.id) {
      extensionContextInvalidated = true;
      return false;
    }

    chrome.runtime.sendMessage(message, (response: T | undefined) => {
      const err = chrome.runtime.lastError;
      if (err?.message?.includes('Extension context invalidated')) {
        extensionContextInvalidated = true;
        return;
      }
      callback?.(response);
    });
    return true;
  } catch (err: any) {
    if (err?.message?.includes('Extension context invalidated')) {
      extensionContextInvalidated = true;
      return false;
    }

    console.debug('[CareerVivid Extension] Runtime message skipped:', err);
    return false;
  }
}

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

function getCompanyFromPage(): string {
  // 1. Try og:site_name metadata
  const siteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
  if (siteName) return siteName.trim();

  // 2. Try common company name selectors on ATS pages
  const selectors = ['.company-name', '[class*="companyName"]', '.company', '.brand', '.logo-text'];
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent) {
      const txt = el.textContent.trim();
      if (txt && txt.length < 50) return txt;
    }
  }

  // 3. Fallback to capitalized domain name
  try {
    const hostname = window.location.hostname.replace(/^www\./i, '');
    const firstPart = hostname.split('.')[0];
    if (firstPart) {
      return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
    }
  } catch (e) {}

  return document.title || 'Unknown Company';
}

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
      let title = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        document.querySelector('h1')?.textContent?.trim() || '';
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') ||
        document.querySelector('[class*="description"]')?.textContent?.trim() || '';
      
      const company = getCompanyFromPage();

      // Clean up title (remove trailing company name, e.g. "Software Engineer - OpenAI" -> "Software Engineer")
      if (title && company) {
        const cleanPatterns = [
          new RegExp(`\\s*[-|–|—|:|•]\\s*${company}.*`, 'i'),
          new RegExp(`\\s*at\\s*${company}.*`, 'i'),
        ];
        for (const pattern of cleanPatterns) {
          title = title.replace(pattern, '').trim();
        }
      }

      if (title) return { title, company, location: '', description, url: window.location.href };
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

  const existingFab = document.getElementById('cv-autofill-fab') as HTMLButtonElement;
  if (existingFab) {
    fabEl = existingFab;
    resetFAB();
    return;
  }

  const fab = document.createElement('button');
  fab.id = 'cv-autofill-fab';
  fabEl = fab;
  resetFAB();

  fab.addEventListener('click', handleAutofillClick);
  document.body.appendChild(fab);
}

async function handleAutofillClick(): Promise<void> {
  if (!fabEl) return;

  fabEl.classList.add('cv-fab-loading');
  fabEl.innerHTML = `<div class="cv-fab-pulse"></div><span>Filling form...</span>`;
  fabEl.disabled = true;

  // Retrieve profile from background via message
  const sent = sendRuntimeMessage<{ error?: string }>({ type: 'AUTOFILL_APPLICATION' }, (response) => {
    // The actual fill result comes back via FILL_COMPLETE message
    if (response?.error) {
      showToast(`❌ ${response.error}`);
      resetFAB();
    }
  });

  if (!sent) {
    showToast('CareerVivid extension was reloaded. Refresh this page, then try again.');
    resetFAB();
  }
}

function resetFAB(): void {
  if (!fabEl) return;
  fabEl.classList.remove('cv-fab-loading', 'cv-fab-done');
  fabEl.disabled = false;
  if (isUserAuthenticated) {
    fabEl.classList.add('cv-fab-done');
    fabEl.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      <span>Autofill Active</span>
    `;
  } else {
    fabEl.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
      <span>Autofill with CareerVivid</span>
    `;
  }
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
      const sent = sendRuntimeMessage<{ success?: boolean }>({ type: 'SAVE_JOB', job }, (res) => {
        if (res?.success) {
          btn.classList.add('cv-btn-success');
          btn.textContent = '✓ Saved';
        } else {
          btn.textContent = 'Error saving';
          setTimeout(() => btn.textContent = 'Save Job', 2000);
        }
      });
      if (!sent) {
        btn.textContent = 'Refresh page';
        setTimeout(() => btn.textContent = 'Save Job', 2000);
      }
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

    case 'AUTH_STATE_CHANGED':
      isUserAuthenticated = message.isAuthenticated === true;
      resetFAB();
      sendResponse({ success: true });
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
        sendRuntimeMessage({ type: 'FILL_COMPLETE', result });

        // Phase 2: Auto-log to job tracker (best-effort, no user action needed)
        if (result.filledCount > 0) {
          const job = extractJobData();
          if (job) {
            sendRuntimeMessage({
              type: 'AUTO_LOG_APPLICATION',
              job,
              filledCount: result.filledCount,
            });
          }
        }

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

    case 'GET_CAREERVIVID_AUTH': {
      if (!isCareerVividWebApp()) {
        sendResponse({ success: false, error: 'not_careervivid_page' });
        break;
      }

      readCareerVividIndexedDbAuth().then((authPayload) => {
        sendResponse({ success: !!authPayload, auth: authPayload });
      }).catch((err: Error) => {
        sendResponse({ success: false, error: err.message });
      });
      return true;
    }

    default:
      break;
  }
  return true;
});


// ── Initialization & SPA Navigation Observer ──────────────────────────────────

// ── CareerVivid Web Auth Sync ─────────────────────────────────────────────────

function isCareerVividWebApp(): boolean {
  return (
    window.location.hostname === 'careervivid.app' ||
    window.location.hostname.endsWith('.careervivid.app') ||
    ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      (document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') === 'CareerVivid' ||
       document.title.includes('CareerVivid')))
  );
}

function startCareerVividAuthSync(): void {
  const isCareerVividSite =
    isCareerVividWebApp();

  if (!isCareerVividSite) return;

  console.log('[CareerVivid Extension] Main site detected. Starting IndexedDB auth sync.');

  let lastToken = '';
  let missedChecks = 0;

  const sendAuth = (data: {
    token: string;
    uid: string;
    refreshToken?: string | null;
    expirationTime?: number | null;
    apiKey?: string | null;
  }) => {
    return sendRuntimeMessage({
      type: 'SAVE_AUTH_TOKEN',
      ...data,
    });
  };

  const clearAuth = () => {
    return sendRuntimeMessage({ type: 'CLEAR_AUTH_TOKEN' });
  };

  const checkAuth = () => {
    readCareerVividIndexedDbAuth().then((authPayload) => {
      if (authPayload) {
        if (authPayload.token !== lastToken) {
          missedChecks = 0;
          lastToken = authPayload.token;
          sendAuth(authPayload);
        }
        return;
      }

      missedChecks += 1;
      if (lastToken !== '' && missedChecks >= 2) {
        lastToken = '';
        clearAuth();
      }
    }).catch((e) => {
      console.debug('[CareerVivid Extension] Error reading Firebase IndexedDB auth:', e);
    });
  };

  checkAuth();
  const authInterval = setInterval(() => {
    if (extensionContextInvalidated) {
      clearInterval(authInterval);
      return;
    }
    checkAuth();
  }, 2500);
  window.addEventListener('focus', checkAuth);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkAuth();
    }
  });
}

function readCareerVividIndexedDbAuth(): Promise<CareerVividAuthPayload | null> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('firebaseLocalStorageDb');
      request.onerror = () => resolve(null);
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
          db.close();
          resolve(null);
          return;
        }

        const transaction = db.transaction(['firebaseLocalStorage'], 'readonly');
        const objectStore = transaction.objectStore('firebaseLocalStorage');
        const getAllRequest = objectStore.getAll();

        getAllRequest.onsuccess = (e) => {
          const results = (e.target as IDBRequest).result;
          const userVal = (results || [])
            .map((item: any) => parseFirebaseIndexedDbValue(item?.value))
            .filter((value: any) => value && value.uid && value.stsTokenManager?.accessToken)
            .sort((a: any, b: any) => (b.stsTokenManager.expirationTime || 0) - (a.stsTokenManager.expirationTime || 0))[0];

          db.close();

          if (!userVal?.stsTokenManager) {
            resolve(null);
            return;
          }

          resolve({
            token: userVal.stsTokenManager.accessToken,
            refreshToken: userVal.stsTokenManager.refreshToken,
            expirationTime: userVal.stsTokenManager.expirationTime,
            apiKey: userVal.apiKey,
            uid: userVal.uid,
          });
        };
        getAllRequest.onerror = () => {
          db.close();
          resolve(null);
        };
      };
    } catch (e) {
      reject(e);
    }
  });
}

function parseFirebaseIndexedDbValue(value: any): any {
  if (!value) return null;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
}

function checkAuthStatus(callback?: () => void): void {
  let resolved = false;

  const timeout = setTimeout(() => {
    if (!resolved) {
      resolved = true;
      console.warn('[CareerVivid] Auth check timed out after 500ms. Defaulting to unauthenticated state.');
      isUserAuthenticated = false;
      callback?.();
    }
  }, 500);

  const sent = sendRuntimeMessage<{ isAuthenticated: boolean }>({ type: 'CHECK_AUTH_STATUS' }, (res) => {
    if (!resolved) {
      resolved = true;
      clearTimeout(timeout);
      isUserAuthenticated = res?.isAuthenticated === true;
      callback?.();
    }
  });

  if (!sent && !resolved) {
    resolved = true;
    clearTimeout(timeout);
    isUserAuthenticated = false;
    callback?.();
  }
}

// ─── Resource-Safe DOM Injection Manager (5-Second Limit) ───────────────────

let injectionObserver: MutationObserver | null = null;
let injectionTimeout: number | null = null;
let lastKnownUrl = window.location.href;
let rafPending = false;

function throttledInject(): void {
  if (rafPending) return;
  rafPending = true;

  requestAnimationFrame(() => {
    try {
      injectSaveButton();
      injectFAB();
    } catch (e) {
      console.error('[CareerVivid] Injection error during render pass:', e);
    } finally {
      rafPending = false;
    }
  });
}

function startInjectionWindow(): void {
  stopInjectionWindow();
  throttledInject();

  injectionObserver = new MutationObserver((mutations) => {
    const hasStructureChanges = mutations.some(m => m.addedNodes.length > 0 || m.removedNodes.length > 0);
    if (hasStructureChanges) {
      throttledInject();
    }
  });

  try {
    injectionObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  } catch (e) {
    console.warn('[CareerVivid] Failed to start MutationObserver:', e);
  }

  injectionTimeout = window.setTimeout(() => {
    stopInjectionWindow();
    console.debug('[CareerVivid] DOM scanning window ended (5-second timeout reached).');
  }, 5000);
}

function stopInjectionWindow(): void {
  if (injectionObserver) {
    injectionObserver.disconnect();
    injectionObserver = null;
  }
  if (injectionTimeout) {
    clearTimeout(injectionTimeout);
    injectionTimeout = null;
  }
}

function setupSpaNavigationListener(): void {
  const handleUrlChange = () => {
    if (window.location.href !== lastKnownUrl) {
      lastKnownUrl = window.location.href;
      console.debug('[CareerVivid] SPA URL transition detected. Re-triggering injection safety window.');
      startInjectionWindow();
    }
  };

  window.addEventListener('popstate', handleUrlChange);
  window.addEventListener('hashchange', handleUrlChange);

  // Non-invasive polling fallback to catch framework-level SPA transitions (like Next.js)
  // without dangerous monkey-patching of history.pushState/replaceState which crashes host pages.
  const spaInterval = setInterval(() => {
    if (extensionContextInvalidated) {
      clearInterval(spaInterval);
      return;
    }
    handleUrlChange();
  }, 1000);
}

async function silentPrefetch(): Promise<void> {
  try {
    const context = getATSContext();
    if (!context.isApplicationPage) return;

    // Collect form questions
    const adapter = detectAdapter();
    if (!adapter) return;

    const fields = adapter.getFormFields();
    const questions = fields
      .filter(f => f.type !== 'file' && f.type !== 'unknown' && f.label)
      .map(f => {
        const q: { label: string; type: string; options?: string[] } = {
          label: f.label,
          type: f.type,
        };
        if (f.element instanceof HTMLSelectElement) {
          q.options = Array.from(f.element.options)
            .filter(o => o.value && o.value !== '')
            .map(o => o.text.trim());
        }
        return q;
      });

    if (questions.length === 0) return;

    // Extract job context
    const job = extractJobData();

    // Signal background to prefetch — fire-and-forget from content script's perspective
    sendRuntimeMessage({
      type: 'PREFETCH_AI_ANSWERS',
      pageUrl: window.location.href,
      questions,
      companyName: job?.company || document.title,
      jobTitle:    job?.title   || document.querySelector('h1')?.textContent?.trim() || 'Unknown Role',
      jobDescription: job?.description || '',
    });

    // Signal background to prefetch cover letter as well if description is present
    if (job?.description) {
      sendRuntimeMessage({
        type: 'PREFETCH_COVER_LETTER',
        pageUrl: window.location.href,
        companyName: job?.company || document.title,
        jobTitle:    job?.title   || document.querySelector('h1')?.textContent?.trim() || 'Unknown Role',
        jobDescription: job.description,
      });
    }
  } catch (e) {
    // Prefetch is best-effort — never surface errors to the user
    console.debug('[CareerVivid] prefetch skipped:', e);
  }
}

/**
 * Asynchronous, error-safe entry point for the content script.
 */
async function safeInit(): Promise<void> {
  try {
    injectStyles();

    checkAuthStatus(async () => {
      try {
        startInjectionWindow();
        setupSpaNavigationListener();

        if (isCareerVividWebApp()) {
          startCareerVividAuthSync();
        }

        const context = getATSContext();
        if (context.isApplicationPage) {
          setTimeout(() => {
            silentPrefetch().catch(e => {
              console.debug('[CareerVivid] Safe prefetch skipped:', e);
            });
          }, 1500);
        }
      } catch (innerError) {
        console.error('[CareerVivid] Safe initialization callback failed:', innerError);
      }
    });

  } catch (outerError) {
    console.error('[CareerVivid] Unhandled content script boot error:', outerError);
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  safeInit();
} else {
  window.addEventListener('DOMContentLoaded', () => {
    safeInit();
  });
}

