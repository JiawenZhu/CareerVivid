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
let careerVividAuthSyncStarted = false;

function claimContentScriptBoot(): boolean {
  const win = window as Window & { __careerVividContentScriptBooted__?: boolean };
  if (win.__careerVividContentScriptBooted__) return false;
  win.__careerVividContentScriptBooted__ = true;
  return true;
}

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

    if (import.meta.env.DEV) {
      console.debug('[CareerVivid Extension] Runtime message skipped:', err);
    }
    return false;
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

// Injected into the page as a <style> tag to avoid CSP issues with inline styles
const CSS = `
  /* In-page Save Job Buttons */
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

  /* In-page Toast Notifications */
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

  /* Layout-Shifting Transitions */
  .cv-body-shift {
    transition: margin-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }

  /* Expandable Floating Menu Container (FAB Root) */
  #cv-floating-root {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  /* The 4-Color Grid Trigger FAB Button */
  .cv-floating-trigger {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #090d16 0%, #1e1b4b 100%);
    border: 2px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(99, 102, 241, 0.15);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    padding: 0;
    margin: 0;
    outline: none;
  }
  .cv-floating-trigger:hover {
    transform: scale(1.08) rotate(15deg);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.35), 0 4px 12px rgba(99, 102, 241, 0.25);
    border-color: rgba(255, 255, 255, 0.2);
  }
  .cv-floating-trigger:active {
    transform: scale(0.95);
  }

  /* Rotating Close Icon inside FAB when Menu is open */
  .cv-floating-trigger.cv-active {
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.15);
  }

  /* Rotating triggers */
  .cv-floating-trigger.cv-active .cv-logo-svg {
    display: none !important;
  }
  .cv-floating-trigger.cv-active .cv-close-svg {
    display: block !important;
    transform: rotate(90deg);
  }

  /* The Custom Expandable Action Menu Dashboard */
  .cv-floating-menu {
    width: 330px;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px) saturate(190%);
    -webkit-backdrop-filter: blur(20px) saturate(190%);
    border: 1px solid rgba(229, 231, 235, 0.8);
    border-radius: 24px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04);
    position: absolute;
    bottom: 72px;
    right: 0;
    padding: 24px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 18px;
    opacity: 0;
    transform: translateY(24px) scale(0.9);
    pointer-events: none;
    transform-origin: bottom right;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 2147483646;
  }
  .cv-floating-menu.cv-menu-expanded {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }

  /* Category Styling */
  .cv-menu-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .cv-menu-header {
    font-size: 11px;
    font-weight: 700;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    padding: 0 6px;
    margin-bottom: 4px;
  }

  /* Row Item Styling */
  .cv-menu-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 8px 10px;
    border-radius: 14px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    width: 100%;
    box-sizing: border-box;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    text-decoration: none;
  }
  .cv-menu-row:hover {
    background: #f3f4f6;
  }
  .cv-menu-row:active {
    transform: scale(0.98);
  }

  /* Icons inside Row Items */
  .cv-row-icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: #f8fafc;
    color: #475569;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
  }
  .cv-menu-row:hover .cv-row-icon-wrapper {
    background: #ffffff;
    color: #4f46e5;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
  }

  /* Title inside Row Items */
  .cv-row-title {
    font-size: 15px;
    font-weight: 600;
    color: #1e1b4b;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  /* Active/Success State for Scrapers & Autofill in Menu */
  .cv-row-loading .cv-row-icon-wrapper {
    background: #eff6ff;
    color: #3b82f6;
  }
  .cv-row-success .cv-row-icon-wrapper {
    background: #ecfdf5;
    color: #10b981;
  }
  .cv-row-success .cv-row-title {
    color: #047857;
  }

  /* Speechify/Claude-Style Sidebar Panel */
  .cv-sidebar-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 400px;
    height: 100vh;
    z-index: 2147483645;
    background: #ffffff;
    border-left: 1px solid rgba(229, 231, 235, 1);
    box-shadow: -12px 0 40px rgba(0, 0, 0, 0.06), -4px 0 12px rgba(0, 0, 0, 0.02);
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    transform: translateX(100%);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
  }
  .cv-sidebar-panel.cv-sidebar-open {
    transform: translateX(0);
  }

  /* Sidebar Header */
  .cv-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background: #0f172a;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    color: #ffffff;
    box-sizing: border-box;
    flex-shrink: 0;
  }
  .cv-sidebar-title-container {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .cv-sidebar-logo-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cv-sidebar-title {
    font-size: 14px;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    letter-spacing: -0.01em;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .cv-sidebar-close {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    transition: all 0.2s;
    padding: 0;
    outline: none;
  }
  .cv-sidebar-close:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }

  /* Sidebar Iframe Sandboxed Wrapper */
  .cv-sidebar-iframe {
    width: 100%;
    height: 100%;
    border: none;
    flex: 1;
    background: #f9fafb;
    box-sizing: border-box;
  }
`;

function injectStyles(): void {
  if (document.getElementById('cv-styles')) return;
  const style = document.createElement('style');
  style.id = 'cv-styles';
  style.textContent = CSS;
  document.head.appendChild(style);
}

// ── Job Data Extraction ───────────────────────────────────────────────────────

function formatCompanySlug(slug: string): string {
  const cleaned = slug.trim().replace(/[-_]+/g, ' ');
  if (!cleaned) return '';

  const knownNames: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
  };

  const normalized = cleaned.replace(/\s+/g, '').toLowerCase();
  if (knownNames[normalized]) return knownNames[normalized];

  return cleaned
    .split(/\s+/)
    .map(part => part ? part.charAt(0).toUpperCase() + part.slice(1) : '')
    .join(' ');
}

function getCompanyFromATSUrl(): string {
  try {
    const { hostname, pathname } = window.location;
    const pathParts = pathname.split('/').filter(Boolean);

    if (/ashbyhq\.com$/i.test(hostname) && pathParts[0]) {
      return formatCompanySlug(pathParts[0]);
    }

    if (/jobs\.lever\.co$/i.test(hostname) && pathParts[0]) {
      return formatCompanySlug(pathParts[0]);
    }

    const greenhouseMatch = hostname.match(/^([^.]+)\.greenhouse\.io$/i);
    if (greenhouseMatch?.[1]) {
      return formatCompanySlug(greenhouseMatch[1]);
    }
  } catch (e) {}

  return '';
}

function getCompanyFromPage(): string {
  // 1. ATS URLs often carry the company slug, e.g. jobs.ashbyhq.com/openai/...
  const atsCompany = getCompanyFromATSUrl();
  if (atsCompany) return atsCompany;

  // 2. Try og:site_name metadata
  const siteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
  if (siteName) return siteName.trim();

  // 3. Try common company name selectors on ATS pages
  const selectors = ['.company-name', '[class*="companyName"]', '.company', '.brand', '.logo-text'];
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent) {
      const txt = el.textContent.trim();
      if (txt && txt.length < 50) return txt;
    }
  }

  // 4. Fallback to capitalized domain name
  try {
    const hostname = window.location.hostname.replace(/^www\./i, '');
    const firstPart = hostname.split('.')[0];
    if (firstPart) {
      return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
    }
  } catch (e) {}

  return document.title || 'Unknown Company';
}

function getTextAfterHeading(labels: string[]): string {
  const normalizedLabels = labels.map(label => label.toLowerCase());
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, strong, b, dt'));

  for (const heading of headings) {
    const headingText = heading.textContent?.trim().replace(/[:*]+$/g, '').toLowerCase();
    if (!headingText || !normalizedLabels.includes(headingText)) continue;

    let next = heading.nextElementSibling;
    while (next) {
      const text = next.textContent?.trim();
      if (text) return text;
      next = next.nextElementSibling;
    }
  }

  return '';
}

function extractLocation(): string {
  const labelledLocation = getTextAfterHeading(['Location', 'Office', 'Workplace']);
  if (labelledLocation && labelledLocation.length < 120) return labelledLocation;

  const locationSelectors = [
    '[class*="location"]',
    '[data-testid*="location"]',
    '[aria-label*="location" i]',
  ];

  for (const selector of locationSelectors) {
    const el = document.querySelector(selector);
    const text = el?.textContent?.trim();
    if (text && text.length < 120) return text;
  }

  return '';
}

function extractSalary(): string {
  // LinkedIn
  const liInsights = document.querySelectorAll(
    '.job-details-jobs-unified-top-card__job-insight span, .compensation-and-workplace-type span, .job-details-preferences-and-skills__pill'
  );
  for (const el of Array.from(liInsights)) {
    const text = el.textContent?.trim() || '';
    if (text.includes('$') || text.toLowerCase().includes('/yr') || text.toLowerCase().includes('/hr')) {
      return text;
    }
  }

  // Indeed
  const indeedSnippets = document.querySelectorAll('[data-testid="attribute_snippet_testid"], [data-testid="jobsearch-SalaryEstimate"]');
  for (const el of Array.from(indeedSnippets)) {
    const text = el.textContent?.trim() || '';
    if (text.includes('$')) return text;
  }

  // Generic: regex over visible text near the top of the page
  const SALARY_RE = /\$[\d,]+(?:K)?(?:\s*[-–]\s*\$[\d,]+(?:K)?)?(?:\s*(?:per|\/)\s*(?:year|yr|hour|hr|month|mo))?/i;
  const candidates = document.querySelectorAll('h1, h2, h3, [class*="salary"], [class*="compensation"], [class*="pay"]');
  for (const el of Array.from(candidates)) {
    const text = el.textContent || '';
    const m = text.match(SALARY_RE);
    if (m) return m[0].trim();
  }

  return '';
}

function getElementText(element: Element | null): string {
  if (!element) return '';

  const rawText = element instanceof HTMLElement
    ? element.innerText
    : element.textContent || '';

  return rawText
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isLikelyCsodJobPage(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();

  return (hostname.endsWith('.csod.com') || hostname.includes('cornerstoneondemand.com')) &&
    pathname.includes('/careersite/') &&
    pathname.includes('/requisition/');
}

function extractDescriptionFromVisiblePage(title?: string): string {
  const selectors = [
    '[data-testid*="job-description"]',
    '[data-automation-id*="jobDescription"]',
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[class*="posting-description"]',
    '[class*="requisition"]',
    '[class*="description"]',
    'main',
    '[role="main"]',
  ];

  for (const selector of selectors) {
    const text = getElementText(document.querySelector(selector));
    if (text.length > 200) return text.slice(0, 12000);
  }

  const bodyText = getElementText(document.body);
  if (!bodyText || bodyText.length < 200) return '';

  if (isLikelyCsodJobPage()) {
    const startMarkers = [
      'Job Summary',
      'Duties & Responsibilities',
      'Specialty Factors',
      'Preferred Qualifications',
      'Knowledge, Skills and Abilities',
    ];
    const endMarkers = [
      'Looking for more',
      'Illinois Human Resources',
      'Requisition ID',
    ];
    const startCandidates = startMarkers
      .map(marker => bodyText.indexOf(marker))
      .filter(index => index >= 0);
    const start = startCandidates.length > 0
      ? Math.min(...startCandidates)
      : title
        ? bodyText.indexOf(title)
        : 0;
    const safeStart = start >= 0 ? start : 0;
    const endCandidates = endMarkers
      .map(marker => bodyText.indexOf(marker, safeStart + 1))
      .filter(index => index > safeStart);
    const end = endCandidates.length > 0 ? Math.min(...endCandidates) : bodyText.length;

    return bodyText.slice(safeStart, end).trim().slice(0, 12000);
  }

  return bodyText.slice(0, 12000);
}

function extractJobData(): { title: string; company: string; location: string; description: string; url: string; salary?: string } | null {
  try {
    if (isCareerVividWebApp()) return null;

    if (isLinkedIn) {
      const title = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim() ||
        document.querySelector('.jobs-unified-top-card__job-title')?.textContent?.trim();
      const company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() ||
        document.querySelector('.jobs-unified-top-card__company-name')?.textContent?.trim();
      const location = document.querySelector('.job-details-jobs-unified-top-card__primary-description-container')?.textContent?.trim() ||
        document.querySelector('.jobs-unified-top-card__primary-description-container')?.textContent?.trim();
      const description = document.querySelector('#job-details')?.textContent?.trim() || '';
      const salary = extractSalary();
      if (title && company) return { title, company, location: location || '', description, url: window.location.href, salary: salary || undefined };
    } else if (isIndeed) {
      const title = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim();
      const company = document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim();
      const location = document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.textContent?.trim();
      const description = document.querySelector('#jobDescriptionText')?.textContent?.trim() || '';
      const salary = extractSalary();
      if (title && company) return { title, company, location: location || '', description, url: window.location.href, salary: salary || undefined };
    } else {
      // Generic ATS extraction using Open Graph tags / page title
      let title = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        document.querySelector('h1')?.textContent?.trim() || '';
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
      const salary = extractSalary();
      const company = getCompanyFromPage();
      const location = extractLocation();
      const visibleDescription = extractDescriptionFromVisiblePage(title);
      const description = isLikelyCsodJobPage() && visibleDescription
        ? visibleDescription
        : metaDescription.length > 200
        ? metaDescription
        : visibleDescription;

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

      if (title) return { title, company, location, description, url: window.location.href, salary: salary || undefined };
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.debug('[CareerVivid] Job extraction error:', e);
    }
  }
  return null;
}

let lastBroadcastedJobContextSignature = '';
let jobContextBroadcastTimer: number | null = null;
let jobContextObserver: MutationObserver | null = null;

function getJobContextSignature(
  job: ReturnType<typeof extractJobData>,
  context: ReturnType<typeof getATSContext>
): string {
  return JSON.stringify({
    url: window.location.href,
    title: job?.title || '',
    company: job?.company || '',
    descriptionLength: job?.description?.length || 0,
    salary: job?.salary || '',
    platform: context.platform || '',
    isApplicationPage: !!context.isApplicationPage,
  });
}

function broadcastJobContextIfChanged(force = false): void {
  try {
    const job = extractJobData();
    const context = getATSContext();
    const signature = getJobContextSignature(job, context);

    if (!force && signature === lastBroadcastedJobContextSignature) return;

    lastBroadcastedJobContextSignature = signature;
    sendRuntimeMessage({
      type: 'JOB_CONTEXT_CHANGED',
      job,
      context,
      url: window.location.href,
      title: document.title,
    });
  } catch (e) {
    if (import.meta.env.DEV) {
      console.debug('[CareerVivid] Job context broadcast skipped:', e);
    }
  }
}

function scheduleJobContextBroadcast(delay = 350): void {
  if (jobContextBroadcastTimer) {
    window.clearTimeout(jobContextBroadcastTimer);
  }

  jobContextBroadcastTimer = window.setTimeout(() => {
    jobContextBroadcastTimer = null;
    broadcastJobContextIfChanged();
  }, delay);
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

// ── Expandable Floating Action Menu & Webpage Sidebar Panel ────────────────────

// Globals to manage FAB & Sidebar elements
let cvFloatingRoot: HTMLDivElement | null = null;
let cvSidebarPanel: HTMLDivElement | null = null;
let isSidebarOpen = false;

// Compatibility layer to prevent existing auto-fill engine logic from crashing
let fabEl: any = {
  classList: {
    add: (cls: string) => {
      const autofillRow = document.getElementById('cv-menu-autofill');
      if (autofillRow) {
        if (cls === 'cv-fab-loading') {
          autofillRow.classList.add('cv-row-loading');
          autofillRow.querySelector('.cv-row-title')!.textContent = 'Autofilling...';
        }
      }
    },
    remove: (cls: string) => {
      const autofillRow = document.getElementById('cv-menu-autofill');
      if (autofillRow) {
        if (cls === 'cv-fab-loading') {
          autofillRow.classList.remove('cv-row-loading');
        }
      }
    }
  },
  set disabled(val: boolean) {}
};

function resetFAB(): void {
  const autofillRow = document.getElementById('cv-menu-autofill');
  if (autofillRow) {
    autofillRow.classList.remove('cv-row-loading', 'cv-row-success');
    autofillRow.querySelector('.cv-row-title')!.textContent = 'Autofill Application';
  }
}

// Determines if we are on a relevant page to show the FAB icon (Job board or ATS page)
function shouldShowFAB(): boolean {
  const lowercaseUrl = window.location.href.toLowerCase();

  // Do not show on main CareerVivid web application itself to prevent recursion
  if (lowercaseUrl.includes('careervivid.app')) {
    return false;
  }

  const isKnownJobSite = [
    'linkedin.com',
    'indeed.com',
    'greenhouse.io',
    'lever.co',
    'myworkdayjobs.com',
    'ashbyhq.com',
    'smartrecruiters.com',
    'workable.com',
    'bamboohr.com'
  ].some(s => lowercaseUrl.includes(s));

  const isCustomJobPage = [
    '/jobs/',
    '/careers/',
    '/careers-at/',
    '/apply/',
    '/positions/',
    '/job/',
    '/position/'
  ].some(p => lowercaseUrl.includes(p)) || lowercaseUrl.includes('careers.') || lowercaseUrl.includes('jobs.');

  const context = getATSContext();
  return isKnownJobSite || isCustomJobPage || context.isApplicationPage;
}

function injectFAB(): void {
  const existingRoot = document.getElementById('cv-floating-root');
  if (existingRoot) {
    cvFloatingRoot = existingRoot as HTMLDivElement;
    return;
  }

  if (!shouldShowFAB()) return;

  // Create the FAB container
  const root = document.createElement('div');
  root.id = 'cv-floating-root';
  cvFloatingRoot = root;

  // 1. Create the FAB Trigger Button (4-color circular grid logo)
  const trigger = document.createElement('button');
  trigger.className = 'cv-floating-trigger';
  trigger.title = 'CareerVivid AI Assistant';
  trigger.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" class="cv-logo-svg" style="transform: rotate(45deg); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
      <path d="M15 3C8.37 3 3 8.37 3 15H15V3Z" fill="#06b6d4" />
      <path d="M17 3V15H29C29 8.37 23.63 3 17 3Z" fill="#eab308" />
      <path d="M3 17C3 23.63 8.37 29 15 29V17H3Z" fill="#3b82f6" />
      <path d="M17 17V29C23.63 29 29 23.63 29 17H17Z" fill="#ec4899" />
    </svg>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="cv-close-svg" style="display: none; transition: transform 0.3s;">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;

  // 2. Create the Expandable Action Menu Dashboard
  const menu = document.createElement('div');
  menu.className = 'cv-floating-menu';
  menu.innerHTML = `
    <!-- Save Jobs Section -->
    <div class="cv-menu-section">
      <div class="cv-menu-header">Save Jobs</div>
      <button class="cv-menu-row" id="cv-menu-save-job">
        <div class="cv-row-icon-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
        </div>
        <span class="cv-row-title">Save Job to Board</span>
      </button>
    </div>

    <!-- Autofill + Materials Section -->
    <div class="cv-menu-section">
      <div class="cv-menu-header">Autofill + Materials</div>
      <button class="cv-menu-row" id="cv-menu-autofill">
        <div class="cv-row-icon-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z"></path></svg>
        </div>
        <span class="cv-row-title">Autofill Application</span>
      </button>
      <button class="cv-menu-row" id="cv-menu-build-resume">
        <div class="cv-row-icon-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
        </div>
        <span class="cv-row-title">Build a Resume</span>
      </button>
      <button class="cv-menu-row" id="cv-menu-tailor-resume">
        <div class="cv-row-icon-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12a10 10 0 0 1 13.7-9.3"></path><path d="M22 12a10 10 0 0 0-3.7-7.7"></path><path d="M12 12A4 4 0 0 0 8 16"></path><path d="M16 16c0-2.2-1.8-4-4-4s-4 1.8-4 4"></path><path d="M12 8a8 8 0 0 0-8 8"></path><path d="M20 16a8 8 0 0 0-8-8c-2.4 0-4.6.9-6.2 2.5"></path></svg>
        </div>
        <span class="cv-row-title">Build a Job Tailored Resume</span>
      </button>
      <button class="cv-menu-row" id="cv-menu-cover-letter">
        <div class="cv-row-icon-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
        </div>
        <span class="cv-row-title">Generate a Cover Letter</span>
      </button>
    </div>

    <!-- Other Section -->
    <div class="cv-menu-section">
      <div class="cv-menu-header">Other</div>
      <button class="cv-menu-row" id="cv-menu-home">
        <div class="cv-row-icon-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        </div>
        <span class="cv-row-title">Home</span>
      </button>
      <button class="cv-menu-row" id="cv-menu-settings">
        <div class="cv-row-icon-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </div>
        <span class="cv-row-title">Settings</span>
      </button>
    </div>
  `;

  // ── Action Interactions ──

  // Toggling Expandable Action Menu on Trigger FAB Click
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = menu.classList.contains('cv-menu-expanded');
    if (isExpanded) {
      menu.classList.remove('cv-menu-expanded');
      trigger.classList.remove('cv-active');
    } else {
      menu.classList.add('cv-menu-expanded');
      trigger.classList.add('cv-active');
    }
  });

  // Action: Save Job to Board
  const saveBtn = menu.querySelector('#cv-menu-save-job') as HTMLButtonElement;
  saveBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    saveBtn.classList.add('cv-row-loading');
    saveBtn.querySelector('.cv-row-title')!.textContent = 'Saving job...';

    const job = extractJobData();
    if (job) {
      const sent = sendRuntimeMessage<{ success?: boolean }>({ type: 'SAVE_JOB', job }, (res) => {
        saveBtn.classList.remove('cv-row-loading');
        if (res?.success) {
          saveBtn.classList.add('cv-row-success');
          saveBtn.querySelector('.cv-row-title')!.textContent = '✓ Saved to Board';
          showToast('✓ Job saved successfully to CareerVivid!');
          setTimeout(() => {
            saveBtn.classList.remove('cv-row-success');
            saveBtn.querySelector('.cv-row-title')!.textContent = 'Save Job to Board';
          }, 3500);
        } else {
          saveBtn.querySelector('.cv-row-title')!.textContent = 'Error saving';
          setTimeout(() => {
            saveBtn.querySelector('.cv-row-title')!.textContent = 'Save Job to Board';
          }, 2000);
        }
      });
      if (!sent) {
        saveBtn.classList.remove('cv-row-loading');
        saveBtn.querySelector('.cv-row-title')!.textContent = 'Please refresh page';
        setTimeout(() => {
          saveBtn.querySelector('.cv-row-title')!.textContent = 'Save Job to Board';
        }, 2500);
      }
    } else {
      saveBtn.classList.remove('cv-row-loading');
      saveBtn.querySelector('.cv-row-title')!.textContent = 'No job data found';
      setTimeout(() => {
        saveBtn.querySelector('.cv-row-title')!.textContent = 'Save Job to Board';
      }, 2500);
    }
  });

  // Action: Autofill Application
  const autofillBtn = menu.querySelector('#cv-menu-autofill') as HTMLButtonElement;
  autofillBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.remove('cv-menu-expanded');
    trigger.classList.remove('cv-active');
    handleAutofillClick();
  });

  // Action: Build a Resume (Opens Hub in a new tab)
  const buildResumeBtn = menu.querySelector('#cv-menu-build-resume') as HTMLButtonElement;
  buildResumeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.remove('cv-menu-expanded');
    trigger.classList.remove('cv-active');
    window.open('https://careervivid.app/newresume?scrollTo=create-section', '_blank');
  });

  // Action: Tailor Resume (Opens/extends the sidebar)
  const tailorResumeBtn = menu.querySelector('#cv-menu-tailor-resume') as HTMLButtonElement;
  tailorResumeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.remove('cv-menu-expanded');
    trigger.classList.remove('cv-active');
    openSidebar();
  });

  // Action: Generate a Cover Letter (Opens/extends the sidebar)
  const coverLetterBtn = menu.querySelector('#cv-menu-cover-letter') as HTMLButtonElement;
  coverLetterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.remove('cv-menu-expanded');
    trigger.classList.remove('cv-active');
    openSidebar();
  });

  // Action: Home
  const homeBtn = menu.querySelector('#cv-menu-home') as HTMLButtonElement;
  homeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.remove('cv-menu-expanded');
    trigger.classList.remove('cv-active');
    openSidebar();
  });

  // Action: Settings
  const settingsBtn = menu.querySelector('#cv-menu-settings') as HTMLButtonElement;
  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.remove('cv-menu-expanded');
    trigger.classList.remove('cv-active');
    openSidebar();
  });

  // Append elements to container
  root.appendChild(menu);
  root.appendChild(trigger);
  document.body.appendChild(root);

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (menu.classList.contains('cv-menu-expanded') && !menu.contains(target) && !trigger.contains(target)) {
      menu.classList.remove('cv-menu-expanded');
      trigger.classList.remove('cv-active');
    }
  });

  // Close menu on scroll
  window.addEventListener('scroll', () => {
    if (menu.classList.contains('cv-menu-expanded')) {
      menu.classList.remove('cv-menu-expanded');
      trigger.classList.remove('cv-active');
    }
  }, { passive: true });
}

async function handleAutofillClick(): Promise<void> {
  const autofillRow = document.getElementById('cv-menu-autofill');
  if (autofillRow) {
    autofillRow.classList.add('cv-row-loading');
    autofillRow.querySelector('.cv-row-title')!.textContent = 'Autofilling fields...';
  }

  // Retrieve profile from background and run form injection
  const sent = sendRuntimeMessage<{ error?: string }>({ type: 'AUTOFILL_APPLICATION' }, (response) => {
    if (response?.error) {
      showToast(`❌ ${response.error}`);
      resetFAB();
    }
  });

  if (!sent) {
    showToast('⚠️ CareerVivid extension was reloaded. Refresh this page and try again.');
    resetFAB();
  }
}

// ── In-Page sandboxed Webpage Sidebar Panel (Speechify / Claude-Style) ─────────

function createSidebar(): void {
  if (document.getElementById('cv-sidebar-panel')) {
    cvSidebarPanel = document.getElementById('cv-sidebar-panel') as HTMLDivElement;
    return;
  }

  const panel = document.createElement('div');
  panel.id = 'cv-sidebar-panel';
  panel.className = 'cv-sidebar-panel';
  panel.innerHTML = `
    <div class="cv-sidebar-header">
      <div class="cv-sidebar-title-container">
        <div class="cv-sidebar-logo-circle">
          <svg width="14" height="14" viewBox="0 0 32 32" fill="none" style="transform: rotate(45deg);">
            <path d="M15 3C8.37 3 3 8.37 3 15H15V3Z" fill="#06b6d4" />
            <path d="M17 3V15H29C29 8.37 23.63 3 17 3Z" fill="#eab308" />
            <path d="M3 17C3 23.63 8.37 29 15 29V17H3Z" fill="#3b82f6" />
            <path d="M17 17V29C23.63 29 29 23.63 29 17H17Z" fill="#ec4899" />
          </svg>
        </div>
        <h3 class="cv-sidebar-title">CareerVivid AI Assistant</h3>
      </div>
      <button class="cv-sidebar-close" id="cv-sidebar-close-btn" title="Close Panel">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <iframe class="cv-sidebar-iframe" id="cv-sidebar-iframe-el"></iframe>
  `;

  document.body.appendChild(panel);
  cvSidebarPanel = panel;

  // Add Close listener
  const closeBtn = panel.querySelector('#cv-sidebar-close-btn') as HTMLButtonElement;
  closeBtn.addEventListener('click', closeSidebar);
}

function openSidebar(): void {
  const sent = sendRuntimeMessage<{ success?: boolean }>({ type: 'OPEN_SIDE_PANEL' }, (response) => {
    if (response?.success) return;
    openEmbeddedSidebar();
  });

  if (!sent) {
    openEmbeddedSidebar();
  }
}

function openEmbeddedSidebar(): void {
  createSidebar();
  if (!cvSidebarPanel) return;

  const iframe = cvSidebarPanel.querySelector('#cv-sidebar-iframe-el') as HTMLIFrameElement;
  if (iframe && !iframe.src) {
    iframe.src = chrome.runtime.getURL("index.html");
  }

  // 1. Shift webpage content body smoothly to the left (by 400px margin)
  document.documentElement.classList.add('cv-body-shift');
  document.body.classList.add('cv-body-shift');
  document.documentElement.style.setProperty('margin-right', '400px', 'important');
  document.body.style.setProperty('margin-right', '400px', 'important');

  // 2. Open side panel with transition
  cvSidebarPanel.classList.add('cv-sidebar-open');
  isSidebarOpen = true;
}

function closeSidebar(): void {
  if (!cvSidebarPanel) return;

  // 1. Restore webpage content layout smoothly
  document.documentElement.style.removeProperty('margin-right');
  document.body.style.removeProperty('margin-right');

  // 2. Hide side panel with transition
  cvSidebarPanel.classList.remove('cv-sidebar-open');
  isSidebarOpen = false;
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

    case 'RESUME_CHANGED':
      window.postMessage({ type: 'CAREER_VIVID_EXTENSION_RESUME_CHANGED', resumeId: message.resumeId }, '*');
      sendResponse({ success: true });
      break;

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

      let resumeFile: File | undefined;
      if (message.base64Pdf && message.fileName) {
        try {
          const raw = atob(message.base64Pdf);
          const array = new Uint8Array(new ArrayBuffer(raw.length));
          for (let i = 0; i < raw.length; i++) {
            array[i] = raw.charCodeAt(i);
          }
          const blob = new Blob([array], { type: 'application/pdf' });
          resumeFile = new File([blob], message.fileName, { type: 'application/pdf' });
        } catch (fileErr) {
          if (import.meta.env.DEV) {
            console.debug('[CareerVivid] Failed to decode and reconstitute resume PDF:', fileErr);
          }
        }
      }

      runAutofill(profile, resumeFile).then((result: AutoFillResult) => {
        // Update FAB to show success (compat)
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

        // Update the new action menu row beautifully
        const autofillRow = document.getElementById('cv-menu-autofill');
        if (autofillRow) {
          autofillRow.classList.remove('cv-row-loading');
          autofillRow.classList.add('cv-row-success');
          autofillRow.querySelector('.cv-row-title')!.textContent = `✓ ${result.filledCount} Fields Filled`;
          setTimeout(() => {
            autofillRow.classList.remove('cv-row-success');
            autofillRow.querySelector('.cv-row-title')!.textContent = 'Autofill Application';
          }, 5000);
        }

        // Show a toast summary
        const parts = [`✅ ${result.filledCount} fields filled`];
        if (result.resumeUpload) {
          if (result.resumeUpload.status === 'success') {
            parts.push(`📄 Resume uploaded!`);
          } else if (result.resumeUpload.status === 'failed') {
            parts.push(`❌ Resume upload failed`);
          }
        }
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

  if (!isCareerVividSite || careerVividAuthSyncStarted) return;
  careerVividAuthSyncStarted = true;

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
      if (import.meta.env.DEV) {
        console.debug('[CareerVivid Extension] Error reading Firebase IndexedDB auth:', e);
      }
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

  // Handle resume selection changes originating from the main web application
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'CAREER_VIVID_WEB_RESUME_CHANGED') {
      const resumeId = event.data.resumeId;
      if (resumeId) {
        readCareerVividIndexedDbAuth().then((authPayload) => {
          const resolvedUserId = authPayload?.uid;
          if (resolvedUserId) {
            sendRuntimeMessage({
              type: 'SYNC_PROFILE',
              userId: resolvedUserId,
              resumeId
            });
          }
        });
      }
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
let lastInjectTime = 0;

function throttledInject(): void {
  if (rafPending) return;
  rafPending = true;

  requestAnimationFrame(() => {
    try {
      const now = Date.now();
      // Minimum 200ms cooldown between injection passes to prevent layout thrashing and loops
      if (now - lastInjectTime > 200) {
        lastInjectTime = now;
        injectSaveButton();
        // Temporarily disabled now that the toolbar icon opens the native side panel.
        // injectFAB();
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.debug('[CareerVivid] Injection error during render pass:', e);
      }
    } finally {
      rafPending = false;
    }
  });
}

function startInjectionWindow(): void {
  stopInjectionWindow();
  throttledInject();

  injectionObserver = new MutationObserver((mutations) => {
    // Avoid infinite feedback loops by ignoring mutations on elements we injected ourselves
    const hasExternalChanges = mutations.some(m => {
      const target = m.target as HTMLElement;
      if (
        !target ||
        target.id === 'cv-floating-root' || target.closest('#cv-floating-root') ||
        target.id === 'cv-sidebar-panel' || target.closest('#cv-sidebar-panel') ||
        target.classList.contains('cv-btn') || target.classList.contains('cv-toast') ||
        target.id === 'cv-toast'
      ) {
        return false;
      }
      return m.addedNodes.length > 0 || m.removedNodes.length > 0;
    });

    if (hasExternalChanges) {
      throttledInject();
    }
  });

  try {
    injectionObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  } catch (e) {
    if (import.meta.env.DEV) {
      console.debug('[CareerVivid] Failed to start MutationObserver:', e);
    }
  }

  injectionTimeout = window.setTimeout(() => {
    stopInjectionWindow();
    if (import.meta.env.DEV) {
      console.debug('[CareerVivid] DOM scanning window ended (5-second timeout reached).');
    }
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
      if (import.meta.env.DEV) {
        console.debug('[CareerVivid] SPA URL transition detected. Re-triggering injection safety window.');
      }
      startInjectionWindow();
      scheduleJobContextBroadcast(500);
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

function setupJobContextBroadcasting(): void {
  scheduleJobContextBroadcast(800);

  if (jobContextObserver) return;

  jobContextObserver = new MutationObserver((mutations) => {
    const hasExternalChanges = mutations.some(mutation => {
      const target = mutation.target;
      if (!(target instanceof HTMLElement)) return mutation.type === 'characterData';
      if (
        target.id === 'cv-floating-root' || target.closest('#cv-floating-root') ||
        target.id === 'cv-sidebar-panel' || target.closest('#cv-sidebar-panel') ||
        target.id === 'cv-toast' || target.closest('#cv-toast')
      ) {
        return false;
      }
      return mutation.addedNodes.length > 0 ||
        mutation.removedNodes.length > 0 ||
        mutation.type === 'characterData';
    });

    if (hasExternalChanges) {
      scheduleJobContextBroadcast();
    }
  });

  try {
    jobContextObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  } catch (e) {
    if (import.meta.env.DEV) {
      console.debug('[CareerVivid] Job context observer skipped:', e);
    }
  }
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
    if (import.meta.env.DEV) {
      console.debug('[CareerVivid] prefetch skipped:', e);
    }
  }
}

/**
 * Asynchronous, error-safe entry point for the content script.
 */
async function safeInit(): Promise<void> {
  try {
    if (!claimContentScriptBoot()) return;

    if (isCareerVividWebApp()) {
      startCareerVividAuthSync();
      return;
    }

    injectStyles();

    checkAuthStatus(async () => {
      try {
        startInjectionWindow();
        setupSpaNavigationListener();
        setupJobContextBroadcasting();

        const context = getATSContext();
        if (context.isApplicationPage) {
          setTimeout(() => {
            silentPrefetch().catch(e => {
              if (import.meta.env.DEV) {
                console.debug('[CareerVivid] Safe prefetch skipped:', e);
              }
            });
          }, 1500);
        }
      } catch (innerError) {
        if (import.meta.env.DEV) {
          console.debug('[CareerVivid] Safe initialization callback failed:', innerError);
        }
      }
    });

  } catch (outerError) {
    if (import.meta.env.DEV) {
      console.debug('[CareerVivid] Unhandled content script boot error:', outerError);
    }
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  safeInit();
} else {
  window.addEventListener('DOMContentLoaded', () => {
    safeInit();
  });
}
