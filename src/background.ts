/// <reference types="chrome" />
// CareerVivid Chrome Extension - Background Service Worker
// Handles messaging between popup, content scripts, and storage

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('CareerVivid Extension installed');
        // Open onboarding page on first install
        chrome.tabs.create({ url: 'https://careervivid.app/extension-welcome' });
    }

    // Create context menu on install/update
    chrome.contextMenus.create({
        id: 'saveJob',
        title: 'Save Job to CareerVivid',
        contexts: ['page'],
        documentUrlPatterns: ['https://www.linkedin.com/jobs/*', 'https://www.indeed.com/*']
    });
});

// Check auth status on startup and when cookies change
const CHECK_AUTH_COOKIE = 'session'; // Default Firebase session cookie or custom one.
// If using client-side Firebase Auth, the token is in IndexedDB, but often a session cookie is used for SSR.
// Alternatively, we look for *any* change in cookies for our domain and broadcast.

function checkAuthToken() {
    chrome.cookies.get({ url: 'https://careervivid.app', name: 'session' }, (cookie) => {
        const isAuthenticated = !!cookie;
        chrome.storage.local.set({ isAuthenticated }, () => {
            // Broadcast to popup if open
            chrome.runtime.sendMessage({ type: 'AUTH_STATE_CHANGED', isAuthenticated }).catch(() => { });
        });
    });
    // Fallback: Check for __session which is common in Firebase Hosting
    chrome.cookies.get({ url: 'https://careervivid.app', name: '__session' }, (cookie) => {
        if (cookie) {
            chrome.storage.local.set({ isAuthenticated: true });
        }
    });
}

// Listen for cookie changes
chrome.cookies.onChanged.addListener((changeInfo) => {
    if (changeInfo.cookie.domain.includes('careervivid.app')) {
        checkAuthToken();
    }
});

// Check on startup
checkAuthToken();

// Message handler for communication between components
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'GET_RESUME_DATA':
            chrome.storage.local.get(['resumes', 'selectedResumeId'], (result) => {
                sendResponse(result);
            });
            return true; // Keep channel open for async response

        case 'OPEN_RESUME_PICKER':
            // Open popup with resume picker
            chrome.action.openPopup();
            sendResponse({ success: true });
            return true;

        case 'AUTOFILL_APPLICATION':
            // Forward autofill data to content script
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'FILL_FORM',
                        data: message.data
                    });
                }
            });
            sendResponse({ success: true });
            return true;

        case 'SAVE_JOB':
            // Save job to tracked applications
            chrome.storage.local.get(['trackedJobs'], (result: any) => {
                const jobs = result.trackedJobs || [];
                jobs.push({
                    ...message.job,
                    savedAt: new Date().toISOString(),
                    status: 'saved'
                });
                chrome.storage.local.set({ trackedJobs: jobs }, () => {
                    sendResponse({ success: true, jobCount: jobs.length });
                });
            });
            return true;

        default:
            sendResponse({ error: 'Unknown message type' });
            return false;
    }
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'saveJob' && tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JOB_DATA' }, (response) => {
            if (response?.job) {
                chrome.storage.local.get(['trackedJobs'], (result: any) => {
                    const jobs = result.trackedJobs || [];
                    jobs.push({
                        ...response.job,
                        savedAt: new Date().toISOString(),
                        status: 'saved'
                    });
                    chrome.storage.local.set({ trackedJobs: jobs });
                });
            }
        });
    }
});
