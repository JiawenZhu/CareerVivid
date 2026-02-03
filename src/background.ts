// CareerVivid Chrome Extension - Background Service Worker
// Handles messaging between popup, content scripts, and storage

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('CareerVivid Extension installed');
        // Open onboarding page on first install
        chrome.tabs.create({ url: 'https://careervivid.app/extension-welcome' });
    }
});

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
            chrome.storage.local.get(['trackedJobs'], (result) => {
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

// Context menu for right-click actions
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'saveJob',
        title: 'Save Job to CareerVivid',
        contexts: ['page'],
        documentUrlPatterns: ['https://www.linkedin.com/jobs/*', 'https://www.indeed.com/*']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'saveJob' && tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JOB_DATA' }, (response) => {
            if (response?.job) {
                chrome.storage.local.get(['trackedJobs'], (result) => {
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
