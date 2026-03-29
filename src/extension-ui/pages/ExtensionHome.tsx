/// <reference types="chrome" />
import React, { useEffect, useState, useCallback } from 'react';
import {
    Plus, Briefcase, Mic, ExternalLink, FileText, Wand2,
    Settings, Zap, CheckCircle, AlertCircle, Loader2, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useResumes } from '../../hooks/useResumes';

interface AutoFillResult {
    platform: string;
    filledCount: number;
    skippedCount: number;
    errorCount: number;
    timestamp: string;
}

const ExtensionHome: React.FC = () => {
    const { userProfile, currentUser } = useAuth();
    const { resumes } = useResumes();
    const [currentTab, setCurrentTab] = useState<{ url: string; title: string } | null>(null);
    const [isJobSite, setIsJobSite] = useState(false);
    const [isApplicationPage, setIsApplicationPage] = useState(false);
    const [atsPlatform, setAtsPlatform] = useState<string | null>(null);
    const [scrapedJob, setScrapedJob] = useState<{ title: string; company: string; description?: string } | null>(null);
    const [fillResult, setFillResult] = useState<AutoFillResult | null>(null);
    const [isFilling, setIsFilling] = useState(false);
    const [hasProfile, setHasProfile] = useState(false);
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

    // Listen for FILL_COMPLETE from content script (relayed via background)
    useEffect(() => {
        const handleMessage = (message: any) => {
            if (message.type === 'AUTH_STATE_CHANGED') {
                window.location.reload();
            }
            if (message.type === 'FILL_COMPLETE') {
                setFillResult(message.result);
                setIsFilling(false);
            }
        };
        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, []);

    // On mount: get tab info, ATS context, cached profile
    useEffect(() => {
        if (typeof chrome === 'undefined' || !chrome.tabs) return;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (!tab?.url) return;
            setCurrentTab({ url: tab.url, title: tab.title || '' });

            const url = tab.url;
            const isKnownJobSite = ['linkedin.com/jobs', 'indeed.com', 'greenhouse.io', 'jobs.lever.co', 'myworkdayjobs.com', 'ashbyhq.com'].some(s => url.includes(s));
            setIsJobSite(isKnownJobSite);

            if (tab.id) {
                // Extract job data
                chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JOB_DATA' }, (response) => {
                    if (response?.job) setScrapedJob(response.job);
                });
                // Check ATS context (is this an application page?)
                chrome.tabs.sendMessage(tab.id, { type: 'GET_ATS_CONTEXT' }, (response) => {
                    if (response?.context) {
                        setIsApplicationPage(response.context.isApplicationPage);
                        setAtsPlatform(response.context.platform);
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
        if (!currentUser || !resumes.length || hasProfile) return;
        const defaultResume = resumes[0];
        if (defaultResume?.id) {
            chrome.runtime.sendMessage({
                type: 'SYNC_PROFILE',
                userId: currentUser.uid,
                resumeId: defaultResume.id,
            }, (res) => {
                if (res?.success) {
                    setHasProfile(true);
                    setSelectedResumeId(defaultResume.id!);
                }
            });
        }
    }, [currentUser, resumes, hasProfile]);

    const handleAutofill = useCallback(() => {
        if (!hasProfile) {
            // No profile — sync now then apply
            if (currentUser && resumes[0]?.id) {
                setIsFilling(true);
                chrome.runtime.sendMessage({
                    type: 'SYNC_PROFILE',
                    userId: currentUser.uid,
                    resumeId: resumes[0].id!,
                }, (res) => {
                    if (res?.success) {
                        setHasProfile(true);
                        chrome.runtime.sendMessage({ type: 'AUTOFILL_APPLICATION' });
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
            if (res?.error) {
                setIsFilling(false);
            }
        });
    }, [hasProfile, currentUser, resumes]);

    const handleAction = (action: string) => {
        if (action === 'save_job' && currentTab?.url && scrapedJob) {
            import('../../services/userJobService').then(async ({ userJobService }) => {
                if (currentUser) {
                    try {
                        await userJobService.addJob(currentUser.uid, {
                            companyName: scrapedJob.company,
                            jobTitle: scrapedJob.title,
                            jobPostURL: currentTab.url,
                            applicationStatus: 'To Apply',
                            jobDescription: scrapedJob.description || '',
                            location: '',
                        } as any);
                        alert('Job Saved to Dashboard!');
                    } catch (_) { }
                }
            });
        } else if (action === 'tailor_resume' && scrapedJob) {
            chrome.storage.local.set({ pending_tailor_jd: scrapedJob.description || '' }, () => {
                window.open(`https://careervivid.app/newresume?source=extension_tailor&jobTitle=${encodeURIComponent(scrapedJob.title)}`, '_blank');
            });
        } else if (action === 'practice_interview' && scrapedJob) {
            const cleanTitle = scrapedJob.title ? encodeURIComponent(scrapedJob.title.replace(/\(.*\)/, '').trim()) : 'General';
            window.open(`https://careervivid.app/interview-studio/new?role=${cleanTitle}`, '_blank');
        } else if (action === 'new_resume') {
            window.open('https://careervivid.app/newresume', '_blank');
        }
    };

    // Selected resume name
    const selectedResumeName = resumes.find(r => r.id === selectedResumeId)?.title || resumes[0]?.title || 'Your Resume';

    return (
        <div className="min-h-[540px] w-[380px] bg-gray-50 flex flex-col font-sans text-gray-900">
            {/* Header */}
            <header className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-400 to-indigo-600 shadow ring-2 ring-white flex items-center justify-center text-white font-bold text-sm">
                        {userProfile?.displayName?.[0] || userProfile?.email?.[0] || 'U'}
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 leading-tight">
                            {userProfile?.displayName || 'CareerVivid User'}
                        </h1>
                        <p className="text-[10px] uppercase tracking-wide text-indigo-600 font-semibold">CareerVivid</p>
                    </div>
                </div>
                <button onClick={() => window.open('https://careervivid.app/profile', '_blank')}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    <Settings size={18} />
                </button>
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
                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                    <FileText size={11} />
                                    Using: <span className="font-medium text-gray-700">{selectedResumeName}</span>
                                    <button onClick={() => window.open('https://careervivid.app/extension', '_blank')}
                                        className="text-indigo-500 hover:underline ml-1">change</button>
                                </p>
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
                                            Skipped fields may need manual input (custom questions, file uploads).
                                        </p>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleAutofill}
                                disabled={isFilling}
                                className="mt-3 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isFilling ? (
                                    <><Loader2 size={18} className="animate-spin" /><span>Filling form...</span></>
                                ) : fillResult ? (
                                    <><Zap size={18} /><span>Autofill Again</span></>
                                ) : (
                                    <><Zap size={18} /><span>Autofill Application</span></>
                                )}
                            </button>
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
