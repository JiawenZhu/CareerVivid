import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useResumes } from '../hooks/useResumes';
import { usePortfolios } from '../hooks/usePortfolios';
import { useWhiteboards } from '../hooks/useWhiteboards';
import { ResumeData, PracticeHistoryEntry, JobApplicationData, Folder, WhiteboardData } from '../types';
import { PortfolioData } from '../features/portfolio/types/portfolio';
import { PlusCircle, FileText, Mic, Briefcase, GripVertical, LayoutDashboard, Loader2, Globe, Plus, User as UserIcon, LogOut, ChevronDown, FolderPlus, Trash2, PenTool, LayoutGrid, List, ChevronRight, PanelLeft, Github, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import AppLayout from '../components/Layout/AppLayout';
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
import ShareWhiteboardModal from '../components/ShareWhiteboardModal';
import FolderReorderModal from '../components/FolderReorderModal';
import { useTranslation } from 'react-i18next';
import LanguageSelect from '../components/LanguageSelect';
import AIUsageProgressBar from '../components/AIUsageProgressBar';
import { useSidebarStore } from '../store/useSidebarStore';
import { useMediaQuery } from '../hooks/useMediaQuery';

// Extracted Components
import ResumeCard from '../components/Dashboard/ResumeCard';
import InterviewHistoryCard from '../components/Dashboard/InterviewHistoryCard';
import JobApplicationCard from '../components/Dashboard/JobApplicationCard';
import WhiteboardCard from '../components/Dashboard/WhiteboardCard';
import EditableHeader from '../components/Dashboard/EditableHeader';
import { ResumeCardSkeleton, InterviewHistoryCardSkeleton } from '../components/Dashboard/DashboardSkeletons';
import DashboardSummaryCards from '../components/Dashboard/DashboardSummaryCards';
import DashboardPreviewSection, { DraggableSectionHeader } from '../components/Dashboard/DashboardPreviewSection';
import ReorderDashboardModal, { SectionItem } from '../components/Dashboard/ReorderDashboardModal';
import { useMyCommunityPosts } from '../hooks/useMyCommunityPosts';
import DashboardPostCard from '../components/Dashboard/DashboardPostCard';
import DesktopCapabilityBanner from '../components/Dashboard/DesktopCapabilityBanner';

// Lazy load modal to optimize dashboard load time
const InterviewReportModal = React.lazy(() => import('../components/InterviewReportModal'));

// --- Workspace Sub-components for Conditional Mounting ---

const WorkspaceSummaryCards: React.FC = () => {
    const { resumes } = useResumes();
    const { portfolios } = usePortfolios();
    const { practiceHistory } = usePracticeHistory();
    const { jobApplications } = useJobTracker();

    return (
        <DashboardSummaryCards
            resumeCount={resumes.length}
            interviewCount={practiceHistory.length}
            portfolioCount={portfolios.length}
            jobCount={jobApplications.length}
        />
    );
};

interface SectionProps {
    viewMode: 'row' | 'grid';
    sectionName: string;
    onLongPress: () => void;
    onTitleChange: (name: string) => void;
}

const ResumesSection: React.FC<SectionProps & { setShareModalResume: (r: ResumeData) => void }> = ({ 
    viewMode, sectionName, onLongPress, onTitleChange, setShareModalResume 
}) => {
    const { resumes, deleteResume, duplicateResume, updateResume } = useResumes();
    const { t } = useTranslation();
    
    return (
        <DashboardPreviewSection
            title={sectionName}
            items={resumes}
            viewMode={viewMode}
            onLongPress={onLongPress}
            onViewAll={() => navigate('/newresume')}
            onTitleChange={onTitleChange}
            emptyMessage={t('dashboard.no_resumes') || "No resumes created yet. Create your first resume!"}
            renderItem={(resume) => (
                <ResumeCard
                    key={resume.id}
                    resume={resume}
                    onDelete={deleteResume}
                    onDuplicate={duplicateResume}
                    onUpdate={updateResume}
                    onShare={setShareModalResume}
                    onDragStart={(e) => e.preventDefault()}
                />
            )}
        />
    );
};

const PortfoliosSection: React.FC<SectionProps & { 
    setShareModalPortfolio: (p: PortfolioData) => void;
    handleDuplicatePortfolio: (id: string) => void;
}> = ({ 
    viewMode, sectionName, onLongPress, onTitleChange, setShareModalPortfolio, handleDuplicatePortfolio 
}) => {
    const { portfolios, deletePortfolio, updatePortfolio } = usePortfolios();
    
    return (
        <DashboardPreviewSection
            title={sectionName}
            items={portfolios}
            viewMode={viewMode}
            onLongPress={onLongPress}
            onViewAll={() => navigate('/portfolio')}
            onTitleChange={onTitleChange}
            emptyMessage="No portfolios created yet."
            renderItem={(portfolio) => (
                <PortfolioCard
                    key={portfolio.id}
                    portfolio={portfolio}
                    onDelete={deletePortfolio}
                    onDuplicate={handleDuplicatePortfolio}
                    onUpdate={updatePortfolio}
                    onShare={setShareModalPortfolio}
                    onDragStart={(e) => e.preventDefault()}
                />
            )}
        />
    );
};

const InterviewStudioSection: React.FC<SectionProps & { setSelectedJobForReport: (e: PracticeHistoryEntry) => void }> = ({ 
    viewMode, sectionName, onLongPress, onTitleChange, setSelectedJobForReport 
}) => {
    const { practiceHistory, deletePracticeHistory } = usePracticeHistory();
    
    return (
        <DashboardPreviewSection
            title={sectionName}
            items={practiceHistory}
            viewMode={viewMode}
            onLongPress={onLongPress}
            onViewAll={() => navigate('/interview-studio')}
            onTitleChange={onTitleChange}
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
    );
};

const WhiteboardsSection: React.FC<SectionProps & { setShareModalWhiteboard: (w: WhiteboardData) => void }> = ({ 
    viewMode, sectionName, onLongPress, onTitleChange, setShareModalWhiteboard 
}) => {
    const { whiteboards, deleteWhiteboard, duplicateWhiteboard, updateWhiteboard, createWhiteboard } = useWhiteboards();
    
    return (
        <React.Fragment>
            <DashboardPreviewSection
                title={sectionName}
                items={whiteboards}
                viewMode={viewMode}
                onLongPress={onLongPress}
                onViewAll={() => navigate('/whiteboard')}
                onTitleChange={onTitleChange}
                emptyMessage="No whiteboards created yet."
                renderItem={(whiteboard) => (
                    <WhiteboardCard
                        key={whiteboard.id}
                        whiteboard={whiteboard}
                        onDelete={deleteWhiteboard}
                        onDuplicate={duplicateWhiteboard}
                        onUpdate={updateWhiteboard}
                        onShare={setShareModalWhiteboard}
                        onDragStart={(e) => e.preventDefault()}
                    />
                )}
            />
            {whiteboards.length === 0 && (
                <div className="flex justify-center -mt-8 mb-10">
                    <button
                        onClick={async () => {
                            const id = await createWhiteboard();
                            navigate(`/whiteboard/${id}`);
                        }}
                        className="bg-primary-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-primary-700 transition"
                    >
                        + Create a New Whiteboard
                    </button>
                </div>
            )}
        </React.Fragment>
    );
};

const JobTrackerSection: React.FC<SectionProps & { setSelectedJobApplication: (j: JobApplicationData) => void }> = ({ 
    viewMode, sectionName, onLongPress, onTitleChange, setSelectedJobApplication 
}) => {
    const { jobApplications, updateJobApplication } = useJobTracker();
    
    return (
        <div className="mb-10">
            <DraggableSectionHeader
                title={sectionName}
                viewMode={viewMode}
                onLongPress={onLongPress}
                onViewAll={() => navigate('/job-tracker')}
                hasItems={jobApplications.length > 0}
                onTitleChange={onTitleChange}
            />

            <div className="mb-6">
                <StatusOverview applications={jobApplications} />
            </div>

            <KanbanBoard
                applications={jobApplications}
                onCardClick={setSelectedJobApplication}
                onUpdateApplication={updateJobApplication}
            />
        </div>
    );
};

// --- Constants and Utilities ---

const SECTIONS_CONFIG: SectionItem[] = [
    { id: 'interviewStudio', label: 'Technical Interview Simulator Sessions' },
    { id: 'resumes', label: 'My Resumes' },
    { id: 'whiteboards', label: 'My Whiteboards' },
    { id: 'portfolios', label: 'Portfolios' },
    { id: 'communityPosts', label: 'My Community Posts' },
    { id: 'jobTracker', label: 'Career Pipeline' },
];

const DEFAULT_ORDER = SECTIONS_CONFIG.map(s => s.id);

const DEFAULT_SECTION_NAMES: Record<string, string> = {
    interviewStudio: 'Technical Interview Simulator Sessions',
    resumes: 'My Resumes',
    whiteboards: 'My Whiteboards',
    portfolios: 'Portfolios',
    communityPosts: 'My Community Posts',
    jobTracker: 'Career Pipeline',
};

const handleDuplicatePortfolioInWrapper = async (
    id: string, 
    portfoliosList: PortfolioData[], 
    isPremiumUser: boolean, 
    duplicateFn: (id: string) => Promise<void>,
    setLimitMessage: (msg: string) => void,
    setIsUpgradeModalOpen: (open: boolean) => void
) => {
    const portfolio = portfoliosList.find(p => p.id === id);
    if (!portfolio) return;
    
    const totalCount = portfoliosList.length;
    const bioLinksCount = portfoliosList.filter(p => p.mode === 'linkinbio').length;

    if (!isPremiumUser && totalCount >= 2) {
        setLimitMessage('Free users can only create up to 2 sites. Please upgrade your plan to create more.');
        setIsUpgradeModalOpen(true);
        return;
    }

    if (portfolio.mode === 'linkinbio' && !isPremiumUser && bioLinksCount >= 1) {
        setLimitMessage('You have reached your Bio-Link limit. Please upgrade your plan to create more.');
        setIsUpgradeModalOpen(true);
        return;
    }

    await duplicateFn(id);
};

const Dashboard: React.FC = () => {

    const { navPosition, toggleNavPosition } = useNavigation();
    const dashboardTitle = useSidebarStore(state => state.getNodeTitle('/dashboard')) || 'Dashboard';
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const { t } = useTranslation();

    const { resumes, deleteResume, updateResume, isLoading: isLoadingResumes, saveAIGeneratedResume } = useResumes();
    const { portfolios, deletePortfolio, updatePortfolio, duplicatePortfolio } = usePortfolios();
    const { practiceHistory, deletePracticeHistory, updatePracticeHistory, isLoading: isLoadingHistory, addCompletedPractice } = usePracticeHistory();
    const { jobApplications, deleteJobApplication, updateJobApplication, isLoading: isLoadingJobs, deleteAllJobApplications } = useJobTracker();
    const { whiteboards, createWhiteboard } = useWhiteboards();
    const { posts: myCommunityPosts, isLoading: isLoadingCommunityPosts, deletePost: deleteCommunityPost } = useMyCommunityPosts();

    const { currentUser, logOut, isAdmin, userProfile, isPremium, aiUsage } = useAuth();

    const [selectedJobForReport, setSelectedJobForReport] = useState<PracticeHistoryEntry | null>(null);
    const [selectedJobApplication, setSelectedJobApplication] = useState<JobApplicationData | null>(null);
    const [shareModalResume, setShareModalResume] = useState<ResumeData | null>(null);
    const [shareModalPortfolio, setShareModalPortfolio] = useState<PortfolioData | null>(null);
    const [shareModalWhiteboard, setShareModalWhiteboard] = useState<WhiteboardData | null>(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [limitMessage, setLimitMessage] = useState('You have reached your site limit. Please upgrade your plan to create more.');

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { }, confirmText: 'Confirm' });

    // View Mode Toggle State
    const [viewMode, setViewMode] = useState<'row' | 'grid'>(() => {
        return (localStorage.getItem('careervivid_dashboard_view') as 'row' | 'grid') || 'row';
    });

    useEffect(() => {
        localStorage.setItem('careervivid_dashboard_view', viewMode);
    }, [viewMode]);

    // Dashboard Sections Reordering State
    const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem('careervivid_dashboard_order');
            if (stored) {
                const parsed = JSON.parse(stored);
                const missing = DEFAULT_ORDER.filter(id => !parsed.includes(id));
                return [...parsed, ...missing];
            }
        } catch (e) {
            console.error("Failed to parse dashboard order:", e);
        }
        return DEFAULT_ORDER;
    });

    useEffect(() => {
        localStorage.setItem('careervivid_dashboard_order', JSON.stringify(sectionOrder));
    }, [sectionOrder]);

    const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

    const [sectionNames, setSectionNames] = useState<Record<string, string>>(() => {
        try {
            const stored = localStorage.getItem('careervivid_section_names');
            if (stored) return { ...DEFAULT_SECTION_NAMES, ...JSON.parse(stored) };
        } catch (e) {
            console.error("Failed to parse section names:", e);
        }
        return { ...DEFAULT_SECTION_NAMES };
    });

    const handleSectionNameChange = (sectionId: string, newName: string) => {
        setSectionNames(prev => {
            const updated = { ...prev, [sectionId]: newName };
            localStorage.setItem('careervivid_section_names', JSON.stringify(updated));
            return updated;
        });
    };

    const handleDuplicatePortfolio = async (id: string) => {
        await handleDuplicatePortfolioInWrapper(id, portfolios, isPremium, duplicatePortfolio, setLimitMessage, setIsUpgradeModalOpen);
    };

    useEffect(() => {
        if (!currentUser) return;
        const importGuestData = async () => {
            const guestResumeJSON = localStorage.getItem('guestResume');
            if (guestResumeJSON) {
                try {
                    const guestResume = JSON.parse(guestResumeJSON);
                    await saveAIGeneratedResume(guestResume);
                    localStorage.removeItem('guestResume');
                    trackDemoConversion('convertedResumeUsers');
                } catch (e) { console.error(e); }
            }
            const guestInterviewJSON = localStorage.getItem('guestInterview');
            if (guestInterviewJSON) {
                try {
                    const guestInterview = JSON.parse(guestInterviewJSON);
                    await addCompletedPractice(guestInterview);
                    localStorage.removeItem('guestInterview');
                    trackDemoConversion('convertedInterviewUsers');
                } catch (e) { console.error(e); }
            }
        };
        const timer = setTimeout(importGuestData, 500);
        return () => clearTimeout(timer);
    }, [currentUser, saveAIGeneratedResume, addCompletedPractice]);

    const userMenuRef = useRef<HTMLDivElement>(null);
    const newMenuRef = useRef<HTMLDivElement>(null);

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [jobTrackerShowPreview, setJobTrackerShowPreview] = useState(true);

    const [isFolderReorderModalOpen, setIsFolderReorderModalOpen] = useState(false);

    // Upgrade Guide State (Steps 1 & 2)
    const [upgradeStep, setUpgradeStep] = useState(() => {
        const stored = localStorage.getItem('upgrade_guide_step');
        return stored ? parseInt(stored) : 0;
    });

    useEffect(() => {
        const handleTrigger = () => setUpgradeStep(1);
        window.addEventListener('trigger-upgrade-guide', handleTrigger);
        return () => window.removeEventListener('trigger-upgrade-guide', handleTrigger);
    }, []);

    const closeConfirmModal = () => setConfirmModal({ ...confirmModal, isOpen: false });

    const saveFolders = async (newFolders: Folder[]) => {
        const orderedFolders = newFolders.map((f, i) => ({ ...f, order: i }));
        setFolders(orderedFolders);
        if (!currentUser) return;
        const settingsRef = doc(db, 'users', currentUser.uid, 'settings', 'dashboard');
        await updateDoc(settingsRef, { folders: orderedFolders });
    };

    const handleStep1Click = () => {
        setIsUserMenuOpen(!isUserMenuOpen);
        if (upgradeStep === 1) {
            localStorage.setItem('upgrade_guide_step', '2');
            setUpgradeStep(2);
        }
    };

    const handleAddFolder = () => {
        const newFolder = { id: `folder_${Date.now()}`, title: t('dashboard.new_folder'), order: folders.length };
        const updatedFolders = [...folders, newFolder];
        setFolders(updatedFolders);
        // Note: Save to firestore if needed, but for now we'll rely on local/props
    };

    const handleStep2Click = () => {
        if (upgradeStep === 2) {
            localStorage.setItem('upgrade_guide_step', '3');
            setUpgradeStep(3);
        }
    };

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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const confirmItemDelete = (id: string, type: 'resume' | 'practice' | 'job' | 'portfolio' | 'post', coverImage?: string) => {
        setConfirmModal({
            isOpen: true,
            title: t('dashboard.confirm_delete_title', { type }),
            message: t('dashboard.confirm_delete_message', { type }),
            onConfirm: () => {
                if (type === 'resume') deleteResume(id);
                if (type === 'portfolio') deletePortfolio(id);
                if (type === 'practice') deletePracticeHistory(id);
                if (type === 'job') deleteJobApplication(id);
                if (type === 'post') deleteCommunityPost(id, coverImage);
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

    // If resumes are loading, or if there are no resumes (which will cause a redirect), show a loading screen on desktop.
    if (isDesktop && (isLoadingResumes || (!isLoadingResumes && resumes.length === 0))) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-950">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                <p className="dark:text-white mt-4">{t('dashboard.loading')}</p>
            </div>
        );
    }

    const isLoading = isLoadingCommunityPosts || (isDesktop && (isLoadingHistory || isLoadingJobs));

    return (
        <AppLayout>
            <div className="bg-[#f8f9fa] dark:bg-[#0a0c10] min-h-screen">
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
                <header className={`bg-white/80 dark:bg-[#0a0c10]/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800/60 shadow-sm sticky top-0 z-20 ${navPosition === 'side' ? 'md:hidden' : ''}`}>
                    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16 sm:h-20">
                            <div className="flex items-center gap-4">
                                <a
                                    href="/dashboard"
                                    onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
                                    className="flex items-center gap-2"
                                >
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
                                <a
                                    href="https://github.com/Jastalk/CareerVivid"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:block"
                                    title="Open Source Project"
                                >
                                    <Github size={20} />
                                </a>
                                <button
                                    onClick={toggleNavPosition}
                                    className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:block"
                                    title="Toggle Sidebar"
                                >
                                    <PanelLeft size={20} />
                                </button>
                                <button onClick={() => navigate('/community')} className="flex items-center gap-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 font-semibold py-2 px-3 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/80 transition-colors cursor-pointer">
                                    <Users size={20} /> <span className="hidden md:inline">{t('nav.community', 'Community')}</span>
                                </button>
                                <button onClick={() => navigate('/interview-studio')} className="items-center gap-2 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 font-semibold py-2 px-3 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/80 transition-colors hidden md:flex">
                                    <Mic size={20} /> <span className="hidden md:inline">{t('nav.interview_studio')}</span>
                                </button>
                                <div className="relative hidden md:block" ref={newMenuRef}>
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
                                                <button onClick={async () => {
                                                    const id = await createWhiteboard();
                                                    navigate(`/whiteboard/${id}`);
                                                    setIsNewMenuOpen(false);
                                                }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    <PenTool size={16} /> New Whiteboard
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
                                                <button onClick={() => { handleStep2Click(); navigate('/profile'); }} className="w-full text-left relative block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
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
                                                </button>
                                                <button onClick={() => navigate('/developer')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    Developer Settings (API/MCP)
                                                </button>
                                                {isPremium && <button onClick={() => navigate('/referrals')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Referrals</button>}
                                                {(userProfile?.roles?.includes('academic_partner') || userProfile?.role === 'academic_partner') && <button onClick={() => navigate('/academic-partner')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{t('dashboard.academic_partner')}</button>}
                                                {(userProfile?.roles?.includes('business_partner') || userProfile?.role === 'business_partner') && <button onClick={() => navigate('/business-partner/dashboard')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Business Partner</button>}
                                                {isAdmin && <button onClick={() => navigate('/admin')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{t('dashboard.admin')}</button>}
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
                    {/* Dynamic Header synced with Sidebar */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-all">
                            {dashboardTitle}
                        </h1>
                    </div>

                    {/* Mobile Only: Desktop Capability Banner */}
                    {!isDesktop && <DesktopCapabilityBanner />}

                    {/* Mobile-Only: Community Posts Premium Card */}
                    <div className="block md:hidden w-full mb-4">
                        <a
                            onClick={(e) => { e.preventDefault(); navigate('/my-posts'); }}
                            className="block bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 shadow-lg shadow-blue-500/30 text-white relative overflow-hidden active:scale-95 transition-transform cursor-pointer group"
                        >
                            {/* Decorative element */}
                            <MessageSquare className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 transform -rotate-12 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />

                            <div className="flex items-center gap-3 relative z-10">
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                    <MessageSquare size={20} className="text-white" />
                                </div>
                                <span className="font-medium text-blue-100">My Posts</span>
                            </div>
                            <div className="text-4xl font-bold mt-4 relative z-10">
                                {myCommunityPosts?.length || 0}
                            </div>
                        </a>
                    </div>

                    {/* Summary Cards */}
                    {isDesktop && <WorkspaceSummaryCards />}

                    {/* View Mode Toggle */}
                    <div className="flex justify-end mt-6 mb-2 pr-1">
                        <button
                            onClick={() => setViewMode(viewMode === 'row' ? 'grid' : 'row')}
                            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm font-medium"
                            title={viewMode === 'row' ? 'Switch to Grid View' : 'Switch to Row View'}
                        >
                            {viewMode === 'row' ? (
                                <><LayoutGrid size={18} /> <span className="hidden sm:inline">Grid View</span></>
                            ) : (
                                <><List size={18} /> <span className="hidden sm:inline">Row View</span></>
                            )}
                        </button>
                    </div>

                    {/* Sections Rendered in Configured Order */}
                    {sectionOrder.map(sectionId => {
                        switch (sectionId) {
                            case 'interviewStudio':
                                return isDesktop && (
                                    <InterviewStudioSection
                                        key={sectionId}
                                        viewMode={viewMode}
                                        sectionName={sectionNames.interviewStudio}
                                        onLongPress={() => setIsReorderModalOpen(true)}
                                        onTitleChange={(name) => handleSectionNameChange('interviewStudio', name)}
                                        setSelectedJobForReport={setSelectedJobForReport}
                                    />
                                );
                            case 'resumes':
                                return isDesktop && (
                                    <ResumesSection
                                        key={sectionId}
                                        viewMode={viewMode}
                                        sectionName={sectionNames.resumes}
                                        onLongPress={() => setIsReorderModalOpen(true)}
                                        onTitleChange={(name) => handleSectionNameChange('resumes', name)}
                                        setShareModalResume={setShareModalResume}
                                    />
                                );
                            case 'whiteboards':
                                return isDesktop && (
                                    <WhiteboardsSection
                                        key={sectionId}
                                        viewMode={viewMode}
                                        sectionName={sectionNames.whiteboards}
                                        onLongPress={() => setIsReorderModalOpen(true)}
                                        onTitleChange={(name) => handleSectionNameChange('whiteboards', name)}
                                        setShareModalWhiteboard={setShareModalWhiteboard}
                                    />
                                );
                            case 'communityPosts':
                                return (
                                    <React.Fragment key={sectionId}>
                                        <DashboardPreviewSection
                                            title={sectionNames.communityPosts}
                                            items={myCommunityPosts}
                                            viewMode={viewMode}
                                            onLongPress={() => setIsReorderModalOpen(true)}
                                            onViewAll={() => navigate('/community')}
                                            onTitleChange={(name) => handleSectionNameChange('communityPosts', name)}
                                            emptyMessage="You haven't written any community posts yet. Share your experience!"
                                            renderItem={(post) => (
                                                <DashboardPostCard
                                                    key={post.id}
                                                    post={post}
                                                    onDelete={deleteCommunityPost}
                                                    onDragStart={() => { }}
                                                />
                                            )}
                                        />
                                    </React.Fragment>
                                );
                            case 'portfolios':
                                return isDesktop && (
                                    <PortfoliosSection
                                        key={sectionId}
                                        viewMode={viewMode}
                                        sectionName={sectionNames.portfolios}
                                        onLongPress={() => setIsReorderModalOpen(true)}
                                        onTitleChange={(name) => handleSectionNameChange('portfolios', name)}
                                        setShareModalPortfolio={setShareModalPortfolio}
                                        handleDuplicatePortfolio={handleDuplicatePortfolio}
                                    />
                                );
                            case 'jobTracker':
                                return isDesktop && (
                                    <JobTrackerSection
                                        key={sectionId}
                                        viewMode={viewMode}
                                        sectionName={sectionNames.jobTracker}
                                        onLongPress={() => setIsReorderModalOpen(true)}
                                        onTitleChange={(name) => handleSectionNameChange('jobTracker', name)}
                                        setSelectedJobApplication={setSelectedJobApplication}
                                    />
                                );
                            default:
                                return null;
                        }
                    })}
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

                {
                    shareModalWhiteboard && (
                        <ShareWhiteboardModal
                            isOpen={!!shareModalWhiteboard}
                            onClose={() => setShareModalWhiteboard(null)}
                            whiteboard={shareModalWhiteboard}
                        />
                    )
                }

                <ReorderDashboardModal
                    isOpen={isReorderModalOpen}
                    onClose={() => setIsReorderModalOpen(false)}
                    sections={SECTIONS_CONFIG
                        .filter(s => sectionOrder.includes(s.id))
                        .sort((a, b) => sectionOrder.indexOf(a.id) - sectionOrder.indexOf(b.id))
                    }
                    onSave={(newOrder) => setSectionOrder(newOrder)}
                />

                <FolderReorderModal
                    isOpen={isFolderReorderModalOpen}
                    onClose={() => setIsFolderReorderModalOpen(false)}
                    folders={folders}
                    onSave={saveFolders}
                />
            </div >
        </AppLayout>
    );
};

export default Dashboard;
