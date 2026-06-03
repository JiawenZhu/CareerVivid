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

function openNativeSidePanel(tabId?: number): Promise<void> {
    const sidePanel = (chrome as any).sidePanel;

    if (!sidePanel?.open || !tabId) {
        return Promise.reject(new Error('Side panel API unavailable'));
    }

    return sidePanel.open({ tabId });
}

if ((chrome as any).sidePanel?.setPanelBehavior) {
    (chrome as any).sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error: unknown) => {
        console.debug('[CareerVivid] Side panel behavior setup skipped:', error);
    });
}

chrome.action.onClicked.addListener((tab) => {
    openNativeSidePanel(tab.id).catch((error: unknown) => {
        console.debug('[CareerVivid] Toolbar side panel open failed:', error);
    });
});

// ── Auth: Detect Firebase session via cookies ─────────────────────────────────

const AUTH_DOMAINS = [
    'https://careervivid.app',
    'https://www.careervivid.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173'
] as const;

const AUTH_REFRESH_ALARM = 'careervivid-refresh-auth-token';

type ExtensionAuthPayload = {
    token: string;
    uid: string;
    refreshToken?: string | null;
    expirationTime?: number | null;
    apiKey?: string | null;
    email?: string | null;
    photoURL?: string | null;
    source?: string | null;
};

const CAREERVIVID_TAB_HOSTS = new Set([
    'careervivid.app',
    'www.careervivid.app',
    'localhost',
    '127.0.0.1'
]);

function parseJwt(token: string): any {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function scheduleTokenRefreshAlarm(expirationTime?: number | null): void {
    if (!chrome.alarms) return;

    if (!expirationTime) {
        chrome.alarms.clear(AUTH_REFRESH_ALARM);
        return;
    }

    const refreshAt = Math.max(Date.now() + 60 * 1000, expirationTime - 10 * 60 * 1000);
    chrome.alarms.create(AUTH_REFRESH_ALARM, { when: refreshAt });
}

// ── NEW: Firebase Auto-Refresh & Token Validation Pipeline ───────────────────

async function refreshFirebaseToken(refreshToken: string, apiKey: string): Promise<{ idToken: string; refreshToken: string; expirationTime: number } | null> {
    try {
        const endpoint = `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('[CareerVivid] Token refresh failed:', response.status, errText);
            return null;
        }

        const data = await response.json();
        const idToken = data.access_token;
        const newRefreshToken = data.refresh_token || refreshToken;
        const expiresIn = parseInt(data.expires_in, 10) || 3600;
        const expirationTime = Date.now() + expiresIn * 1000;

        return { idToken, refreshToken: newRefreshToken, expirationTime };
    } catch (e) {
        console.error('[CareerVivid] Error during token refresh fetch:', e);
        return null;
    }
}

function ensureFreshToken(callback: (token: string | null) => void): void {
    chrome.storage.local.get([
        'firebaseIdToken',
        'authToken',
        'firebaseRefreshToken',
        'tokenExpirationTime',
        'firebaseApiKey',
        'isAuthenticated'
    ], (result) => {
        const idToken = result.firebaseIdToken || result.authToken;
        const refreshToken = result.firebaseRefreshToken;
        const expirationTime = result.tokenExpirationTime;
        const apiKey = result.firebaseApiKey;

        if (!result.isAuthenticated || !idToken) {
            callback(null);
            return;
        }

        // Mock tokens are old dev-bypass state. Clear them so the extension
        // cannot behave as logged in without a real CareerVivid session.
        if (idToken === 'mock-dev-id-token') {
            chrome.storage.local.set({
                devModeAuth: false,
                isAuthenticated: false,
                firebaseIdToken: null,
                firebaseRefreshToken: null,
                tokenExpirationTime: null,
                firebaseApiKey: null,
                uid: null,
                selectedResumeId: null,
                autofillProfile: null,
            }, () => callback(null));
            return;
        }

        const now = Date.now();
        const buffer = 5 * 60 * 1000; // 5 minute buffer

        // If not expired, return current token
        if (expirationTime && (now + buffer) < expirationTime) {
            callback(idToken);
            return;
        }

        // If expired but we have a refresh token and API key, refresh it!
        if (refreshToken && apiKey) {
            console.log('[CareerVivid] ID token expired or expiring soon, attempting auto-refresh...');
            refreshFirebaseToken(refreshToken, apiKey).then((newData) => {
                if (newData) {
                    chrome.storage.local.set({
                        firebaseIdToken: newData.idToken,
                        authToken: newData.idToken,
                        firebaseRefreshToken: newData.refreshToken,
                        tokenExpirationTime: newData.expirationTime,
                        authSyncedAt: new Date().toISOString(),
                        authSyncSource: 'background_refresh'
                    }, () => {
                        scheduleTokenRefreshAlarm(newData.expirationTime);
                        console.log('[CareerVivid] Token auto-refreshed successfully');
                        callback(newData.idToken);
                    });
                } else {
                    console.warn('[CareerVivid] Auto-refresh failed, using existing token as fallback');
                    callback(idToken);
                }
            });
        } else {
            console.warn('[CareerVivid] Cannot refresh token: missing refreshToken or apiKey. Using existing token.');
            callback(idToken);
        }
    });
}

function getFreshTokenPromise(): Promise<string | null> {
    return new Promise((resolve) => {
        ensureFreshToken((token) => {
            resolve(token);
        });
    });
}

function parseFirestoreRestValue(val: any): any {
    if (!val) return null;
    const type = Object.keys(val)[0];
    const value = val[type];

    switch (type) {
        case 'stringValue':
            return value;
        case 'integerValue':
            return parseInt(value, 10);
        case 'doubleValue':
            return parseFloat(value);
        case 'booleanValue':
            return value;
        case 'nullValue':
            return null;
        case 'timestampValue':
            return value;
        case 'arrayValue':
            const values = value.values || [];
            return values.map(parseFirestoreRestValue);
        case 'mapValue':
            const fields = value.fields || {};
            const result: Record<string, any> = {};
            for (const key in fields) {
                result[key] = parseFirestoreRestValue(fields[key]);
            }
            return result;
        default:
            return value;
    }
}

function parseFirestoreRestDoc(doc: any): any {
    const fields = doc.fields || {};
    const result: Record<string, any> = {};
    for (const key in fields) {
        result[key] = parseFirestoreRestValue(fields[key]);
    }
    const parts = doc.name.split('/');
    result.id = parts[parts.length - 1];
    return result;
}

function broadcastAuthState(isAuthenticated: boolean): void {
    chrome.runtime.sendMessage({ type: 'AUTH_STATE_CHANGED', isAuthenticated }, () => {
        const err = chrome.runtime.lastError;
    });

    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            if (!tab.id) return;
            chrome.tabs.sendMessage(tab.id, { type: 'AUTH_STATE_CHANGED', isAuthenticated }, () => {
                const err = chrome.runtime.lastError;
            });
        });
    });
}

function broadcastResumeSelection(resumeId: string): void {
    chrome.runtime.sendMessage({ type: 'RESUME_CHANGED', resumeId }, () => {
        const err = chrome.runtime.lastError;
    });

    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            if (!tab.id) return;
            chrome.tabs.sendMessage(tab.id, { type: 'RESUME_CHANGED', resumeId }, () => {
                const err = chrome.runtime.lastError;
            });
        });
    });
}

let pendingAuthClearTimer: ReturnType<typeof setTimeout> | null = null;

function persistAuthToken(
    payload: {
        token: string;
        uid?: string | null;
        refreshToken?: string | null;
        expirationTime?: number | null;
        apiKey?: string | null;
        email?: string | null;
        source?: string | null;
    },
    callback?: () => void
): void {
    if (!payload.token || payload.token === 'mock-dev-id-token') {
        clearAuthToken(callback);
        return;
    }

    chrome.storage.local.get([
        'isAuthenticated',
        'firebaseIdToken',
        'authToken',
        'firebaseRefreshToken',
        'tokenExpirationTime',
        'firebaseApiKey',
        'uid',
        'userEmail',
        'photoURL'
    ], (current) => {
        if (pendingAuthClearTimer) {
            clearTimeout(pendingAuthClearTimer);
            pendingAuthClearTimer = null;
        }

        const tokenPayload = parseJwt(payload.token);
        const uid = payload.uid || tokenPayload?.user_id || tokenPayload?.sub || current.uid || null;
        if (!uid) {
            callback?.();
            return;
        }

        const next = {
            isAuthenticated: true,
            firebaseIdToken: payload.token,
            authToken: payload.token,
            firebaseRefreshToken: payload.refreshToken !== undefined ? payload.refreshToken : (current.firebaseRefreshToken || null),
            tokenExpirationTime: payload.expirationTime !== undefined ? payload.expirationTime : (current.tokenExpirationTime || null),
            firebaseApiKey: payload.apiKey !== undefined ? payload.apiKey : (current.firebaseApiKey || null),
            uid,
            userEmail: payload.email !== undefined ? payload.email : (current.userEmail || null),
            photoURL: (payload as any).photoURL !== undefined ? (payload as any).photoURL : (current.photoURL || null),
            authSyncSource: payload.source || 'unknown',
            authSyncedAt: new Date().toISOString(),
        };

        const changed = Object.entries(next).some(([key, value]) => current[key] !== value);

        if (!changed) {
            callback?.();
            return;
        }

        chrome.storage.local.set(next, () => {
            scheduleTokenRefreshAlarm(next.tokenExpirationTime);
            if (current.isAuthenticated !== true) {
                broadcastAuthState(true);
            }
            callback?.();
        });
    });
}

function persistAuthTokenPromise(payload: ExtensionAuthPayload): Promise<boolean> {
    return new Promise((resolve) => {
        persistAuthToken(payload, () => resolve(true));
    });
}

function scheduleAuthTokenClear(): void {
    if (pendingAuthClearTimer) {
        clearTimeout(pendingAuthClearTimer);
    }

    pendingAuthClearTimer = setTimeout(() => {
        pendingAuthClearTimer = null;
        findAuthCookie((cookie) => {
            if (!cookie) {
                clearAuthToken();
            }
        });
    }, 750);
}

function findAuthCookie(callback: (cookie: chrome.cookies.Cookie | null) => void): void {
    let checkedCount = 0;
    const cookieNames = ['session', '__session', 'token'];
    const totalChecks = AUTH_DOMAINS.length * cookieNames.length;
    let foundAuth = false;

    AUTH_DOMAINS.forEach((domain) => {
        cookieNames.forEach((name) => {
            chrome.cookies.get({ url: domain, name }, (cookie) => {
                checkedCount++;
                if (cookie && !foundAuth) {
                    foundAuth = true;
                    callback(cookie);
                    return;
                }

                if (checkedCount === totalChecks && !foundAuth) {
                    callback(null);
                }
            });
        });
    });
}

function clearAuthToken(callback?: () => void): void {
    if (pendingAuthClearTimer) {
        clearTimeout(pendingAuthClearTimer);
        pendingAuthClearTimer = null;
    }

    scheduleTokenRefreshAlarm(null);

    chrome.storage.local.get(['isAuthenticated'], (current) => {
        chrome.storage.local.set({
            devModeAuth: false,
            isAuthenticated: false,
            firebaseIdToken: null,
            authToken: null,
            firebaseRefreshToken: null,
            tokenExpirationTime: null,
            firebaseApiKey: null,
            uid: null,
            userEmail: null,
            photoURL: null,
            authSyncSource: null,
            authSyncedAt: null,
            selectedResumeId: null,
            autofillProfile: null,
        }, () => {
            if (current.isAuthenticated !== false) {
                broadcastAuthState(false);
            }
            callback?.();
        });
    });
}

async function getStoredAuthStatus(): Promise<{ isAuthenticated: boolean; uid: string | null; token: string | null }> {
    const stored = await chrome.storage.local.get([
        'devModeAuth',
        'isAuthenticated',
        'firebaseIdToken',
        'authToken',
        'uid',
        'tokenExpirationTime'
    ]);

    const token = stored.firebaseIdToken || stored.authToken || null;
    if (stored.devModeAuth || token === 'mock-dev-id-token') {
        await chrome.storage.local.remove([
            'devModeAuth',
            'autofillProfile',
            'selectedResumeId',
            'firebaseIdToken',
            'authToken',
            'firebaseRefreshToken',
            'tokenExpirationTime',
            'firebaseApiKey',
            'uid',
            'isAuthenticated',
        ]);
        return { isAuthenticated: false, uid: null, token: null };
    }

    const isAuthenticated = stored.isAuthenticated === true && !!token && !!stored.uid;
    if (isAuthenticated) {
        scheduleTokenRefreshAlarm(stored.tokenExpirationTime || null);
    }

    return {
        isAuthenticated,
        uid: stored.uid || null,
        token,
    };
}

function findAuthCookiePromise(): Promise<ExtensionAuthPayload | null> {
    return new Promise((resolve) => {
        findAuthCookie((cookie) => {
            if (!cookie?.value) {
                resolve(null);
                return;
            }

            const payload = parseJwt(cookie.value);
            const uid = payload?.user_id || payload?.sub || null;
            if (!uid) {
                resolve(null);
                return;
            }

            resolve({
                token: cookie.value,
                uid,
                expirationTime: typeof payload?.exp === 'number' ? payload.exp * 1000 : null,
            });
        });
    });
}

function isCareerVividTabUrl(url: string | undefined): boolean {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        if (!CAREERVIVID_TAB_HOSTS.has(parsed.hostname)) return false;
        if ((parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') && !['3000', '3001', '5173'].includes(parsed.port)) {
            return false;
        }
        return true;
    } catch (_) {
        return false;
    }
}

async function requestAuthFromCareerVividTabs(): Promise<ExtensionAuthPayload | null> {
    const tabs = await chrome.tabs.query({});
    const careerVividTabs = tabs.filter((tab) => isCareerVividTabUrl(tab.url));

    for (const tab of careerVividTabs) {
        if (!tab.id) continue;

        let response = await sendAuthRequestToTab(tab.id);

        if (!response?.success) {
            await injectContentScriptIntoTab(tab.id);
            response = await sendAuthRequestToTab(tab.id);
        }

        if (!response?.success) {
            response = await readAuthFromTabIndexedDb(tab.id);
        }

        const authPayload = response?.auth;
        if (response?.success && authPayload?.token && authPayload?.uid) {
            return {
                token: authPayload.token,
                uid: authPayload.uid,
                refreshToken: authPayload.refreshToken || null,
                expirationTime: authPayload.expirationTime || null,
                apiKey: authPayload.apiKey || null,
            };
        }
    }

    return null;
}

function sendAuthRequestToTab(tabId: number): Promise<any | null> {
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { type: 'GET_CAREERVIVID_AUTH' }, (res) => {
            const _ = chrome.runtime.lastError;
            resolve(res || null);
        });
    });
}

function readAuthFromTabIndexedDb(tabId: number): Promise<any | null> {
    return new Promise((resolve) => {
        chrome.scripting.executeScript(
            {
                target: { tabId },
                func: () => {
                    const parseFirebaseValue = (value: any) => {
                        if (!value) return null;
                        if (typeof value !== 'string') return value;
                        try {
                            return JSON.parse(value);
                        } catch (_) {
                            return null;
                        }
                    };

                    return new Promise((innerResolve) => {
                        try {
                            const request = indexedDB.open('firebaseLocalStorageDb');
                            request.onerror = () => innerResolve({ success: false });
                            request.onsuccess = (event) => {
                                const db = (event.target as IDBOpenDBRequest).result;
                                if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
                                    db.close();
                                    innerResolve({ success: false });
                                    return;
                                }

                                const getAllRequest = db
                                    .transaction(['firebaseLocalStorage'], 'readonly')
                                    .objectStore('firebaseLocalStorage')
                                    .getAll();

                                getAllRequest.onsuccess = (e) => {
                                    const results = (e.target as IDBRequest).result || [];
                                    const userVal = results
                                        .map((item: any) => parseFirebaseValue(item?.value))
                                        .filter((value: any) => value && value.uid && value.stsTokenManager?.accessToken)
                                        .sort((a: any, b: any) => (b.stsTokenManager.expirationTime || 0) - (a.stsTokenManager.expirationTime || 0))[0];

                                    db.close();

                                    if (!userVal?.stsTokenManager) {
                                        innerResolve({ success: false });
                                        return;
                                    }

                                    innerResolve({
                                        success: true,
                                        auth: {
                                            token: userVal.stsTokenManager.accessToken,
                                            uid: userVal.uid,
                                            refreshToken: userVal.stsTokenManager.refreshToken || null,
                                            expirationTime: userVal.stsTokenManager.expirationTime || null,
                                            apiKey: userVal.apiKey || null,
                                        },
                                    });
                                };

                                getAllRequest.onerror = () => {
                                    db.close();
                                    innerResolve({ success: false });
                                };
                            };
                        } catch (_) {
                            innerResolve({ success: false });
                        }
                    });
                },
            },
            (results) => {
                const _ = chrome.runtime.lastError;
                resolve(results?.[0]?.result || null);
            }
        );
    });
}

function injectContentScriptIntoTab(tabId: number): Promise<void> {
    return new Promise((resolve) => {
        chrome.scripting.executeScript(
            {
                target: { tabId },
                files: ['content.js'],
            },
            () => {
                const _ = chrome.runtime.lastError;
                resolve();
            }
        );
    });
}

async function hydrateAuthState(options: { allowClear?: boolean } = {}): Promise<{ isAuthenticated: boolean; uid: string | null; source: string }> {
    const stored = await getStoredAuthStatus();
    if (stored.isAuthenticated) {
        return { isAuthenticated: true, uid: stored.uid, source: 'storage' };
    }

    const cookieAuth = await findAuthCookiePromise();
    if (cookieAuth) {
        await persistAuthTokenPromise(cookieAuth);
        return { isAuthenticated: true, uid: cookieAuth.uid, source: 'cookie' };
    }

    const tabAuth = await requestAuthFromCareerVividTabs();
    if (tabAuth) {
        await persistAuthTokenPromise(tabAuth);
        return { isAuthenticated: true, uid: tabAuth.uid, source: 'career_vivid_tab' };
    }

    if (options.allowClear) {
        await new Promise<void>((resolve) => clearAuthToken(() => resolve()));
    }

    return { isAuthenticated: false, uid: null, source: 'none' };
}

function isAllowedExternalSender(url: string | undefined): boolean {
    if (!url) return false;

    try {
        const parsed = new URL(url);
        if (parsed.hostname === 'careervivid.app' || parsed.hostname.endsWith('.careervivid.app')) {
            return parsed.protocol === 'https:';
        }
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
            return parsed.protocol === 'http:' && ['3000', '3001', '5173'].includes(parsed.port);
        }
        return false;
    } catch (_) {
        return false;
    }
}


function checkAuthToken(): void {
    hydrateAuthState().catch((err) => {
        console.debug('[CareerVivid] Auth hydration failed:', err);
    });
}

chrome.cookies.onChanged.addListener((changeInfo) => {
    const domain = changeInfo.cookie.domain;
    if (domain.includes('careervivid.app') || domain.includes('localhost') || domain.includes('127.0.0.1')) {
        hydrateAuthState({ allowClear: changeInfo.removed }).catch((err) => {
            console.debug('[CareerVivid] Cookie auth hydration failed:', err);
        });
    }
});

checkAuthToken();

chrome.runtime.onStartup?.addListener(() => {
    hydrateAuthState().catch((err) => {
        console.debug('[CareerVivid] Startup auth hydration failed:', err);
    });
});

chrome.alarms?.onAlarm.addListener((alarm) => {
    if (alarm.name !== AUTH_REFRESH_ALARM) return;

    ensureFreshToken((token) => {
        if (!token) {
            hydrateAuthState().catch((err) => {
                console.debug('[CareerVivid] Alarm auth hydration failed:', err);
            });
        }
    });
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && isCareerVividTabUrl(tab.url)) {
        setTimeout(() => {
            hydrateAuthState().catch((err) => {
                console.debug('[CareerVivid] Tab auth hydration failed:', err);
            });
        }, 500);
    }
});

// ── Profile Sync: Firebase → chrome.storage.local ────────────────────────────
//
// This is the key architectural piece for auto-apply. When the user logs in or
// explicitly selects a resume, we sync their resume data into local extension
// storage so that the content script can access it instantly without an async
// Firebase call on every application page.

async function syncProfileFromFirebase(userId: string, resumeId: string): Promise<void> {
    try {
        const idToken = await getFreshTokenPromise();

        let resumeData: Record<string, any> | null = null;
        let userData: Record<string, any> | null = null;

        if (idToken && idToken !== 'mock-dev-id-token') {
            const resumeUrl = `https://firestore.googleapis.com/v1/projects/jastalk-firebase/databases/(default)/documents/users/${userId}/resumes/${resumeId}`;
            const userUrl = `https://firestore.googleapis.com/v1/projects/jastalk-firebase/databases/(default)/documents/users/${userId}`;

            const [resumeResp, userResp] = await Promise.all([
                fetch(resumeUrl, { headers: { 'Authorization': `Bearer ${idToken}` } }),
                fetch(userUrl, { headers: { 'Authorization': `Bearer ${idToken}` } })
            ]);

            if (!resumeResp.ok) {
                throw new Error(`Failed to fetch resume via REST: ${resumeResp.statusText}`);
            }

            const rawResume = await resumeResp.json();
            resumeData = parseFirestoreRestDoc(rawResume);

            if (userResp.ok) {
                const rawUser = await userResp.json();
                userData = parseFirestoreRestDoc(rawUser);
            } else {
                console.warn('[CareerVivid] Failed to fetch user profile via REST, using empty object');
                userData = {};
            }
        } else {
            throw new Error('Authentication missing. Please log in to CareerVivid again.');
        }

        if (!resumeData) {
            throw new Error('Resume data was not found.');
        }

        const profile: AutoFillProfile = normalizeResumeToProfile(resumeData, userData || {}, resumeId);

        await chrome.storage.local.set({
            autofillProfile: profile,
            selectedResumeId: resumeId,
        });

        console.log('[CareerVivid] Profile synced:', profile.firstName, profile.lastName);
    } catch (err) {
        console.error('[CareerVivid] Profile sync failed:', err);
        throw err;
    }
}

async function fetchResumesFromFirebase(userId: string): Promise<Record<string, any>[]> {
    const idToken = await getFreshTokenPromise();
    if (!idToken || idToken === 'mock-dev-id-token') {
        return [];
    }

    const url = `https://firestore.googleapis.com/v1/projects/jastalk-firebase/databases/(default)/documents/users/${userId}/resumes`;
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${idToken}` }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch resumes via REST: ${response.statusText}`);
    }

    const data = await response.json();
    const documents = data.documents || [];
    return documents
        .map((doc: any) => parseFirestoreRestDoc(doc))
        .sort((a: any, b: any) => {
            const aTime = new Date(a.updatedAt || 0).getTime();
            const bTime = new Date(b.updatedAt || 0).getTime();
            return bTime - aTime;
        });
}

async function ensureAutofillProfile(): Promise<AutoFillProfile> {
    const stored = await chrome.storage.local.get([
        'autofillProfile',
        'selectedResumeId',
        'uid',
        'isAuthenticated',
        'devModeAuth'
    ]);

    if (stored.autofillProfile) {
        return stored.autofillProfile as AutoFillProfile;
    }

    if (stored.devModeAuth) {
        await chrome.storage.local.remove([
            'devModeAuth',
            'autofillProfile',
            'selectedResumeId',
            'firebaseIdToken',
            'uid',
            'isAuthenticated',
        ]);
        throw new Error('Dev bypass is not a real CareerVivid login. Please sign in to sync your actual resume.');
    }

    if (!stored.isAuthenticated || !stored.uid) {
        throw new Error('Please log in to CareerVivid first.');
    }

    let resumeId = stored.selectedResumeId as string | undefined;

    if (!resumeId) {
        const resumes = await fetchResumesFromFirebase(stored.uid);
        resumeId = resumes[0]?.id;
    }

    if (!resumeId) {
        throw new Error('No resume found. Please create or select a resume first.');
    }

    await syncProfileFromFirebase(stored.uid, resumeId);

    const synced = await chrome.storage.local.get(['autofillProfile']);
    if (!synced.autofillProfile) {
        throw new Error('Profile sync failed. Please select a resume from the extension popup.');
    }

    return synced.autofillProfile as AutoFillProfile;
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
    const contact = resumeData.personalDetails || resumeData.contact || resumeData.personalInfo || {};
    const experiences = resumeData.employmentHistory || resumeData.experience || resumeData.workExperience || [];
    const educationList = resumeData.education || [];
    const skillsSection = resumeData.skills || [];
    const websites = resumeData.websites || [];

    const findWebsite = (patterns: RegExp[]): string => {
        const match = websites.find((site: any) => {
            const label = `${site?.label || ''} ${site?.platform || ''} ${site?.url || ''}`;
            return patterns.some(pattern => pattern.test(label));
        });
        return match?.url || '';
    };

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
        linkedinUrl: contact.linkedin || contact.linkedinUrl || userData.linkedinUrl || findWebsite([/linkedin/i]),
        githubUrl: contact.github || contact.githubUrl || userData.githubUrl || findWebsite([/github/i]),
        portfolioUrl: contact.portfolio || contact.website || userData.portfolioUrl || findWebsite([/portfolio/i, /website/i, /^((?!linkedin|github).)*https?:\/\//i]),
        city: contact.city || '',
        state: contact.state || contact.region || '',
        country: contact.country || 'United States',
        summary: resumeData.summary || resumeData.professionalSummary || '',
        workExperience: experiences.map((exp: any) => ({
            title: exp.jobTitle || exp.title || exp.position || '',
            company: exp.employer || exp.company || '',
            startDate: exp.startDate || exp.start || '',
            endDate: exp.current ? 'Present' : (exp.endDate || exp.end || ''),
            description: exp.description || exp.summary || '',
            location: exp.location || '',
        })),
        education: educationList.map((edu: any) => ({
            degree: edu.degree || edu.degreeType || '',
            fieldOfStudy: edu.fieldOfStudy || edu.major || '',
            school: edu.school || edu.institution || edu.university || '',
            graduationDate: edu.graduationDate || edu.endDate || edu.end || '',
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
        case 'OPEN_SIDE_PANEL': {
            const tabId = sender.tab?.id;

            openNativeSidePanel(tabId).then(() => {
                sendResponse({ success: true });
            }).catch((error: any) => {
                console.debug('[CareerVivid] Native side panel open failed:', error);
                sendResponse({ success: false, error: error?.message || 'Unable to open side panel' });
            });

            return true;
        }

        // Fetch user profile from Firestore REST via background to bypass CORS origin checks in popup
        case 'FETCH_USER_PROFILE': {
            const { userId } = message;
            getFreshTokenPromise().then(async (idToken) => {
                if (!idToken || idToken === 'mock-dev-id-token') {
                    sendResponse({ success: false, error: 'invalid_auth_token' });
                    return;
                }
                try {
                    const url = `https://firestore.googleapis.com/v1/projects/jastalk-firebase/databases/(default)/documents/users/${userId}`;
                    const response = await fetch(url, {
                        headers: { 'Authorization': `Bearer ${idToken}` }
                    });
                    if (response.ok) {
                        const doc = await response.json();
                        const fields = doc.fields || {};
                        const parsedProfile: Record<string, any> = {};
                        for (const key in fields) {
                            parsedProfile[key] = parseFirestoreRestValue(fields[key]);
                        }
                        sendResponse({ success: true, profile: parsedProfile });
                    } else {
                        sendResponse({ success: false, error: `REST error: ${response.status}` });
                    }
                } catch (err: any) {
                    sendResponse({ success: false, error: err.message || 'Network error' });
                }
            });
            return true;
        }

        // Fetch user resumes from Firestore REST via background to bypass CORS origin checks in popup
        case 'FETCH_RESUMES': {
            const { userId } = message;
            fetchResumesFromFirebase(userId).then((resumes) => {
                sendResponse({ success: true, resumes });
            }).catch((err: any) => {
                if (err?.message?.includes('mock-dev-id-token')) {
                    sendResponse({ success: false, error: 'invalid_auth_token' });
                    return;
                }
                sendResponse({ success: false, error: err.message || 'Network error' });
            });
            return true;
        }

        // Popup triggers auto-fill on the current tab (structured fields only — fast path)
        case 'AUTOFILL_APPLICATION':
            ensureAutofillProfile().then((profile) => {
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
            }).catch((err: any) => {
                sendResponse({ success: false, error: err.message || 'No profile synced. Please select a resume first.' });
            });
            return true;

        // Create a temporary scrape transit document in Firestore REST via background to bypass CORS origin checks in popup
        case 'CREATE_TRANSIT_DOC': {
            const { userId, job } = message;
            getFreshTokenPromise().then(async (idToken) => {
                if (!idToken || idToken === 'mock-dev-id-token') {
                    sendResponse({ success: false, error: 'invalid_auth_token' });
                    return;
                }
                try {
                    const url = `https://firestore.googleapis.com/v1/projects/jastalk-firebase/databases/(default)/documents/users/${userId}/temporaryScrapes`;
                    const restBody = {
                        fields: {
                            title: { stringValue: job.title || '' },
                            company: { stringValue: job.company || '' },
                            description: { stringValue: job.description || '' },
                            url: { stringValue: job.url || '' },
                            createdAt: { timestampValue: new Date().toISOString() }
                        }
                    };
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`
                        },
                        body: JSON.stringify(restBody)
                    });
                    if (response.ok) {
                        const resData = await response.json();
                        const parts = resData.name.split('/');
                        const scrapeId = parts[parts.length - 1];
                        sendResponse({ success: true, scrapeId });
                    } else {
                        const errText = await response.text();
                        sendResponse({ success: false, error: `REST error: ${response.status} ${errText}` });
                    }
                } catch (err: any) {
                    sendResponse({ success: false, error: err.message || 'Network error' });
                }
            });
            return true;
        }

        // Popup requests the cached profile + resume list
        case 'GET_RESUME_DATA':
            chrome.storage.local.get(['autofillProfile', 'selectedResumeId', 'isAuthenticated'], (result) => {
                sendResponse(result);
            });
            return true;

        // User selected a resume in the popup → sync it from Firebase
        case 'SYNC_PROFILE':
            syncProfileFromFirebase(message.userId, message.resumeId).then(() => {
                broadcastResumeSelection(message.resumeId);
                sendResponse({ success: true });
            }).catch((err) => {
                sendResponse({ success: false, error: err.message });
            });
            return true;

        // ── NEW: AI-powered answer generation for open-ended questions ─────────────
        // Flow: content script extracts questions → popup calls this → Cloud Function → answers
        case 'GENERATE_AI_ANSWERS': {
            const { questions, companyName, jobTitle, jobDescription, jobId } = message;

            getFreshTokenPromise().then(async (idToken) => {
                if (!idToken) {
                    sendResponse({ success: false, error: 'Not authenticated. Please log in to CareerVivid.' });
                    return;
                }

                if (idToken === 'mock-dev-id-token') {
                    sendResponse({ success: false, error: 'Please sign in to CareerVivid to generate answers from your real resume.' });
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
            chrome.storage.local.get([cacheKey, 'tokenExpirationTime', 'firebaseRefreshToken'], async (stored: any) => {
                const cached = stored[cacheKey];
                const now = Date.now();
                const TTL = 30 * 60 * 1000; // 30 minutes

                // Serve from cache if still fresh
                if (cached && (now - cached.cachedAt) < TTL) {
                    console.debug('[CareerVivid] Prefetch hit:', pageUrl);
                    return;
                }

                getFreshTokenPromise().then(async (idToken) => {
                    if (!idToken || !questions?.length) return;

                    if (idToken === 'mock-dev-id-token') {
                        return;
                    }

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
        });

            // Always respond immediately so the content script message channel closes
            sendResponse({ success: true });
            return true;
        }

        // ── Phase 3: Cover Letter Prefetch ──────────────────────────────────────────
        case 'PREFETCH_COVER_LETTER': {
            const { pageUrl, companyName, jobTitle, jobDescription } = message;

            const cacheKey = `coverletter_${btoa(pageUrl).slice(0, 40)}`;
            chrome.storage.local.get([cacheKey, 'selectedResumeId'], async (stored: any) => {
                const cached = stored[cacheKey];
                const now = Date.now();
                const TTL = 30 * 60 * 1000; // 30 minutes

                if (cached && (now - cached.cachedAt) < TTL) {
                    console.debug('[CareerVivid] Cover Letter prefetch hit:', pageUrl);
                    return;
                }

                const resumeId = stored.selectedResumeId;
                if (!resumeId || !jobDescription) return;

                getFreshTokenPromise().then(async (idToken) => {
                    if (!idToken) return;

                    if (idToken === 'mock-dev-id-token') {
                        return;
                    }

                try {
                    const endpoint = 'https://us-west1-jastalk-firebase.cloudfunctions.net/generateCoverLetter';
                    const resp = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`,
                        },
                        body: JSON.stringify({
                            data: {
                                resumeId,
                                jobDescription,
                                jobTitle,
                                companyName,
                            },
                        }),
                    });

                    if (!resp.ok) return;

                    const json = await resp.json() as any;
                    const result = json.result || json;

                    if (result?.coverLetter?.content) {
                        chrome.storage.local.set({
                            [cacheKey]: {
                                content: result.coverLetter.content,
                                cachedAt: now,
                                companyName,
                                jobTitle,
                                pageUrl,
                            },
                        });
                        console.debug('[CareerVivid] Cover Letter prefetched & cached');
                    }
                } catch (err) {
                    console.debug('[CareerVivid] Cover Letter prefetch failed silently:', err);
                }
            });
        });

            sendResponse({ success: true });
            return true;
        }

        // ── Phase 3: Manual/Direct Cover Letter Generation ──────────────────────────
        case 'GENERATE_COVER_LETTER': {
            const { pageUrl, companyName, jobTitle, jobDescription } = message;

            chrome.storage.local.get(['selectedResumeId'], async (stored: any) => {
                const resumeId = stored.selectedResumeId;

                if (!resumeId) {
                    sendResponse({ success: false, error: 'Active resume missing.' });
                    return;
                }

                getFreshTokenPromise().then(async (idToken) => {
                    if (!idToken) {
                        sendResponse({ success: false, error: 'Authentication missing.' });
                        return;
                    }

                    if (idToken === 'mock-dev-id-token') {
                        sendResponse({ success: false, error: 'Please sign in to CareerVivid to generate a cover letter from your real resume.' });
                        return;
                    }

                if (!jobDescription) {
                    sendResponse({ success: false, error: 'Job description is required to generate a cover letter.' });
                    return;
                }

                try {
                    const endpoint = 'https://us-west1-jastalk-firebase.cloudfunctions.net/generateCoverLetter';
                    const resp = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`,
                        },
                        body: JSON.stringify({
                            data: {
                                resumeId,
                                jobDescription,
                                jobTitle,
                                companyName,
                            },
                        }),
                    });

                    if (!resp.ok) {
                        const errText = await resp.text();
                        sendResponse({ success: false, error: `Error: ${resp.status} ${errText}` });
                        return;
                    }

                    const json = await resp.json() as any;
                    const result = json.result || json;

                    if (result?.coverLetter?.content) {
                        const cacheKey = `coverletter_${btoa(pageUrl).slice(0, 40)}`;
                        await chrome.storage.local.set({
                            [cacheKey]: {
                                content: result.coverLetter.content,
                                cachedAt: Date.now(),
                                companyName,
                                jobTitle,
                                pageUrl,
                            },
                        });
                        sendResponse({ success: true, coverLetter: result.coverLetter.content });
                    } else {
                        sendResponse({ success: false, error: 'Invalid response format from service.' });
                    }
                } catch (err: any) {
                    console.error('[CareerVivid] GENERATE_COVER_LETTER failed:', err);
                    sendResponse({ success: false, error: err.message || 'Network error' });
                }
            });
        });
            return true;
        }

        // ── Phase 2: Auto-log to tracker when fill completes ─────────────────────
        // Content script sends FILL_COMPLETE after running autofill.
        // Background relays it to the popup AND auto-logs a "To Apply" entry
        // in the tracker so the user has a record without any manual action.
        case 'AUTO_LOG_APPLICATION': {
            const { job: autoJob, filledCount } = message;
            if (!autoJob?.title) { sendResponse({ success: false }); return true; }

            chrome.storage.local.get(['trackedJobs'], async (stored: any) => {
                const jobs: any[] = stored.trackedJobs || [];

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

                    // Best-effort: also persist to Firebase if authenticated and not mock token
                    getFreshTokenPromise().then((freshToken) => {
                        if (freshToken && freshToken !== 'mock-dev-id-token') {
                            fetch('https://us-west1-jastalk-firebase.cloudfunctions.net/cliJobsHunt', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${freshToken}`,
                                },
                                body: JSON.stringify({ job: entry }),
                            }).catch(() => { /* best-effort */ });
                        }
                    });
                }

                sendResponse({ success: true, alreadyLogged });
            });
            return true;
        }

        // ── NEW: Check if the user is authenticated from storage ──────────────────
        case 'CHECK_AUTH_STATUS':
            hydrateAuthState().then((authState) => {
                sendResponse(authState);
            }).catch((err: any) => {
                sendResponse({ isAuthenticated: false, uid: null, source: 'error', error: err.message || 'Auth hydration failed' });
            });
            return true;

        case 'HYDRATE_AUTH':
            hydrateAuthState().then((authState) => {
                sendResponse(authState);
            }).catch((err: any) => {
                sendResponse({ isAuthenticated: false, uid: null, source: 'error', error: err.message || 'Auth hydration failed' });
            });
            return true;

        // ── NEW: Store Firebase ID token (called from popup after login) ──────────
        case 'STORE_AUTH_TOKEN':
            chrome.storage.local.set({ firebaseIdToken: message.idToken }, () => {
                sendResponse({ success: true });
            });
            return true;

        // ── NEW: Internal relay of SAVE/CLEAR auth tokens from content script ─────
        case 'SAVE_AUTH_TOKEN': {
            const { token, uid, refreshToken, expirationTime, apiKey, email, photoURL, source } = message;
            persistAuthToken({ token, uid, refreshToken, expirationTime, apiKey, email, photoURL, source: source || 'internal_message' } as any, () => {
                sendResponse({ success: true });
            });
            return true;
        }

        case 'CLEAR_AUTH_TOKEN': {
            clearAuthToken(() => {
                sendResponse({ success: true });
            });
            return true;
        }

        // ── NEW: Mark a job as Applied and get confirmation ────────────────────────
        case 'MARK_JOB_APPLIED': {
            const { jobId: appliedJobId } = message;
            getFreshTokenPromise().then(async (idToken) => {
                if (!idToken || !appliedJobId) {
                    sendResponse({ success: false });
                    return;
                }
                if (idToken === 'mock-dev-id-token') {
                    sendResponse({ success: true });
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
        case 'OPEN_RESUME_PICKER': {
            const tabId = sender.tab?.id;

            if (tabId) {
                openNativeSidePanel(tabId).then(() => {
                    sendResponse({ success: true });
                }).catch((error: any) => {
                    sendResponse({ success: false, error: error?.message || 'Unable to open side panel' });
                });
                return true;
            }

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTabId = tabs[0]?.id;
                openNativeSidePanel(activeTabId).then(() => {
                    sendResponse({ success: true });
                }).catch((error: any) => {
                    sendResponse({ success: false, error: error?.message || 'Unable to open side panel' });
                });
            });
            return true;
        }

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

// ── Direct Web-to-Extension Auth Sync (Speechify-Style) ───────────────────────
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    console.log('[CareerVivid] Received external message:', message?.type, 'from:', sender?.url);
    if (!message) return false;

    if (!isAllowedExternalSender(sender?.url)) {
        sendResponse({ success: false, error: 'Unauthorized sender origin' });
        return false;
    }

    if (message.type === 'SAVE_AUTH_TOKEN' || message.type === 'AUTH_SUCCESS') {
        const { token, uid, refreshToken, expirationTime, apiKey, email, photoURL, source } = message;
        const payload = token ? parseJwt(token) : null;
        const resolvedUid = uid || payload?.user_id || payload?.sub || null;
        persistAuthToken({ token, uid: resolvedUid, refreshToken, expirationTime, apiKey, email, photoURL, source: source || 'external_message' } as any, () => {
            sendResponse({ success: true, isAuthenticated: true, uid: resolvedUid, source: 'external_message' });
        });
        return true;
    }

    if (message.type === 'CLEAR_AUTH_TOKEN') {
        clearAuthToken(() => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (message.type === 'SELECTED_RESUME_CHANGED') {
        const { resumeId } = message;
        chrome.storage.local.set({ selectedResumeId: resumeId }, () => {
            chrome.storage.local.get(['uid'], (result) => {
                const userId = result.uid;
                if (userId) {
                    syncProfileFromFirebase(userId, resumeId).then(() => {
                        broadcastResumeSelection(resumeId);
                        sendResponse({ success: true });
                    }).catch((err) => {
                        sendResponse({ success: false, error: err.message });
                    });
                } else {
                    broadcastResumeSelection(resumeId);
                    sendResponse({ success: true, warning: 'No active user ID in extension storage to sync full profile details' });
                }
            });
        });
        return true;
    }

    return false;
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
