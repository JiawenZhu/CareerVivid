// FIX: Added a global declaration for the `chrome` object to resolve type errors
// when the build environment doesn't correctly load the chrome types.
declare const chrome: any;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Career Co-Pilot extension installed.');
});

// Listener for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);

  if (request.action === 'getJobDetails') {
    // This is where you would process the scraped job details
    // For example, save them to storage or send them to your API
    console.log('Job Details:', request.data);

    // Send a response back to the content script
    sendResponse({ status: 'success', message: 'Job details received.' });
  }

  // Return true to indicate you wish to send a response asynchronously
  return true;
});