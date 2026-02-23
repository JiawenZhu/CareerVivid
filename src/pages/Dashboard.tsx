import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useResumes } from '../hooks/useResumes';
import { usePortfolios } from '../hooks/usePortfolios';
import { ResumeData, PracticeHistoryEntry, JobApplicationData, Folder } from '../types';
import { PortfolioData } from '../features/portfolio/types/portfolio';
import { PlusCircle, FileText, Mic, Briefcase, GripVertical, LayoutDashboard, Loader2, Globe, Plus, User as UserIcon, LogOut, ChevronDown, FolderPlus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePracticeHistory } from '../hooks/useJobHistory';
import JobDetailModal from '../components/JobTracker/JobDetailModal';
import { useJobTracker } from '../hooks/useJobTracker';
import { navigate } from '../utils/navigation';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import ThemeToggle from '../components/ThemeToggle';
import StatusOverview from '../components/JobTracker/StatusOverview';
import KanbanBoard from '../components/JobTracker/KanbanBoard';
import ConfirmationModal from '../components/ConfirmationModal';
import { trackDemoConversion } from '../services/trackingService';
import PortfolioCard from '../components/PortfolioCard';
import Logo from '../components/Logo';
import ShareResumeModal from '../components/ShareResumeModal';
import SharePortfolioModal from '../components/SharePortfolioModal';
import FolderReorderModal from '../components/FolderReorderModal';
import { useTranslation } from 'react-i18next';
import LanguageSelect from '../components/LanguageSelect';
import AIUsageProgressBar from '../components/AIUsageProgressBar';

// Extracted Components
import ResumeCard from '../components/Dashboard/ResumeCard';
import InterviewHistoryCard from '../components/Dashboard/InterviewHistoryCard';
import JobApplicationCard from '../components/Dashboard/JobApplicationCard';
import EditableHeader from '../components/Dashboard/EditableHeader';
import { ResumeCardSkeleton, InterviewHistoryCardSkeleton } from '../components/Dashboard/DashboardSkeletons';
import DashboardSummaryCards from '../components/Dashboard/DashboardSummaryCards';
import DashboardPreviewSection from '../components/Dashboard/DashboardPreviewSection';

// Lazy load modal to optimize dashboard load time
const InterviewReportModal = React.lazy(() => import('../components/InterviewReportModal'));

const Dashboard: React.FC = () => {
    const { resumes, isLoading: isLoadingResumes, deleteResume, duplicateResume, updateResume, addBlankResume, saveAIGeneratedResume } = useResumes();
    const { portfolios, isLoading: isLoadingPortfolios, deletePortfolio, duplicatePortfolio, updatePortfolio, createPortfolio } = usePortfolios();
    const { practiceHistory, isLoading: isLoadingHistory, deletePracticeHistory, updatePracticeHistory, addCompletedPractice } = usePracticeHistory();
    const { jobApplications, isLoading: isLoadingJobs, updateJobApplication, deleteJobApplication, deleteAllJobApplications } = useJobTracker();
    const { currentUser, logOut, isAdmin, userProfile, isPremium, aiUsage } = useAuth();
    const { t } = useTranslation();

    const [selectedJobForReport, setSelectedJobForReport] = useState<PracticeHistoryEntry | null>(null);
    const [selectedJobApplication, setSelectedJobApplication] = useState<JobApplicationData | null>(null);
    const [shareModalResume, setShareModalResume] = useState<ResumeData | null>(null);
    const [shareModalPortfolio, setShareModalPortfolio] = useState<PortfolioData | null>(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false); // New State for limit modal

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { }, confirmText: 'Confirm' });

    // ... (existing code for menu refs etc.) ...

    // Limit Logic
    const bioLinksCount = portfolios.filter(p => p.mode === 'linkinbio').length;
    const totalPortfolioCount = portfolios.length;
    const [limitMessage, setLimitMessage] = useState('You have reached your site limit. Please upgrade your plan to create more.');

    const handleDuplicatePortfolio = async (id: string) => {
        const portfolio = portfolios.find(p => p.id === id);
        if (!portfolio) return;

        // Check Total Limit (2 sites for free users)
        if (!isPremium && totalPortfolioCount >= 2) {
            setLimitMessage('Free users can only create up to 2 sites. Please upgrade your plan to create more.');
            setIsUpgradeModalOpen(true);
            return;
        }

        // Check Limit for Bio-Links (1 for free users)
        if (portfolio.mode === 'linkinbio') {
            if (!isPremium && bioLinksCount >= 1) {
                setLimitMessage('You have reached your Bio-Link limit. Please upgrade your plan to create more.');
                setIsUpgradeModalOpen(true);
                return;
            }
        }

        // Proceed if valid
        await duplicatePortfolio(id);
    };

    const handleCreateNewPortfolio = () => {
        // Check Total Limit (2 sites for free users)
        if (!isPremium && totalPortfolioCount >= 2) {
            setLimitMessage('Free users can only create up to 2 sites. Please upgrade your plan to create more.');
            setIsUpgradeModalOpen(true);
            return;
        }
        navigate('/portfolio');
    };

    // ... (existing code) ...


    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const newMenuRef = useRef<HTMLDivElement>(null);

    const [folders, setFolders] = useState<Folder[]>([]);
    const [jobTrackerShowPreview, setJobTrackerShowPreview] = useState(true);
    const [dragOverSection, setDragOverSection] = useState<{ id: string, position: 'top' | 'bottom' | 'middle' } | null>(null);

    const [isFolderReorderModalOpen, setIsFolderReorderModalOpen] = useState(false);

    // Long Press Logic
    const [longPressState, setLongPressState] = useState<{ id: string, count: number } | null>(null);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const longPressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Upgrade Guide State (Steps 1 & 2)
    const [upgradeStep, setUpgradeStep] = useState(() => {
        const stored = localStorage.getItem('upgrade_guide_step');
        return stored ? parseInt(stored) : 0;
    });

    useEffect(() => {
        // Listen for custom trigger event from ChatBot
        const handleTrigger = () => {
            setUpgradeStep(1);
        };
        window.addEventListener('trigger-upgrade-guide', handleTrigger);
        return () => window.removeEventListener('trigger-upgrade-guide', handleTrigger);
    }, []);

    const handleStep1Click = () => {
        setIsUserMenuOpen(!isUserMenuOpen);
        if (upgradeStep === 1) {
            localStorage.setItem('upgrade_guide_step', '2');
            setUpgradeStep(2);
        }
    };

    const handleStep2Click = () => {
        if (upgradeStep === 2) {
            localStorage.setItem('upgrade_guide_step', '3');
            setUpgradeStep(3);
        }
    };

    // Refs for auto-reordering folders
    const latestResumeTsRef = useRef<number>(0);
    const latestInterviewTsRef = useRef<number>(0);
    const latestJobTsRef = useRef<number>(0);
    const isDashboardInitialLoadRef = useRef(true);

    useEffect(() => {
        // On initial load for a user with no resumes, redirect them to the creation hub.
        // This also handles the case where a user deletes all their resumes.
        if (!isLoadingResumes && resumes.length === 0) {
            navigate('/newresume');
        }
    }, [resumes, isLoadingResumes]);

    // Effect to import guest data on first login
    useEffect(() => {
        if (!currentUser) return;

        const importGuestData = async () => {
            // Import Resume
            const guestResumeJSON = localStorage.getItem('guestResume');
            if (guestResumeJSON) {
                try {
                    const guestResume = JSON.parse(guestResumeJSON) as ResumeData;
                    await saveAIGeneratedResume(guestResume);
                    localStorage.removeItem('guestResume');
                    console.log("Successfully imported guest resume.");
                    trackDemoConversion('convertedResumeUsers');
                } catch (e) {
                    console.error("Failed to import guest resume:", e);
                    localStorage.removeItem('guestResume');
                }
            }

            // Import Interview
            const guestInterviewJSON = localStorage.getItem('guestInterview');
            if (guestInterviewJSON) {
                try {
                    const guestInterview = JSON.parse(guestInterviewJSON) as PracticeHistoryEntry;
                    await addCompletedPractice(guestInterview);
                    localStorage.removeItem('guestInterview');
                    console.log("Successfully imported guest interview.");
                    trackDemoConversion('convertedInterviewUsers');
                } catch (e) {
                    console.error("Failed to import guest interview:", e);
                    localStorage.removeItem('guestInterview');
                }
            }


        };

        // Run once after user context is available
        const timer = setTimeout(importGuestData, 500);
        return () => clearTimeout(timer);
    }, [currentUser, saveAIGeneratedResume, addCompletedPractice]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
                setIsNewMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!currentUser) return;
        const settingsRef = doc(db, 'users', currentUser.uid, 'settings', 'dashboard');
        const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            const defaultFolders = [
                { id: 'resumes', title: t('dashboard.my_resumes'), order: 0 },
                { id: 'portfolios', title: 'My Portfolios', order: 1 },
                { id: 'interviews', title: t('dashboard.interview_sessions'), order: 2 },
            ];
            if (docSnap.exists()) {
                const data = docSnap.data();
                setJobTrackerShowPreview(data.jobTrackerShowPreview !== false);
                let currentFolders: Folder[] = data.folders || [];

                defaultFolders.forEach(df => {
                    if (!currentFolders.some(f => f.id === df.id)) {
                        currentFolders.push({ ...df, order: currentFolders.length });
                    }
                });

                if (data.folders) {
                    setFolders([...currentFolders].sort((a, b) => a.order - b.order));
                } else {
                    setFolders(defaultFolders);
                    setDoc(settingsRef, { folders: defaultFolders }, { merge: true }).catch(console.error);
                }
            } else {
                const defaultSettings = { folders: defaultFolders, jobTrackerShowPreview: true };
                setFolders(defaultFolders);
                setJobTrackerShowPreview(true);
                setDoc(settingsRef, defaultSettings).catch(console.error);
            }
        });
        return unsubscribe;
    }, [currentUser]);

    // Re-add Job Tracker folder if it's been deleted but jobs exist
    useEffect(() => {
        if (jobApplications.length > 0 && !folders.some(f => f.id === 'jobTracker')) {
            const jobTrackerFolder = { id: 'jobTracker', title: t('dashboard.job_tracker'), order: folders.length };
            saveFolders([...folders, jobTrackerFolder]);
        } else if (jobApplications.length === 0 && folders.some(f => f.id === 'jobTracker')) {
            // Optional: remove tracker if it becomes empty and wasn't a custom folder
            // For now, we'll leave it, as the user might want to drag items into it.
        }
    }, [jobApplications.length, folders]);

    // Auto-reorder folders based on activity
    useEffect(() => {
        if (isLoadingResumes || isLoadingHistory || isLoadingJobs || folders.length === 0) return;

        // Helper to get max timestamp
        const getMaxTs = (items: any[], field: string) => {
            if (!items || items.length === 0) return 0;
            return Math.max(...items.map(item => {
                const val = item[field];
                if (!val) return 0;
                // Handle Firestore Timestamp
                if (typeof val === 'object' && 'toMillis' in val) {
                    return (val as any).toMillis();
                }
                // Handle Date object
                if (val instanceof Date) return val.getTime();
                // Handle ISO string or number
                return new Date(val).getTime();
            }));
        };

        const currentMaxResumeTs = getMaxTs(resumes, 'updatedAt');
        const currentMaxInterviewTs = getMaxTs(practiceHistory, 'timestamp');
        const currentMaxJobTs = getMaxTs(jobApplications, 'updatedAt');

        // Initial load: just set the refs, don't reorder
        if (isDashboardInitialLoadRef.current) {
            latestResumeTsRef.current = currentMaxResumeTs;
            latestInterviewTsRef.current = currentMaxInterviewTs;
            latestJobTsRef.current = currentMaxJobTs;
            isDashboardInitialLoadRef.current = false;
            return;
        }

        let folderToBump: string | null = null;

        // Check for new activity
        if (currentMaxResumeTs > latestResumeTsRef.current) {
            // Find which folder contains the latest resume
            // We need to find the resume with this timestamp
            const latestResume = resumes.find(r => {
                const val = r.updatedAt;
                let ts = 0;
                if (val && typeof val === 'object' && 'toMillis' in (val as any)) {
                    ts = (val as any).toMillis();
                } else if ((val as any) instanceof Date) {
                    ts = (val as any).getTime();
                } else if (val) {
                    ts = new Date(val).getTime();
                }
                return ts === currentMaxResumeTs;
            });
            if (latestResume) {
                folderToBump = latestResume.section || 'resumes';
            }
            latestResumeTsRef.current = currentMaxResumeTs;
        }

        if (currentMaxInterviewTs > latestInterviewTsRef.current) {
            const latestInterview = practiceHistory.find(p => {
                const val = p.timestamp;
                let ts = 0;
                if (val && typeof val === 'object' && 'toMillis' in (val as any)) {
                    ts = (val as any).toMillis();
                } else if ((val as any) instanceof Date) {
                    ts = (val as any).getTime();
                } else if (val) {
                    ts = new Date(val).getTime();
                }
                return ts === currentMaxInterviewTs;
            });
            if (latestInterview) {
                folderToBump = latestInterview.section || 'interviews';
            }
            latestInterviewTsRef.current = currentMaxInterviewTs;
        }

        if (currentMaxJobTs > latestJobTsRef.current) {
            // Jobs are always in 'jobTracker' folder (or custom section if we allowed moving them, which we do)
            const latestJob = jobApplications.find(j => {
                const val = j.updatedAt;
                let ts = 0;
                if (val && typeof val === 'object' && 'toMillis' in (val as any)) {
                    ts = (val as any).toMillis();
                } else if ((val as any) instanceof Date) {
                    ts = (val as any).getTime();
                } else if (val) {
                    ts = new Date(val).getTime();
                }
                return ts === currentMaxJobTs;
            });
            if (latestJob) {
                folderToBump = latestJob.section || 'jobTracker';
            }
            latestJobTsRef.current = currentMaxJobTs;
        }

        if (folderToBump) {
            const folderIndex = folders.findIndex(f => f.id === folderToBump);
            // If folder exists and is not already at the top
            if (folderIndex > 0) {
                const newFolders = [...folders];
                const [movedFolder] = newFolders.splice(folderIndex, 1);
                newFolders.unshift(movedFolder);
                saveFolders(newFolders);
            }
        }

    }, [resumes, practiceHistory, jobApplications, isLoadingResumes, isLoadingHistory, isLoadingJobs]);

    const updateDashboardSettings = async (settings: object) => {
        if (!currentUser) return;
        const settingsRef = doc(db, 'users', currentUser.uid, 'settings', 'dashboard');
        await updateDoc(settingsRef, settings);
    };

    const saveFolders = async (newFolders: Folder[]) => {
        const orderedFolders = newFolders.map((f, i) => ({ ...f, order: i }));
        setFolders(orderedFolders); // Optimistic update
        await updateDashboardSettings({ folders: orderedFolders });
    };

    const handleToggleTrackerPreview = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.checked;
        setJobTrackerShowPreview(newValue);
        updateDashboardSettings({ jobTrackerShowPreview: newValue });
    };

    const handleTitleUpdate = (folderId: string, newTitle: string) => {
        const updatedFolders = folders.map(f => f.id === folderId ? { ...f, title: newTitle } : f);
        saveFolders(updatedFolders);
    };

    const handleAddFolder = () => {
        const newFolder = { id: `folder_${Date.now()}`, title: t('dashboard.new_folder'), order: folders.length };
        saveFolders([...folders, newFolder]);
    };

    const closeConfirmModal = () => setConfirmModal({ ...confirmModal, isOpen: false });

    const confirmItemDelete = (id: string, type: 'resume' | 'practice' | 'job' | 'portfolio') => {
        setConfirmModal({
            isOpen: true,
            title: t('dashboard.confirm_delete_title', { type }),
            message: t('dashboard.confirm_delete_message', { type }),
            onConfirm: () => {
                if (type === 'resume') deleteResume(id);
                if (type === 'portfolio') deletePortfolio(id);
                if (type === 'practice') deletePracticeHistory(id);
                if (type === 'job') deleteJobApplication(id);
                closeConfirmModal();
            },
            confirmText: t('dashboard.delete')
        });
    };

    const confirmFolderDelete = async (folderId: string) => {
        setConfirmModal({
            isOpen: true,
            title: t('dashboard.confirm_folder_delete_title'),
            message: t('dashboard.confirm_folder_delete_message'),
            onConfirm: async () => {
                if (!currentUser) return;
                const batch = writeBatch(db);
                resumes.forEach(r => {
                    if ((r.section || 'resumes') === folderId) {
                        batch.update(doc(db, 'users', currentUser.uid, 'resumes', r.id), { section: 'resumes' });
                    }
                });
                practiceHistory.forEach(p => {
                    if ((p.section || 'interviews') === folderId) {
                        batch.update(doc(db, 'users', currentUser.uid, 'practiceHistory', p.id), { section: 'interviews' });
                    }
                });
                jobApplications.forEach(j => {
                    if (j.section === folderId) {
                        batch.update(doc(db, 'users', currentUser.uid, 'jobTracker', j.id), { section: 'jobTracker' });
                    }
                });
                try {
                    await batch.commit();
                    const updatedFolders = folders.filter(f => f.id !== folderId);
                    await saveFolders(updatedFolders);
                } catch (error) {
                    console.error("Error moving items and deleting folder:", error);
                }
                closeConfirmModal();
            },
            confirmText: t('dashboard.delete')
        });
    };

    const confirmDeleteTracker = async () => {
        setConfirmModal({
            isOpen: true,
            title: t('dashboard.delete_all_jobs_title'),
            message: t('dashboard.delete_all_jobs_message'),
            onConfirm: async () => {
                try {
                    await deleteAllJobApplications();
                } catch (error) {
                    console.error("Error deleting all job applications:", error);
                }
                closeConfirmModal();
            },
            confirmText: t('dashboard.yes_delete_all')
        });
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetFolderId: string) => {
        e.preventDefault();
        setDragOverSection(null);
        try {
            const jsonString = e.dataTransfer.getData('application/json');
            if (!jsonString) return;
            const data = JSON.parse(jsonString);
            if (data.type === 'folder') {
                const draggedFolderId = data.id;
                if (draggedFolderId === targetFolderId) return;

                const newFolders = [...folders];
                const draggedIndex = newFolders.findIndex(f => f.id === draggedFolderId);
                const targetIndex = newFolders.findIndex(f => f.id === targetFolderId);

                if (draggedIndex === -1 || targetIndex === -1) return;

                const [draggedItem] = newFolders.splice(draggedIndex, 1);
                newFolders.splice(targetIndex, 0, draggedItem);

                saveFolders(newFolders);

            } else {
                const { id, type } = data;
                if (targetFolderId === 'jobTracker' && type !== 'jobApplication') return;
                if (targetFolderId !== 'jobTracker' && type === 'jobApplication') {
                    if (!folders.some(f => f.id === targetFolderId)) return;
                }

                if (type === 'resume') updateResume(id, { section: targetFolderId });
                if (type === 'portfolio') updatePortfolio(id, { section: targetFolderId });
                if (type === 'interview') updatePracticeHistory(id, { section: targetFolderId });
                if (type === 'jobApplication') updateJobApplication(id, { section: targetFolderId });
            }
        } catch (error) { console.error("Failed to handle drop:", error); }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string, type: 'resume' | 'portfolio' | 'interview' | 'jobApplication' | 'folder') => {
        e.dataTransfer.setData('application/job-id', JSON.stringify({ id, type }));
        e.dataTransfer.setData('application/json', JSON.stringify({ id, type }));
        if (type !== 'folder') {
            e.stopPropagation();
        }
    };

    // If resumes are loading, or if there are no resumes (which will cause a redirect), show a loading screen.
    // This prevents the empty dashboard from flashing on screen for new users.
    if (isLoadingResumes || (!isLoadingResumes && resumes.length === 0)) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-950">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                <p className="dark:text-white mt-4">{t('dashboard.loading')}</p>
            </div>
        );
    }

    const isLoading = isLoadingHistory || isLoadingJobs;

    return (
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
            {/* Upgrade Modal for Site Limits */}
            <ConfirmationModal
                isOpen={isUpgradeModalOpen}
                onCancel={() => setIsUpgradeModalOpen(false)}
                onConfirm={() => navigate('/subscription')}
                title="Limit Reached"
                message={limitMessage}
                confirmText="Upgrade Now"
                cancelText="Maybe Later"
                variant="default"
            />
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-20">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 sm:h-20">
                        <div className="flex items-center gap-4">
                            <a href="/" className="flex items-center gap-2">
                                <Logo className="h-8 w-8" />
                                <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">CareerVivid</span>
                            </a>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden lg:block">{currentUser?.email}</span>

                            {/* AI Usage Progress Bar */}
                            {aiUsage && (
                                /* Desktop: Minimal Progress Bar */
                                <div className="hidden xl:block w-48">
                                    <AIUsageProgressBar
                                        used={aiUsage.count}
                                        limit={aiUsage.limit}
                                        isPremium={isPremium}
                                        onUpgradeClick={() => navigate('/subscription')}
                                        variant="minimal"
                                    />
                                </div>
                            )}
                            <LanguageSelect />
                            <ThemeToggle />
                            <button onClick={() => navigate('/interview-studio')} className="flex items-center gap-2 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 font-semibold py-2 px-3 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/80 transition-colors">
                                <Mic size={20} /> <span className="hidden md:inline">{t('nav.interview_studio')}</span>
                            </button>
                            <div className="relative" ref={newMenuRef}>
                                <button onClick={() => setIsNewMenuOpen(!isNewMenuOpen)} className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-3 rounded-lg shadow-soft hover:bg-primary-700 transition-colors">
                                    <PlusCircle size={20} /> <span className="hidden md:inline">{t('dashboard.create_new')}</span> <ChevronDown size={20} />
                                </button>
                                {isNewMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border dark:border-gray-700">
                                        <div className="py-1">
                                            <button onClick={() => { navigate('/newresume'); setIsNewMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <FileText size={16} /> {t('dashboard.new_resume')}
                                            </button>
                                            <button onClick={() => { navigate('/portfolio'); setIsNewMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <Globe size={16} /> New Portfolio
                                            </button>
                                            <button onClick={() => { navigate('/interview-studio'); setIsNewMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <Mic size={16} /> {t('dashboard.interview_practice')}
                                            </button>
                                            <button onClick={() => { navigate('/job-market'); setIsNewMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <Briefcase size={16} /> Find Jobs (Professional)
                                            </button>
                                            <button onClick={() => { navigate('/job-tracker'); setIsNewMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <Briefcase size={16} /> {t('dashboard.track_new_job')}
                                            </button>
                                            <div className="border-t my-1 border-gray-200 dark:border-gray-600"></div>
                                            <button onClick={() => { handleAddFolder(); setIsNewMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <FolderPlus size={16} /> {t('dashboard.new_folder')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="relative" ref={userMenuRef}>
                                <button onClick={handleStep1Click} className="relative w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                                    {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="User" className="w-full h-full rounded-full object-cover" /> : <UserIcon size={20} />}

                                    {/* Step 1 Arrow: Pointing UP to Profile Icon */}
                                    {!isPremium && upgradeStep === 1 && (
                                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce-vertical pointer-events-none z-50">
                                            <svg className="w-8 h-8 text-orange-500 transform -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                            <span className="text-orange-500 font-bold text-sm whitespace-nowrap bg-white dark:bg-gray-800 px-1 rounded shadow-sm">Click on Profile</span>
                                        </div>
                                    )}
                                </button>
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border dark:border-gray-700">
                                        <div className="py-1">
                                            <a href="/profile" onClick={handleStep2Click} className="relative block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                {t('dashboard.profile')}
                                                {/* Step 2 Arrow: Pointing LEFT to Profile Link (from Right side) */}
                                                {!isPremium && upgradeStep === 2 && (
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 animate-bounce-horizontal pointer-events-none">
                                                        <svg className="w-6 h-6 text-orange-500 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                        </svg>
                                                        <span className="text-orange-500 font-bold text-xs whitespace-nowrap">Click Here</span>
                                                    </div>
                                                )}
                                            </a>
                                            {isPremium && <a href="/referrals" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Referrals</a>}
                                            {(userProfile?.roles?.includes('academic_partner') || userProfile?.role === 'academic_partner') && <a href="/academic-partner" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{t('dashboard.academic_partner')}</a>}
                                            {(userProfile?.roles?.includes('business_partner') || userProfile?.role === 'business_partner') && <a href="/business-partner/dashboard" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Business Partner</a>}
                                            {isAdmin && <a href="/admin" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{t('dashboard.admin')}</a>}
                                            <button onClick={logOut} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{t('dashboard.sign_out')}</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Only: Full Width AI Progress Bar */}
                    {aiUsage && (
                        <div className="block xl:hidden pb-3 -mt-2">
                            <AIUsageProgressBar
                                used={aiUsage.count}
                                limit={aiUsage.limit}
                                isPremium={isPremium}
                                onUpgradeClick={() => navigate('/subscription')}
                                variant="mobile-line"
                            />
                        </div>
                    )}
                </div>
            </header>
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Summary Cards */}
                <DashboardSummaryCards
                    resumeCount={resumes.length}
                    interviewCount={practiceHistory.length}
                    portfolioCount={portfolios.length}
                    jobCount={jobApplications.length}
                />

                {/* Interview Sessions Preview */}
                <DashboardPreviewSection
                    title="Interview Studio Sessions"
                    icon={<GripVertical className="rotate-90" size={20} />}
                    items={practiceHistory}
                    onViewAll={() => navigate('/interview-studio')}
                    emptyMessage="No practice sessions yet. Start your first mock interview!"
                    renderItem={(session) => (
                        <InterviewHistoryCard
                            key={session.id}
                            entry={session}
                            onDelete={deletePracticeHistory}
                            onShowReport={setSelectedJobForReport}
                            onDragStart={(e) => e.preventDefault()}
                        />
                    )}
                />

                {/* Resumes Preview */}
                <DashboardPreviewSection
                    title="My Resumes"
                    icon={<GripVertical className="rotate-90" size={20} />}
                    items={resumes}
                    onViewAll={() => navigate('/newresume')}
                    emptyMessage="No resumes created yet. Create your first resume!"
                    renderItem={(resume) => (
                        <ResumeCard
                            key={resume.id}
                            resume={resume}
                            onDelete={deleteResume}
                            onDuplicate={duplicateResume}
                            onUpdate={updateResume}
                            onShare={(r) => setShareModalResume(r)}
                            onDragStart={(e) => e.preventDefault()}
                        />
                    )}
                />
            </div>


            <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" /></div>}>
                {selectedJobForReport && <InterviewReportModal jobHistoryEntry={selectedJobForReport} onClose={() => setSelectedJobForReport(null)} />}
            </Suspense>
            {selectedJobApplication && <JobDetailModal job={selectedJobApplication} onClose={() => setSelectedJobApplication(null)} onUpdate={updateJobApplication} onDelete={(id) => { confirmItemDelete(id, 'job'); setSelectedJobApplication(null); }} />}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirmModal}
                confirmText={confirmModal.confirmText}
            />

            {
                shareModalResume && (
                    <ShareResumeModal
                        isOpen={!!shareModalResume}
                        onClose={() => setShareModalResume(null)}
                        resume={shareModalResume}
                        onUpdate={updateResume}
                    />
                )
            }

            {
                shareModalPortfolio && (
                    <SharePortfolioModal
                        isOpen={!!shareModalPortfolio}
                        onClose={() => setShareModalPortfolio(null)}
                        portfolioId={shareModalPortfolio.id}
                        portfolioTitle={shareModalPortfolio.title}
                        portfolioData={shareModalPortfolio}
                    />
                )
            }

            <FolderReorderModal
                isOpen={isFolderReorderModalOpen}
                onClose={() => setIsFolderReorderModalOpen(false)}
                folders={folders}
                onSave={saveFolders}
            />
        </div >
    );
};

export default Dashboard;
