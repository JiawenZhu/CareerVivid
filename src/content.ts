// CareerVivid Chrome Extension - Content Script
// Injects UI into LinkedIn and Indeed job pages

// Detect which site we're on
const isLinkedIn = window.location.hostname.includes('linkedin.com');
const isIndeed = window.location.hostname.includes('indeed.com');

// CareerVivid button styles
const BUTTON_STYLE = `
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #1f2937 0%, #000000 100%);
  color: white;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 9999;
`;

const BUTTON_HOVER_STYLE = `
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #374151 0%, #111827 100%);
`;

// Create CareerVivid button
function createCVButton(text: string, icon: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'careervivid-btn';
    btn.innerHTML = `
    ${icon}
    <span>${text}</span>
  `;
    btn.style.cssText = BUTTON_STYLE;

    btn.addEventListener('mouseenter', () => {
        btn.style.cssText = BUTTON_STYLE + BUTTON_HOVER_STYLE;
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.cssText = BUTTON_STYLE;
    });
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
    });

    return btn;
}

// Extract job data from the page
function extractJobData(): { title: string; company: string; location: string; description: string; url: string } | null {
    try {
        if (isLinkedIn) {
            // LinkedIn Selectors (Unified & Classic)
            const title = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim() ||
                document.querySelector('.jobs-unified-top-card__job-title')?.textContent?.trim();

            const company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() ||
                document.querySelector('.jobs-unified-top-card__company-name')?.textContent?.trim();

            const location = document.querySelector('.job-details-jobs-unified-top-card__primary-description-container')?.textContent?.trim() ||
                document.querySelector('.jobs-unified-top-card__primary-description-container')?.textContent?.trim();

            // Description is often in a specific container, sometimes 'Show more' is needed but we grab current text
            const description = document.querySelector('#job-details')?.textContent?.trim() || '';

            if (title && company) {
                return { title, company, location: location || '', description, url: window.location.href };
            }
        } else if (isIndeed) {
            const title = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim();
            const company = document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim();
            const location = document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.textContent?.trim();
            const description = document.querySelector('#jobDescriptionText')?.textContent?.trim() || '';

            if (title && company) {
                return { title, company, location: location || '', description, url: window.location.href };
            }
        }
    } catch (e) {
        console.error('CareerVivid Extraction Error:', e);
    }
    return null;
}

// Inject CareerVivid buttons into the page
function injectButtons(): void {
    if (document.querySelector('.careervivid-btn')) return;

    const saveIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;

    // Actions
    const handleSave = (btn: HTMLButtonElement) => {
        btn.textContent = 'Saving...';
        const job = extractJobData();
        if (job) {
            chrome.runtime.sendMessage({ type: 'SAVE_JOB', job }, (res) => {
                if (res?.success) {
                    btn.innerHTML = `✓ Saved`;
                    btn.style.background = '#10B981'; // Green
                    btn.style.borderColor = '#059669';
                } else {
                    btn.textContent = 'Error';
                    setTimeout(() => btn.innerHTML = `${saveIcon} Save Job`, 2000);
                }
            });
        } else {
            btn.textContent = 'No Data';
        }
    };

    if (isLinkedIn) {
        // LinkedIn: Find the apply button container
        const applySection = document.querySelector('.jobs-apply-button--top-card') || document.querySelector('.jobs-unified-top-card__action-container');
        if (applySection) {
            const saveBtn = createCVButton('Save Job', saveIcon, () => handleSave(saveBtn));
            applySection.appendChild(saveBtn);
        }
    } else if (isIndeed) {
        // Indeed: Find the apply button
        const applyBtn = document.querySelector('[data-testid="indeedApply-button"]') || document.querySelector('#indeedApplyButton');
        if (applyBtn?.parentElement) {
            const container = document.createElement('div');
            container.style.cssText = 'display: flex; gap: 8px; margin-top: 12px;';
            const saveBtn = createCVButton('Save Job', saveIcon, () => handleSave(saveBtn));
            container.appendChild(saveBtn);
            applyBtn.parentElement.insertAdjacentElement('afterend', container);
        }
    }
}

// Listen for messages from background/popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'EXTRACT_JOB_DATA':
            const job = extractJobData();
            sendResponse({ job });
            break;
    }
    return true;
});

// Bridge: Check if this tab was opened for Tailoring
// Logic: If query param ?source=extension_tailor exists, we try to pull the JD from storage
if (window.location.href.includes('careervivid.app/newresume') && window.location.href.includes('source=extension_tailor')) {
    chrome.storage.local.get(['pending_tailor_jd'], (result) => {
        if (result.pending_tailor_jd) {
            // Wait for React to mount then inject
            // Since we can't easily access React state from outside, we'll try to populate localStorage 
            // used by the web app or just alert the user to paste. 
            // Better approach: The web app should read from a shared location, but standard localStorage is sandboxed.
            // Best hack for now: Copy to clipboard? Or just use URL params if length allows.
            // Re-visiting: URL param is safest for "Low Effort".
        }
    });
}

// Initialize: inject buttons and observe for SPA navigation
function init(): void {
    injectButtons();
    const observer = new MutationObserver(() => injectButtons());
    observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'complete') init();
else window.addEventListener('load', init);
