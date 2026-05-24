import React, { useState, useEffect } from 'react';
import { navigate } from '../utils/navigation';
import { ResumeData } from '../types';
import { useEditor } from '../hooks/useEditor';
import { db } from '../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { TEMPLATES } from '../templates';

// UI Components
import Toast from '../components/Toast';
import AlertModal from '../components/AlertModal';
import ConfirmationModal from '../components/ConfirmationModal';
import FeedbackModal from '../components/FeedbackModal';
import UpgradeModal from '../components/UpgradeModal';
import ShareResumeModal from '../components/ShareResumeModal';
import { Sparkles, Loader2 } from 'lucide-react';
import ExportSuccessModal from '../components/ExportSuccessModal';

// Refactored Components
import EditorHeader from './editor/components/EditorHeader';
import EditorSidebar from './editor/components/EditorSidebar';
import EditorPreview from './editor/components/EditorPreview';
import OptimizationPanel from './editor/components/OptimizationPanel';

interface EditorProps {
    resumeId?: string;
    initialData?: ResumeData;
    isShared?: boolean;
    onSharedUpdate?: (data: Partial<ResumeData>) => void;
    initialViewMode?: 'edit' | 'preview';
    initialActiveTab?: 'content' | 'template' | 'design' | 'comments';
}

const Editor: React.FC<EditorProps> = (props) => {
    const {
        resumeId,
        initialData,
        isShared = false,
        onSharedUpdate,
        initialViewMode = 'edit',
        initialActiveTab = 'content'
    } = props;

    const {
        currentUser,
        isPremium,
        theme,
        toggleTheme,
        t,
        resume,
        tempPhoto,
        setTempPhoto,
        activeTemplate,
        viewMode,
        setViewMode,
        activeTab,
        setActiveTab,
        sidebarMode,
        isDesktop,
        isConfirmModalOpen,
        setIsConfirmModalOpen,
        showCelebration,
        isGuestMode,
        isResumeLoading,
        isTemplateLoading,
        alertState,
        setAlertState,
        isFeedbackModalOpen,
        setIsFeedbackModalOpen,
        isSignupPromptOpen,
        setIsSignupPromptOpen,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        isExporting,
        exportProgress,
        isTranslating,
        optimizationJob,
        setOptimizationJob,
        isPreviewBlurred,
        scale,
        hasAnnotations,
        annotationUrl,
        annotationObjects,
        showAnnotationOverlay,
        isShareModalOpen,
        setIsShareModalOpen,
        comments,
        toastMessage,
        setToastMessage,
        hasViewedFeedback,
        showGuideArrow,
        setShowGuideArrow,
        sampleResumeForPreview,
        sidebarWidth,
        handleResumeChange,
        handleDesignChange,
        handleSidebarResize,
        handleFocusField,
        handleTemplateSelect,
        handleExport,
        handleTranslateResume,
        handleGoogleDocsExport,
        toggleFeedbackOverlay,
        closeComments,
        handleConfirmNew,
        updateResume,
        isExportSuccessModalOpen,
        setIsExportSuccessModalOpen,
        exportedDocUrl,
        translationSuccessModal,
        setTranslationSuccessModal
    } = useEditor({
        resumeId,
        initialData,
        isShared,
        onSharedUpdate,
        initialViewMode,
        initialActiveTab
    });

    // Track if any header dropdown (Download / Translate) is open
    // so the overflow banner can fade transparently behind them
    const [isAnyDropdownOpen, setIsAnyDropdownOpen] = useState(false);

    const [initialTailorModalOpen, setInitialTailorModalOpen] = useState(false);
    const [initialJobDescription, setInitialJobDescription] = useState('');

    // Auto-clear transit data from session storage after the tailor modal is successfully opened/stabilized
    useEffect(() => {
        if (initialTailorModalOpen) {
            const timer = setTimeout(() => {
                sessionStorage.removeItem('transit_resume_tailor');
                sessionStorage.removeItem('transit_resume_tailor_data');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [initialTailorModalOpen]);

    useEffect(() => {
        // 1. Intercept URL search params and move them to sessionStorage if matching the tailor transition source
        const params = new URLSearchParams(window.location.search);
        const source = params.get('source');
        if (source === 'extension_tailor') {
            const scrapeId = params.get('scrapeId') || '';
            const fallbackDescription = params.get('fallbackDescription') || '';
            sessionStorage.setItem('transit_resume_tailor', JSON.stringify({ scrapeId, fallbackDescription }));

            // Cleanse URL immediately to keep query parameters clean and avoid double-triggering
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }

        // 2. Consume from sessionStorage
        const syncTransitJob = async () => {
            const transitStr = sessionStorage.getItem('transit_resume_tailor');
            if (!transitStr) return;

            try {
                const transitData = JSON.parse(transitStr);
                const { scrapeId, fallbackDescription } = transitData;

                // If cached parsed data already exists in sessionStorage, use it directly (resolves StrictMode double-fetch/early-delete)
                const cachedDataStr = sessionStorage.getItem('transit_resume_tailor_data');
                if (cachedDataStr) {
                    const cachedData = JSON.parse(cachedDataStr);
                    setInitialJobDescription(cachedData.description || '');
                    setInitialTailorModalOpen(true);
                    return;
                }

                if (scrapeId) {
                    if (currentUser?.uid) {
                        try {
                            const docRef = doc(db, 'users', currentUser.uid, 'temporaryScrapes', scrapeId);
                            const docSnap = await getDoc(docRef);

                            if (docSnap.exists()) {
                                const data = docSnap.data();
                                const jd = data.description || '';

                                // Cache the fetched results in sessionStorage first
                                sessionStorage.setItem(
                                    'transit_resume_tailor_data',
                                    JSON.stringify({ description: jd })
                                );

                                setInitialJobDescription(jd);
                                setInitialTailorModalOpen(true);

                                // Delete transit document from Firestore
                                await deleteDoc(docRef);
                            }
                        } catch (error) {
                            console.error('Error syncing transit job in Editor:', error);
                        }
                    }
                    // Wait for currentUser?.uid if not loaded yet
                } else if (fallbackDescription) {
                    setInitialJobDescription(fallbackDescription);
                    setInitialTailorModalOpen(true);
                }
            } catch (e) {
                console.error('Error parsing transit resume tailor from sessionStorage:', e);
                sessionStorage.removeItem('transit_resume_tailor');
                sessionStorage.removeItem('transit_resume_tailor_data');
            }
        };

        syncTransitJob();
    }, [currentUser?.uid]);

    if (!resume && (!isShared && !isGuestMode)) {
        if (isResumeLoading) {
            return <div className="flex justify-center items-center h-screen dark:text-white">{t('editor.loading_resume')}</div>;
        }

        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-white">
                <div className="max-w-md text-center">
                    <h1 className="text-2xl font-semibold">Resume not found for this account</h1>
                    <p className="mt-3 text-sm leading-6 text-gray-300">
                        This resume is not available under {currentUser?.email || 'the current sign-in'}. Please sign back into the account that owns this resume and try again.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="mt-6 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }
    if (!resume) return null;

    const resumeForPreview = tempPhoto ? { ...resume, personalDetails: { ...resume.personalDetails, photo: tempPhoto } } : resume;

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
            {showCelebration && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-celebration-fade-in-out">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center">
                        <Sparkles className="w-16 h-16 text-yellow-400 mx-auto animate-celebration-sparkle" />
                        <h2 className="text-3xl font-bold mt-4 text-gray-900 dark:text-white">{t('editor.congrats')}</h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">{t('editor.new_resume_ready')}</p>
                    </div>
                </div>
            )}

            <EditorHeader
                resume={resume}
                currentUser={currentUser!}
                isShared={isShared}
                isGuestMode={isGuestMode}
                isTranslating={isTranslating}
                isExporting={isExporting}
                hasAnnotations={hasAnnotations}
                hasViewedFeedback={hasViewedFeedback}
                commentsCount={comments.length}
                showAnnotationOverlay={showAnnotationOverlay}
                theme={theme}
                showGuideArrow={showGuideArrow}
                onResumeChange={handleResumeChange}
                onExport={handleExport}
                onTranslate={handleTranslateResume}
                onToggleFeedback={toggleFeedbackOverlay}
                onShare={() => setIsShareModalOpen(true)}
                onToggleTheme={toggleTheme}
                setViewMode={setViewMode}
                onDismissGuideArrow={() => setShowGuideArrow(false)}
                onExportToGoogleDocs={handleGoogleDocsExport}
                onDropdownChange={setIsAnyDropdownOpen}
                initialTailorModalOpen={initialTailorModalOpen}
                initialJobDescription={initialJobDescription}
            />

            <div className="flex-grow flex overflow-hidden relative h-[calc(100vh-64px)]">
                <EditorSidebar
                    resume={resume}
                    currentUser={currentUser!}
                    activeTab={activeTab}
                    activeTemplate={activeTemplate}
                    templates={TEMPLATES}
                    sidebarWidth={sidebarWidth}
                    sidebarMode={sidebarMode}
                    isDesktop={isDesktop}
                    isGuestMode={isGuestMode}
                    isShared={isShared}
                    isTemplateLoading={isTemplateLoading}
                    tempPhoto={tempPhoto}
                    sampleResume={sampleResumeForPreview}
                    viewMode={viewMode}
                    setActiveTab={setActiveTab}
                    setTempPhoto={setTempPhoto}
                    onResumeChange={handleResumeChange}
                    onTemplateSelect={handleTemplateSelect}
                    onDesignChange={handleDesignChange}
                    onResizeSidebar={handleSidebarResize}
                    onCloseComments={closeComments}
                />

                <EditorPreview
                    resume={resumeForPreview}
                    viewMode={viewMode}
                    scale={scale}
                    currentUserUid={currentUser?.uid || ''}
                    showAnnotationOverlay={showAnnotationOverlay}
                    annotationUrl={annotationUrl}
                    annotationObjects={annotationObjects}
                    isPreviewBlurred={isPreviewBlurred}
                    onResumeChange={handleResumeChange}
                    onFocusField={handleFocusField}
                    onDoubleClick={() => { setViewMode('preview'); }}
                    isAnyDropdownOpen={isAnyDropdownOpen}
                />

                {optimizationJob && (
                    <OptimizationPanel
                        job={optimizationJob}
                        onClear={() => {
                            setOptimizationJob(null);
                            sessionStorage.removeItem('jobDescriptionForOptimization');
                            sessionStorage.removeItem('jobTitleForOptimization');
                        }}
                    />
                )}
            </div>

            {/* UI Modals */}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                title={t('editor.create_new_confirm_title')}
                message={t('editor.create_new_confirm_msg')}
                onConfirm={handleConfirmNew}
                onCancel={() => setIsConfirmModalOpen(false)}
                confirmText={t('dashboard.create_new')}
            />
            <ConfirmationModal
                isOpen={isSignupPromptOpen}
                title={t('editor.signup_prompt_title')}
                message={t('editor.signup_prompt_msg')}
                onConfirm={() => navigate('/signup')}
                onCancel={() => setIsSignupPromptOpen(false)}
                confirmText={t('auth.sign_up_free')}
            />
            <ConfirmationModal
                isOpen={translationSuccessModal.isOpen}
                title={t('editor.translation_complete')}
                message={t('editor.translation_success_msg')}
                confirmText={t('editor.go_to_translated') || 'Go to Translated Resume'}
                cancelText={t('editor.stay_on_current') || 'Stay on Current Page'}
                onConfirm={() => {
                    navigate(`/edit/${translationSuccessModal.newResumeId}`);
                    setTranslationSuccessModal({ isOpen: false, newResumeId: '' });
                }}
                onCancel={() => {
                    setTranslationSuccessModal({ isOpen: false, newResumeId: '' });
                }}
            />
            <AlertModal
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                onClose={() => setAlertState({ isOpen: false, title: '', message: '' })}
            />
            {isExporting && (
                <div className="fixed inset-0 bg-black/60 z-[101] flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
                        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
                        <p className="mt-4 font-semibold">{exportProgress}</p>
                    </div>
                </div>
            )}
            <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} source="editor" />
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} feature="PDF Export" />
            {isShareModalOpen && resume && (
                <ShareResumeModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} resume={resume} onUpdate={updateResume} />
            )}
            <ExportSuccessModal
                isOpen={isExportSuccessModalOpen}
                onClose={() => setIsExportSuccessModalOpen(false)}
                docUrl={exportedDocUrl}
            />
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
        </div>
    );
};

export default Editor;
