/// <reference types="chrome" />
import React, { useEffect, useState, useCallback } from 'react';
import {
    Wand2, Mic, ChevronRight, FileText, ExternalLink, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useResumes } from '../../hooks/useResumes';
import { getAppUrl, getResumeBuilderUrl, isCareerVividAppUrl } from '../../utils/extensionUtils';
import { db } from '../../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { analyzeResumeMatch } from '../../services/geminiService';
import { ResumeMatchAnalysis } from '../../types';

// Extracted Sub-Components
import { ExtensionHeader } from '../components/ExtensionHeader';
import { AutoFillCard, AutoFillResult } from '../components/AutoFillCard';
import { MatchBreakdownCard } from '../components/MatchBreakdownCard';
import { AIAnswerCard, AIAnswer } from '../components/AIAnswerCard';

const ExtensionHome: React.FC = () => {
    const { userProfile: contextUserProfile, currentUser, logOut } = useAuth();
    const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
    const [localProfile, setLocalProfile] = useState<any>(null);
    const [restUserProfile, setRestUserProfile] = useState<any>(null);
    const [localPhotoURL, setLocalPhotoURL] = useState<string | null>(null);
    const [matchScore, setMatchScore] = useState<number | null>(null);
    const [matchAnalysis, setMatchAnalysis] = useState<ResumeMatchAnalysis | null>(null);
    const [isCalculatingScore, setIsCalculatingScore] = useState(false);

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
                const _ = chrome.runtime.lastError;
                if (res?.success && res.profile) {
                    setRestUserProfile(res.profile);
                } else {
                    if (res?.error === 'invalid_auth_token') {
                        console.log("Invalid extension auth token; waiting for real CareerVivid sign-in");
                    } else {
                        console.log("Could not fetch user profile via REST:", res?.error);
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

    useEffect(() => {
        if (!scrapedJob?.description || !localProfile || !currentTab?.url) {
            setMatchScore(null);
            setMatchAnalysis(null);
            return;
        }

        const runAnalysis = async () => {
            const cacheKey = `analysis_${btoa(currentTab.url).slice(0, 40)}_${selectedResumeId || 'default'}`;

            try {
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

                // Construct a unified resume text from localProfile structured fields
                const resumeParts = [
                    localProfile.summary || '',
                    localProfile.skills?.join(', ') || '',
                    localProfile.workExperience?.map((w: any) => `${w.title} at ${w.company}\n${w.description}`).join('\n\n') || '',
                    localProfile.education?.map((e: any) => `${e.degree} in ${e.fieldOfStudy} from ${e.school}`).join('\n\n') || '',
                ];
                const resumeText = resumeParts.filter(Boolean).join('\n\n');
                const uid = resolvedUserId || 'guest_user';

                // Truncate job description to 2500 characters for high speed matching
                const truncatedJd = scrapedJob.description.slice(0, 2500);

                const result = await analyzeResumeMatch(uid, resumeText, truncatedJd);
                if (typeof result?.matchPercentage === 'number') {
                    const score = Math.round(result.matchPercentage);
                    setMatchScore(score);
                    setMatchAnalysis(result);

                    // Save to cache
                    chrome.storage.local.set({
                        [cacheKey]: {
                            score,
                            analysis: result,
                            timestamp: Date.now()
                        }
                    });
                }
            } catch (err) {
                console.error("[CareerVivid] Match score calculation failed:", err);
                setMatchScore(null);
                setMatchAnalysis(null);
            } finally {
                setIsCalculatingScore(false);
            }
        };

        runAnalysis();
    }, [scrapedJob?.description, localProfile, resolvedUserId, currentTab?.url, selectedResumeId]);

    // Listen for FILL_COMPLETE from content script
    useEffect(() => {
        const handleMessage = (message: any) => {
            if (message.type === 'AUTH_STATE_CHANGED') {
                setIsFilling(false);
            }
            if (message.type === 'FILL_COMPLETE') {
                setFillResult(message.result);
                setIsFilling(false);
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
            if (isCareerVividAppUrl(url)) {
                setIsJobSite(false);
                setIsApplicationPage(false);
                setAtsPlatform(null);
                setScrapedJob(null);
                setMatchScore(null);
                setMatchAnalysis(null);
                return;
            }

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

            const cacheKey = `prefetch_${btoa(url).slice(0, 40)}`;
            const clCacheKey = `coverletter_${btoa(url).slice(0, 40)}`;
            setPrefetchCacheKey(cacheKey);
            chrome.storage.local.get([cacheKey, clCacheKey], (cached: any) => {
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

            if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JOB_DATA' }, (response) => {
                    const _ = chrome.runtime.lastError;
                    if (response?.job) {
                        setScrapedJob(response.job);
                        if (response.job.title) {
                            setIsJobSite(true);
                        }
                    }
                });
                chrome.tabs.sendMessage(tab.id, { type: 'GET_ATS_CONTEXT' }, (response) => {
                    const _ = chrome.runtime.lastError;
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

        chrome.storage.local.get(['autofillProfile', 'selectedResumeId'], (result) => {
            setHasProfile(!!result.autofillProfile);
            setSelectedResumeId((result.selectedResumeId as string | undefined) || null);
        });
    }, []);

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
                    setAiError('No form fields detected on this page. Make sure you\'re on an application form.');
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
    }, [currentTab, scrapedJob, prefetchReady, aiAnswers, prefetchCacheKey]);

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
                    window.open(getAppUrl(`/job-tracker?source=extension_tracker&fallbackDescription=${encodeURIComponent(scrapedJob.description || '')}&url=${encodeURIComponent(currentTab?.url || '')}`), '_blank');
                    return;
                }

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
                        const _ = chrome.runtime.lastError;
                        resolve(response);
                    });
                });

                if (!res?.success || !res?.scrapeId) {
                    throw new Error(res?.error || 'Failed to create transit doc');
                }

                window.open(getAppUrl(`/job-tracker?source=extension_tracker&scrapeId=${res.scrapeId}`), '_blank');
            } catch (error: any) {
                console.error('Error creating transit doc:', error);
                window.open(getAppUrl(`/job-tracker?source=extension_tracker&fallbackDescription=${encodeURIComponent(scrapedJob.description || '')}&url=${encodeURIComponent(currentTab?.url || '')}`), '_blank');
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
                        const _ = chrome.runtime.lastError;
                        resolve(response);
                    });
                });

                if (!res?.success || !res?.scrapeId) {
                    throw new Error(res?.error || 'Failed to create transit doc');
                }

                window.open(getAppUrl(`/interview-studio?source=extension_practice&scrapeId=${res.scrapeId}`), '_blank');
            } catch (error: any) {
                const cleanTitle = scrapedJob.title ? encodeURIComponent(scrapedJob.title.replace(/\(.*\)/, '').trim()) : 'General';
                window.open(getAppUrl(`/interview-studio/new?role=${cleanTitle}`), '_blank');
            } finally {
                setIsPreparingTransit(false);
            }
        } else if (action === 'new_resume') {
            window.open(getResumeBuilderUrl(), '_blank');
        }
    };

    const hasNoResumes = !isLoadingResumes && resumes.length === 0;

    return (
        <div className="min-h-[540px] h-screen w-full bg-[#f7f8fb] flex flex-col font-sans text-gray-900 relative overflow-hidden">
            {isPreparingTransit && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                    <h3 className="font-bold text-gray-900 text-base">Synchronizing Job Metadata</h3>
                    <p className="text-xs text-gray-500 mt-2 max-w-[240px]">
                        Scraping deep description details & preparing your CareerVivid workspace...
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

                {/* ── Modular AutoFill Card (Application Pages) ── */}
                <AutoFillCard
                    isApplicationPage={isApplicationPage}
                    atsPlatform={atsPlatform}
                    hasProfile={hasProfile}
                    selectedResumeId={selectedResumeId}
                    resumes={resumes}
                    onSelectResume={(newResumeId) => {
                        setSelectedResumeId(newResumeId);
                        chrome.storage.local.set({ selectedResumeId: newResumeId });
                        if (resolvedUserId) {
                            chrome.runtime.sendMessage({
                                type: 'SYNC_PROFILE',
                                userId: resolvedUserId,
                                resumeId: newResumeId
                            }, (res) => {
                                const _ = chrome.runtime.lastError;
                            });
                        }
                    }}
                    fillResult={fillResult}
                    isFilling={isFilling}
                    isGeneratingAI={isGeneratingAI}
                    prefetchReady={prefetchReady}
                    aiError={aiError}
                    onAutofill={handleAutofill}
                    onSmartFill={handleSmartFill}
                />

                {hasNoResumes ? (
                    <div className="rounded-[20px] border border-indigo-100 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                        <div className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                            Setup needed
                        </div>
                        <h2 className="mt-3 text-lg font-extrabold text-slate-950">Create your first resume</h2>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                            CareerVivid needs a base resume before autofill, AI matching, and tailored materials can work.
                        </p>
                        <div className="mt-3 grid gap-2 text-xs text-slate-600">
                            <div className="rounded-xl bg-slate-50 px-3 py-2">1. Build or import a base resume.</div>
                            <div className="rounded-xl bg-slate-50 px-3 py-2">2. Select it for autofill in the extension.</div>
                            <div className="rounded-xl bg-slate-50 px-3 py-2">3. Return to a job page to save, match, and tailor.</div>
                        </div>
                        <button
                            onClick={() => window.open(getAppUrl('/extension-welcome'), '_blank')}
                            className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-black"
                        >
                            Start setup
                        </button>
                    </div>
                ) : (
                    <MatchBreakdownCard
                        matchScore={matchScore}
                        matchAnalysis={matchAnalysis}
                        isCalculatingScore={isCalculatingScore}
                        isJobSite={isJobSite}
                        scrapedJob={scrapedJob}
                        onSaveJob={() => handleAction('save_job')}
                        onNewResume={() => handleAction('new_resume')}
                    />
                )}

                {/* ── Secondary Actions ── */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => handleAction(isJobSite ? 'tailor_resume' : 'new_resume')}
                        className="group flex flex-col items-start p-3 bg-white rounded-[18px] border border-gray-100 shadow-[0_8px_18px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_22px_rgba(0,0,0,0.07)] hover:border-purple-100 transition-all duration-300"
                    >
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-600 mb-2 group-hover:scale-110 transition-transform">
                            <Wand2 size={18} />
                        </div>
                        <span className="font-bold text-gray-900 text-sm">Tailor Resume</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">Match keywords</span>
                    </button>

                    <button
                        onClick={() => handleAction('practice_interview')}
                        className="group flex flex-col items-start p-3 bg-white rounded-[18px] border border-gray-100 shadow-[0_8px_18px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_22px_rgba(0,0,0,0.07)] hover:border-pink-100 transition-all duration-300"
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
                        <button onClick={() => window.open(getResumeBuilderUrl(), '_blank')}
                            className="text-[10px] text-indigo-500 font-semibold hover:underline flex items-center gap-0.5">
                            View all <ChevronRight size={10} />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {resumes.slice(0, 2).map((resume) => (
                            <div
                                key={resume.id}
                                onClick={() => window.open(`https://careervivid.app/edit/${resume.id}`, '_blank')}
                                className={`flex items-center gap-3 p-3 bg-white rounded-2xl border transition-all cursor-pointer shadow-sm group ${selectedResumeId === resume.id ? 'border-indigo-300 bg-indigo-50 shadow-indigo-100/70' : 'border-gray-100 hover:border-indigo-200'}`}
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

                {/* AI Smart Fill Review Panel */}
                {showAiPanel && aiAnswers.length > 0 && (
                    <div className="border-t border-indigo-100 bg-white pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-800">
                                    {aiAnswers.filter(a => a.source === 'ai_generated').length} AI answers ready
                                </p>
                                <p className="text-[10px] text-gray-400">Review answers, then fill.</p>
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

            {/* Footer */}
            <footer className="px-4 py-3 bg-white/95 backdrop-blur border-t border-gray-100 text-center sticky bottom-0 z-10">
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
