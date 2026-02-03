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
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
`;

const BUTTON_HOVER_STYLE = `
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
`;

// Create CareerVivid button
function createCVButton(text: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'careervivid-btn';
    btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
    </svg>
    ${text}
  `;
    btn.style.cssText = BUTTON_STYLE;

    btn.addEventListener('mouseenter', () => {
        btn.style.cssText = BUTTON_STYLE + BUTTON_HOVER_STYLE;
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.cssText = BUTTON_STYLE;
    });
    btn.addEventListener('click', onClick);

    return btn;
}

// Extract job data from the page
function extractJobData(): { title: string; company: string; location: string; url: string } | null {
    if (isLinkedIn) {
        const title = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim();
        const company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim();
        const location = document.querySelector('.job-details-jobs-unified-top-card__primary-description-container')?.textContent?.trim();

        if (title && company) {
            return { title, company, location: location || '', url: window.location.href };
        }
    } else if (isIndeed) {
        const title = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim();
        const company = document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim();
        const location = document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.textContent?.trim();

        if (title && company) {
            return { title, company, location: location || '', url: window.location.href };
        }
    }
    return null;
}

// Inject CareerVivid buttons into the page
function injectButtons(): void {
    // Skip if already injected
    if (document.querySelector('.careervivid-btn')) return;

    if (isLinkedIn) {
        // LinkedIn: Find the apply button container
        const applySection = document.querySelector('.jobs-apply-button--top-card');
        if (applySection) {
            const fillBtn = createCVButton('Fill with CareerVivid', () => {
                chrome.runtime.sendMessage({ type: 'OPEN_RESUME_PICKER' });
            });
            const saveBtn = createCVButton('Save Job', () => {
                const job = extractJobData();
                if (job) {
                    chrome.runtime.sendMessage({ type: 'SAVE_JOB', job });
                    saveBtn.textContent = '✓ Saved!';
                    saveBtn.style.background = '#22C55E';
                }
            });
            applySection.appendChild(fillBtn);
            applySection.appendChild(saveBtn);
        }
    } else if (isIndeed) {
        // Indeed: Find the apply button
        const applyBtn = document.querySelector('[data-testid="indeedApply-button"]');
        if (applyBtn?.parentElement) {
            const container = document.createElement('div');
            container.style.cssText = 'display: flex; gap: 8px; margin-top: 12px;';

            const fillBtn = createCVButton('Fill with CareerVivid', () => {
                chrome.runtime.sendMessage({ type: 'OPEN_RESUME_PICKER' });
            });
            const saveBtn = createCVButton('Save Job', () => {
                const job = extractJobData();
                if (job) {
                    chrome.runtime.sendMessage({ type: 'SAVE_JOB', job });
                    saveBtn.textContent = '✓ Saved!';
                    saveBtn.style.background = '#22C55E';
                }
            });

            container.appendChild(fillBtn);
            container.appendChild(saveBtn);
            applyBtn.parentElement.insertAdjacentElement('afterend', container);
        }
    }
}

// Handle form filling
function fillForm(resumeData: any): void {
    // Common form field selectors
    const fieldMappings: Record<string, string[]> = {
        firstName: ['[name*="first"]', '[id*="first"]', '[placeholder*="First"]'],
        lastName: ['[name*="last"]', '[id*="last"]', '[placeholder*="Last"]'],
        email: ['[type="email"]', '[name*="email"]', '[id*="email"]'],
        phone: ['[type="tel"]', '[name*="phone"]', '[id*="phone"]'],
        city: ['[name*="city"]', '[id*="city"]'],
        summary: ['[name*="summary"]', '[name*="about"]', 'textarea']
    };

    Object.entries(fieldMappings).forEach(([field, selectors]) => {
        const value = resumeData.personalDetails?.[field];
        if (value) {
            for (const selector of selectors) {
                const input = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
                if (input && !input.value) {
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    break;
                }
            }
        }
    });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'FILL_FORM':
            fillForm(message.data);
            sendResponse({ success: true });
            break;
        case 'EXTRACT_JOB_DATA':
            const job = extractJobData();
            sendResponse({ job });
            break;
    }
    return true;
});

// Initialize: inject buttons and observe for SPA navigation
function init(): void {
    injectButtons();

    // Re-inject on SPA navigation (LinkedIn/Indeed are SPAs)
    const observer = new MutationObserver(() => {
        injectButtons();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Run when DOM is ready
if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', init);
}
