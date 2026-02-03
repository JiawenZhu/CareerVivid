import React, { useEffect, useState } from 'react';
import { Plus, Briefcase, Mic, ExternalLink, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ExtensionHome: React.FC = () => {
    const { userProfile } = useAuth();
    const [currentTab, setCurrentTab] = useState<{ url: string; title: string } | null>(null);
    const [isJobSite, setIsJobSite] = useState(false);

    useEffect(() => {
        // Check current tab to see if we're on a job site
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tab = tabs[0];
                if (tab?.url) {
                    setCurrentTab({ url: tab.url, title: tab.title || '' });
                    if (tab.url.includes('linkedin.com/jobs') || tab.url.includes('indeed.com')) {
                        setIsJobSite(true);
                    }
                }
            });
        }
    }, []);

    const handleAction = (action: string) => {
        if (action === 'save_job' && currentTab?.url) {
            // Send message to content script to extract and save job
            if (typeof chrome !== 'undefined' && chrome.tabs && currentTab) {
                // Find tab ID
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]?.id) {
                        chrome.tabs.sendMessage(tabs[0].id, { type: 'EXTRACT_JOB_DATA' }, (response) => {
                            if (response?.job) {
                                // Save via background/storage
                                chrome.runtime.sendMessage({ type: 'SAVE_JOB', job: response.job }, (res) => {
                                    if (res.success) {
                                        // Show success toast or feedback
                                        alert('Job Saved!');
                                    }
                                });
                            }
                        });
                    }
                });
            }
        } else if (action === 'new_resume') {
            window.open('https://careervivid.app/new', '_blank');
        }
    };

    const ActionCard: React.FC<{
        icon: React.ElementType;
        title: string;
        desc: string;
        color: string;
        onClick: () => void;
        highlight?: boolean;
    }> = ({ icon: Icon, title, desc, color, onClick, highlight }) => (
        <button
            onClick={onClick}
            className={`relative w-full text-left p-4 rounded-2xl transition-all border ${highlight
                    ? 'bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-900 border-primary-200 dark:border-primary-800 shadow-md ring-1 ring-primary-100 dark:ring-primary-900'
                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm hover:shadow-md'
                }`}
        >
            <div className={`absolute top-4 right-4 p-2 rounded-lg ${color} bg-opacity-10`}>
                <Icon size={18} className={color.replace('bg-', 'text-')} />
            </div>
            <div className="font-semibold text-gray-900 dark:text-white mb-1 pr-12">{title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{desc}</div>
        </button>
    );

    return (
        <div className="p-4 space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Hello, {userProfile?.firstName || 'There'} 👋
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ready to land your dream job?</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary-400 to-purple-500"></div>
            </div>

            {/* Context Aware Action */}
            {isJobSite && (
                <div className="animate-in slide-in-from-top-4 fade-in duration-500">
                    <ActionCard
                        icon={Briefcase}
                        title="Save This Job"
                        desc="Extract details from this page to your tracker."
                        color="bg-primary-500 text-primary-500"
                        onClick={() => handleAction('save_job')}
                        highlight
                    />
                </div>
            )}

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3">
                <ActionCard
                    icon={Plus}
                    title="New Resume"
                    desc="Create from scratch"
                    color="bg-purple-500 text-purple-500"
                    onClick={() => handleAction('new_resume')}
                />
                <ActionCard
                    icon={Mic}
                    title="Practice"
                    desc="Interview prep"
                    color="bg-pink-500 text-pink-500"
                    onClick={() => window.open('https://careervivid.app/interview-studio/demo', '_blank')}
                />
            </div>

            {/* Recent Resumes (Placeholder for now) */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Resumes</h3>
                    <button className="text-xs text-primary-600 font-medium hover:underline">View All</button>
                </div>

                {/* Placeholder Items */}
                {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary-200 transition-colors cursor-pointer group">
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-400 group-hover:text-primary-500 transition-colors">
                            <FileText size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">Software Engineer Resume</div>
                            <div className="text-[10px] text-gray-500">Edited 2 days ago</div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExtensionHome;
