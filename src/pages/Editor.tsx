import React from 'react';
import { ResumeData } from '../types';
import { useEditor } from '../hooks/useEditor';
import { TEMPLATES } from '../templates';

// UI Components
import Toast from '../components/Toast';
import AlertModal from '../components/AlertModal';
import ConfirmationModal from '../components/ConfirmationModal';
import FeedbackModal from '../components/FeedbackModal';
import UpgradeModal from '../components/UpgradeModal';
import ShareResumeModal from '../components/ShareResumeModal';
import { Sparkles, Loader2 } from 'lucide-react';

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
        updateResume
    } = useEditor({
        resumeId,
        initialData,
        isShared,
        onSharedUpdate,
        initialViewMode,
        initialActiveTab
    });

    if (!resume && (!isShared && !isGuestMode)) return <div className="flex justify-center items-center h-screen dark:text-white">{t('editor.loading_resume')}</div>;
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
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
        </div>
    );
};

export default Editor;
