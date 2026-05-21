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

        // Popup triggers auto-fill on the current tab (structured fields only — fast path)
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

        // ── NEW: AI-powered answer generation for open-ended questions ─────────────
        // Flow: content script extracts questions → popup calls this → Cloud Function → answers
        case 'GENERATE_AI_ANSWERS': {
            const { questions, companyName, jobTitle, jobDescription, jobId } = message;

            chrome.storage.local.get(['firebaseIdToken'], async (stored: any) => {
                const idToken: string | undefined = stored.firebaseIdToken;

                if (!idToken) {
                    sendResponse({ success: false, error: 'Not authenticated. Please log in to CareerVivid.' });
                    return;
                }

                try {
                    // Call the Cloud Function (us-west1 region)
                    const endpoint = 'https://us-west1-jastalk-firebase.cloudfunctions.net/generateApplyAnswers';

                    const resp = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`,
                        },
                        body: JSON.stringify({
                            data: { questions, companyName, jobTitle, jobDescription, jobId }
                        }),
                    });

                    if (!resp.ok) {
                        const errText = await resp.text();
                        sendResponse({ success: false, error: `Cloud Function error: ${resp.status} ${errText}` });
                        return;
                    }

                    const json = await resp.json() as any;
                    const result = json.result || json;

                    sendResponse({ success: true, answers: result.answers, aiCount: result.aiCount });
                } catch (err: any) {
                    console.error('[CareerVivid] GENERATE_AI_ANSWERS failed:', err);
                    sendResponse({ success: false, error: err.message || 'Network error' });
                }
            });
            return true;
        }

        // ── Phase 2: Silent Prefetch — cache AI answers before popup opens ───────────
        // Triggered by content script ~1.5s after landing on an application page.
        // Stores result in chrome.storage.local keyed by URL (TTL: 30 minutes).
        // When popup opens, answers are served instantly from cache.
        case 'PREFETCH_AI_ANSWERS': {
            const { pageUrl, questions, companyName, jobTitle, jobDescription } = message;

            // Check if we already have a fresh cache for this URL
            const cacheKey = `prefetch_${btoa(pageUrl).slice(0, 40)}`;
            chrome.storage.local.get([cacheKey, 'firebaseIdToken'], async (stored: any) => {
                const cached = stored[cacheKey];
                const now = Date.now();
                const TTL = 30 * 60 * 1000; // 30 minutes

                // Serve from cache if still fresh
                if (cached && (now - cached.cachedAt) < TTL) {
                    console.debug('[CareerVivid] Prefetch hit:', pageUrl);
                    return;
                }

                const idToken: string | undefined = stored.firebaseIdToken;
                if (!idToken || !questions?.length) return;

                try {
                    // Call generateApplyAnswers via onCall endpoint
                    const endpoint = 'https://us-west1-jastalk-firebase.cloudfunctions.net/generateApplyAnswers';
                    const resp = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`,
                        },
                        body: JSON.stringify({
                            data: { questions, companyName, jobTitle, jobDescription },
                        }),
                    });

                    if (!resp.ok) return;

                    const json = await resp.json() as any;
                    const result = json.result || json;

                    if (result?.answers?.length) {
                        // Cache answers + job context by URL key
                        chrome.storage.local.set({
                            [cacheKey]: {
                                answers: result.answers,
                                aiCount: result.aiCount || 0,
                                companyName,
                                jobTitle,
                                pageUrl,
                                cachedAt: now,
                            },
                            // Also store the latest prefetch key so popup can look it up
                            latestPrefetchKey: cacheKey,
                        });
                        console.debug('[CareerVivid] Prefetch cached:', jobTitle, 'at', companyName);
                    }
                } catch (err) {
                    // Fire-and-forget — never throw to content script
                    console.debug('[CareerVivid] Prefetch failed silently:', err);
                }
            });

            // Always respond immediately so the content script message channel closes
            sendResponse({ success: true });
            return true;
        }

        // ── Phase 2: Auto-log to tracker when fill completes ─────────────────────
        // Content script sends FILL_COMPLETE after running autofill.
        // Background relays it to the popup AND auto-logs a "To Apply" entry
        // in the tracker so the user has a record without any manual action.
        case 'AUTO_LOG_APPLICATION': {
            const { job: autoJob, filledCount } = message;
            if (!autoJob?.title) { sendResponse({ success: false }); return true; }

            chrome.storage.local.get(['trackedJobs', 'firebaseIdToken'], async (stored: any) => {
                const jobs: any[] = stored.trackedJobs || [];
                const idToken: string | undefined = stored.firebaseIdToken;

                // Deduplicate by URL — don’t log the same application twice
                const alreadyLogged = jobs.some(
                    (j: any) => j.url === autoJob.url || (j.title === autoJob.title && j.company === autoJob.company)
                );

                if (!alreadyLogged) {
                    const entry = {
                        ...autoJob,
                        status: 'To Apply',
                        filledCount,
                        savedAt: new Date().toISOString(),
                        autoLogged: true,
                    };
                    jobs.unshift(entry); // newest first
                    chrome.storage.local.set({ trackedJobs: jobs });

                    // Best-effort: also persist to Firebase if authenticated
                    if (idToken) {
                        fetch('https://us-west1-jastalk-firebase.cloudfunctions.net/cliJobsHunt', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${idToken}`,
                            },
                            body: JSON.stringify({ job: entry }),
                        }).catch(() => { /* best-effort */ });
                    }
                }

                sendResponse({ success: true, alreadyLogged });
            });
            return true;
        }

        // ── NEW: Store Firebase ID token (called from popup after login) ──────────
        case 'STORE_AUTH_TOKEN':
            chrome.storage.local.set({ firebaseIdToken: message.idToken }, () => {
                sendResponse({ success: true });
            });
            return true;

        // ── NEW: Mark a job as Applied and get confirmation ────────────────────────
        case 'MARK_JOB_APPLIED': {
            const { jobId: appliedJobId } = message;
            chrome.storage.local.get(['firebaseIdToken'], async (stored: any) => {
                const idToken: string | undefined = stored.firebaseIdToken;
                if (!idToken || !appliedJobId) {
                    sendResponse({ success: false });
                    return;
                }
                try {
                    const endpoint = 'https://us-west1-jastalk-firebase.cloudfunctions.net/cliJobsUpdate';
                    await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`,
                        },
                        body: JSON.stringify({ jobId: appliedJobId, status: 'Applied' }),
                    });
                    sendResponse({ success: true });
                } catch (_) {
                    sendResponse({ success: false });
                }
            });
            return true;
        }

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
