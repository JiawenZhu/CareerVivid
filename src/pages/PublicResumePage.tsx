import React, { useEffect, useState, useRef, Suspense, useLayoutEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, MessageSquare, PenTool, Loader2, AlertCircle, LayoutDashboard, User as UserIcon, LogOut, User, X, Send } from 'lucide-react';
import { ResumeData } from '../types';
import ResumePreview from '../components/ResumePreview';
import PublicHeader from '../components/PublicHeader';
import AdvancedAnnotationCanvas from '../components/AdvancedAnnotationCanvas';
import { AnnotationObject, getLatestAnnotation } from '../services/annotationService';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { navigate } from '../App';
import { addComment, subscribeToComments, Comment } from '../services/commentService';
import { subscribeToAnnotations } from '../services/annotationService';
import Toast from '../components/Toast';
import CommentsPanel from '../components/CommentsPanel';
import { playNotificationSound } from '../utils/notificationSound';

// Lazy load the Editor to keep initial bundle size small for viewers
const Editor = React.lazy(() => import('./Editor'));



const PublicResumePage: React.FC = () => {
    const [resume, setResume] = useState<ResumeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [scale, setScale] = useState(0.2);
    const [isExporting, setIsExporting] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showAnnotations, setShowAnnotations] = useState(false);
    const [latestAnnotationUrl, setLatestAnnotationUrl] = useState<string | null>(null);
    const [latestAnnotationObjects, setLatestAnnotationObjects] = useState<AnnotationObject[]>([]);
    const [ownerIsPremium, setOwnerIsPremium] = useState(false);
    const [isPreviewBlurred, setIsPreviewBlurred] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const isInitialLoadRef = useRef(true);

    const previewContainerRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const blurOverlayRef = useRef<HTMLDivElement>(null);

    const [routeParams, setRouteParams] = useState<{ userId: string, resumeId: string } | null>(null);
    const { currentUser, isPremium, isAdmin, logOut } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const AuthenticatedHeader = () => (
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-40 h-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <a href="/dashboard" className="flex items-center gap-2">
                        <Logo className="h-8 w-8" />
                        <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">CareerVivid</span>
                    </a>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mr-2"
                    >
                        <LayoutDashboard size={18} />
                        Back to Dashboard
                    </button>



                    <ThemeToggle />

                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 ring-2 ring-transparent hover:ring-primary-500 transition-all"
                        >
                            {currentUser?.photoURL ? (
                                <img src={currentUser.photoURL} alt="User" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <UserIcon size={20} />
                            )}
                        </button>

                        {isUserMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-100 dark:border-gray-700 py-1 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser?.displayName || 'User'}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser?.email}</p>
                                </div>

                                <div className="py-1">
                                    <button onClick={() => navigate('/dashboard')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <LayoutDashboard size={16} /> Dashboard
                                    </button>
                                    <button onClick={() => navigate('/profile')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <User size={16} /> Profile
                                    </button>
                                    <button onClick={logOut} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10">
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );

    useEffect(() => {
        const fetchResume = async (retryCount = 0) => {
            const path = window.location.pathname;
            const cleanPath = path.split('?')[0];
            const parts = cleanPath.split('/').filter(p => p !== '');

            // Expected: ["shared", "userId", "resumeId"] or ["en", "shared", "userId", "resumeId"]
            // Find index of 'shared' to handle language prefix
            const sharedIndex = parts.indexOf('shared');
            if (sharedIndex === -1 || parts.length < sharedIndex + 3) {
                setError("Invalid link format.");
                setLoading(false);
                return;
            }

            const userId = parts[sharedIndex + 1];
            const resumeId = parts[sharedIndex + 2];
            setRouteParams({ userId, resumeId });

            try {
                const projectId = 'jastalk-firebase';
                const url = `https://us-west1-${projectId}.cloudfunctions.net/getPublicResume?userId=${encodeURIComponent(userId)}&resumeId=${encodeURIComponent(resumeId)}`;

                const response = await fetch(url);

                if (response.ok) {
                    const data = await response.json() as ResumeData & { ownerIsPremium?: boolean };
                    setResume(data);
                    setOwnerIsPremium(data.ownerIsPremium || false);
                    setLoading(false);
                } else if (response.status === 403) {
                    setError("This resume is private or no longer shared.");
                    setLoading(false);
                } else if (response.status === 404) {
                    setError("Resume not found.");
                    setLoading(false);
                } else if (response.status === 500 && retryCount < 1) {
                    // Retry once for 500 errors (handling cold starts)
                    console.warn("Got 500 error, retrying...");
                    setTimeout(() => fetchResume(retryCount + 1), 1500);
                    // Don't set loading to false - let the retry handle it
                } else {
                    console.error(`Fetch error: ${response.status} ${response.statusText}`);
                    setError(`Failed to load resume (Status: ${response.status}). The server might be waking up.`);
                    setLoading(false);
                }
            } catch (err: any) {
                console.error("Error fetching resume:", err);
                if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
                    setError("Connection failed. This is likely a CORS issue or the function doesn't have public permissions.");
                } else {
                    setError("Unable to load resume. Please try again later.");
                }
                setLoading(false);
            }
        };

        fetchResume();
    }, []);

    // Real-time Comments and Annotations Subscriptions
    useEffect(() => {
        if (!resume || !routeParams) return;

        // Subscribe to comments
        const unsubscribeComments = subscribeToComments(routeParams.userId, routeParams.resumeId, (newComments) => {
            if (!isInitialLoadRef.current && newComments.length > comments.length) {
                const latestComment = newComments[0];
                // Only show toast if current user is the resume owner AND the comment is from someone else
                const isOwner = currentUser && currentUser.uid === routeParams.userId;
                if (isOwner && latestComment.userId !== currentUser.uid) {
                    setToastMessage(`New feedback received from ${latestComment.author}`);
                    playNotificationSound();
                }
            }
            setComments(newComments);
        });

        // Subscribe to annotations
        const unsubscribeAnnotations = subscribeToAnnotations(routeParams.userId, routeParams.resumeId, (annotation) => {
            if (annotation) {
                const hadAnnotationBefore = !!latestAnnotationUrl;
                setLatestAnnotationUrl(annotation.imageUrl);
                if (annotation.objects) {
                    setLatestAnnotationObjects(annotation.objects);
                }

                // Show toast only if current user is the resume owner AND this is a new annotation (not initial load)
                const isOwner = currentUser && currentUser.uid === routeParams.userId;
                if (isOwner && !isInitialLoadRef.current && !hadAnnotationBefore) {
                    setToastMessage(`New annotation received from ${annotation.author || 'Reviewer'}`);
                    playNotificationSound();
                }
            }
        });

        // Mark initial load as complete after a short delay
        setTimeout(() => {
            isInitialLoadRef.current = false;
        }, 1000);

        return () => {
            unsubscribeComments();
            unsubscribeAnnotations();
        };
    }, [resume, routeParams, comments.length, latestAnnotationUrl, showComments, showAnnotations]);

    useLayoutEffect(() => {
        const calculateScale = () => {
            if (previewContainerRef.current) {
                const parentWidth = previewContainerRef.current.offsetWidth;
                const originalWidth = 824;
                if (parentWidth > 0) {
                    setScale(Math.min(1, (parentWidth - 40) / originalWidth));
                }
            }
        };

        if (resume) {
            calculateScale();
            window.addEventListener('resize', calculateScale);
        }

        return () => window.removeEventListener('resize', calculateScale);
    }, [resume]);

    // Anti-Screenshot Protection
    useEffect(() => {
        const handleScreenshot = (e: KeyboardEvent) => {
            // ESC key to dismiss blur
            if (e.key === 'Escape' || e.code === 'Escape') {
                setIsPreviewBlurred(false);
                if (blurOverlayRef.current) {
                    blurOverlayRef.current.style.display = 'none';
                }
                return;
            }

            // Mac: Cmd+Shift+ANY key (screenshot shortcuts)
            if (e.metaKey && e.shiftKey) {
                if (blurOverlayRef.current) {
                    blurOverlayRef.current.style.display = 'flex';
                }
                setIsPreviewBlurred(true);
            }

            // Windows: PrintScreen
            if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
                if (blurOverlayRef.current) {
                    blurOverlayRef.current.style.display = 'flex';
                }
                setIsPreviewBlurred(true);
            }
        };

        window.addEventListener('keydown', handleScreenshot);
        return () => window.removeEventListener('keydown', handleScreenshot);
    }, []);

    const handleDownload = async () => {
        if (!resume || !previewRef.current) return;

        // Check download permission
        const viewerIsPremium = currentUser && (isPremium || isAdmin);
        const canDownload = ownerIsPremium || viewerIsPremium;

        if (!canDownload) {
            alert('Download requires a premium subscription. Please upgrade to download this resume.');
            return;
        }

        setIsExporting(true);
        let downloadSuccessful = false;

        // Attempt Backend PDF Generation (High Quality) for ALL users
        // Condition: Owner must be premium (checked by Cloud Function)
        // Authenticated users send token (for drafts/verification)
        // Unauthenticated users send userId/resumeId (Cloud Function verifies DB data)
        try {
            const projectId = 'jastalk-firebase';
            const functionUrl = `https://us-west1-${projectId}.cloudfunctions.net/generateResumePdfHttp`;

            let headers: HeadersInit = { 'Content-Type': 'application/json' };
            let body: any = {};

            if (currentUser && (isPremium || isAdmin)) {
                // Scenario 1: Authenticated Premium User (e.g., Owner)
                // Behavior: Send Token + ResumeData (allows draft printing)
                const token = await currentUser.getIdToken();
                headers['Authorization'] = `Bearer ${token}`;
                body = { resumeData: resume, templateId: resume.templateId };
            } else {
                // Scenario 2: Public Visitor / Non-Premium Viewer
                // Behavior: Send userId + resumeId. Backend verifies Owner Premium status + DB data.
                if (!routeParams) throw new Error("Missing route params for public download");
                body = { userId: routeParams.userId, resumeId: routeParams.resumeId };
            }

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${resume.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                downloadSuccessful = true;
            } else {
                console.warn("Backend PDF generation failed (likely non-premium owner), falling back to client-side.", response.status);
            }
        } catch (backendError) {
            console.error("Backend PDF generation error:", backendError);
        }

        // Fallback: Client-side Generation (if backend unavailable or user not eligible)
        if (!downloadSuccessful) {
            try {
                const html2canvas = (await import('html2canvas')).default;
                // Use higher scale for better PDF quality (matches Editor.tsx fallback)
                const canvas = await html2canvas(previewRef.current, { scale: 3, useCORS: true });

                const { jsPDF } = await import('jspdf');
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const imgProps = pdf.getImageProperties(imgData);
                const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
                pdf.save(`${resume.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
                downloadSuccessful = true;
            } catch (err) {
                console.error("Download failed:", err);
                alert("Failed to download. Please try again.");
            }
        }

        setIsExporting(false);
    };

    const handleSharedUpdate = async (updatedData: Partial<ResumeData>) => {
        if (!routeParams || !resume) return;
        // Optimistic Update
        const newResume = { ...resume, ...updatedData };
        setResume(newResume);

        try {
            const projectId = 'jastalk-firebase';
            // Use Cloud Function to update, as client-side rules block unauthorized writes
            const response = await fetch(`https://us-west1-${projectId}.cloudfunctions.net/updatePublicResume`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: routeParams.userId,
                    resumeId: routeParams.resumeId,
                    data: updatedData
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Update failed response:", errorText);
                throw new Error(`Update failed: ${response.status}`);
            }
        } catch (err) {
            console.error("Failed to save shared update:", err);
            alert("Failed to save changes. Please check your connection.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
                {currentUser ? <AuthenticatedHeader /> : <PublicHeader />}
                <div className="flex-grow flex items-center justify-center flex-col gap-3">
                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                    <p className="text-gray-500 text-sm">Loading secure content...</p>
                </div>
            </div>
        );
    }

    if (error || !resume || !routeParams) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
                {currentUser ? <AuthenticatedHeader /> : <PublicHeader />}
                <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                    <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unable to View Resume</h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md">{error}</p>
                </div>
            </div>
        );
    }

    const permission = resume.shareConfig?.permission || 'viewer';

    // Calculate download permission
    const viewerIsPremium = currentUser && (isPremium || isAdmin);
    const canDownload = ownerIsPremium || viewerIsPremium;

    // --- EDITOR MODE ---
    if (permission === 'editor') {
        // Extract query params for initial view state
        const queryPart = window.location.search.substring(1);
        const params = new URLSearchParams(queryPart);
        const initialViewMode = (params.get('viewMode') as 'edit' | 'preview') || 'edit';
        const initialActiveTab = (params.get('activeTab') as 'content' | 'template' | 'design' | 'comments') || 'content';

        return (
            <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
                <Editor
                    initialData={resume}
                    isShared={true}
                    onSharedUpdate={handleSharedUpdate}
                    initialViewMode={initialViewMode}
                    initialActiveTab={initialActiveTab}
                />
            </Suspense>
        );
    }

    // --- VIEWER / COMMENTER MODE ---
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col font-sans relative overflow-hidden">
            {currentUser ? <AuthenticatedHeader /> : <PublicHeader />}

            {/* Toolbar */}
            <div className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pb-4 px-4 shadow-sm sticky z-30 ${currentUser ? 'top-20 pt-4' : 'top-0 pt-24'}`}>
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate max-w-md">{resume.title}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Shared by {resume.personalDetails.firstName} {resume.personalDetails.lastName}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {['commenter', 'editor'].includes(permission) && (
                            <button
                                onClick={() => setShowAnnotations(!showAnnotations)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${showAnnotations ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                                <PenTool size={18} />
                                <span className="font-medium">Markup</span>
                            </button>
                        )}

                        {permission === 'commenter' && (
                            <button
                                onClick={() => setShowComments(!showComments)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${showComments ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-400' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                                <MessageSquare size={18} />
                                <span className="font-medium">Comments</span>
                            </button>
                        )}
                        <button
                            onClick={handleDownload}
                            disabled={isExporting || !canDownload}
                            className={`flex items-center gap-2 font-semibold py-2 px-6 rounded-full transition-all shadow-lg ${canDownload
                                ? 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-xl'
                                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                } disabled:opacity-70`}
                            title={!canDownload ? 'Premium subscription required for download' : ''}
                        >
                            {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                            {isExporting ? 'Processing...' : canDownload ? 'Download' : 'Download (Premium)'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="flex-grow p-4 sm:p-8 overflow-y-auto relative" ref={previewContainerRef}>
                <div className={`max-w-5xl mx-auto flex justify-center transition-all duration-300 ${showComments ? 'mr-[320px]' : ''}`}>
                    <div
                        className="bg-white shadow-2xl rounded-sm overflow-hidden transition-transform origin-top relative"
                        style={{
                            width: '824px',
                            minHeight: '1165px',
                            transform: `scale(${scale})`,
                            marginBottom: `-${(1 - scale) * 1165}px`
                        }}
                    >
                        <ResumePreview
                            resume={resume}
                            template={resume.templateId}
                            previewRef={previewRef}
                        />

                        {/* Annotation Layer */}
                        {showAnnotations && (
                            permission === 'commenter' ? (
                                <AdvancedAnnotationCanvas
                                    resumeId={routeParams.resumeId}
                                    ownerId={routeParams.userId}
                                    currentUser={currentUser}
                                    width={824}
                                    height={1165}
                                    onSave={(url, objects) => {
                                        setLatestAnnotationUrl(url);
                                        setLatestAnnotationObjects(objects);
                                    }}
                                    initialImage={latestAnnotationUrl}
                                    initialObjects={latestAnnotationObjects}
                                />
                            ) : (
                                latestAnnotationUrl && (
                                    <AdvancedAnnotationCanvas
                                        resumeId={routeParams.resumeId}
                                        ownerId={routeParams.userId}
                                        currentUser={currentUser}
                                        width={824}
                                        height={1165}
                                        initialImage={latestAnnotationUrl}
                                        initialObjects={latestAnnotationObjects}
                                        isReadOnly={true}
                                    />
                                )
                            )
                        )}

                        {/* Anti-Screenshot Blur Overlay */}
                        <div
                            ref={blurOverlayRef}
                            className="absolute inset-0 backdrop-blur-3xl bg-white/40 dark:bg-gray-900/40 z-50 items-center justify-center"
                            style={{ display: isPreviewBlurred ? 'flex' : 'none' }}
                        >
                            <div className="text-center max-w-md mx-auto px-6 py-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
                                <div className="mb-4">
                                    <svg className="w-16 h-16 mx-auto text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                    Content Protected
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                                    Screenshots are disabled to protect resume content. Please use the Download button to save this resume.
                                </p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <kbd className="px-2 py-1 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded shadow-sm">
                                        ESC
                                    </kbd>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">to dismiss</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Comment Sidebar for Commenter Role */}
            {permission === 'commenter' && (
                <CommentsPanel
                    isOpen={showComments}
                    onClose={() => setShowComments(false)}
                    resumeId={routeParams.resumeId}
                    ownerId={routeParams.userId}
                    currentUser={currentUser}
                />
            )}

            {/* Toast Notification */}
            {toastMessage && (
                <Toast
                    message={toastMessage}
                    onClose={() => setToastMessage(null)}
                />
            )}
        </div>
    );
};

export default PublicResumePage;
