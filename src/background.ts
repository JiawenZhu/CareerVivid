/// <reference types="chrome" />
// CareerVivid Chrome Extension - Background Service Worker
// Handles messaging between popup, content scripts, and storage.
// Also responsible for syncing user profile data from Firebase to chrome.storage.local.

import type { AutoFillProfile } from './types/autofill.types';

// ── Installation Handler ──────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('CareerVivid Extension installed');
        chrome.tabs.create({ url: 'https://careervivid.app/extension-welcome' });
    }

    chrome.contextMenus.create({
        id: 'saveJob',
        title: 'Save Job to CareerVivid',
        contexts: ['page'],
        documentUrlPatterns: [
            'https://www.linkedin.com/jobs/*',
            'https://www.indeed.com/*',
            'https://boards.greenhouse.io/*',
            'https://jobs.lever.co/*',
        ]
    });
});

// ── Auth: Detect Firebase session via cookies ─────────────────────────────────

function checkAuthToken(): void {
    const checkCookie = (name: string) =>
        chrome.cookies.get({ url: 'https://careervivid.app', name }, (cookie) => {
            if (cookie) chrome.storage.local.set({ isAuthenticated: true });
        });

    chrome.cookies.get({ url: 'https://careervivid.app', name: 'session' }, (cookie) => {
        const isAuthenticated = !!cookie;
        chrome.storage.local.set({ isAuthenticated }, () => {
            chrome.runtime.sendMessage({ type: 'AUTH_STATE_CHANGED', isAuthenticated }).catch(() => { });
        });
    });
    checkCookie('__session');
}

chrome.cookies.onChanged.addListener((changeInfo) => {
    if (changeInfo.cookie.domain.includes('careervivid.app')) {
        checkAuthToken();
    }
});

checkAuthToken();

// ── Profile Sync: Firebase → chrome.storage.local ────────────────────────────
//
// This is the key architectural piece for auto-apply. When the user logs in or
// explicitly selects a resume, we sync their resume data into local extension
// storage so that the content script can access it instantly without an async
// Firebase call on every application page.

async function syncProfileFromFirebase(userId: string, resumeId: string): Promise<void> {
    try {
        // Dynamically import Firebase to keep the service worker lean
        const { initializeApp, getApps } = await import('firebase/app');
        const { getFirestore, doc, getDoc } = await import('firebase/firestore');
        const { getAuth } = await import('firebase/auth');

        const firebaseConfig = {
            apiKey: "AIzaSyCRMb5eCJJKEOWcIVfkxJh780B_9oFLHEs",
            authDomain: "jastalk-firebase.firebaseapp.com",
            projectId: "jastalk-firebase",
            storageBucket: "jastalk-firebase.firebasestorage.app",
            messagingSenderId: "882267873237",
            appId: "1:882267873237:web:65ba38c60e0ec617c7a3b0"
        };

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const db = getFirestore(app);

        // Fetch the resume document
        const resumeRef = doc(db, 'users', userId, 'resumes', resumeId);
        const resumeSnap = await getDoc(resumeRef);

        if (!resumeSnap.exists()) {
            console.warn('[CareerVivid] Resume not found:', resumeId);
            return;
        }

        const resumeData = resumeSnap.data();

        // Also fetch the user profile for contact info
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};

        // Normalize into AutoFillProfile shape
        const profile: AutoFillProfile = normalizeResumeToProfile(resumeData, userData, resumeId);

        // Cache locally for content script access
        await chrome.storage.local.set({
            autofillProfile: profile,
            selectedResumeId: resumeId,
        });

        console.log('[CareerVivid] Profile synced:', profile.firstName, profile.lastName);
    } catch (err) {
        console.error('[CareerVivid] Profile sync failed:', err);
    }
}

/**
 * Normalize raw Firestore resume + user data into a flat AutoFillProfile.
 * Adapts to CareerVivid's resume data structure.
 */
function normalizeResumeToProfile(
    resumeData: Record<string, any>,
    userData: Record<string, any>,
    resumeId: string
): AutoFillProfile {
    const contact = resumeData.contact || resumeData.personalInfo || {};
    const experiences = resumeData.experience || resumeData.workExperience || [];
    const educationList = resumeData.education || [];
    const skillsSection = resumeData.skills || [];

    // Skills can be a flat array of strings or array of {name} objects
    const skills: string[] = skillsSection.map((s: any) =>
        typeof s === 'string' ? s : s.name || s.skill || ''
    ).filter(Boolean);

    // Name: try resume contact first, then user profile
    const displayName: string = userData.displayName || '';
    const nameParts = displayName.split(' ');
    const firstName: string = contact.firstName || contact.first_name || nameParts[0] || '';
    const lastName: string = contact.lastName || contact.last_name || nameParts.slice(1).join(' ') || '';

    return {
        firstName,
        lastName,
        email: contact.email || userData.email || '',
        phone: contact.phone || contact.phoneNumber || '',
        linkedinUrl: contact.linkedin || contact.linkedinUrl || userData.linkedinUrl || '',
        githubUrl: contact.github || contact.githubUrl || userData.githubUrl || '',
        portfolioUrl: contact.portfolio || contact.website || userData.portfolioUrl || '',
        city: contact.city || '',
        state: contact.state || '',
        country: contact.country || 'United States',
        summary: resumeData.summary || resumeData.professionalSummary || '',
        workExperience: experiences.map((exp: any) => ({
            title: exp.title || exp.position || '',
            company: exp.company || exp.employer || '',
            startDate: exp.startDate || exp.start || '',
            endDate: exp.endDate || exp.end || exp.current ? 'Present' : '',
            description: exp.description || exp.summary || '',
            location: exp.location || '',
        })),
        education: educationList.map((edu: any) => ({
            degree: edu.degree || edu.degreeType || '',
            fieldOfStudy: edu.fieldOfStudy || edu.major || '',
            school: edu.school || edu.institution || edu.university || '',
            graduationDate: edu.graduationDate || edu.endDate || '',
            gpa: edu.gpa || '',
        })),
        skills,
        sourceResumeId: resumeId,
        lastSyncedAt: new Date().toISOString(),
    };
}

// ── Message Router ────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {

        // Popup requests the cached profile + resume list
        case 'GET_RESUME_DATA':
            chrome.storage.local.get(['autofillProfile', 'selectedResumeId', 'isAuthenticated'], (result) => {
                sendResponse(result);
            });
            return true;

        // User selected a resume in the popup → sync it from Firebase
        case 'SYNC_PROFILE':
            syncProfileFromFirebase(message.userId, message.resumeId).then(() => {
                sendResponse({ success: true });
            }).catch((err) => {
                sendResponse({ success: false, error: err.message });
            });
            return true;

        // Popup triggers auto-fill on the current tab
        case 'AUTOFILL_APPLICATION':
            chrome.storage.local.get(['autofillProfile'], async (result) => {
                const profile = result.autofillProfile;
                if (!profile) {
                    sendResponse({ success: false, error: 'No profile synced. Please select a resume first.' });
                    return;
                }
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]?.id) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            type: 'FILL_FORM',
                            profile,
                        });
                        sendResponse({ success: true });
                    } else {
                        sendResponse({ success: false, error: 'No active tab found.' });
                    }
                });
            });
            return true;

        // Open popup for resume selection
        case 'OPEN_RESUME_PICKER':
            chrome.action.openPopup();
            sendResponse({ success: true });
            return true;

        // Save a job to local tracker + Firebase (if logged in)
        case 'SAVE_JOB':
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

// ── Context Menu ──────────────────────────────────────────────────────────────

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
