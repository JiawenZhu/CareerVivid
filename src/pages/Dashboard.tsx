import React, { Suspense, useRef, useEffect } from 'react';
import { PlusCircle, FileText, Mic, Briefcase, LayoutDashboard, Globe, User as UserIcon, ChevronDown, FolderPlus, PenTool, LayoutGrid, List, PanelLeft, Users, MessageSquare, ArrowRight, Sparkles, type LucideIcon } from 'lucide-react';

// Hooks & Logic
import { useDashboard } from '../hooks/useDashboard';
import { navigate } from '../utils/navigation';

// UI Components
import AppLayout from '../components/Layout/AppLayout';
import ThemeToggle from '../components/ThemeToggle';
import ConfirmationModal from '../components/ConfirmationModal';
import Logo from '../components/Logo';
import ShareResumeModal from '../components/ShareResumeModal';
import SharePortfolioModal from '../components/SharePortfolioModal';
import ShareWhiteboardModal from '../components/ShareWhiteboardModal';
import LanguageSelect from '../components/LanguageSelect';
import AIUsageProgressBar from '../components/AIUsageProgressBar';

// Refactored Sections
import { 
    WorkspaceSummaryCards, 
    ResumesSection, 
    PortfoliosSection, 
    InterviewStudioSection, 
    WhiteboardsSection, 
    JobTrackerSection 
} from '../components/Dashboard/DashboardSections';

import DashboardPreviewSection from '../components/Dashboard/DashboardPreviewSection';
import DashboardPostCard from '../components/Dashboard/DashboardPostCard';
import { MobilePostCard } from '../components/Dashboard/DashboardMobileCards';
import ReorderDashboardModal from '../components/Dashboard/ReorderDashboardModal';
import JobDetailModal from '../components/JobTracker/JobDetailModal';
import CareerProfileGraphCard from '../components/Dashboard/CareerProfileGraphCard';

// Lazy load modal
const InterviewReportModal = React.lazy(() => import('../components/InterviewReportModal'));

const mobileWorkflowActions = [
    { label: 'Resume', icon: FileText, path: '/newresume', className: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/50' },
    { label: 'Portfolio', icon: Globe, path: '/portfolio', className: 'bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-950/30 dark:text-pink-200 dark:border-pink-900/50' },
    { label: 'Interview', icon: Mic, path: '/interview-studio', className: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/30 dark:text-purple-200 dark:border-purple-900/50' },
    { label: 'Jobs', icon: Briefcase, path: '/jobs/recommend', className: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/50' },
    { label: 'Community', icon: MessageSquare, path: '/community', className: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/50' },
    { label: 'Whiteboard', icon: PenTool, path: '/whiteboard', className: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:border-slate-800' },
];

const MobileWorkflowLauncher: React.FC = () => (
    <nav className="md:hidden mb-6" aria-label="Dashboard workflows">
        <div className="grid grid-cols-3 gap-2">
            {mobileWorkflowActions.map(({ label, icon: Icon, path, className }) => (
                <button
                    key={path}
                    type="button"
                    onClick={() => navigate(path)}
                    className={`min-h-[76px] rounded-2xl border px-2.5 py-3 text-center shadow-sm transition active:scale-[0.98] ${className}`}
                >
                    <Icon size={19} className="mx-auto mb-2" />
                    <span className="block text-[11px] font-bold leading-tight">{label}</span>
                </button>
            ))}
        </div>
    </nav>
);

interface DesktopWorkspaceCommandCenterProps {
    title: string;
    resumeCount: number;
    interviewCount: number;
    portfolioCount: number;
    jobCount: number;
    communityPostCount: number;
    whiteboardCount: number;
    viewMode: 'row' | 'grid';
    onToggleView: () => void;
    onOrganizeSections: () => void;
}

const DesktopWorkspaceCommandCenter: React.FC<DesktopWorkspaceCommandCenterProps> = ({
    title,
    resumeCount,
    interviewCount,
    portfolioCount,
    jobCount,
    communityPostCount,
    whiteboardCount,
    viewMode,
    onToggleView,
    onOrganizeSections,
}) => {
    const primaryActions: Array<{
        label: string;
        description: string;
        icon: LucideIcon;
        path: string;
        className: string;
    }> = [
        {
            label: 'Build Resume',
            description: `${resumeCount} saved`,
            icon: FileText,
            path: '/newresume',
            className: 'border-blue-100 bg-blue-50/70 text-blue-700 hover:border-blue-200 hover:bg-blue-100/80 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200',
        },
        {
            label: 'Find Jobs',
            description: 'Recommended matches',
            icon: Briefcase,
            path: '/jobs/recommend',
            className: 'border-emerald-100 bg-emerald-50/70 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-100/80 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200',
        },
        {
            label: 'Practice Interview',
            description: `${interviewCount} sessions`,
            icon: Mic,
            path: '/interview-studio',
            className: 'border-violet-100 bg-violet-50/70 text-violet-700 hover:border-violet-200 hover:bg-violet-100/80 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-200',
        },
    ];

    const workspaceStats: Array<{
        label: string;
        value: number;
        icon: LucideIcon;
        path: string;
    }> = [
        { label: 'Resumes', value: resumeCount, icon: FileText, path: '/newresume' },
        { label: 'Pipeline', value: jobCount, icon: Briefcase, path: '/job-tracker' },
        { label: 'Interviews', value: interviewCount, icon: Mic, path: '/interview-studio' },
        { label: 'Portfolios', value: portfolioCount, icon: Globe, path: '/portfolio' },
        { label: 'Community', value: communityPostCount, icon: MessageSquare, path: '/my-posts' },
        { label: 'Whiteboards', value: whiteboardCount, icon: PenTool, path: '/whiteboard' },
    ];

    return (
        <section className="hidden md:block mb-8">
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
                <div className="rounded-[1.35rem] border border-stone-200/80 bg-white/85 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/55">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                                <Sparkles size={13} />
                                Workspace
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white lg:text-4xl">
                                {title}
                            </h1>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Start from the action you need, then use the sections below for detailed editing and review.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={onToggleView}
                                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700"
                                title={viewMode === 'row' ? 'Switch to Grid View' : 'Switch to Row View'}
                            >
                                {viewMode === 'row' ? <LayoutGrid size={16} /> : <List size={16} />}
                                {viewMode === 'row' ? 'Grid View' : 'Row View'}
                            </button>
                            <button
                                type="button"
                                onClick={onOrganizeSections}
                                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700"
                            >
                                <LayoutDashboard size={16} />
                                Organize
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 lg:grid-cols-3">
                        {primaryActions.map(({ label, description, icon: Icon, path, className }) => (
                            <button
                                key={path}
                                type="button"
                                onClick={() => navigate(path)}
                                className={`group flex min-h-[92px] items-center justify-between rounded-2xl border px-4 py-3 text-left shadow-sm transition ${className}`}
                            >
                                <span className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm dark:bg-slate-950/40">
                                        <Icon size={20} />
                                    </span>
                                    <span>
                                        <span className="block text-sm font-bold">{label}</span>
                                        <span className="mt-1 block text-xs font-medium opacity-75">{description}</span>
                                    </span>
                                </span>
                                <ArrowRight size={17} className="opacity-45 transition group-hover:translate-x-0.5 group-hover:opacity-80" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rounded-[1.35rem] border border-stone-200/80 bg-white/85 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/55">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 dark:text-slate-400">
                                Workspace Snapshot
                            </p>
                            <h2 className="mt-1 text-lg font-extrabold text-gray-950 dark:text-white">
                                Your active career assets
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/subscription')}
                            className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200"
                        >
                            Credits
                        </button>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2.5">
                        {workspaceStats.map(({ label, value, icon: Icon, path }) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => navigate(path)}
                                className="group rounded-2xl border border-stone-200 bg-stone-50/70 p-3 text-left transition hover:border-stone-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                            >
                                <span className="flex items-center justify-between gap-2">
                                    <Icon size={15} className="text-slate-500 dark:text-slate-400" />
                                    <ArrowRight size={13} className="text-slate-400 opacity-0 transition group-hover:opacity-100" />
                                </span>
                                <span className="mt-3 block text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">{value}</span>
                                <span className="mt-0.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const Dashboard: React.FC = () => {
    const {
        navPosition,
        toggleNavPosition,
        dashboardTitle,
        t,
        resumes,
        updateResume,
        portfolios,
        updatePortfolio,
        practiceHistory,
        jobApplications,
        updateJobApplication,
        deleteJobApplication,
        whiteboards,
        updateWhiteboard,
        createWhiteboard,
        myCommunityPosts,
        isLoadingCommunityPosts,
        deleteCommunityPost,
        currentUser,
        logOut,
        isAdmin,
        userProfile,
        isPremium,
        aiUsage,
        selectedJobForReport,
        setSelectedJobForReport,
        selectedJobApplication,
        setSelectedJobApplication,
        shareModalResume,
        setShareModalResume,
        shareModalPortfolio,
        setShareModalPortfolio,
        shareModalWhiteboard,
        setShareModalWhiteboard,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        limitMessage,
        confirmModal,
        viewMode,
        setViewMode,
        sectionOrder,
        setSectionOrder,
        isReorderModalOpen,
        setIsReorderModalOpen,
        sectionNames,
        handleSectionNameChange,
        handleDuplicatePortfolio,
        isUserMenuOpen,
        setIsUserMenuOpen,
        isNewMenuOpen,
        setIsNewMenuOpen,
        upgradeStep,
        handleStep1Click,
        handleAddFolder,
        handleStep2Click,
        confirmItemDelete,
        confirmDeleteTracker,
        closeConfirmModal
    } = useDashboard();

    const userMenuRef = useRef<HTMLDivElement>(null);
    const newMenuRef = useRef<HTMLDivElement>(null);

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
    }, [setIsUserMenuOpen, setIsNewMenuOpen]);

    return (
        <AppLayout>
            <div className="min-h-screen bg-gray-50/50 dark:bg-[#0a0c10]/80 relative overflow-hidden">
                {/* Ambient Base Glow */}
                <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-400/20 dark:bg-primary-600/10 blur-[120px] pointer-events-none z-[-1]" />
                <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[120px] pointer-events-none z-[-1]" />
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
                            <div className="flex min-w-0 items-center gap-3">
                                <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} className="flex items-center gap-2">
                                    <Logo className="h-8 w-8" />
                                    <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">CareerVivid</span>
                                </a>
                                <span className="hidden max-w-[240px] truncate rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 md:inline-flex">
                                    {currentUser?.email || 'Workspace'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3">
                                {aiUsage && (
                                    <div className="hidden xl:block w-48">
                                        <AIUsageProgressBar used={aiUsage.count} limit={aiUsage.limit} isPremium={isPremium} onUpgradeClick={() => navigate('/subscription')} variant="minimal" />
                                    </div>
                                )}
                                <LanguageSelect />
                                <ThemeToggle />
                                <button onClick={toggleNavPosition} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:block" title="Toggle Sidebar">
                                    <PanelLeft size={20} />
                                </button>
                                <button onClick={() => navigate('/community')} className="flex items-center gap-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 font-semibold py-2 px-3 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/80 transition-colors cursor-pointer md:hidden">
                                    <Users size={20} /> <span className="hidden md:inline">{t('nav.community', 'Community')}</span>
                                </button>
                                <div className="relative hidden md:block" ref={newMenuRef}>
                                    <button onClick={() => setIsNewMenuOpen(!isNewMenuOpen)} className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-primary-700">
                                        <PlusCircle size={18} /> <span>{t('dashboard.create_new')}</span> <ChevronDown size={18} />
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
                                                <button onClick={async () => { const id = await createWhiteboard(); navigate(`/whiteboard/${id}`); setIsNewMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    <PenTool size={16} /> New Whiteboard
                                                </button>
                                                {/* <button onClick={() => { navigate('/sop/new'); setIsNewMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    <ClipboardList size={16} /> New SOP Document
                                                </button> */}
                                                <button onClick={() => { navigate('/interview-studio'); setIsNewMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    <Mic size={16} /> {t('dashboard.interview_practice')}
                                                </button>
                                                <button onClick={() => { navigate('/jobs/recommend'); setIsNewMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    <Briefcase size={16} /> Find recommended jobs
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
                                        {!isPremium && upgradeStep === 1 && (
                                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce-vertical pointer-events-none z-50">
                                                <svg className="w-8 h-8 text-orange-500 transform -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                <span className="text-orange-500 font-bold text-sm whitespace-nowrap bg-white dark:bg-gray-800 px-1 rounded shadow-sm">Click on Profile</span>
                                            </div>
                                        )}
                                    </button>
                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border dark:border-gray-700">
                                            <div className="py-1">
                                                <button onClick={() => { handleStep2Click(); navigate('/profile'); }} className="w-full text-left relative block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    {t('dashboard.profile')}
                                                    {!isPremium && upgradeStep === 2 && (
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 animate-bounce-horizontal pointer-events-none">
                                                            <svg className="w-6 h-6 text-orange-500 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                            <span className="text-orange-500 font-bold text-xs whitespace-nowrap">Click Here</span>
                                                        </div>
                                                    )}
                                                </button>
                                                <button onClick={() => navigate('/developer')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Developer Settings (API/MCP)</button>
                                                {isPremium && <button onClick={() => navigate('/referrals')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Referrals</button>}
                                                {(userProfile?.roles?.includes('academic_partner') || userProfile?.role === 'academic_partner') && <button onClick={() => navigate('/academic-partner')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{t('dashboard.academic_partner')}</button>}
                                                {(userProfile?.roles?.includes('business_partner') || userProfile?.role === 'business_partner') && <button onClick={() => navigate('/business-partner/dashboard')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Business Partner</button>}
                                                {(userProfile?.roles?.includes('agency_partner') || userProfile?.role === 'agency_partner') && <button onClick={() => navigate('/agency-partner/dashboard')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Agency Partner</button>}
                                                {isAdmin && <button onClick={() => navigate('/admin')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{t('dashboard.admin')}</button>}
                                                <button onClick={logOut} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{t('dashboard.sign_out')}</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {aiUsage && (
                            <div className="block xl:hidden pb-3 -mt-2">
                                <AIUsageProgressBar used={aiUsage.count} limit={aiUsage.limit} isPremium={isPremium} onUpgradeClick={() => navigate('/subscription')} variant="mobile-line" />
                            </div>
                        )}
                    </div>
                </header>

                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8 md:hidden">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-all">{dashboardTitle}</h1>
                    </div>

                    {navPosition === 'side' ? (
                        <div className="mb-8 hidden md:block">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-all">{dashboardTitle}</h1>
                        </div>
                    ) : (
                        <DesktopWorkspaceCommandCenter
                            title={dashboardTitle}
                            resumeCount={resumes.length}
                            interviewCount={practiceHistory.length}
                            portfolioCount={portfolios.length}
                            jobCount={jobApplications.length}
                            communityPostCount={myCommunityPosts.length}
                            whiteboardCount={whiteboards.length}
                            viewMode={viewMode}
                            onToggleView={() => setViewMode(viewMode === 'row' ? 'grid' : 'row')}
                            onOrganizeSections={() => setIsReorderModalOpen(true)}
                        />
                    )}

                    <MobileWorkflowLauncher />

                    <CareerProfileGraphCard
                        resumes={resumes}
                        portfolios={portfolios}
                        practiceHistory={practiceHistory}
                        jobApplications={jobApplications}
                    />

                    <div className={navPosition === 'side' ? undefined : 'md:hidden'}>
                        <WorkspaceSummaryCards />
                    </div>

                    <div className={`justify-end mt-6 mb-2 pr-1 ${navPosition === 'side' ? 'hidden md:flex' : 'flex md:hidden'}`}>
                        <button onClick={() => setViewMode(viewMode === 'row' ? 'grid' : 'row')} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm font-medium" title={viewMode === 'row' ? 'Switch to Grid View' : 'Switch to Row View'}>
                            {viewMode === 'row' ? (<><LayoutGrid size={18} /> <span className="hidden sm:inline">Grid View</span></>) : (<><List size={18} /> <span className="hidden sm:inline">Row View</span></>)}
                        </button>
                    </div>

                    {sectionOrder.map(sectionId => {
                        const commonProps = {
                            viewMode,
                            sectionName: sectionNames[sectionId],
                            onLongPress: () => setIsReorderModalOpen(true),
                            onTitleChange: (name: string) => handleSectionNameChange(sectionId, name)
                        };

                        switch (sectionId) {
                            case 'interviewStudio':
                                return <InterviewStudioSection key={sectionId} {...commonProps} setSelectedJobForReport={setSelectedJobForReport} />;
                            case 'resumes':
                                return <ResumesSection key={sectionId} {...commonProps} setShareModalResume={setShareModalResume} />;
                            case 'whiteboards':
                                return <WhiteboardsSection key={sectionId} {...commonProps} setShareModalWhiteboard={setShareModalWhiteboard} />;
                            case 'communityPosts':
                                return (
                                    <DashboardPreviewSection
                                        key={sectionId}
                                        title={sectionNames.communityPosts}
                                        items={myCommunityPosts}
                                        viewMode={viewMode}
                                        onLongPress={() => setIsReorderModalOpen(true)}
                                        onViewAll={() => navigate('/community')}
                                        onTitleChange={(name) => handleSectionNameChange('communityPosts', name)}
                                        emptyMessage="You haven't written any community posts yet. Share your experience!"
                                        mobileRenderItem={(post) => <MobilePostCard key={post.id} post={post} onDelete={deleteCommunityPost} />}
                                        renderItem={(post) => <DashboardPostCard key={post.id} post={post} onDelete={deleteCommunityPost} onDragStart={() => { }} />}
                                    />
                                );
                            case 'portfolios':
                                return <PortfoliosSection key={sectionId} {...commonProps} setShareModalPortfolio={setShareModalPortfolio} handleDuplicatePortfolio={handleDuplicatePortfolio} />;
                            case 'jobTracker':
                                return <JobTrackerSection key={sectionId} {...commonProps} setSelectedJobApplication={setSelectedJobApplication} />;
                            default:
                                return null;
                        }
                    })}
                </div>

                {/* Modals & Overlays */}
                <ConfirmationModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={closeConfirmModal} confirmText={confirmModal.confirmText} />
                {selectedJobForReport && (
                    <Suspense fallback={<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center text-white">Loading Report...</div>}>
                        <InterviewReportModal jobHistoryEntry={selectedJobForReport} onClose={() => setSelectedJobForReport(null)} />
                    </Suspense>
                )}
                {selectedJobApplication && (
                    <JobDetailModal onClose={() => setSelectedJobApplication(null)} job={selectedJobApplication} onUpdate={updateJobApplication} onDelete={deleteJobApplication} />
                )}
                {shareModalResume && (
                    <ShareResumeModal isOpen={!!shareModalResume} onClose={() => setShareModalResume(null)} resume={shareModalResume} onUpdate={updateResume} />
                )}
                {shareModalPortfolio && (
                    <SharePortfolioModal isOpen={!!shareModalPortfolio} onClose={() => setShareModalPortfolio(null)} portfolioId={shareModalPortfolio.id} portfolioTitle={shareModalPortfolio.title} portfolioData={shareModalPortfolio} />
                )}
                {shareModalWhiteboard && (
                    <ShareWhiteboardModal isOpen={!!shareModalWhiteboard} onClose={() => setShareModalWhiteboard(null)} whiteboard={shareModalWhiteboard} />
                )}
                <ReorderDashboardModal isOpen={isReorderModalOpen} onClose={() => setIsReorderModalOpen(false)} sections={sectionOrder.map(id => ({ id, label: sectionNames[id] }))} onSave={setSectionOrder} />
            </div>
        </AppLayout>
    );
};

export default Dashboard;
