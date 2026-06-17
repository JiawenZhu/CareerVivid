/// <reference types="chrome" />
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Wand2, Mic, ChevronRight, FileText, Loader2, Mail, LayoutDashboard, ExternalLink, Briefcase, Target, MessageSquareText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useResumes } from '../../hooks/useResumes';
import { getAppUrl, getResumeBuilderUrl, isCareerVividAppUrl } from '../../utils/extensionUtils';
import { ResumeMatchAnalysis } from '../../types';
import { FREE_PLAN_CREDIT_LIMIT, PRO_PLAN_CREDIT_LIMIT, PRO_MAX_PLAN_CREDIT_LIMIT, ENTERPRISE_PLAN_CREDIT_LIMIT } from '../../config/creditCosts';

// Extracted Sub-Components
import { ExtensionHeader } from '../components/ExtensionHeader';
import type { AutoFillResult } from '../components/AutoFillCard';
import { MatchBreakdownCard } from '../components/MatchBreakdownCard';
import { AIAnswerCard, AIAnswer } from '../components/AIAnswerCard';

type ScrapedJob = { title: string; company: string; location?: string; description?: string; salary?: string };

const JOB_SITE_PATTERNS = [
    'linkedin.com/jobs',
    'indeed.com',
    'greenhouse.io',
    'jobs.lever.co',
    'myworkdayjobs.com',
    'ashbyhq.com',
    'smartrecruiters.com',
    'workable.com',
    'bamboohr.com',
    'csod.com/ux/ats/careersite',
    'cornerstoneondemand.com'
];

const CUSTOM_JOB_PATHS = [
    '/jobs/',
    '/careers/',
    '/careers-at/',
    '/apply/',
    '/positions/',
    '/job/',
    '/position/',
    '/requisition/'
];

const isLikelyJobSiteUrl = (url: string) => {
    const lowercaseUrl = url.toLowerCase();
    const isKnownJobSite = JOB_SITE_PATTERNS.some(pattern => lowercaseUrl.includes(pattern));
    const isCustomJobPage = CUSTOM_JOB_PATHS.some(path => lowercaseUrl.includes(path)) ||
        lowercaseUrl.includes('careers.') ||
        lowercaseUrl.includes('jobs.');

    return isKnownJobSite || isCustomJobPage;
};

const makeStorageKey = (namespace: string, parts: Array<string | null | undefined>) => {
    const input = parts.filter(Boolean).join('|');
    let hash = 0x811c9dc5;

    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193);
    }

    return `${namespace}_${(hash >>> 0).toString(36)}`;
};

const getProfileCreditLimit = (profile: any): number => {
    if (!profile) return FREE_PLAN_CREDIT_LIMIT;

    let limit = FREE_PLAN_CREDIT_LIMIT;
    const plan = profile.plan || 'free';

    if (plan === 'pro' || plan === 'premium' || plan === 'pro_monthly' || plan === 'pro_sprint') {
        limit = PRO_PLAN_CREDIT_LIMIT;
    } else if (plan === 'max' || plan === 'pro_max') {
        limit = PRO_MAX_PLAN_CREDIT_LIMIT;
    } else if (plan === 'enterprise') {
        limit = (profile.seats || 1) * ENTERPRISE_PLAN_CREDIT_LIMIT;
    }

    return limit + (profile.promotions?.tokenCredits || 0);
};

const getProfileAIUsage = (profile: any): { count: number; limit: number } | null => {
    if (!profile) return null;

    return {
        count: Number(profile.aiUsage?.count || 0),
        limit: getProfileCreditLimit(profile),
    };
};

const ExtensionHome: React.FC = () => {
    const { userProfile: contextUserProfile, currentUser, logOut, aiUsage: contextAIUsage, refreshAIUsage, loading: authLoading } = useAuth();
    const refreshAIUsageRef = useRef(refreshAIUsage);
    const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
    const [isAuthResolved, setIsAuthResolved] = useState(false);
    const [localProfile, setLocalProfile] = useState<any>(null);
    const [restUserProfile, setRestUserProfile] = useState<any>(null);
    const [localPhotoURL, setLocalPhotoURL] = useState<string | null>(null);
    const [matchScore, setMatchScore] = useState<number | null>(null);
    const [matchAnalysis, setMatchAnalysis] = useState<ResumeMatchAnalysis | null>(null);
    const [isCalculatingScore, setIsCalculatingScore] = useState(false);

    const userProfile = contextUserProfile || restUserProfile;
    const effectiveAIUsage = contextAIUsage || getProfileAIUsage(userProfile);
    const isOutOfCredits = effectiveAIUsage ? effectiveAIUsage.count >= effectiveAIUsage.limit : false;

    useEffect(() => {
        refreshAIUsageRef.current = refreshAIUsage;
    }, [refreshAIUsage]);

    useEffect(() => {
        if (authLoading) return; // wait for Firebase auth to settle
        if (currentUser?.uid) {
            setResolvedUserId(currentUser.uid);
            setIsAuthResolved(true);
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
                setIsAuthResolved(true);
            });
        }
    }, [currentUser, authLoading]);

    useEffect(() => {
        if (!resolvedUserId || currentUser) {
            setRestUserProfile(null);
            return;
        }

        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({ type: 'FETCH_USER_PROFILE', userId: resolvedUserId }, (res) => {
                const _ = chrome.runtime.lastError;
                if (res?.success && res.profile) {
                    setRestUserProfile(res.profile);
                } else {
                    if (import.meta.env.DEV) {
                        if (res?.error === 'invalid_auth_token') {
                            console.debug('Invalid extension auth token; waiting for real CareerVivid sign-in');
                        } else {
                            console.debug('Could not fetch user profile via REST:', res?.error);
                        }
                    }
                }
            });
        }
    }, [resolvedUserId, currentUser]);

    useEffect(() => {
        const loadLocalState = () => {
            chrome.storage.local.get(['devModeAuth', 'autofillProfile', 'selectedResumeId', 'photoURL'], (res) => {
                if (res.devModeAuth) {
                    setLocalProfile(null);
                    setHasProfile(false);
                    setSelectedResumeId(null);
                    setLocalPhotoURL(null);
                    return;
                }

                setLocalProfile(res.autofillProfile || null);
                setHasProfile(!!res.autofillProfile);
                setSelectedResumeId((res.selectedResumeId as string | undefined) || null);
                setLocalPhotoURL(res.photoURL || null);
            });
        };

        loadLocalState();

        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'local') {
                if (changes.devModeAuth || changes.autofillProfile || changes.selectedResumeId || changes.photoURL) {
                    loadLocalState();
                }
            }
        };

        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.onChanged.addListener(handleStorageChange);
            return () => chrome.storage.onChanged.removeListener(handleStorageChange);
        }
    }, []);

    const { resumes, isLoading: isLoadingResumes } = useResumes(resolvedUserId);
    const [currentTab, setCurrentTab] = useState<{ url: string; title: string } | null>(null);
    const [isJobSite, setIsJobSite] = useState(false);
    const [isApplicationPage, setIsApplicationPage] = useState(false);
    const [atsPlatform, setAtsPlatform] = useState<string | null>(null);
    const [scrapedJob, setScrapedJob] = useState<ScrapedJob | null>(null);
    const [fillResult, setFillResult] = useState<AutoFillResult | null>(null);
    const [isFilling, setIsFilling] = useState(false);
    const [hasProfile, setHasProfile] = useState(false);
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
    const activeResume = resumes.find(resume => resume.id === selectedResumeId) || resumes[0] || null;
    const activeResumeTitle = activeResume?.title || null;

    // AI Smart Fill state
    const [aiAnswers, setAiAnswers] = useState<AIAnswer[]>([]);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [fillAllConfirm, setFillAllConfirm] = useState(false);
    const [submittedJobId, setSubmittedJobId] = useState<string | null>(null);

    // Mark as Applied state
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
    const contextRequestIdRef = useRef(0);
    const lastTabUrlRef = useRef<string | null>(null);

    const resetJobDependentState = useCallback(() => {
        setScrapedJob(null);
        setMatchScore(null);
        setMatchAnalysis(null);
        setIsCalculatingScore(false);
        setFillResult(null);
        setIsFilling(false);
        setAiAnswers([]);
        setAiError(null);
        setShowAiPanel(false);
        setFillAllConfirm(false);
        setSubmittedJobId(null);
        setMarkedApplied(false);
        setPrefetchReady(false);
        setPrefetchCacheKey(null);
        setCoverLetter('');
        setIsGeneratingCoverLetter(false);
        setClError(null);
        setCoverLetterReady(false);
        setShowCoverLetterPanel(false);
        setCopiedCoverLetter(false);
    }, []);

    const refreshActiveTabContext = useCallback(() => {
        if (typeof chrome === 'undefined' || !chrome.tabs) return;

        const requestId = contextRequestIdRef.current + 1;
        contextRequestIdRef.current = requestId;
        const isCurrentRequest = () => contextRequestIdRef.current === requestId;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!isCurrentRequest()) return;

            const tab = tabs[0];
            const url = tab?.url || '';
            const title = tab?.title || '';

            if (!url) {
                lastTabUrlRef.current = null;
                setCurrentTab(null);
                setIsJobSite(false);
                setIsApplicationPage(false);
                setAtsPlatform(null);
                resetJobDependentState();
                return;
            }

            const urlChanged = lastTabUrlRef.current !== url;
            if (urlChanged) {
                lastTabUrlRef.current = url;
                resetJobDependentState();
            }

            setCurrentTab({ url, title });

            if (isCareerVividAppUrl(url)) {
                setIsJobSite(false);
                setIsApplicationPage(false);
                setAtsPlatform(null);
                setScrapedJob(null);
                setMatchScore(null);
                setMatchAnalysis(null);
                return;
            }

            setIsJobSite(isLikelyJobSiteUrl(url));

            const cacheKey = makeStorageKey('prefetch', [url]);
            const clCacheKey = makeStorageKey('coverletter', [url]);
            setPrefetchCacheKey(cacheKey);
            chrome.storage.local.get([cacheKey, clCacheKey], (cached: any) => {
                if (!isCurrentRequest()) return;

                const hitAnswers = cached[cacheKey];
                const hitCL = cached[clCacheKey];
                const TTL = 30 * 60 * 1000;

                if (hitAnswers && (Date.now() - hitAnswers.cachedAt) < TTL && hitAnswers.answers?.length) {
                    setPrefetchReady(true);
                    setAiAnswers(hitAnswers.answers);
                }

                if (hitCL && (Date.now() - hitCL.cachedAt) < TTL && hitCL.content) {
                    setCoverLetter(hitCL.content);
                    setCoverLetterReady(true);
                }
            });

            if (!tab?.id) return;

            chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JOB_DATA' }, (response) => {
                const _ = chrome.runtime.lastError;
                if (!isCurrentRequest()) return;

                if (response?.job) {
                    setScrapedJob(response.job);
                    setIsJobSite(true);
                    return;
                }

                setScrapedJob(null);
                setMatchScore(null);
                setMatchAnalysis(null);
            });

            chrome.tabs.sendMessage(tab.id, { type: 'GET_ATS_CONTEXT' }, (response) => {
                const _ = chrome.runtime.lastError;
                if (!isCurrentRequest()) return;

                if (response?.context) {
                    setIsApplicationPage(response.context.isApplicationPage);
                    setAtsPlatform(response.context.platform);
                    if (response.context.isApplicationPage || response.context.platform) {
                        setIsJobSite(true);
                    }
                    return;
                }

                setIsApplicationPage(false);
                setAtsPlatform(null);
            });
        });
    }, [resetJobDependentState]);

    useEffect(() => {
        if (!resolvedUserId || !scrapedJob?.description || !localProfile || !currentTab?.url) {
            setMatchScore(null);
            setMatchAnalysis(null);
            return;
        }

        const runAnalysis = async () => {
            const cacheKey = makeStorageKey('analysis', [
                currentTab.url,
                scrapedJob.title,
                scrapedJob.company,
                selectedResumeId || 'default',
            ]);

            try {
                setMatchScore(null);
                setMatchAnalysis(null);
                setIsCalculatingScore(true);

                // First check cache
                const cachedRes = await new Promise<any>((resolve) => {
                    chrome.storage.local.get([cacheKey], resolve);
                });

                if (cachedRes && cachedRes[cacheKey]) {
                    const cachedData = cachedRes[cacheKey];
                    // Cache TTL: 2 hours
                    if (Date.now() - cachedData.timestamp < 2 * 60 * 60 * 1000) {
                        setMatchScore(cachedData.score);
                        setMatchAnalysis(cachedData.analysis);
                        setIsCalculatingScore(false);
                        return;
                    }
                }

                // Cache miss — block if the user is out of AI credits
                if (isOutOfCredits) {
                    setMatchScore(null);
                    setMatchAnalysis(null);
                    setIsCalculatingScore(false);
                    return;
                }

                // Construct a unified resume text from localProfile structured fields
                const resumeParts = [
                    localProfile.summary || '',
                    localProfile.skills?.join(', ') || '',
                    localProfile.workExperience?.map((w: any) => `${w.title} at ${w.company}\n${w.description}`).join('\n\n') || '',
                    localProfile.education?.map((e: any) => `${e.degree} in ${e.fieldOfStudy} from ${e.school}`).join('\n\n') || '',
                ];
                const resumeText = resumeParts.filter(Boolean).join('\n\n');
                // Truncate job description to 2500 characters for high speed matching
                const truncatedJd = scrapedJob.description.slice(0, 2500);

                const result = await new Promise<{
                    success?: boolean;
                    analysis?: ResumeMatchAnalysis;
                    credits?: { count: number; limit: number; remaining: number; charged: number };
                    error?: string;
                }>((resolve) => {
                    chrome.runtime.sendMessage({
                        type: 'ANALYZE_RESUME_MATCH',
                        resumeText,
                        jobDescription: truncatedJd,
                        pageUrl: currentTab.url,
                        jobTitle: scrapedJob.title || '',
                        companyName: scrapedJob.company || '',
                        resumeId: selectedResumeId || '',
                    }, (response) => {
                        const _ = chrome.runtime.lastError;
                        resolve(response || { success: false, error: 'Extension background service did not respond.' });
                    });
                });

                if (!result?.success || !result.analysis) {
                    throw new Error(result?.error || 'AI match analysis failed.');
                }

                if (result.credits) {
                    setRestUserProfile((profile: any) => profile ? {
                        ...profile,
                        aiUsage: {
                            ...(profile.aiUsage || {}),
                            count: result.credits!.count,
                            monthlyLimit: result.credits!.limit,
                        },
                    } : profile);
                    refreshAIUsageRef.current().catch(() => {
                        // Background auth may be the active auth source in the extension side panel.
                    });
                }

                const analysis = result.analysis;
                if (typeof analysis?.matchPercentage === 'number') {
                    const score = Math.round(analysis.matchPercentage);
                    setMatchScore(score);
                    setMatchAnalysis(analysis);

                    // Save to cache
                    chrome.storage.local.set({
                        [cacheKey]: {
                            score,
                            analysis,
                            timestamp: Date.now()
                        }
                    });
                }
            } catch (err) {
                if (import.meta.env.DEV) {
                    console.debug('[CareerVivid] Match score calculation failed:', err);
                }
                setMatchScore(null);
                setMatchAnalysis(null);
            } finally {
                setIsCalculatingScore(false);
            }
        };

        runAnalysis();
    }, [scrapedJob?.description, scrapedJob?.title, scrapedJob?.company, localProfile, resolvedUserId, currentTab?.url, selectedResumeId, isOutOfCredits]);

    // Listen for FILL_COMPLETE from content script
    useEffect(() => {
        const handleMessage = (message: any) => {
            if (message.type === 'AUTH_STATE_CHANGED') {
                // Reload the side panel so auth state, gates, and data are all fresh
                window.location.reload();
                return;
            }
            if (message.type === 'FILL_COMPLETE') {
                setFillResult(message.result);
                setIsFilling(false);
                if (!submittedJobId && scrapedJob) {
                    setSubmittedJobId(window.location.href);
                }
            }
            if (message.type === 'JOB_CONTEXT_CHANGED') {
                const applyJobContext = (url: string, title: string) => {
                    if (url && lastTabUrlRef.current !== url) {
                        lastTabUrlRef.current = url;
                        resetJobDependentState();
                    }
                    if (url) {
                        setCurrentTab({ url, title });
                        setPrefetchCacheKey(makeStorageKey('prefetch', [url]));
                    }
                    setScrapedJob(message.job || null);
                    setIsApplicationPage(!!message.context?.isApplicationPage);
                    setAtsPlatform(message.context?.platform || null);
                    setIsJobSite(!!message.job || !!message.context?.isApplicationPage || !!message.context?.platform || isLikelyJobSiteUrl(url));
                };

                if (typeof chrome !== 'undefined' && chrome.tabs) {
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        const activeUrl = tabs[0]?.url || '';
                        if (message.url && activeUrl && message.url !== activeUrl) return;
                        applyJobContext(activeUrl || message.url || '', tabs[0]?.title || message.title || '');
                    });
                } else {
                    applyJobContext(message.url || '', message.title || '');
                }
            }
        };
        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, [submittedJobId, scrapedJob, resetJobDependentState]);

    // On mount: get tab info, ATS context, cached profile, prefetch cache
    useEffect(() => {
        refreshActiveTabContext();

        chrome.storage.local.get(['autofillProfile', 'selectedResumeId'], (result) => {
            setHasProfile(!!result.autofillProfile);
            setSelectedResumeId((result.selectedResumeId as string | undefined) || null);
        });
    }, [refreshActiveTabContext]);

    useEffect(() => {
        if (typeof chrome === 'undefined' || !chrome.tabs) return;

        const handleActivated = () => {
            refreshActiveTabContext();
        };

        const handleUpdated = (_tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
            if (changeInfo.status === 'complete' || changeInfo.url) {
                refreshActiveTabContext();
            }
        };

        chrome.tabs.onActivated.addListener(handleActivated);
        chrome.tabs.onUpdated.addListener(handleUpdated);

        return () => {
            chrome.tabs.onActivated.removeListener(handleActivated);
            chrome.tabs.onUpdated.removeListener(handleUpdated);
        };
    }, [refreshActiveTabContext]);

    // Auto-sync profile when resumes are loaded
    useEffect(() => {
        if (!resolvedUserId || !resumes.length || hasProfile) return;
        const defaultResume = resumes[0];
        if (defaultResume?.id) {
            chrome.runtime.sendMessage({
                type: 'SYNC_PROFILE',
                userId: resolvedUserId,
                resumeId: defaultResume.id,
            }, (res) => {
                const _ = chrome.runtime.lastError;
                if (res?.success) {
                    setHasProfile(true);
                    setSelectedResumeId(defaultResume.id!);
                }
            });
        }
    }, [resolvedUserId, resumes, hasProfile]);

    const handleSmartFill = useCallback(() => {
        if (!currentTab) return;

        if (prefetchReady && aiAnswers.length > 0) {
            setShowAiPanel(true);
            setFillAllConfirm(false);
            return;
        }

        if (isOutOfCredits) {
            setAiError("You have reached your monthly AI credit limit. Please upgrade to CareerVivid Pro to get unlimited answers.");
            return;
        }

        setIsGeneratingAI(true);
        setAiError(null);
        setShowAiPanel(false);
        setAiAnswers([]);
        setFillAllConfirm(false);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) {
                setAiError('No active tab found.');
                setIsGeneratingAI(false);
                return;
            }

            chrome.tabs.sendMessage(tabs[0].id, { type: 'EXTRACT_FORM_QUESTIONS' }, (response) => {
                const _ = chrome.runtime.lastError;
                const questions = response?.questions || [];

                if (questions.length === 0) {
                    setAiError(null);
                    setIsGeneratingAI(false);
                    return;
                }

                chrome.runtime.sendMessage({
                    type: 'GENERATE_AI_ANSWERS',
                    questions,
                    companyName: scrapedJob?.company || document.title,
                    jobTitle: scrapedJob?.title || 'Unknown Role',
                    jobDescription: scrapedJob?.description || '',
                }, (res) => {
                    const _ = chrome.runtime.lastError;
                    setIsGeneratingAI(false);
                    if (res?.success && res.answers) {
                        setAiAnswers(res.answers);
                        setShowAiPanel(true);
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
    }, [currentTab, scrapedJob, prefetchReady, aiAnswers, prefetchCacheKey, isOutOfCredits]);

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

    const handleFillAll = useCallback(() => {
        if (!fillAllConfirm) {
            setFillAllConfirm(true);
            return;
        }
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

    const handleAutofill = useCallback(() => {
        if (!hasProfile) {
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

    const handleMarkApplied = useCallback(() => {
        if (markedApplied) return;
        setMarkedApplied(true);
        chrome.runtime.sendMessage({
            type: 'UPDATE_JOB_STATUS',
            url: currentTab?.url || '',
            title: scrapedJob?.title || '',
            company: scrapedJob?.company || '',
            status: 'Applied',
            stage: 'applied',
        }, () => { const _ = chrome.runtime.lastError; });
    }, [markedApplied, currentTab, scrapedJob]);

    const getSelectedResumeContext = () => {
        const activeResume = resumes.find(resume => resume.id === selectedResumeId) || resumes[0];
        return {
            resumeId: activeResume?.id || selectedResumeId || '',
            resumeTitle: activeResume?.title || '',
        };
    };

    const buildTrackerTransitPath = (job: ScrapedJob, url: string, stage?: string) => {
        const resumeContext = getSelectedResumeContext();
        const params = new URLSearchParams({
            source: 'extension_tracker',
            url,
            stage: stage || 'wishlist',
        });

        if (job.description) params.set('fallbackDescription', job.description);
        if (job.title) params.set('title', job.title);
        if (job.company) params.set('company', job.company);
        if (job.location) params.set('location', job.location);
        if (job.salary) params.set('salary', job.salary);
        if (resumeContext.resumeId) params.set('resumeId', resumeContext.resumeId);
        if (resumeContext.resumeTitle) params.set('resumeTitle', resumeContext.resumeTitle);

        return `/job-tracker?${params.toString()}`;
    };

    const handleAction = async (action: string, stage?: string) => {
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
                    window.open(getAppUrl(buildTrackerTransitPath(scrapedJob, currentTab.url, stage)), '_blank');
                    return;
                }

                const resumeContext = getSelectedResumeContext();
                const res = await new Promise<any>((resolve) => {
                    chrome.runtime.sendMessage({
                        type: 'CREATE_TRANSIT_DOC',
                        userId: resolvedUserId,
                        job: {
                            title: scrapedJob.title || '',
                            company: scrapedJob.company || '',
                            location: scrapedJob.location || '',
                            description: scrapedJob.description || '',
                            url: currentTab?.url || '',
                            salary: scrapedJob.salary || '',
                            stage: stage || 'wishlist',
                            resumeId: resumeContext.resumeId,
                            resumeTitle: resumeContext.resumeTitle,
                            matchAnalysisJson: resumeContext.resumeId && matchAnalysis ? JSON.stringify(matchAnalysis) : '',
                        }
                    }, (response) => {
                        const _ = chrome.runtime.lastError;
                        resolve(response);
                    });
                });

                if (!res?.success || !res?.scrapeId) {
                    throw new Error(res?.error || 'Failed to create transit doc');
                }

                window.open(getAppUrl(`/job-tracker?source=extension_tracker&scrapeId=${res.scrapeId}`), '_blank');
            } catch (error: any) {
                if (import.meta.env.DEV) {
                    console.debug('Error creating transit doc:', error);
                }
                window.open(getAppUrl(buildTrackerTransitPath(scrapedJob, currentTab.url, stage)), '_blank');
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

                const resumeContext = getSelectedResumeContext();
                const res = await new Promise<any>((resolve) => {
                    chrome.runtime.sendMessage({
                        type: 'CREATE_TRANSIT_DOC',
                        userId: resolvedUserId,
                        job: {
                            title: scrapedJob.title || '',
                            company: scrapedJob.company || '',
                            description: scrapedJob.description || '',
                            url: currentTab?.url || '',
                            resumeId: resumeContext.resumeId,
                            resumeTitle: resumeContext.resumeTitle,
                        }
                    }, (response) => {
                        const _ = chrome.runtime.lastError;
                        resolve(response);
                    });
                });

                if (!res?.success || !res?.scrapeId) {
                    throw new Error(res?.error || 'Failed to create transit doc');
                }

                const targetResumeId = selectedResumeId || resumes[0]?.id;
                if (targetResumeId) {
                    window.open(getAppUrl(`/edit/${targetResumeId}?source=extension_tailor&scrapeId=${res.scrapeId}`), '_blank');
                } else {
                    window.open(getAppUrl(`/newresume?source=extension_tailor&scrapeId=${res.scrapeId}`), '_blank');
                }
            } catch (error: any) {
                const targetResumeId = selectedResumeId || resumes[0]?.id;
                chrome.storage.local.set({ pending_tailor_jd: scrapedJob.description || '' }, () => {
                    if (targetResumeId) {
                        window.open(getAppUrl(`/edit/${targetResumeId}?source=extension_tailor&jobTitle=${encodeURIComponent(scrapedJob.title)}&fallbackDescription=${encodeURIComponent(scrapedJob.description || '')}`), '_blank');
                    } else {
                        window.open(getAppUrl(`/newresume?source=extension_tailor&jobTitle=${encodeURIComponent(scrapedJob.title)}&fallbackDescription=${encodeURIComponent(scrapedJob.description || '')}`), '_blank');
                    }
                });
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

                const resumeContext = getSelectedResumeContext();
                const res = await new Promise<any>((resolve) => {
                    chrome.runtime.sendMessage({
                        type: 'CREATE_TRANSIT_DOC',
                        userId: resolvedUserId,
                        job: {
                            title: scrapedJob.title || '',
                            company: scrapedJob.company || '',
                            description: scrapedJob.description || '',
                            url: currentTab?.url || '',
                            resumeId: resumeContext.resumeId,
                            resumeTitle: resumeContext.resumeTitle,
                        }
                    }, (response) => {
                        const _ = chrome.runtime.lastError;
                        resolve(response);
                    });
                });

                if (!res?.success || !res?.scrapeId) {
                    throw new Error(res?.error || 'Failed to create transit doc');
                }

                const targetResumeId = selectedResumeId || resumes[0]?.id;
                if (targetResumeId) {
                    window.open(getAppUrl(`/interview-studio?source=extension_practice&scrapeId=${res.scrapeId}&resumeId=${targetResumeId}`), '_blank');
                } else {
                    window.open(getAppUrl(`/interview-studio?source=extension_practice&scrapeId=${res.scrapeId}`), '_blank');
                }
            } catch (error: any) {
                const targetResumeId = selectedResumeId || resumes[0]?.id;
                const cleanTitle = scrapedJob.title ? encodeURIComponent(scrapedJob.title.replace(/\(.*\)/, '').trim()) : 'General';
                if (targetResumeId) {
                    window.open(getAppUrl(`/interview-studio/new?role=${cleanTitle}&resumeId=${targetResumeId}`), '_blank');
                } else {
                    window.open(getAppUrl(`/interview-studio/new?role=${cleanTitle}`), '_blank');
                }
            } finally {
                setIsPreparingTransit(false);
            }
        } else if (action === 'cover_letter' && scrapedJob) {
            if (!resolvedUserId) {
                alert('Please sign in to CareerVivid before generating a cover letter.');
                window.open(getAppUrl('/login'), '_blank');
                return;
            }
            try {
                setIsPreparingTransit(true);
                const tokenRes = await new Promise<{ firebaseIdToken?: string }>(resolve => {
                    chrome.storage.local.get(['firebaseIdToken'], resolve);
                });
                const token = tokenRes.firebaseIdToken;

                const fallbackResumeId = selectedResumeId || resumes[0]?.id;
                if (!token || token === 'mock-dev-id-token') {
                    if (fallbackResumeId) {
                        window.open(getAppUrl(`/edit/${fallbackResumeId}?coverLetter=1`), '_blank');
                    } else {
                        window.open(getAppUrl('/dashboard'), '_blank');
                    }
                    setIsPreparingTransit(false);
                    return;
                }

                const resumeContext = getSelectedResumeContext();
                const res = await new Promise<any>((resolve) => {
                    chrome.runtime.sendMessage({
                        type: 'CREATE_TRANSIT_DOC',
                        userId: resolvedUserId,
                        job: {
                            title: scrapedJob.title || '',
                            company: scrapedJob.company || '',
                            description: scrapedJob.description || '',
                            url: currentTab?.url || '',
                            stage: 'applying',
                            resumeId: resumeContext.resumeId,
                            resumeTitle: resumeContext.resumeTitle,
                        }
                    }, (response) => {
                        const _ = chrome.runtime.lastError;
                        resolve(response);
                    });
                });

                if (!res?.success || !res?.scrapeId) {
                    throw new Error(res?.error || 'Failed to create transit doc');
                }

                const targetResumeId = selectedResumeId || resumes[0]?.id;
                if (targetResumeId) {
                    window.open(getAppUrl(`/edit/${targetResumeId}?source=extension_cl&scrapeId=${res.scrapeId}`), '_blank');
                } else {
                    window.open(getAppUrl(`/newresume?source=extension_cl&scrapeId=${res.scrapeId}`), '_blank');
                }
            } catch {
                const fallbackId = selectedResumeId || resumes[0]?.id;
                if (fallbackId) {
                    window.open(getAppUrl(`/edit/${fallbackId}?coverLetter=1`), '_blank');
                } else {
                    window.open(getAppUrl('/dashboard'), '_blank');
                }
            } finally {
                setIsPreparingTransit(false);
            }
        } else if (action === 'new_resume') {
            window.open(getResumeBuilderUrl(), '_blank');
        }
    };

    const hasNoResumes = !isLoadingResumes && resumes.length === 0;
    const isGuest = isAuthResolved && !resolvedUserId;
    const needsResume = isAuthResolved && !!resolvedUserId && !isLoadingResumes && resumes.length === 0;

    // ── Gate: Loading ──────────────────────────────────────────────────────────
    if (!isAuthResolved || authLoading) {
        return (
            <div className="min-h-[540px] h-screen w-full bg-[#f8f8fb] flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#625bd5] flex items-center justify-center shadow-[0_10px_20px_rgba(98,91,213,0.16)]">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
                <p className="text-xs font-semibold text-gray-400">Loading CareerVivid...</p>
            </div>
        );
    }

    // ── Gate: Sign In ──────────────────────────────────────────────────────────
    if (isGuest) {
        return (
            <div className="min-h-[540px] h-screen w-full bg-[#f8f8fb] flex flex-col font-sans text-gray-900">
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    {/* Logo mark */}
                    <div className="w-14 h-14 rounded-2xl bg-[#625bd5] flex items-center justify-center shadow-[0_14px_28px_rgba(98,91,213,0.18)] mb-5">
                        <Wand2 className="w-7 h-7 text-white" />
                    </div>

                    <h1 className="text-xl font-semibold text-gray-950 leading-tight">
                        Sign in to unlock<br />your job search tools
                    </h1>
                    <p className="mt-2 text-xs text-gray-500 leading-relaxed max-w-[230px]">
                        Track jobs, match your resume to roles, and prepare tailored application materials.
                    </p>

                    {/* Value props */}
                    <div className="mt-5 w-full max-w-[260px] space-y-2 text-left">
                        {[
                            { icon: Briefcase, text: 'Save roles into your job tracker' },
                            { icon: Target, text: 'AI resume match score and keyword analysis' },
                            { icon: MessageSquareText, text: 'Support for application questions' },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-2.5 bg-white rounded-2xl px-3 py-2.5 border border-[#ececf4] shadow-sm">
                                <span className="h-6 w-6 rounded-xl bg-[#eef0ff] text-[#625bd5] flex items-center justify-center flex-shrink-0">
                                    <Icon size={12} />
                                </span>
                                <span className="text-[11px] font-semibold text-gray-700">{text}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTAs */}
                    <div className="mt-6 w-full max-w-[260px] space-y-2.5">
                        <button
                            onClick={() => window.open(getAppUrl('/login'), '_blank')}
                            className="w-full py-3 rounded-2xl bg-[#625bd5] hover:bg-[#5851c8] text-white font-semibold text-sm shadow-[0_12px_24px_rgba(98,91,213,0.18)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                            Sign in to CareerVivid
                        </button>
                        <button
                            onClick={() => window.open(getAppUrl('/signup'), '_blank')}
                            className="w-full py-2.5 rounded-2xl bg-white hover:bg-[#f8f8fb] text-gray-700 font-semibold text-sm border border-[#ececf4] shadow-sm transition-all hover:border-[#d9d7fb]"
                        >
                            Create free account
                        </button>
                    </div>
                </div>

                <footer className="px-6 pb-5 text-center">
                    <p className="text-[10px] text-gray-400">Free forever · No credit card required</p>
                </footer>
            </div>
        );
    }

    // ── Gate: No Resumes ───────────────────────────────────────────────────────
    if (needsResume) {
        return (
            <div className="min-h-[540px] h-screen w-full bg-[#f8f8fb] flex flex-col font-sans text-gray-900">
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-[#625bd5] flex items-center justify-center shadow-[0_14px_28px_rgba(98,91,213,0.18)] mb-5">
                        <FileText className="w-7 h-7 text-white" />
                    </div>

                    <h1 className="text-xl font-semibold text-gray-950 leading-tight">
                        Create your first resume
                    </h1>
                    <p className="mt-2 text-xs text-gray-500 leading-relaxed max-w-[230px]">
                        CareerVivid needs a base resume to power AI matching and tailored materials.
                    </p>

                    {/* Steps */}
                    <div className="mt-5 w-full max-w-[260px] space-y-2 text-left">
                        {[
                            '1. Build or import your base resume',
                            '2. Return here to match your next job',
                            '3. Get AI match scores and smart answers',
                        ].map((step) => (
                            <div key={step} className="flex items-center gap-2.5 bg-white rounded-2xl px-3 py-2.5 border border-[#ececf4] shadow-sm">
                                <span className="text-[11px] font-semibold text-gray-700">{step}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTAs */}
                    <div className="mt-6 w-full max-w-[260px] space-y-2.5">
                        <button
                            onClick={() => window.open(getResumeBuilderUrl(), '_blank')}
                            className="w-full py-3 rounded-2xl bg-[#625bd5] hover:bg-[#5851c8] text-white font-semibold text-sm shadow-[0_12px_24px_rgba(98,91,213,0.18)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                            Build my resume
                        </button>
                        <button
                            onClick={() => window.open(getAppUrl('/dashboard'), '_blank')}
                            className="w-full py-2.5 rounded-2xl bg-white hover:bg-[#f8f8fb] text-gray-700 font-semibold text-sm border border-[#ececf4] shadow-sm transition-all hover:border-[#d9d7fb]"
                        >
                            Open dashboard
                        </button>
                    </div>
                </div>

                <footer className="px-6 pb-5 text-center">
                    <p className="text-[10px] text-gray-400">Signed in as {currentUser?.email || 'your account'}</p>
                </footer>
            </div>
        );
    }

    return (
        <div className="min-h-[540px] h-screen w-full bg-[#f8f8fb] flex flex-col font-sans text-gray-900 relative overflow-hidden">
            {isPreparingTransit && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
                    <Loader2 className="w-12 h-12 text-[#625bd5] animate-spin mb-4" />
                    <h3 className="font-semibold text-gray-900 text-base">Syncing job details</h3>
                    <p className="text-xs text-gray-500 mt-2 max-w-[240px]">
                        Preparing your CareerVivid workspace...
                    </p>
                </div>
            )}

            {/* Modular Header */}
            <ExtensionHeader
                userProfile={userProfile}
                currentUser={currentUser}
                localPhotoURL={localPhotoURL}
                localProfile={localProfile}
            />

            <main className="flex-1 px-3.5 py-3 space-y-3 overflow-y-auto">

                {/* ── AI Credit Error Banner ── */}
                {aiError && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 flex items-start gap-2.5 shadow-sm">
                        <div className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center">
                            <span className="text-amber-600 text-[11px] font-semibold">!</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-amber-800 leading-snug">{aiError}</p>
                            <button
                                onClick={() => window.open('https://careervivid.app/subscription', '_blank')}
                                className="mt-1.5 text-[10px] font-semibold text-[#625bd5] hover:text-[#4f4a9f] transition-colors underline underline-offset-2"
                            >
                                Upgrade to CareerVivid Pro →
                            </button>
                        </div>
                        <button
                            onClick={() => setAiError(null)}
                            className="flex-shrink-0 text-amber-400 hover:text-amber-600 transition-colors mt-0.5"
                            aria-label="Dismiss"
                        >
                            <span className="text-sm leading-none">×</span>
                        </button>
                    </div>
                )}

                <MatchBreakdownCard
                    matchScore={matchScore}
                    matchAnalysis={matchAnalysis}
                    isCalculatingScore={isCalculatingScore}
                    isJobSite={isJobSite}
                    scrapedJob={scrapedJob}
                    onSaveJob={(stage) => handleAction('save_job', stage)}
                    onNewResume={() => handleAction('new_resume')}
                    aiUsage={effectiveAIUsage ?? undefined}
                    selectedResumeTitle={activeResumeTitle}
                />

                {/* ── Mark as Applied ── */}
                {isApplicationPage && (
                    <button
                        onClick={handleMarkApplied}
                        disabled={markedApplied}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold border transition-all duration-300 ${
                            markedApplied
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 shadow-sm hover:shadow-emerald-100'
                        }`}
                    >
                        {markedApplied ? (
                            <>
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Applied - tracked
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Mark as applied
                            </>
                        )}
                    </button>
                )}

                {/* ── Secondary Actions ── */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => handleAction(isJobSite ? 'tailor_resume' : 'new_resume')}
                        className="group flex flex-col items-start p-3 bg-white rounded-[20px] border border-[#ececf4] shadow-[0_10px_22px_rgba(15,23,42,0.05)] hover:shadow-[0_14px_26px_rgba(15,23,42,0.07)] hover:border-[#d9d7fb] transition-all duration-300"
                    >
                        <div className="p-2 rounded-xl bg-[#f3f2ff] text-[#625bd5] mb-2 group-hover:scale-105 transition-transform">
                            <Wand2 size={18} />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">Tailor resume</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">Match keywords</span>
                    </button>

                    <button
                        onClick={() => handleAction('practice_interview')}
                        className="group flex flex-col items-start p-3 bg-white rounded-[20px] border border-[#ececf4] shadow-[0_10px_22px_rgba(15,23,42,0.05)] hover:shadow-[0_14px_26px_rgba(15,23,42,0.07)] hover:border-[#f4d6e7] transition-all duration-300"
                    >
                        <div className="p-2 rounded-xl bg-[#fff0f7] text-[#d95b92] mb-2 group-hover:scale-105 transition-transform">
                            <Mic size={18} />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">Practice</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">Mock interview</span>
                    </button>
                </div>

                {/* ── Recent Resumes ── */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-gray-400">Resumes</h3>
                        <button onClick={() => window.open(getResumeBuilderUrl(), '_blank')}
                            className="text-[10px] text-[#625bd5] font-semibold hover:underline flex items-center gap-0.5">
                            View all <ChevronRight size={10} />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {resumes.slice(0, 2).map((resume) => (
                            <div
                                key={resume.id}
                                onClick={() => window.open(`https://careervivid.app/edit/${resume.id}`, '_blank')}
                                className={`flex items-center gap-3 p-3 bg-white rounded-2xl border transition-all cursor-pointer shadow-sm group ${selectedResumeId === resume.id ? 'border-[#c8c7f4] bg-[#f5f4ff] shadow-[0_8px_18px_rgba(98,91,213,0.10)]' : 'border-[#ececf4] hover:border-[#d9d7fb]'}`}
                            >
                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${selectedResumeId === resume.id ? 'bg-[#e9e8ff] text-[#625bd5]' : 'bg-[#f4f5f8] text-gray-400 group-hover:text-[#625bd5]'}`}>
                                    <FileText size={15} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-gray-900 truncate">{resume.title || 'Untitled'}</div>
                                    {selectedResumeId === resume.id && (
                                        <div className="text-[10px] text-[#625bd5] font-semibold">Active resume</div>
                                    )}
                                </div>
                                <ExternalLink size={12} className="text-gray-300 group-hover:text-[#8d88e6] flex-shrink-0" />
                            </div>
                        ))}
                        {resumes.length === 0 && (
                            <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-[10px] text-gray-400">No resumes yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Smart Fill Review Panel */}
                {showAiPanel && aiAnswers.length > 0 && (
                    <div className="border-t border-[#ececf4] bg-white pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-800">
                                    {aiAnswers.filter(a => a.source === 'ai_generated').length} AI answers ready
                                </p>
                                <p className="text-[10px] text-gray-400">Review answers, then fill.</p>
                            </div>
                            <button
                                onClick={handleFillAll}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                                    fillAllConfirm
                                        ? 'bg-amber-500 text-white animate-pulse'
                                        : 'bg-[#f3f2ff] text-[#625bd5] hover:bg-[#ecebff]'
                                }`}
                            >
                                {fillAllConfirm ? 'Confirm fill all?' : 'Fill all'}
                            </button>
                        </div>
                        <div className="space-y-1 pb-3 max-h-72 overflow-y-auto">
                            {aiAnswers.map((a, i) => (
                                <AIAnswerCard
                                    key={i}
                                    answer={a}
                                    onInject={() => handleInjectAnswer(a)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer — Quick Actions */}
            <footer className="px-3.5 pt-3 pb-3 bg-white/95 backdrop-blur border-t border-[#ececf4] sticky bottom-0 z-10">
                <div className="grid grid-cols-4 gap-2 mb-2.5">
                    {[
                        { label: 'New resume',   icon: FileText,        color: 'bg-[#eef0ff] text-[#625bd5]', action: () => handleAction('new_resume') },
                        { label: 'Cover letter', icon: Mail,            color: 'bg-[#f3f2ff] text-[#7069dc]', action: () => handleAction('cover_letter') },
                        { label: 'Interview',    icon: Mic,             color: 'bg-[#fff0f7] text-[#d95b92]', action: () => handleAction('practice_interview') },
                        { label: 'Dashboard',    icon: LayoutDashboard, color: 'bg-[#f4f5f8] text-slate-600', action: () => window.open('https://careervivid.app/dashboard', '_blank') },
                    ].map(({ label, icon: Icon, color, action }) => (
                        <button
                            key={label}
                            onClick={action}
                            className="group flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color} group-hover:scale-105 transition-transform`}>
                                <Icon size={15} />
                            </div>
                            <span className="text-[9px] font-semibold text-gray-500 leading-none">{label}</span>
                        </button>
                    ))}
                </div>
            </footer>
        </div>
    );
};

export default ExtensionHome;
