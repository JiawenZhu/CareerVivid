import React, { Suspense, useRef, useEffect } from 'react';
import { PlusCircle, FileText, Mic, Briefcase, LayoutDashboard, Loader2, Globe, User as UserIcon, ChevronDown, FolderPlus, PenTool, LayoutGrid, List, PanelLeft, Github, Users, MessageSquare, ClipboardList } from 'lucide-react';

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
import DesktopCapabilityBanner from '../components/Dashboard/DesktopCapabilityBanner';
import ReorderDashboardModal from '../components/Dashboard/ReorderDashboardModal';
import JobDetailModal from '../components/JobTracker/JobDetailModal';

// Lazy load modal
const InterviewReportModal = React.lazy(() => import('../components/InterviewReportModal'));

const Dashboard: React.FC = () => {
    const {
        navPosition,
        toggleNavPosition,
        dashboardTitle,
        isDesktop,
        t,
        resumes,
        isLoadingResumes,
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

    if (isDesktop && isLoadingResumes) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-950">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                <p className="dark:text-white mt-4">{t('dashboard.loading')}</p>
            </div>
        );
    }

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
                            <div className="flex items-center gap-4">
                                <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} className="flex items-center gap-2">
                                    <Logo className="h-8 w-8" />
                                    <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">CareerVivid</span>
                                </a>
                            </div>
                            <div className="flex items-center gap-2 md:gap-4">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden lg:block">{currentUser?.email}</span>
                                {aiUsage && (
                                    <div className="hidden xl:block w-48">
                                        <AIUsageProgressBar used={aiUsage.count} limit={aiUsage.limit} isPremium={isPremium} onUpgradeClick={() => navigate('/subscription')} variant="minimal" />
                                    </div>
                                )}
                                <LanguageSelect />
                                <ThemeToggle />
                                <a href="https://github.com/Jastalk/CareerVivid" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:block" title="Open Source Project">
                                    <Github size={20} />
                                </a>
                                <button onClick={toggleNavPosition} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:block" title="Toggle Sidebar">
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
                                                <button onClick={async () => { const id = await createWhiteboard(); navigate(`/whiteboard/${id}`); setIsNewMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    <PenTool size={16} /> New Whiteboard
                                                </button>
                                                <button onClick={() => { navigate('/sop/new'); setIsNewMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    <ClipboardList size={16} /> New SOP Document
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
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-all">{dashboardTitle}</h1>
                    </div>

                    {!isDesktop && <DesktopCapabilityBanner />}

                    <div className="block md:hidden w-full mb-4">
                        <a onClick={(e) => { e.preventDefault(); navigate('/my-posts'); }} className="block bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 shadow-lg shadow-blue-500/30 text-white relative overflow-hidden active:scale-95 transition-transform cursor-pointer group">
                            <MessageSquare className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 transform -rotate-12 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm"><MessageSquare size={20} className="text-white" /></div>
                                <span className="font-medium text-blue-100">My Posts</span>
                            </div>
                            <div className="text-4xl font-bold mt-4 relative z-10">{myCommunityPosts?.length || 0}</div>
                        </a>
                    </div>

                    {isDesktop && <WorkspaceSummaryCards />}

                    <div className="flex justify-end mt-6 mb-2 pr-1">
                        <button onClick={() => setViewMode(viewMode === 'row' ? 'grid' : 'row')} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm font-medium" title={viewMode === 'row' ? 'Switch to Grid View' : 'Switch to Row View'}>
                            {viewMode === 'row' ? (<><LayoutGrid size={18} /> <span className="hidden sm:inline">Grid View</span></>) : (<><List size={18} /> <span className="hidden sm:inline">Row View</span></>)}
                        </button>
                    </div>

                    {sectionOrder.map(sectionId => {
                        const commonProps = {
                            key: sectionId,
                            viewMode,
                            sectionName: sectionNames[sectionId],
                            onLongPress: () => setIsReorderModalOpen(true),
                            onTitleChange: (name: string) => handleSectionNameChange(sectionId, name)
                        };

                        switch (sectionId) {
                            case 'interviewStudio':
                                return isDesktop && <InterviewStudioSection {...commonProps} setSelectedJobForReport={setSelectedJobForReport} />;
                            case 'resumes':
                                return isDesktop && <ResumesSection {...commonProps} setShareModalResume={setShareModalResume} />;
                            case 'whiteboards':
                                return isDesktop && <WhiteboardsSection {...commonProps} setShareModalWhiteboard={setShareModalWhiteboard} />;
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
                                        renderItem={(post) => <DashboardPostCard key={post.id} post={post} onDelete={deleteCommunityPost} onDragStart={() => { }} />}
                                    />
                                );
                            case 'portfolios':
                                return isDesktop && <PortfoliosSection {...commonProps} setShareModalPortfolio={setShareModalPortfolio} handleDuplicatePortfolio={handleDuplicatePortfolio} />;
                            case 'jobTracker':
                                return isDesktop && <JobTrackerSection {...commonProps} setSelectedJobApplication={setSelectedJobApplication} />;
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
