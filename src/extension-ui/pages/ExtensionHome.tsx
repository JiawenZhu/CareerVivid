/// <reference types="chrome" />
import React, { useEffect, useState } from 'react';
import { Plus, Briefcase, Mic, ExternalLink, ChevronRight, FileText, Wand2, Settings, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useResumes } from '../../hooks/useResumes';

const ExtensionHome: React.FC = () => {
    const { userProfile, currentUser } = useAuth();
    const { resumes } = useResumes();
    const [currentTab, setCurrentTab] = useState<{ url: string; title: string } | null>(null);
    const [isJobSite, setIsJobSite] = useState(false);
    const [scrapedJob, setScrapedJob] = useState<{ title: string; company: string; description?: string } | null>(null);

    // Listen for auth state changes from background script
    useEffect(() => {
        const handleMessage = (message: any) => {
            if (message.type === 'AUTH_STATE_CHANGED') {
                window.location.reload();
            }
        };
        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, []);

    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tab = tabs[0];
                if (tab?.url) {
                    setCurrentTab({ url: tab.url, title: tab.title || '' });
                    if (tab.url.includes('linkedin.com/jobs') || tab.url.includes('indeed.com')) {
                        setIsJobSite(true);
                        if (tab.id) {
                            chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JOB_DATA' }, (response) => {
                                if (response?.job) {
                                    setScrapedJob(response.job);
                                }
                            });
                        }
                    }
                }
            });
        }
    }, []);

    const handleAction = (action: string) => {
        if (action === 'save_job' && currentTab?.url && scrapedJob) {
            import('../../services/userJobService').then(async ({ userJobService }) => {
                if (currentUser) {
                    try {
                        // Map to JobApplicationData structure
                        await userJobService.addJob(currentUser.uid, {
                            companyName: scrapedJob.company,
                            jobTitle: scrapedJob.title,
                            jobPostURL: currentTab.url,
                            applicationStatus: 'To Apply', // Default status
                            jobDescription: scrapedJob.description || '',
                            location: '',
                        } as any); // Cast to any to avoid strict partial checks if type definitions are slightly off
                        alert('Job Saved to Dashboard!');
                    } catch (e) {
                        // ignore
                    }
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

    return (
        <div className="min-h-[520px] w-[380px] bg-gray-50 flex flex-col font-sans text-gray-900">
            {/* Header */}
            <header className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary-400 to-primary-600 shadow ring-2 ring-white flex items-center justify-center text-white font-bold text-sm">
                        {userProfile?.displayName?.[0] || userProfile?.email?.[0] || 'U'}
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 leading-tight">
                            {userProfile?.displayName || 'CareerVivid User'}
                        </h1>
                        <p className="text-[10px] uppercase tracking-wide text-primary-600 font-semibold">Pro Plan</p>
                    </div>
                </div>
                <button onClick={() => window.open('https://careervivid.app/profile', '_blank')} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    <Settings size={18} />
                </button>
            </header>

            <main className="flex-1 p-5 space-y-6 overflow-y-auto">
                {/* Hero / Context Status */}
                <div className="bg-white rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                                {isJobSite ? 'Job Detected' : 'Ready to Apply'}
                            </span>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">
                                {isJobSite && scrapedJob ? scrapedJob.title : 'Boost Your Career'}
                            </h2>
                            {isJobSite && scrapedJob && (
                                <p className="text-sm text-gray-500 mt-0.5">{scrapedJob.company}</p>
                            )}
                        </div>
                        {isJobSite && (
                            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <Briefcase size={16} />
                            </div>
                        )}
                    </div>

                    {isJobSite ? (
                        <button
                            onClick={() => handleAction('save_job')}
                            className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus size={18} />
                            <span>Save Job to Tracker</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => handleAction('new_resume')}
                            className="mt-4 w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-primary-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus size={18} />
                            <span>Create New Resume</span>
                        </button>
                    )}
                </div>

                {/* Secondary Actions Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => handleAction(isJobSite ? 'tailor_resume' : 'new_resume')}
                        className="group flex flex-col items-start p-4 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:border-primary-100 transition-all duration-300"
                    >
                        <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 mb-3 group-hover:scale-110 transition-transform">
                            <Wand2 size={20} />
                        </div>
                        <span className="font-bold text-gray-900 text-sm">Tailor Resume</span>
                        <span className="text-[10px] text-gray-500 mt-1">Match keywords</span>
                    </button>

                    <button
                        onClick={() => handleAction(isJobSite ? 'practice_interview' : 'practice_interview')}
                        className="group flex flex-col items-start p-4 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:border-pink-100 transition-all duration-300"
                    >
                        <div className="p-2.5 rounded-xl bg-pink-50 text-pink-600 mb-3 group-hover:scale-110 transition-transform">
                            <Mic size={20} />
                        </div>
                        <span className="font-bold text-gray-900 text-sm">Practice</span>
                        <span className="text-[10px] text-gray-500 mt-1">AI Mock Interview</span>
                    </button>
                </div>

                {/* Mini-Dashboard Preview */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Drafts</h3>
                    </div>
                    <div className="space-y-2">
                        {resumes.slice(0, 2).map((resume) => (
                            <div
                                key={resume.id}
                                onClick={() => window.open(`https://careervivid.app/edit/${resume.id}`, '_blank')}
                                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-primary-300 transition-all cursor-pointer shadow-sm group"
                            >
                                <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary-600">
                                    <FileText size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-gray-900 truncate">{resume.title || 'Untitled'}</div>
                                    <div className="text-[10px] text-gray-500">Edited {resume.updatedAt ? new Date((resume.updatedAt as any).seconds ? (resume.updatedAt as any).seconds * 1000 : resume.updatedAt).toLocaleDateString() : 'Just now'}</div>
                                </div>
                            </div>
                        ))}
                        {resumes.length === 0 && (
                            <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-[10px] text-gray-400">No recent resumes.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-4 bg-white border-t border-gray-100 text-center sticky bottom-0 z-10">
                <button
                    onClick={() => window.open('https://careervivid.app/dashboard', '_blank')}
                    className="text-sm font-semibold text-gray-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2 w-full"
                >
                    <span>Go to Dashboard</span>
                    <ExternalLink size={14} />
                </button>
            </footer>
        </div>
    );
};

export default ExtensionHome;
