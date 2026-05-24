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
import { resolveChunkFieldId } from '../utils/resumeTextChunks';
import { initializeApp, deleteApp } from 'firebase/app';
import {
    GoogleAuthProvider,
    getAuth,
    signInWithPopup,
    User
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

interface UseEditorProps {
    resumeId?: string;
    initialData?: ResumeData;
    isShared?: boolean;
    onSharedUpdate?: (data: Partial<ResumeData>) => void;
    initialViewMode?: 'edit' | 'preview';
    initialActiveTab?: 'content' | 'template' | 'design' | 'comments' | 'score';
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
    const [activeTab, setActiveTab] = useState<'content' | 'template' | 'design' | 'comments' | 'score'>(initialActiveTab);
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
    const [isExportSuccessModalOpen, setIsExportSuccessModalOpen] = useState(false);
    const [exportedDocUrl, setExportedDocUrl] = useState('');
    const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
    const [translationSuccessModal, setTranslationSuccessModal] = useState<{
        isOpen: boolean;
        newResumeId: string;
    }>({ isOpen: false, newResumeId: '' });


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
            default: return '520px';
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
                try {
                localStorage.setItem('guestResume', JSON.stringify(newResumeState));
            } catch (e) {
                if (e instanceof Error && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                    console.warn("Storage quota exceeded, clearing guestResume to free up space.");
                    localStorage.removeItem('guestResume');
                }
            }
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
            const { baseFieldId, formFieldId } = resolveChunkFieldId(fieldId);
            const exactElement = document.getElementById(formFieldId) ||
                document.getElementById(baseFieldId) ||
                document.getElementById(`${baseFieldId}.chunk.0`);
            const container = document.getElementById(`container-${baseFieldId}`);
            const element = exactElement || container?.querySelector<HTMLElement>('textarea, input, select, button, [tabindex]:not([tabindex="-1"])');
            const scrollTarget = element || container;

            if (scrollTarget) {
                scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            if (element) {
                element.focus({ preventScroll: true });
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
            setTranslationSuccessModal({ isOpen: true, newResumeId });
        } catch (error: any) {
            console.error('Translation failed:', error);
            setAlertState({ isOpen: true, title: t('editor.translation_failed'), message: error.message || 'Failed' });
        } finally {
            setIsTranslating(false);
        }
    };

    const getGoogleDocExportUrl = (docUrl: string) => {
        const docId = docUrl.match(/\/document\/d\/([^/?#]+)/)?.[1];
        return docId ? `https://docs.google.com/document/d/${docId}/export?format=docx` : '';
    };

    const triggerDownloadUrl = (url: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getDriveAccessToken = async (user: User) => {
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/drive.file');
        provider.setCustomParameters({ login_hint: user.email || '' });

        // Initialize a temporary secondary Firebase app to sign in with Google in a sandboxed auth instance.
        // This completely avoids linking conflicts and does not affect the main app's authentication state!
        const tempAppName = `gdoc-export-${Date.now()}`;
        const tempApp = initializeApp(auth.app.options, tempAppName);
        const tempAuth = getAuth(tempApp);

        try {
            const result = await signInWithPopup(tempAuth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const accessToken = credential?.accessToken;
            if (!accessToken) throw new Error("Failed to authorize Google Drive access.");
            return accessToken;
        } finally {
            // Safely clean up the temporary app in memory
            deleteApp(tempApp).catch(err => console.error("Temp App cleanup failed:", err));
        }
    };

    const openGoogleDocsExportTab = () => {
        const exportTab = window.open('', '_blank');
        if (!exportTab) return null;
        exportTab.opener = null;
        exportTab.document.title = 'Preparing Google Doc...';
        exportTab.document.body.innerHTML = `
            <main style="font-family: Inter, Arial, sans-serif; display: grid; min-height: 100vh; place-items: center; margin: 0; color: #111827; background-color: #f9fafb;">
                <div style="text-align: center; padding: 24px;">
                    <div style="margin-bottom: 20px; display: inline-block; width: 48px; height: 48px; border: 4px solid #3b82f6; border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite;"></div>
                    <h1 style="font-size: 22px; font-weight: 600; margin-bottom: 8px; color: #1f2937;">Preparing your Google Doc...</h1>
                    <p style="color: #6b7280; font-size: 15px; margin: 0; max-width: 320px; line-height: 1.5;">We are generating your resume document. This page will automatically redirect once it is ready.</p>
                </div>
                <style>
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
            </main>
        `;
        return exportTab;
    };

    const isGoogleDocUrl = (url: string) => {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.hostname === 'docs.google.com' && parsedUrl.pathname.startsWith('/document/d/');
        } catch {
            return false;
        }
    };

    const openGeneratedGoogleDoc = (docUrl: string, exportTab: Window | null) => {
        if (!isGoogleDocUrl(docUrl)) {
            exportTab?.close();
            throw new Error("Google Docs export finished, but the returned document link was invalid.");
        }
        if (exportTab && !exportTab.closed) {
            exportTab.location.href = docUrl;
            return;
        }
        window.open(docUrl, '_blank', 'noopener,noreferrer');
    };

    const handleGoogleDocsExport = async (format: 'google-docs' | 'docx' = 'google-docs') => {
        if (handleGuestAction('download')) return;
        if (!resume) return;

        if (!currentUser || !currentUser.email) {
            setAlertState({ isOpen: true, title: "Export Failed", message: "Please sign in before exporting your resume." });
            return;
        }

        setIsExporting(true);
        setExportProgress(format === 'docx' ? "Preparing Word document..." : "Preparing Google Doc...");

        let exportTab: Window | null = null;
        const cacheKey = `gdoc_access_token_${currentUser.uid}`;
        let tokenToUse = googleAccessToken;
        let isPreAuthorized = false;

        // Try to retrieve a valid cached token from sessionStorage if React state is empty
        if (!tokenToUse) {
            try {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    const { token, expiresAt } = JSON.parse(cached);
                    if (expiresAt > Date.now() + 60000) { // 1 minute safety buffer
                        tokenToUse = token;
                        setGoogleAccessToken(token);
                        isPreAuthorized = true;
                    }
                }
            } catch (e) {
                console.warn("Failed to retrieve cached Google token:", e);
            }
        } else {
            isPreAuthorized = true;
        }

        try {
            // 1. If we don't have the Google access token yet, request it first.
            // We do NOT open the exportTab yet, to prevent the browser from seeing two popups (Auth popup + exportTab)
            // in the same click handler and triggering the popup blocker.
            if (!tokenToUse) {
                setExportProgress("Requesting Google Drive Access...");
                const accessToken = await getDriveAccessToken(currentUser);
                tokenToUse = accessToken;
                setGoogleAccessToken(accessToken);

                // Cache the token in sessionStorage (valid for ~1 hour)
                try {
                    const expiresAt = Date.now() + 3500 * 1000;
                    sessionStorage.setItem(cacheKey, JSON.stringify({ token: accessToken, expiresAt }));
                } catch (e) {
                    console.error("Failed to cache Google token:", e);
                }
            }

            // 2. Now that we have the access token:
            // - If this was a subsequent export (token was already cached), we can open the exportTab immediately
            //   since no Auth popup was triggered. This is 100% blocker-free!
            // - If this was the first export (just finished Auth popup), opening a new tab programmatically now
            //   might be blocked by browser popup blockers since it's inside an async promise chain.
            //   So we only attempt exportTab if the token was already cached. Otherwise, we rely on the modal!
            if (format === 'google-docs' && isPreAuthorized) {
                exportTab = openGoogleDocsExportTab();
            }

            setExportProgress(format === 'docx' ? "Generating Word document..." : "Generating Google Doc...");
            const exportFn = httpsCallable(functions, 'exportToGoogleDocs');
            const response = await exportFn({ resumeData: resume, accessToken: tokenToUse });
            const { docUrl } = response.data as any;

            if (format === 'docx') {
                const docxUrl = getGoogleDocExportUrl(docUrl);
                if (!docxUrl) throw new Error("Could not create the Word document download link.");

                triggerDownloadUrl(docxUrl, `${resume.title.replace(/[^a-zA-Z0-9]/g, '_')}.docx`);
                setToastMessage("Word document download started.");
            } else {
                if (isPreAuthorized && exportTab) {
                    openGeneratedGoogleDoc(docUrl, exportTab);
                    setToastMessage("Google Doc opened in new tab.");
                } else {
                    setExportedDocUrl(docUrl);
                    setIsExportSuccessModalOpen(true);
                    setToastMessage("Resume exported to Google Docs.");
                }
            }

            trackUsage(currentUser.uid, 'resume_download', { format });
        } catch (error: any) {
            console.error("Google Docs Export Failed:", error);
            if (exportTab) {
                try { exportTab.close(); } catch (e) {}
            }

            if (error.code === 'auth/popup-closed-by-user') {
                setToastMessage("Export cancelled.");
            } else if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/account-exists-with-different-credential') {
                setAlertState({
                    isOpen: true,
                    title: "Google Docs Export Failed",
                    message: "That Google account is already connected to another CareerVivid login. Please export with the same Google account you use for this resume account, or sign out and use the account that owns this resume."
                });
            } else if (error.code === 'auth/user-mismatch') {
                setAlertState({
                    isOpen: true,
                    title: "Account Mismatch",
                    message: `Please choose the same Google account as your CareerVivid login (${currentUser.email}).`
                });
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
            try {
                localStorage.setItem(storageKey, JSON.stringify({ viewed: true, timestamp: currentTimestamp }));
            } catch (e) {
                // Ignore storage errors for view tracking
            }
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
            const sideWidth = isDesktop && sidebarMode !== 'closed' ? (sidebarMode === 'expanded' ? window.innerWidth - 32 : 520) : 0;
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
            try {
                localStorage.setItem('guideArrowShownCount', newCount.toString());
            } catch (e) {
                // Ignore storage errors for UI hints
            }
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
    };
};
