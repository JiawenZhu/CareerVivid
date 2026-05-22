/// <reference types="chrome" />
import React, { useEffect, useState, useCallback } from 'react';
import {
    Plus, Briefcase, Mic, ExternalLink, FileText, Wand2,
    Settings, Zap, CheckCircle, AlertCircle, Loader2, ChevronRight,
    Sparkles, ChevronDown, ChevronUp, Copy, CheckCheck, Send, LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useResumes } from '../../hooks/useResumes';
import { getAppUrl } from '../../utils/extensionUtils';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface AutoFillResult {
    platform: string;
    filledCount: number;
    skippedCount: number;
    errorCount: number;
    timestamp: string;
}

interface AIAnswer {
    label: string;
    answer: string;
    confidence: 'high' | 'medium' | 'low';
    source: 'profile_field' | 'ai_generated' | 'skipped' | 'answer_library';
    reasoning?: string;
    injected?: boolean;
    copied?: boolean;
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

const ExtensionHome: React.FC = () => {
    const { userProfile: contextUserProfile, currentUser, logOut } = useAuth();
    const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
    const [localProfile, setLocalProfile] = useState<any>(null);
    const [restUserProfile, setRestUserProfile] = useState<any>(null);

    const userProfile = contextUserProfile || restUserProfile;

    useEffect(() => {
        if (currentUser?.uid) {
            setResolvedUserId(currentUser.uid);
        } else {
            chrome.storage.local.get(['devModeAuth', 'autofillProfile', 'uid'], (res) => {
                if (res.devModeAuth) {
                    setResolvedUserId(null);
                } else if (res.uid) {
                    setResolvedUserId(res.uid);
                } else if (res.autofillProfile?.uid) {
                    setResolvedUserId(res.autofillProfile.uid);
                } else {
                    setResolvedUserId(null);
                }
            });
        }
    }, [currentUser]);

    useEffect(() => {
        if (!resolvedUserId || currentUser) {
            setRestUserProfile(null);
            return;
        }

        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({ type: 'FETCH_USER_PROFILE', userId: resolvedUserId }, (res) => {
                const _ = chrome.runtime.lastError; // Suppress unchecked runtime.lastError warning
                if (res?.success && res.profile) {
                    setRestUserProfile(res.profile);
                } else {
                    if (res?.error === 'invalid_auth_token') {
                        console.log("Invalid extension auth token; waiting for real CareerVivid sign-in");
                    } else {
                        console.log("Could not fetch user profile via REST (expected in dev bypass mode):", res?.error);
                    }
                }
            });
        }
    }, [resolvedUserId, currentUser]);

    useEffect(() => {
        const loadLocalState = () => {
            chrome.storage.local.get(['devModeAuth', 'autofillProfile', 'selectedResumeId'], (res) => {
                if (res.devModeAuth) {
                    setLocalProfile(null);
                    setHasProfile(false);
                    setSelectedResumeId(null);
                    return;
                }

                setLocalProfile(res.autofillProfile || null);
                setHasProfile(!!res.autofillProfile);
                setSelectedResumeId((res.selectedResumeId as string | undefined) || null);
            });
        };

        loadLocalState();

        // Listen for storage changes to keep state synced
        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'local') {
                if (changes.devModeAuth || changes.autofillProfile || changes.selectedResumeId) {
                    loadLocalState();
                }
            }
        };

        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.onChanged.addListener(handleStorageChange);
            return () => chrome.storage.onChanged.removeListener(handleStorageChange);
        }
    }, []);

    const handleSignOut = () => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.remove([
                'devModeAuth',
                'isAuthenticated',
                'selectedResumeId',
                'autofillProfile',
                'firebaseIdToken',
                'uid'
            ], () => {
                chrome.runtime.sendMessage({ type: 'AUTH_STATE_CHANGED', isAuthenticated: false }, () => {
                    const _ = chrome.runtime.lastError;
                });
                
                const cookieNames = ['session', '__session', 'token'];
                const domains = [
                    'https://careervivid.app',
                    'https://www.careervivid.app',
                    'http://localhost:5173',
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'http://127.0.0.1:3000',
                    'http://127.0.0.1:3001',
                    'http://127.0.0.1:5173'
                ];
                
                if (chrome.cookies) {
                    let clearedCount = 0;
                    const totalClears = domains.length * cookieNames.length;
                    
                    domains.forEach((domain) => {
                        cookieNames.forEach((name) => {
                            chrome.cookies.remove({ url: domain, name }, () => {
                                clearedCount++;
                                if (clearedCount === totalClears) {
                                    try {
                                        logOut();
                                    } catch (_) {}
                                    window.location.reload();
                                }
                            });
                        });
                    });
                } else {
                    try {
                        logOut();
                    } catch (_) {}
                    window.location.reload();
                }
            });
        } else {
            try {
                logOut();
            } catch (_) {}
            window.location.reload();
        }
    };

    const { resumes } = useResumes(resolvedUserId);
    const [currentTab, setCurrentTab] = useState<{ url: string; title: string } | null>(null);
    const [isJobSite, setIsJobSite] = useState(false);
    const [isApplicationPage, setIsApplicationPage] = useState(false);
    const [atsPlatform, setAtsPlatform] = useState<string | null>(null);
    const [scrapedJob, setScrapedJob] = useState<{ title: string; company: string; description?: string } | null>(null);
    const [fillResult, setFillResult] = useState<AutoFillResult | null>(null);
    const [isFilling, setIsFilling] = useState(false);
    const [hasProfile, setHasProfile] = useState(false);
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

    // AI Smart Fill state
    const [aiAnswers, setAiAnswers] = useState<AIAnswer[]>([]);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [fillAllConfirm, setFillAllConfirm] = useState(false);
    const [submittedJobId, setSubmittedJobId] = useState<string | null>(null);
    const [markedApplied, setMarkedApplied] = useState(false);

    // Phase 2: prefetch cache state
    const [prefetchReady, setPrefetchReady] = useState(false);
    const [prefetchCacheKey, setPrefetchCacheKey] = useState<string | null>(null);

    // Cover Letter state
    const [coverLetter, setCoverLetter] = useState<string>('');
    const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
    const [clError, setClError] = useState<string | null>(null);
    const [coverLetterReady, setCoverLetterReady] = useState(false);
    const [showCoverLetterPanel, setShowCoverLetterPanel] = useState(false);
    const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);
    const [isPreparingTransit, setIsPreparingTransit] = useState(false);

    // Listen for FILL_COMPLETE from content script (relayed via background)
    useEffect(() => {
        const handleMessage = (message: any) => {
            if (message.type === 'AUTH_STATE_CHANGED') {
                setIsFilling(false);
            }
            if (message.type === 'FILL_COMPLETE') {
                setFillResult(message.result);
                setIsFilling(false);
                // Phase 2: auto-populate job ID from scraped data for one-tap "Mark Applied"
                if (!submittedJobId && scrapedJob) {
                    setSubmittedJobId(window.location.href);
                }
            }
        };
        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, [submittedJobId, scrapedJob]);

    // On mount: get tab info, ATS context, cached profile, prefetch cache
    useEffect(() => {
        if (typeof chrome === 'undefined' || !chrome.tabs) return;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (!tab?.url) return;
            setCurrentTab({ url: tab.url, title: tab.title || '' });

            const url = tab.url;
            const lowercaseUrl = url.toLowerCase();
            const isKnownJobSite = [
                'linkedin.com/jobs',
                'indeed.com',
                'greenhouse.io',
                'jobs.lever.co',
                'myworkdayjobs.com',
                'ashbyhq.com',
                'smartrecruiters.com',
                'workable.com',
                'bamboohr.com'
            ].some(s => lowercaseUrl.includes(s));

            // Support custom company career/job pages (e.g. openai.com/careers/research-scientist)
            const isCustomJobPage = [
                '/jobs/',
                '/careers/',
                '/careers-at/',
                '/apply/',
                '/positions/',
                '/job/',
                '/position/'
            ].some(p => lowercaseUrl.includes(p)) || lowercaseUrl.includes('careers.') || lowercaseUrl.includes('jobs.');

            setIsJobSite(isKnownJobSite || isCustomJobPage);

            // Phase 2: check for prefetched answers + cover letter for this exact URL
            const cacheKey = `prefetch_${btoa(url).slice(0, 40)}`;
            const clCacheKey = `coverletter_${btoa(url).slice(0, 40)}`;
            setPrefetchCacheKey(cacheKey);
            chrome.storage.local.get([cacheKey, clCacheKey], (cached: any) => {
                const hitAnswers = cached[cacheKey];
                const hitCL = cached[clCacheKey];
                const TTL = 30 * 60 * 1000;
                
                if (hitAnswers && (Date.now() - hitAnswers.cachedAt) < TTL && hitAnswers.answers?.length) {
                    setPrefetchReady(true);
                    // Pre-populate answers silently — shown when user opens panel
                    setAiAnswers(hitAnswers.answers);
                }

                if (hitCL && (Date.now() - hitCL.cachedAt) < TTL && hitCL.content) {
                    setCoverLetter(hitCL.content);
                    setCoverLetterReady(true);
                }
            });

            if (tab.id) {
                // Extract job data
                chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JOB_DATA' }, (response) => {
                    const _ = chrome.runtime.lastError; // Suppress unchecked runtime.lastError
                    if (response?.job) {
                        setScrapedJob(response.job);
                        if (response.job.title) {
                            setIsJobSite(true);
                        }
                    }
                });
                // Check ATS context (is this an application page?)
                chrome.tabs.sendMessage(tab.id, { type: 'GET_ATS_CONTEXT' }, (response) => {
                    const _ = chrome.runtime.lastError; // Suppress unchecked runtime.lastError
                    if (response?.context) {
                        setIsApplicationPage(response.context.isApplicationPage);
                        setAtsPlatform(response.context.platform);
                        if (response.context.isApplicationPage || response.context.platform) {
                            setIsJobSite(true);
                        }
                    }
                });
            }
        });

        // Check if a profile is already synced
        chrome.storage.local.get(['autofillProfile', 'selectedResumeId'], (result) => {
            setHasProfile(!!result.autofillProfile);
            setSelectedResumeId((result.selectedResumeId as string | undefined) || null);
        });
    }, []);

    // Auto-sync profile when resumes are loaded (use the first/most recent resume)
    useEffect(() => {
        if (!resolvedUserId || !resumes.length || hasProfile) return;
        const defaultResume = resumes[0];
        if (defaultResume?.id) {
            chrome.runtime.sendMessage({
                type: 'SYNC_PROFILE',
                userId: resolvedUserId,
                resumeId: defaultResume.id,
            }, (res) => {
                const _ = chrome.runtime.lastError; // Suppress unchecked runtime.lastError
                if (res?.success) {
                    setHasProfile(true);
                    setSelectedResumeId(defaultResume.id!);
                }
            });
        }
    }, [resolvedUserId, resumes, hasProfile]);

    // ── AI Smart Fill handler ───────────────────────────────────────────────────
    const handleSmartFill = useCallback(() => {
        if (!currentTab) return;

        // Phase 2: if prefetch already ran, serve from cache immediately
        if (prefetchReady && aiAnswers.length > 0) {
            setShowAiPanel(true);
            setFillAllConfirm(false);
            return;
        }

        setIsGeneratingAI(true);
        setAiError(null);
        setShowAiPanel(false);
        setAiAnswers([]);
        setFillAllConfirm(false);

        // Step 1: Ask content script to extract all form questions
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) {
                setAiError('No active tab found.');
                setIsGeneratingAI(false);
                return;
            }

            chrome.tabs.sendMessage(tabs[0].id, { type: 'EXTRACT_FORM_QUESTIONS' }, (response) => {
                const _ = chrome.runtime.lastError; // Suppress unchecked runtime.lastError
                const questions = response?.questions || [];

                if (questions.length === 0) {
                    setAiError('No form fields detected on this page. Make sure you\'re on an application form.');
                    setIsGeneratingAI(false);
                    return;
                }

                // Step 2: Call Cloud Function via background
                chrome.runtime.sendMessage({
                    type: 'GENERATE_AI_ANSWERS',
                    questions,
                    companyName: scrapedJob?.company || document.title,
                    jobTitle: scrapedJob?.title || 'Unknown Role',
                    jobDescription: scrapedJob?.description || '',
                }, (res) => {
                    const _ = chrome.runtime.lastError; // Suppress unchecked runtime.lastError
                    setIsGeneratingAI(false);
                    if (res?.success && res.answers) {
                        setAiAnswers(res.answers);
                        setShowAiPanel(true);
                        // Update prefetch cache with fresh answers
                        if (prefetchCacheKey) {
                            chrome.storage.local.set({
                                [prefetchCacheKey]: {
                                    answers: res.answers,
                                    aiCount: res.aiCount || 0,
                                    companyName: scrapedJob?.company || '',
                                    jobTitle: scrapedJob?.title || '',
                                    pageUrl: currentTab.url,
                                    cachedAt: Date.now(),
                                },
                            });
                            setPrefetchReady(true);
                        }
                    } else {
                        setAiError(res?.error || 'Failed to generate AI answers. Please try again.');
                    }
                });
            });
        });
    }, [currentTab, scrapedJob, prefetchReady, aiAnswers, prefetchCacheKey]);

    // ── Inject a single AI answer into the form ────────────────────────────────
    const handleInjectAnswer = useCallback((answer: AIAnswer) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) return;
            chrome.tabs.sendMessage(tabs[0].id, {
                type: 'INJECT_ANSWER',
                label: answer.label,
                value: answer.answer,
            }, () => {
                const _ = chrome.runtime.lastError;
            });
            setAiAnswers(prev => prev.map(a =>
                a.label === answer.label ? { ...a, injected: true } : a
            ));
        });
    }, []);

    // ── Fill All with confirmation ─────────────────────────────────────────────
    const handleFillAll = useCallback(() => {
        if (!fillAllConfirm) {
            setFillAllConfirm(true);
            return;
        }
        // Inject all non-empty answers
        const toInject = aiAnswers.filter(a => a.answer && a.source !== 'skipped');
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) return;
            toInject.forEach(answer => {
                chrome.tabs.sendMessage(tabs[0]!.id!, {
                    type: 'INJECT_ANSWER',
                    label: answer.label,
                    value: answer.answer,
                }, () => {
                    const _ = chrome.runtime.lastError;
                });
            });
            setAiAnswers(prev => prev.map(a =>
                toInject.some(t => t.label === a.label) ? { ...a, injected: true } : a
            ));
            setFillAllConfirm(false);
        });
    }, [aiAnswers, fillAllConfirm]);

    // ── Mark job as Applied ───────────────────────────────────────────────────
    const handleMarkApplied = useCallback(() => {
        if (!submittedJobId) return;
        chrome.runtime.sendMessage({ type: 'MARK_JOB_APPLIED', jobId: submittedJobId }, (res) => {
            const _ = chrome.runtime.lastError;
            if (res?.success) setMarkedApplied(true);
        });
    }, [submittedJobId]);

    // ── Cover Letter Handlers ──────────────────────────────────────────────────
    const handleGenerateCoverLetter = useCallback(() => {
        if (!currentTab || !scrapedJob?.description) return;

        setIsGeneratingCoverLetter(true);
        setClError(null);
        setCopiedCoverLetter(false);

        chrome.runtime.sendMessage({
            type: 'GENERATE_COVER_LETTER',
            pageUrl: currentTab.url,
            companyName: scrapedJob.company || document.title,
            jobTitle: scrapedJob.title || 'Unknown Role',
            jobDescription: scrapedJob.description,
        }, (res) => {
            const _ = chrome.runtime.lastError;
            setIsGeneratingCoverLetter(false);
            if (res?.success && res.coverLetter) {
                setCoverLetter(res.coverLetter);
                setCoverLetterReady(true);
                setShowCoverLetterPanel(true);
            } else {
                setClError(res?.error || 'Failed to generate cover letter.');
            }
        });
    }, [currentTab, scrapedJob]);

    const handleCopyCoverLetter = useCallback(() => {
        if (!coverLetter) return;
        navigator.clipboard.writeText(coverLetter).then(() => {
            setCopiedCoverLetter(true);
            setTimeout(() => setCopiedCoverLetter(false), 2000);
        });
    }, [coverLetter]);

    const handleAutofill = useCallback(() => {
        if (!hasProfile) {
            // No profile — sync now then apply
            if (resolvedUserId && resumes[0]?.id) {
                setIsFilling(true);
                chrome.runtime.sendMessage({
                    type: 'SYNC_PROFILE',
                    userId: resolvedUserId,
                    resumeId: resumes[0].id!,
                }, (res) => {
                    const _ = chrome.runtime.lastError;
                    if (res?.success) {
                        setHasProfile(true);
                        chrome.runtime.sendMessage({ type: 'AUTOFILL_APPLICATION' }, () => {
                            const _ = chrome.runtime.lastError;
                        });
                    } else {
                        setIsFilling(false);
                    }
                });
            }
            return;
        }
        setIsFilling(true);
        setFillResult(null);
        chrome.runtime.sendMessage({ type: 'AUTOFILL_APPLICATION' }, (res) => {
            const _ = chrome.runtime.lastError;
            if (res?.error) {
                setIsFilling(false);
            }
        });
    }, [hasProfile, resolvedUserId, resumes]);

    const handleAction = async (action: string) => {
        if (action === 'save_job' && currentTab?.url && scrapedJob) {
            if (!resolvedUserId) {
                alert('Please sign in to CareerVivid before saving jobs.');
                window.open(getAppUrl('/login'), '_blank');
                return;
            }
            try {
                setIsPreparingTransit(true);
                const tokenRes = await new Promise<{ firebaseIdToken?: string }>(resolve => {
                    chrome.storage.local.get(['firebaseIdToken'], resolve);
                });
                const token = tokenRes.firebaseIdToken;

                if (!token || token === 'mock-dev-id-token') {
                    window.open(getAppUrl(`/job-tracker?source=extension_tracker&fallbackDescription=${encodeURIComponent(scrapedJob.description || '')}`), '_blank');
                    return;
                }

                // If real token, delegate transit doc creation to background service worker to bypass CORS:
                const res = await new Promise<any>((resolve) => {
                    chrome.runtime.sendMessage({
                        type: 'CREATE_TRANSIT_DOC',
                        userId: resolvedUserId,
                        job: {
                            title: scrapedJob.title || '',
                            company: scrapedJob.company || '',
                            description: scrapedJob.description || '',
                            url: currentTab?.url || ''
                        }
                    }, (response) => {
                        const _ = chrome.runtime.lastError; // Suppress unchecked runtime.lastError
                        resolve(response);
                    });
                });

                if (!res?.success || !res?.scrapeId) {
                    throw new Error(res?.error || 'Failed to create transit doc via background');
                }

                window.open(getAppUrl(`/job-tracker?source=extension_tracker&scrapeId=${res.scrapeId}`), '_blank');
            } catch (error: any) {
                console.error('Error creating transit doc for tracker:', error);
                window.open(getAppUrl(`/job-tracker?source=extension_tracker&fallbackDescription=${encodeURIComponent(scrapedJob.description || '')}`), '_blank');
            } finally {
                setIsPreparingTransit(false);
            }
        } else if (action === 'tailor_resume' && scrapedJob) {
            if (!resolvedUserId) {
                alert('Please sign in to CareerVivid before tailoring your resume.');
                window.open(getAppUrl('/login'), '_blank');
                return;
            }
            try {
                setIsPreparingTransit(true);
                const tokenRes = await new Promise<{ firebaseIdToken?: string }>(resolve => {
                    chrome.storage.local.get(['firebaseIdToken'], resolve);
                });
                const token = tokenRes.firebaseIdToken;

                if (!token || token === 'mock-dev-id-token') {
                    alert('Please sign in to CareerVivid before tailoring your resume.');
                    window.open(getAppUrl('/signin'), '_blank');
                    setIsPreparingTransit(false);
                    return;
                }

                // If real token, delegate transit doc creation to background service worker to bypass CORS:
                const res = await new Promise<any>((resolve) => {
                    chrome.runtime.sendMessage({
                        type: 'CREATE_TRANSIT_DOC',
                        userId: resolvedUserId,
                        job: {
                            title: scrapedJob.title || '',
                            company: scrapedJob.company || '',
                            description: scrapedJob.description || '',
                            url: currentTab?.url || ''
                        }
                    }, (response) => {
                        const _ = chrome.runtime.lastError; // Suppress unchecked runtime.lastError
                        resolve(response);
                    });
                });

                if (!res?.success || !res?.scrapeId) {
                    throw new Error(res?.error || 'Failed to create transit doc via background');
                }

                const targetResumeId = selectedResumeId || resumes[0]?.id;
                if (targetResumeId) {
                    window.open(getAppUrl(`/edit/${targetResumeId}?source=extension_tailor&scrapeId=${res.scrapeId}`), '_blank');
                } else {
                    window.open(getAppUrl(`/newresume?source=extension_tailor&scrapeId=${res.scrapeId}`), '_blank');
                }
            } catch (error: any) {
                const errorStr = typeof error === 'string' ? error : (error?.message || String(error));
                if (
                    errorStr.includes('invalid_auth_token') ||
                    errorStr.includes('Mock or invalid token') ||
                    errorStr.includes('No valid token')
                ) {
                    alert('Please sign in to CareerVivid before tailoring your resume.');
                    window.open(getAppUrl('/signin'), '_blank');
                } else {
                    console.error('Error creating transit doc:', error);
                    const targetResumeId = selectedResumeId || resumes[0]?.id;
                    chrome.storage.local.set({ pending_tailor_jd: scrapedJob.description || '' }, () => {
                        if (targetResumeId) {
                            window.open(getAppUrl(`/edit/${targetResumeId}?source=extension_tailor&jobTitle=${encodeURIComponent(scrapedJob.title)}`), '_blank');
                        } else {
                            window.open(getAppUrl(`/newresume?source=extension_tailor&jobTitle=${encodeURIComponent(scrapedJob.title)}`), '_blank');
                        }
                    });
                }
            } finally {
                setIsPreparingTransit(false);
            }
        } else if (action === 'practice_interview' && scrapedJob) {
            if (!resolvedUserId) {
                alert('Please sign in to CareerVivid before practicing interviews.');
                window.open(getAppUrl('/login'), '_blank');
                return;
            }
            try {
                setIsPreparingTransit(true);
                const tokenRes = await new Promise<{ firebaseIdToken?: string }>(resolve => {
                    chrome.storage.local.get(['firebaseIdToken'], resolve);
                });
                const token = tokenRes.firebaseIdToken;

                if (!token || token === 'mock-dev-id-token') {
                    alert('Please sign in to CareerVivid before practicing interviews.');
                    window.open(getAppUrl('/signin'), '_blank');
                    setIsPreparingTransit(false);
                    return;
                }

                // If real token, delegate transit doc creation to background service worker to bypass CORS:
                const res = await new Promise<any>((resolve) => {
                    chrome.runtime.sendMessage({
                        type: 'CREATE_TRANSIT_DOC',
                        userId: resolvedUserId,
                        job: {
                            title: scrapedJob.title || '',
                            company: scrapedJob.company || '',
                            description: scrapedJob.description || '',
                            url: currentTab?.url || ''
                        }
                    }, (response) => {
                        const _ = chrome.runtime.lastError; // Suppress unchecked runtime.lastError
                        resolve(response);
                    });
                });

                if (!res?.success || !res?.scrapeId) {
                    throw new Error(res?.error || 'Failed to create transit doc via background');
                }

                window.open(getAppUrl(`/interview-studio?source=extension_practice&scrapeId=${res.scrapeId}`), '_blank');
            } catch (error: any) {
                const errorStr = typeof error === 'string' ? error : (error?.message || String(error));
                if (
                    errorStr.includes('invalid_auth_token') ||
                    errorStr.includes('Mock or invalid token') ||
                    errorStr.includes('No valid token')
                ) {
                    alert('Please sign in to CareerVivid before practicing interviews.');
                    window.open(getAppUrl('/signin'), '_blank');
                } else {
                    console.error('Error creating transit doc:', error);
                    const cleanTitle = scrapedJob.title ? encodeURIComponent(scrapedJob.title.replace(/\(.*\)/, '').trim()) : 'General';
                    window.open(getAppUrl(`/interview-studio/new?role=${cleanTitle}`), '_blank');
                }
            } finally {
                setIsPreparingTransit(false);
            }
        } else if (action === 'new_resume') {
            window.open(getAppUrl('/newresume'), '_blank');
        }
    };

    // Selected resume name
    const selectedResumeName = resumes.find(r => r.id === selectedResumeId)?.title || resumes[0]?.title || 'Your Resume';

    return (
        <div className="min-h-[540px] w-[380px] bg-gray-50 flex flex-col font-sans text-gray-900 relative">
            {isPreparingTransit && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                    <h3 className="font-bold text-gray-900 text-base">Synchronizing Job Metadata</h3>
                    <p className="text-xs text-gray-500 mt-2 max-w-[240px]">
                        Scraping deep description details & preparing your CareerVivid workspace...
                    </p>
                </div>
            )}
            {/* Header */}
            <header className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-400 to-indigo-600 shadow ring-2 ring-white flex items-center justify-center text-white font-bold text-sm">
                        {(userProfile?.displayName?.[0] || userProfile?.email?.[0]) || 
                         (localProfile ? `${localProfile.firstName?.[0] || ''}${localProfile.lastName?.[0] || ''}`.toUpperCase() || 'U' : 'U')}
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 leading-tight">
                            {userProfile?.displayName || 
                             (localProfile ? `${localProfile.firstName || ''} ${localProfile.lastName || ''}`.trim() || 'CareerVivid User' : 'CareerVivid User')}
                        </h1>
                        <p className="text-[10px] uppercase tracking-wide font-semibold text-indigo-600">
                            CareerVivid
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => window.open('https://careervivid.app/profile', '_blank')}
                        title="Settings"
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Settings size={18} />
                    </button>
                    <button 
                        onClick={handleSignOut}
                        title="Sign Out"
                        className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 space-y-4 overflow-y-auto">

                {/* ── AutoFill CTA (Application Pages) ── */}
                {isApplicationPage && (
                    <div className="rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(99,102,241,0.15)] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                    {atsPlatform || 'Application'} Detected
                                </span>
                            </div>
                            <h2 className="text-base font-bold text-gray-900">Ready to Autofill</h2>
                            {hasProfile && (
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                                    <FileText size={12} className="text-indigo-500 flex-shrink-0" />
                                    <span className="font-medium">Using:</span>
                                    <select
                                        value={selectedResumeId || resumes[0]?.id || ''}
                                        onChange={(e) => {
                                            const newResumeId = e.target.value;
                                            if (!newResumeId) return;
                                            setSelectedResumeId(newResumeId);
                                            chrome.storage.local.set({ selectedResumeId: newResumeId });
                                            if (resolvedUserId) {
                                                chrome.runtime.sendMessage({
                                                    type: 'SYNC_PROFILE',
                                                    userId: resolvedUserId,
                                                    resumeId: newResumeId
                                                }, (res) => {
                                                    const _ = chrome.runtime.lastError;
                                                    if (res?.success) {
                                                        console.log('Profile synced with resume:', newResumeId);
                                                    } else {
                                                        console.error('Failed to sync profile:', res?.error);
                                                    }
                                                });
                                                window.postMessage({ type: 'CAREER_VIVID_EXTENSION_RESUME_CHANGED', resumeId: newResumeId }, '*');
                                            }
                                        }}
                                        className="bg-transparent hover:bg-white/80 border border-gray-200 hover:border-indigo-300 text-gray-700 text-xs font-semibold rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 max-w-[170px] truncate shadow-sm transition-all cursor-pointer"
                                    >
                                        {resumes.map((resume) => (
                                            <option key={resume.id} value={resume.id}>
                                                {resume.title || 'Untitled Resume'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Fill Result Panel */}
                            {fillResult && (
                                <div className="mt-3 p-3 bg-white rounded-xl border border-gray-100 space-y-1.5">
                                    <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                                        <CheckCircle size={14} />
                                        Autofill Complete — {fillResult.platform}
                                    </div>
                                    <div className="flex gap-3 text-xs">
                                        <span className="text-green-600 font-medium">✅ {fillResult.filledCount} filled</span>
                                        {fillResult.skippedCount > 0 && (
                                            <span className="text-amber-500 font-medium">⚠️ {fillResult.skippedCount} skipped</span>
                                        )}
                                        {fillResult.errorCount > 0 && (
                                            <span className="text-red-500 font-medium">❌ {fillResult.errorCount} errors</span>
                                        )}
                                    </div>
                                    {fillResult.skippedCount > 0 && (
                                        <p className="text-[10px] text-gray-400">
                                            Skipped fields may need manual input. Try <strong>Smart Fill</strong> for AI answers.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Two fill buttons */}
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleAutofill}
                                    disabled={isFilling || isGeneratingAI}
                                    title="Fills standard fields (name, email, phone, education) instantly"
                                    className="flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-black disabled:opacity-60 text-white py-3 rounded-xl font-semibold shadow transition-all hover:scale-[1.02] active:scale-[0.98] text-xs"
                                >
                                    {isFilling ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                    Quick Fill
                                </button>
                                <button
                                    onClick={handleSmartFill}
                                    disabled={isFilling || isGeneratingAI}
                                    title={prefetchReady ? 'AI answers are pre-generated and ready!' : 'Uses AI to generate personalized answers for open-ended questions'}
                                    className={`flex items-center justify-center gap-1.5 disabled:opacity-60 text-white py-3 rounded-xl font-semibold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] text-xs ${
                                        prefetchReady
                                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                                    }`}
                                >
                                    {isGeneratingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    {isGeneratingAI ? 'Thinking...' : prefetchReady ? 'Smart Fill ✨' : 'Smart Fill 🧠'}
                                </button>
                            </div>

                            {/* AI Error */}
                            {aiError && (
                                <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle size={12} /> {aiError}
                                </p>
                            )}
                        </div>

                        {/* AI Answer Review Panel */}
                        {showAiPanel && aiAnswers.length > 0 && (
                            <div className="border-t border-indigo-100 bg-white">
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">
                                            {aiAnswers.filter(a => a.source === 'ai_generated').length} AI answers ready
                                        </p>
                                        <p className="text-[10px] text-gray-400">Review each answer, then inject. You submit manually.</p>
                                    </div>
                                    <button
                                        onClick={handleFillAll}
                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                                            fillAllConfirm
                                                ? 'bg-amber-500 text-white animate-pulse'
                                                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                        }`}
                                    >
                                        {fillAllConfirm ? 'Confirm Fill All?' : 'Fill All'}
                                    </button>
                                </div>

                                <div className="space-y-1 px-2 pb-3 max-h-72 overflow-y-auto">
                                    {aiAnswers.map((a, i) => (
                                        <AIAnswerCard
                                            key={i}
                                            answer={a}
                                            onInject={() => handleInjectAnswer(a)}
                                        />
                                    ))}
                                </div>

                                {/* Post-submit: "Did you submit?" flow */}
                                {!markedApplied && (
                                    <div className="px-4 pb-4 pt-1 border-t border-gray-50">
                                        <p className="text-[10px] text-gray-400 mb-2">After you submit the form manually:</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Job ID (optional)"
                                                value={submittedJobId || ''}
                                                onChange={e => setSubmittedJobId(e.target.value)}
                                                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-300"
                                            />
                                            <button
                                                onClick={handleMarkApplied}
                                                disabled={!submittedJobId}
                                                className="flex items-center gap-1 text-xs font-bold bg-green-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors"
                                            >
                                                <Send size={11} /> Applied!
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {markedApplied && (
                                    <div className="px-4 pb-4 flex items-center gap-2 text-green-600 text-xs font-semibold">
                                        <CheckCircle size={14} /> Marked as Applied in your Job Tracker!
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Smart Cover Letter Section */}
                        <div className="border-t border-indigo-100 bg-white">
                            <button
                                onClick={() => setShowCoverLetterPanel(e => !e)}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-indigo-600 animate-pulse" />
                                    <span className="text-xs font-bold text-gray-800">
                                        ✨ Smart Cover Letter
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {coverLetterReady && (
                                        <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">
                                            ready
                                        </span>
                                    )}
                                    {showCoverLetterPanel ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                                </div>
                            </button>

                            {showCoverLetterPanel && (
                                <div className="px-4 pb-4 pt-1 space-y-3">
                                    {coverLetterReady ? (
                                        <div className="space-y-3">
                                            <div className="relative p-3 bg-gray-50 border border-gray-100 rounded-xl max-h-48 overflow-y-auto shadow-inner">
                                                <pre className="text-[10px] text-gray-600 font-mono whitespace-pre-wrap leading-relaxed select-all">
                                                    {coverLetter}
                                                </pre>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleCopyCoverLetter}
                                                    className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-[11px] font-bold shadow-sm transition-all active:scale-[0.98]"
                                                >
                                                    {copiedCoverLetter ? <CheckCheck size={13} /> : <Copy size={13} />}
                                                    {copiedCoverLetter ? 'Copied!' : 'Copy to Clipboard'}
                                                </button>
                                                <button
                                                    onClick={handleGenerateCoverLetter}
                                                    disabled={isGeneratingCoverLetter}
                                                    className="flex items-center justify-center gap-1 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-[11px] font-semibold transition-all"
                                                >
                                                    {isGeneratingCoverLetter ? <Loader2 size={13} className="animate-spin" /> : 'Regenerate'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-2">
                                            <p className="text-[11px] text-gray-500">
                                                No cover letter cached for this job description.
                                            </p>
                                            <button
                                                onClick={handleGenerateCoverLetter}
                                                disabled={isGeneratingCoverLetter || !scrapedJob?.description}
                                                className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all"
                                            >
                                                {isGeneratingCoverLetter ? (
                                                    <>
                                                        <Loader2 size={12} className="animate-spin" />
                                                        <span>Generating...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Wand2 size={12} />
                                                        <span>Generate Cover Letter</span>
                                                    </>
                                                )}
                                            </button>
                                            {!scrapedJob?.description && (
                                                <p className="text-[9px] text-red-400">
                                                    (Job description text required)
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {clError && (
                                        <p className="text-[10px] text-red-500 flex items-center gap-1">
                                            <AlertCircle size={11} /> {clError}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Job Detected / Generic CTA ── */}
                <div className="bg-white rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-gray-100">
                    <div className="flex items-start justify-between mb-1">
                        <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider mb-2">
                                {isJobSite ? 'Job Detected' : 'Ready to Apply'}
                            </span>
                            <h2 className="text-base font-bold text-gray-900 leading-tight">
                                {isJobSite && scrapedJob ? scrapedJob.title : 'Supercharge Your Job Hunt'}
                            </h2>
                            {isJobSite && scrapedJob && (
                                <p className="text-xs text-gray-500 mt-0.5">{scrapedJob.company}</p>
                            )}
                        </div>
                        {isJobSite && (
                            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                                <Briefcase size={15} />
                            </div>
                        )}
                    </div>

                    {isJobSite ? (
                        <button
                            onClick={() => handleAction('save_job')}
                            className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-semibold shadow-lg shadow-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                        >
                            <Plus size={16} />
                            <span>Save Job to Tracker</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => handleAction('new_resume')}
                            className="mt-3 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                        >
                            <Plus size={16} />
                            <span>Create AI Resume</span>
                        </button>
                    )}
                </div>

                {/* ── Secondary Actions ── */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => handleAction(isJobSite ? 'tailor_resume' : 'new_resume')}
                        className="group flex flex-col items-start p-3.5 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:border-purple-100 transition-all duration-300"
                    >
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-600 mb-2 group-hover:scale-110 transition-transform">
                            <Wand2 size={18} />
                        </div>
                        <span className="font-bold text-gray-900 text-sm">Tailor Resume</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">Match keywords</span>
                    </button>

                    <button
                        onClick={() => handleAction('practice_interview')}
                        className="group flex flex-col items-start p-3.5 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:border-pink-100 transition-all duration-300"
                    >
                        <div className="p-2 rounded-xl bg-pink-50 text-pink-600 mb-2 group-hover:scale-110 transition-transform">
                            <Mic size={18} />
                        </div>
                        <span className="font-bold text-gray-900 text-sm">Practice</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">AI Mock Interview</span>
                    </button>
                </div>

                {/* ── Recent Resumes ── */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resumes</h3>
                        <button onClick={() => window.open('https://careervivid.app/resumes', '_blank')}
                            className="text-[10px] text-indigo-500 font-semibold hover:underline flex items-center gap-0.5">
                            View all <ChevronRight size={10} />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {resumes.slice(0, 2).map((resume) => (
                            <div
                                key={resume.id}
                                onClick={() => window.open(`https://careervivid.app/edit/${resume.id}`, '_blank')}
                                className={`flex items-center gap-3 p-3 bg-white rounded-xl border transition-all cursor-pointer shadow-sm group ${selectedResumeId === resume.id ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'}`}
                            >
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${selectedResumeId === resume.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-50 text-gray-400 group-hover:text-indigo-500'}`}>
                                    <FileText size={15} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-gray-900 truncate">{resume.title || 'Untitled'}</div>
                                    {selectedResumeId === resume.id && (
                                        <div className="text-[10px] text-indigo-600 font-semibold">Used for autofill</div>
                                    )}
                                </div>
                                <ExternalLink size={12} className="text-gray-300 group-hover:text-indigo-400 flex-shrink-0" />
                            </div>
                        ))}
                        {resumes.length === 0 && (
                            <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-[10px] text-gray-400">No resumes yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-4 bg-white border-t border-gray-100 text-center sticky bottom-0 z-10">
                <button
                    onClick={() => window.open('https://careervivid.app/dashboard', '_blank')}
                    className="text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 w-full"
                >
                    <span>Open Dashboard</span>
                    <ExternalLink size={13} />
                </button>
            </footer>
        </div>
    );
};

export default ExtensionHome;

// ── AIAnswerCard sub-component ────────────────────────────────────────────────

const CONFIDENCE_STYLES = {
    high:   'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    low:    'bg-red-100 text-red-600',
};

const AIAnswerCard: React.FC<{ answer: AIAnswer; onInject: () => void }> = ({ answer, onInject }) => {
    const [expanded, setExpanded] = React.useState(false);

    const isSkipped = answer.source === 'skipped' || !answer.answer;
    const isAI = answer.source === 'ai_generated';
    const isLibrary = answer.source === 'answer_library';

    return (
        <div className={`rounded-xl border p-2.5 transition-all ${answer.injected ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
            <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate max-w-[140px]">
                            {answer.label}
                        </span>
                        {(isAI || isLibrary) && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${CONFIDENCE_STYLES[answer.confidence]}`}>
                                {answer.confidence}
                            </span>
                        )}
                        {isLibrary && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                library
                            </span>
                        )}
                        {answer.source === 'profile_field' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                profile
                            </span>
                        )}
                    </div>

                    {isSkipped ? (
                        <p className="text-[10px] text-gray-400 italic">No answer — fill manually</p>
                    ) : (
                        <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                            {answer.answer}
                        </p>
                    )}

                    {isAI && answer.reasoning && (
                        <button
                            onClick={() => setExpanded(e => !e)}
                            className="flex items-center gap-0.5 text-[9px] text-gray-400 hover:text-gray-600 mt-0.5"
                        >
                            {expanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                            {expanded ? 'less' : 'why?'}
                        </button>
                    )}
                    {expanded && answer.reasoning && (
                        <p className="text-[9px] text-gray-400 italic mt-1 leading-relaxed">{answer.reasoning}</p>
                    )}
                </div>

                {!isSkipped && (
                    <button
                        onClick={onInject}
                        disabled={answer.injected}
                        className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                            answer.injected
                                ? 'bg-green-100 text-green-600 cursor-default'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                        }`}
                    >
                        {answer.injected ? <CheckCheck size={11} /> : <Copy size={11} />}
                        {answer.injected ? 'Done' : 'Fill'}
                    </button>
                )}
            </div>
        </div>
    );
};
