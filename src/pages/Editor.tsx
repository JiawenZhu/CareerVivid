import React, { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { useResumes } from '../hooks/useResumes';
import { ResumeData, TemplateInfo, ResumeMatchAnalysis } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';
import { trackUsage } from '../services/trackingService';
import { translateResumeContent, duplicateAndTranslateResume } from '../services/translationService';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { playNotificationSound } from '../utils/notificationSound';
import { getLatestAnnotation, AnnotationObject, subscribeToAnnotations } from '../services/annotationService';
import { subscribeToComments, Comment } from '../services/commentService';
import { TEMPLATES } from '../templates';
import { createNewResume } from '../constants';
import { auth, functions } from '../firebase'; // Ensure functions is imported if not already
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

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

const Editor: React.FC<EditorProps> = ({
    resumeId,
    initialData,
    isShared = false,
    onSharedUpdate,
    initialViewMode = 'edit',
    initialActiveTab = 'content'
}) => {
    // Hooks & Context
    const { getResumeById, updateResume, isLoading: isResumeLoading } = useResumes();
    const { currentUser, isPremium, isAdmin } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation();

    // State
    const [resume, setResume] = useState<ResumeData | null>(null);
    const [tempPhoto, setTempPhoto] = useState<string | null>(null);
    const [activeTemplate, setActiveTemplate] = useState<TemplateInfo>(TEMPLATES[0]);

    const [viewMode, setViewMode] = useState<'edit' | 'preview'>(initialViewMode);
    const [activeTab, setActiveTab] = useState<'content' | 'template' | 'design' | 'comments'>(initialActiveTab);
    const [previousTab, setPreviousTab] = useState<'content' | 'template' | 'design'>('content');

    const [sidebarMode, setSidebarMode] = useState<'closed' | 'standard' | 'expanded'>('standard');
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

    // Modals & UI States
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [isGuestMode, setIsGuestMode] = useState(false);
    const [isTemplateLoading, setIsTemplateLoading] = useState(false);
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '' });
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isSignupPromptOpen, setIsSignupPromptOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    // Optimization & Preview States
    const [optimizationJob, setOptimizationJob] = useState<{ title: string; description: string; analysis?: ResumeMatchAnalysis } | null>(null);
    const [isPreviewBlurred, setIsPreviewBlurred] = useState(false);
    const [scale, setScale] = useState(1);
    const editorPreviewContainerRef = useRef<HTMLDivElement>(null);

    // Feedback & Collaboration
    const [hasAnnotations, setHasAnnotations] = useState(false);
    const [annotationUrl, setAnnotationUrl] = useState<string | null>(null);
    const [annotationObjects, setAnnotationObjects] = useState<AnnotationObject[]>([]);
    const [showAnnotationOverlay, setShowAnnotationOverlay] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [hasViewedFeedback, setHasViewedFeedback] = useState(false);
    const [lastFeedbackTimestamp, setLastFeedbackTimestamp] = useState<number>(0);
    const isInitialLoadRef = useRef(true);

    // Onboarding
    const [showGuideArrow, setShowGuideArrow] = useState(false);
    const [guideArrowShownCount, setGuideArrowShownCount] = useState(0);

    // Memoized Values
    const sampleResumeForPreview = useMemo(() => createNewResume(), []);

    const sidebarWidth = useMemo(() => {
        if (!isDesktop) return '100%';
        switch (sidebarMode) {
            case 'closed': return '0px';
            case 'expanded': return 'calc(100% - 2rem)';
            default: return '450px';
        }
    }, [isDesktop, sidebarMode]);

    // Calculate Preview Scale
    useLayoutEffect(() => {
        const calculateScale = () => {
            // Logic to find container width. Since component is extracted, we might need a ref logic here or passed from parent?
            // Actually, scaling logic is ideally inside EditorPreview, but it depends on window and sidebarMode.
            // We'll keep the scale state here and pass it down, or move calculation inside EditorPreview.
            // For simplicity, let's keep the listener here but target the container which is now inside EditorPreview.
            // Wait, EditorPreview has its own ref `editorPreviewContainerRef`.
            // Ideally EditorPreview should handle its own scaling. 
            // However, `sidebarMode` affects available width.
            // Let's rely on window resize and sidebar changes.
            // We need access to the container element width.
            // I'll assume EditorPreview handles sizing internally OR I pass a ref. 
            // To keep it clean, let's move scale calculation into EditorPreview? 
            // No, let's keep it here for now as checking width of `flex-1` area requires DOM access.
            // I'll query selector or pass a ref down.
            const container = document.querySelector('.custom-scrollbar > div'); // Rough selector or use ID
            if (container) {
                const parentWidth = container.parentElement?.parentElement?.offsetWidth;
                // This is getting messy. Let's stick to the current logic:
                // The container is the sibling of sidebar.
                const availableWidth = window.innerWidth - (isDesktop && sidebarMode !== 'closed' ? parseInt(sidebarWidth) : 0);
                const originalWidth = 794;
                // Rough estimation
                if (availableWidth > 0 && availableWidth < originalWidth + 64) {
                    setScale((availableWidth - 32) / originalWidth);
                } else {
                    setScale(1);
                }
            }
        };

        const simpleCalculateScale = () => {
            // simplified logic based on window width and sidebar
            const sideWidth = isDesktop && sidebarMode !== 'closed' ? (sidebarMode === 'expanded' ? window.innerWidth - 32 : 450) : 0;
            const available = window.innerWidth - sideWidth;
            const originalWidth = 794; // A4 width px
            if (available < originalWidth + 64) {
                setScale(Math.max(0.3, (available - 48) / originalWidth));
            } else {
                setScale(1);
            }
        }

        simpleCalculateScale();
        window.addEventListener('resize', simpleCalculateScale);
        const timeout = setTimeout(simpleCalculateScale, 300);
        return () => {
            window.removeEventListener('resize', simpleCalculateScale);
            clearTimeout(timeout);
        };
    }, [sidebarMode, viewMode, isDesktop, sidebarWidth]);

    // Effects
    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => { setViewMode(initialViewMode); }, [initialViewMode]);
    useEffect(() => { setActiveTab(initialActiveTab); }, [initialActiveTab]);
    useEffect(() => {
        if (activeTab !== 'content' && sidebarMode === 'expanded') setSidebarMode('standard');
    }, [activeTab, sidebarMode]);

    useEffect(() => {
        if (!isShared && sessionStorage.getItem('isFirstResume') === 'true') {
            setShowCelebration(true);
            sessionStorage.removeItem('isFirstResume');
            setTimeout(() => setShowCelebration(false), 4000);
        }
        const jobDesc = sessionStorage.getItem('jobDescriptionForOptimization');
        const jobTitle = sessionStorage.getItem('jobTitleForOptimization');
        const jobAnalysisStr = sessionStorage.getItem('jobMatchAnalysis');
        let jobAnalysis: ResumeMatchAnalysis | undefined;
        if (jobAnalysisStr) {
            try {
                jobAnalysis = JSON.parse(jobAnalysisStr);
            } catch (e) { console.error('Failed to parse match analysis', e); }
        }

        if (jobDesc && jobTitle) {
            setOptimizationJob({
                title: jobTitle,
                description: jobDesc,
                analysis: jobAnalysis
            });
        }
    }, [isShared]);

    useEffect(() => {
        const arrowCount = localStorage.getItem('guideArrowShownCount');
        if (arrowCount) setGuideArrowShownCount(parseInt(arrowCount, 10));
    }, []);

    useEffect(() => {
        if (activeTab !== 'content' && guideArrowShownCount < 2 && !isShared) {
            setShowGuideArrow(true);
            const newCount = guideArrowShownCount + 1;
            setGuideArrowShownCount(newCount);
            localStorage.setItem('guideArrowShownCount', newCount.toString());
            const timer = setTimeout(() => setShowGuideArrow(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [activeTab, guideArrowShownCount, isShared]);

    // Data Loading Logic
    useEffect(() => {
        if (isShared && initialData) {
            setResume(initialData);
            setActiveTemplate(TEMPLATES.find(t => t.id === initialData.templateId) || TEMPLATES[0]);
            setIsGuestMode(false);
            return;
        }
        if (resumeId === 'guest') {
            setIsGuestMode(true);
            const guestResumeJson = localStorage.getItem('guestResume');
            if (guestResumeJson) {
                const guestResume = JSON.parse(guestResumeJson);
                setResume(guestResume);
                setActiveTemplate(TEMPLATES.find(t => t.id === guestResume.templateId) || TEMPLATES[0]);
                setViewMode('preview');
            } else {
                navigate('/demo');
            }
            return;
        }
        setIsGuestMode(false);
        if (!isResumeLoading && resumeId) {
            const loadedResume = getResumeById(resumeId);
            if (loadedResume) {
                setResume(loadedResume);
                setActiveTemplate(TEMPLATES.find(t => t.id === loadedResume.templateId) || TEMPLATES[0]);
            }
        }
    }, [resumeId, getResumeById, isResumeLoading, isShared, initialData]);

    useEffect(() => { setTempPhoto(null); }, [resumeId]);

    // Auto-correct theme color if invalid for current template
    useEffect(() => {
        if (resume && activeTemplate && !activeTemplate.availableColors.includes(resume.themeColor)) {
            // Only update if the current color is strictly NOT in the list
            // This prevents "Creative" (Teal) from being black
            const defaultColor = activeTemplate.availableColors[0];
            handleResumeChange({ themeColor: defaultColor });
        }
    }, [activeTemplate, resume?.themeColor]);

    // Feedback & Annotations Logic
    useEffect(() => {
        if (!resume || !resume.id || !currentUser || isShared || isGuestMode) {
            setHasAnnotations(false);
            setAnnotationUrl(null);
            return;
        }
        const storageKey = `feedback_viewed_${currentUser.uid}_${resume.id}`;
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
            try {
                const { viewed, timestamp } = JSON.parse(storedData);
                setHasViewedFeedback(viewed);
                setLastFeedbackTimestamp(timestamp);
            } catch (e) { console.error(e); }
        }

        const unsubscribeComments = subscribeToComments(currentUser.uid, resume.id!, (newComments) => {
            if (!isInitialLoadRef.current && newComments.length > comments.length && newComments[0].userId !== currentUser.uid && (newComments[0].createdAt?.toMillis() || Date.now()) > lastFeedbackTimestamp) {
                setToastMessage(`New feedback received from ${newComments[0].author}`);
                playNotificationSound();
                if (!showAnnotationOverlay) {
                    setHasViewedFeedback(false);
                    localStorage.removeItem(storageKey);
                }
            }
            setComments(newComments);
        });

        const unsubscribeAnnotations = subscribeToAnnotations(currentUser.uid, resume.id!, (annotation) => {
            if (annotation) {
                setHasAnnotations(true);
                setAnnotationUrl(annotation.imageUrl);
                setAnnotationObjects(annotation.objects || []);
                if (!isInitialLoadRef.current && !hasAnnotations && (annotation.createdAt?.toMillis() || Date.now()) > lastFeedbackTimestamp) {
                    setToastMessage(`New annotation received from ${annotation.author || 'Reviewer'}`);
                    playNotificationSound();
                    if (!showAnnotationOverlay) {
                        setHasViewedFeedback(false);
                        localStorage.removeItem(storageKey);
                    }
                }
            } else {
                setHasAnnotations(false);
                setAnnotationUrl(null);
                setAnnotationObjects([]);
            }
        });

        setTimeout(() => { isInitialLoadRef.current = false; }, 1000);
        return () => { unsubscribeComments(); unsubscribeAnnotations(); };
    }, [resume, currentUser, isShared, isGuestMode, hasAnnotations, comments.length]);

    // Handlers
    const handleGuestAction = (actionType: 'download') => {
        if (isGuestMode && !isShared) {
            setIsSignupPromptOpen(true);
            return true;
        }
        return false;
    };

    const handleResumeChange = useCallback((updatedData: Partial<ResumeData>) => {
        if (resume) {
            if (updatedData.personalDetails?.photo && updatedData.personalDetails.photo !== resume.personalDetails.photo) {
                setTempPhoto(null);
            }
            const newResumeState = { ...resume, ...updatedData };
            setResume(newResumeState);

            if (isShared && onSharedUpdate) {
                onSharedUpdate(updatedData);
            } else if (isGuestMode) {
                localStorage.setItem('guestResume', JSON.stringify(newResumeState));
            } else {
                updateResume(resume.id, updatedData);
            }
        }
    }, [resume, updateResume, isGuestMode, isShared, onSharedUpdate]);

    const handleDesignChange = (updatedData: Partial<ResumeData>) => handleResumeChange(updatedData);

    const handleSidebarResize = (direction: 'left' | 'right') => {
        if (direction === 'left') {
            if (sidebarMode === 'expanded') setSidebarMode('standard');
            else if (sidebarMode === 'standard') setSidebarMode('closed');
        } else {
            if (sidebarMode === 'closed') setSidebarMode('standard');
            else if (sidebarMode === 'standard' && activeTab === 'content') setSidebarMode('expanded');
        }
    };

    const handleFocusField = useCallback((fieldId: string) => {
        setActiveTab('content');
        if (isDesktop && sidebarMode === 'closed') setSidebarMode('standard');
        if (!isDesktop && viewMode === 'preview') setViewMode('edit');
        setTimeout(() => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.focus();
                element.classList.add('ring-2', 'ring-primary-500', 'ring-offset-2', 'bg-primary-50', 'dark:bg-primary-900/20');
                setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2', 'bg-primary-50', 'dark:bg-primary-900/20');
                }, 2000);
            }
        }, 300);
    }, [isDesktop, sidebarMode, viewMode]);

    const handleTemplateSelect = (template: TemplateInfo) => {
        if (activeTemplate.id === template.id) return;
        setIsTemplateLoading(true);
        setActiveTemplate(template);
        const updates: Partial<ResumeData> = { templateId: template.id };
        if (!template.availableColors.includes(resume?.themeColor || '')) {
            updates.themeColor = template.availableColors[0];
        }
        handleResumeChange(updates);
        setTimeout(() => setIsTemplateLoading(false), 400);
    };

    const handleConfirmNew = () => { setIsConfirmModalOpen(false); navigate('/newresume'); };

    const handleExport = async (optionId: string) => {
        if (handleGuestAction('download')) return;
        if (!resume) return;

        setIsExporting(true);
        const formatName = optionId; // Simplified for brevity in refactor
        setExportProgress(t('editor.generating', { format: formatName }));

        // ... (Export Logic is kept simple here, assume similar to original but delegating to separate function if possible, but for now we keep the core logic or simplified for this step as asked to refactor STRUCTURE mainly. I will retain the logic but maybe in a cleaner way?)
        // To be safe against "breaking working codes", I should probably keep the implementation details or extract them further. 
        // Given the constraints, I will leave the core heavy logic inside for now or extract to a utility if huge.
        // The previous file had massive export logic. Let's try to keep it here but compact.

        // RE-INSERTING THE EXPORT LOGIC (Essential to not break code)
        try {
            if (optionId === 'pdf' && !isPremium) {
                setIsExporting(false);
                setIsUpgradeModalOpen(true);
                return;
            }
            const canUseBackend = currentUser && !isShared;
            if (optionId === 'pdf' && canUseBackend) {
                // ... Backend PDF logic ...
                const token = await currentUser.getIdToken();
                const projectId = 'jastalk-firebase';
                const functionUrl = `https://us-west1-${projectId}.cloudfunctions.net/generateResumePdfHttp`;
                const response = await fetch(functionUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ resumeData: resume, templateId: resume.templateId }) });
                if (!response.ok) throw new Error(`Backend generation failed.`);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${resume.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                document.body.appendChild(link); link.click(); document.body.removeChild(link);
                if (!isGuestMode && !isShared) setIsFeedbackModalOpen(true);
            } else {
                // Client side fallback
                const elementToCapture = document.querySelector('.origin-top') as HTMLElement; // Finding the scaled preview container
                if (!elementToCapture) throw new Error("Preview element not found");
                const html2canvas = (await import('html2canvas')).default;
                const canvas = await html2canvas(elementToCapture, { scale: 3, useCORS: true });

                if (optionId === 'pdf') {
                    const { jsPDF } = await import('jspdf');
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const imgProps = pdf.getImageProperties(imgData);
                    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
                    pdf.save(`${resume.title}.pdf`);
                } else {
                    // PNG logic
                    const dataUrl = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.download = `${resume.title}.png`;
                    link.href = dataUrl;
                    link.click();
                }
            }

            if (currentUser) {
                trackUsage(currentUser.uid, 'resume_download', { format: formatName });
            }
        } catch (error: any) {
            console.error("Export failed:", error);
            setAlertState({ isOpen: true, title: t('editor.export_failed'), message: t('editor.export_failed_msg') });
        } finally {
            setIsExporting(false);
            setExportProgress('');
        }
    };

    const handleTranslateResume = async (targetLanguageCode: string) => {
        if (!resume) return;
        setIsTranslating(true);
        try {
            const newResumeId = await duplicateAndTranslateResume(resume.id!, targetLanguageCode);
            navigate(`/editor/${newResumeId}`);
            setAlertState({ isOpen: true, title: t('editor.translation_complete'), message: t('editor.translation_success_msg') });
        } catch (error: any) {
            console.error('Translation failed:', error);
            setAlertState({ isOpen: true, title: t('editor.translation_failed'), message: error.message || 'Failed' });
        } finally {
            setIsTranslating(false);
        }
    };

    const handleGoogleDocsExport = async () => {
        if (!currentUser || !currentUser.email) return;

        setIsExporting(true);
        setExportProgress("Requesting Google Drive Access...");

        try {
            // 1. Auth Check (Incremental Auth for Drive Scope)
            const provider = new GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/drive.file');

            // Pre-fill the account chooser with the user's current email
            provider.setCustomParameters({
                login_hint: currentUser.email,
                prompt: 'consent' // Force consent screen to ensure we get a fresh token
            });

            const result = await signInWithPopup(auth, provider);

            // 2. Validate that the selected Google account matches the app account
            const googleEmail = result.user.email;
            if (googleEmail?.toLowerCase() !== currentUser.email.toLowerCase()) {
                setAlertState({
                    isOpen: true,
                    title: "Account Mismatch",
                    message: `Please use the same Google account as your CareerVivid login (${currentUser.email}). You selected: ${googleEmail}`
                });
                setIsExporting(false);
                setExportProgress('');
                return; // Abort export
            }

            const credential = GoogleAuthProvider.credentialFromResult(result);
            const accessToken = credential?.accessToken;

            if (!accessToken) {
                throw new Error("Failed to authorize Google Drive access.");
            }

            setExportProgress("Generating Google Doc...");

            // 3. Call Cloud Function
            const exportFn = httpsCallable(functions, 'exportToGoogleDocs');
            const response = await exportFn({
                resumeData: resume,
                accessToken
            });
            const { docUrl } = response.data as any;
            window.open(docUrl, '_blank');

            console.log("Auth Successful. Document Created.");
            setToastMessage("Resume Exported to Google Docs!");

        } catch (error: any) {
            console.error("Google Docs Export Failed:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                setToastMessage("Export cancelled.");
            } else {
                setAlertState({
                    isOpen: true,
                    title: "Export Failed",
                    message: error.message || "Could not connect to Google Drive. Please try again."
                });
            }
        } finally {
            setIsExporting(false);
            setExportProgress('');
        }
    };

    const toggleFeedbackOverlay = () => {
        setShowAnnotationOverlay(!showAnnotationOverlay);
        if (!showAnnotationOverlay) {
            if (activeTab !== 'comments') setPreviousTab(activeTab as 'content' | 'template' | 'design');
            setSidebarMode('standard');
            setActiveTab('comments');
            setHasViewedFeedback(true);
            const storageKey = `feedback_viewed_${currentUser!.uid}_${resume!.id}`;
            const currentTimestamp = Date.now();
            setLastFeedbackTimestamp(currentTimestamp);
            localStorage.setItem(storageKey, JSON.stringify({ viewed: true, timestamp: currentTimestamp }));
        } else {
            setActiveTab(previousTab);
        }
    };

    const closeComments = () => {
        setActiveTab(previousTab);
        setShowAnnotationOverlay(false);
    }

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
                    onDoubleClick={() => { setViewMode('preview'); setSidebarMode('closed'); }}
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
