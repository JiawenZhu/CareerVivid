import { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
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
import { auth, functions } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

interface UseEditorProps {
    resumeId?: string;
    initialData?: ResumeData;
    isShared?: boolean;
    onSharedUpdate?: (data: Partial<ResumeData>) => void;
    initialViewMode?: 'edit' | 'preview';
    initialActiveTab?: 'content' | 'template' | 'design' | 'comments';
}

export const useEditor = ({
    resumeId,
    initialData,
    isShared = false,
    onSharedUpdate,
    initialViewMode = 'edit',
    initialActiveTab = 'content'
}: UseEditorProps) => {
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

    // Handlers
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

    const handleGuestAction = (actionType: 'download') => {
        if (isGuestMode && !isShared) {
            setIsSignupPromptOpen(true);
            return true;
        }
        return false;
    };

    const handleExport = async (optionId: string) => {
        if (handleGuestAction('download')) return;
        if (!resume) return;

        setIsExporting(true);
        const formatName = optionId;
        setExportProgress(t('editor.generating', { format: formatName }));

        try {
            if (optionId === 'pdf' && !isPremium) {
                setIsExporting(false);
                setIsUpgradeModalOpen(true);
                return;
            }
            const canUseBackend = currentUser && !isShared;
            if (optionId === 'pdf' && canUseBackend) {
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
                const elementToCapture = document.querySelector('.origin-top') as HTMLElement;
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
            const provider = new GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/drive.file');
            provider.setCustomParameters({ login_hint: currentUser.email, prompt: 'consent' });
            const result = await signInWithPopup(auth, provider);
            const googleEmail = result.user.email;
            if (googleEmail?.toLowerCase() !== currentUser.email.toLowerCase()) {
                setAlertState({ isOpen: true, title: "Account Mismatch", message: `Please use the same Google account as your CareerVivid login (${currentUser.email}). You selected: ${googleEmail}` });
                setIsExporting(false);
                setExportProgress('');
                return;
            }
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const accessToken = credential?.accessToken;
            if (!accessToken) throw new Error("Failed to authorize Google Drive access.");
            setExportProgress("Generating Google Doc...");
            const exportFn = httpsCallable(functions, 'exportToGoogleDocs');
            const response = await exportFn({ resumeData: resume, accessToken });
            const { docUrl } = response.data as any;
            window.open(docUrl, '_blank');
            setToastMessage("Resume Exported to Google Docs!");
        } catch (error: any) {
            console.error("Google Docs Export Failed:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                setToastMessage("Export cancelled.");
            } else {
                setAlertState({ isOpen: true, title: "Export Failed", message: error.message || "Could not connect to Google Drive. Please try again." });
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

    const handleConfirmNew = () => { setIsConfirmModalOpen(false); navigate('/newresume'); };

    // Layout Effects
    useLayoutEffect(() => {
        const simpleCalculateScale = () => {
            const sideWidth = isDesktop && sidebarMode !== 'closed' ? (sidebarMode === 'expanded' ? window.innerWidth - 32 : 450) : 0;
            const available = window.innerWidth - sideWidth;
            const originalWidth = 794;
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
            try { jobAnalysis = JSON.parse(jobAnalysisStr); } catch (e) { console.error('Failed to parse match analysis', e); }
        }
        if (jobDesc && jobTitle) {
            setOptimizationJob({ title: jobTitle, description: jobDesc, analysis: jobAnalysis });
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

    useEffect(() => {
        if (resume && activeTemplate && !activeTemplate.availableColors.includes(resume.themeColor)) {
            const defaultColor = activeTemplate.availableColors[0];
            handleResumeChange({ themeColor: defaultColor });
        }
    }, [activeTemplate, resume?.themeColor]);

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

    return {
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
    };
};
