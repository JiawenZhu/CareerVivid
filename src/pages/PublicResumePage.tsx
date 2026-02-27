import React, { useEffect, useState, useRef, Suspense, useLayoutEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, MessageSquare, PenTool, Loader2, AlertCircle, LayoutDashboard, User as UserIcon, LogOut, User, X, Send, Eye, ExternalLink, Copy } from 'lucide-react';
import { ResumeData } from '../types';
import ResumePreview from '../components/ResumePreview';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import AdvancedAnnotationCanvas from '../components/AdvancedAnnotationCanvas';
import { AnnotationObject, getLatestAnnotation } from '../services/annotationService';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { navigate } from '../utils/navigation';
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
                    {/* View Only Badge — shown to non-owners */}
                    {routeParams && currentUser?.uid !== routeParams.userId && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-semibold">
                            <Eye size={14} />
                            View Only
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mr-2"
                    >
                        <LayoutDashboard size={18} />
                        Back to Dashboard
                    </button>

                    {/* Create your own CTA — shown to non-owners */}
                    {routeParams && currentUser?.uid !== routeParams.userId && (
                        <a
                            href="/dashboard"
                            className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Create your own
                            <ExternalLink size={14} />
                        </a>
                    )}



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

        // Determine permission level
        let permission: 'viewer' | 'commenter' | 'editor' = 'viewer';
        if (currentUser && currentUser.uid === routeParams.userId) {
            permission = 'editor';
        } else if (resume.shareConfig?.permission === 'commenter') {
            permission = 'commenter';
        }
        // Subscribe to comments
        const unsubscribeComments = subscribeToComments(routeParams.userId, routeParams.resumeId, (newComments) => {
            if (!isInitialLoadRef.current && newComments.length > comments.length) {
                const latestComment = newComments[0];
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

                const isOwner = currentUser && currentUser.uid === routeParams.userId;
                if (isOwner && !isInitialLoadRef.current && !hadAnnotationBefore) {
                    setToastMessage(`New annotation received from ${annotation.author || 'Reviewer'}`);
                    playNotificationSound();
                }
            }
        });

        setTimeout(() => {
            isInitialLoadRef.current = false;
        }, 1000);

        return () => {
            unsubscribeComments();
            unsubscribeAnnotations();
        };
    }, [resume, routeParams, comments.length, latestAnnotationUrl, showComments, showAnnotations, currentUser]);

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

        const viewerIsPremium = currentUser && (isPremium || isAdmin);
        const canDownload = ownerIsPremium || viewerIsPremium;

        if (!canDownload) {
            alert('Download requires a premium subscription. Please upgrade to download this resume.');
            return;
        }

        setIsExporting(true);
        let downloadSuccessful = false;

        try {
            const projectId = 'jastalk-firebase';
            const functionUrl = `https://us-west1-${projectId}.cloudfunctions.net/generateResumePdfHttp`;

            let headers: HeadersInit = { 'Content-Type': 'application/json' };
            let body: any = {};

            if (currentUser && (isPremium || isAdmin)) {
                const token = await currentUser.getIdToken();
                headers['Authorization'] = `Bearer ${token}`;
                body = { resumeData: resume, templateId: resume.templateId };
            } else {
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

        if (!downloadSuccessful) {
            try {
                const html2canvas = (await import('html2canvas')).default;
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
        const newResume = { ...resume, ...updatedData };
        setResume(newResume);

        try {
            const projectId = 'jastalk-firebase';
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

    const viewerIsPremium = currentUser && (isPremium || isAdmin);
    const canDownload = ownerIsPremium || viewerIsPremium;

    // --- EDITOR MODE (owner-only) ---
    // Only the actual document owner gets editor access. Non-owners are downgraded to viewer.
    const isOwner = !!(currentUser && routeParams && currentUser.uid === routeParams.userId);
    if (permission === 'editor' && isOwner) {
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

    // ... (imports)

    // ... (inside component)

    // --- VIEWER / COMMENTER MODE ---
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col font-sans relative">
            {currentUser ? <AuthenticatedHeader /> : <PublicHeader />}

            {/* Toolbar */}
            <div className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pb-4 px-4 shadow-sm sticky z-30 ${currentUser ? 'top-20 pt-4' : 'top-0 pt-24'}`}>
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate max-w-sm">{resume.title}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {permission === 'commenter' ? 'You can add comments and annotations.' : 'View only mode.'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {permission === 'commenter' && (
                            <button
                                onClick={() => setShowComments(!showComments)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${showComments
                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <MessageSquare size={18} />
                                <span className="hidden sm:inline">Comments</span>
                                {comments.length > 0 && (
                                    <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {comments.length}
                                    </span>
                                )}
                            </button>
                        )}
                        <button
                            onClick={handleDownload}
                            disabled={isExporting}
                            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                            <span className="hidden sm:inline">Download PDF</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="flex-grow p-4 sm:p-8 relative" ref={previewContainerRef}>
                <div className={`max-w-5xl mx-auto flex justify-center transition-all duration-300 ${showComments ? 'mr-[320px]' : ''}`}>
                    <div
                        className="bg-white shadow-xl max-w-[824px] print:shadow-none"
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: 'top center',
                            margin: '0 auto',
                            marginBottom: `${(1 - scale) * -100}%`
                        }}
                    >
                        <div ref={previewRef} className="bg-white">
                            <ResumePreview resume={resume} template={resume.templateId} />

                            {/* Anti-screenshot blur overlay */}
                            <div
                                ref={blurOverlayRef}
                                className="absolute inset-0 z-50 bg-white/30 backdrop-blur-[24px] pointer-events-none flex-col items-center justify-center gap-4 hidden transition-opacity duration-300"
                            >
                                <div className="bg-white/90 dark:bg-gray-900/90 p-6 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm text-center border border-gray-200 dark:border-gray-800">
                                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mb-4">
                                        <Copy className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        Screenshot Protected
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                                        This document is protected. Please use the official download button to save a high-quality PDF.
                                    </p>
                                    <p className="text-xs text-gray-500 font-medium">
                                        Press ESC to dismiss
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Comment Sidebar for Commenter Role (Overlay/Fixed) */}
            {permission === 'commenter' && (
                <CommentsPanel
                    isOpen={showComments}
                    onClose={() => setShowComments(false)}
                    resumeId={routeParams.resumeId}
                    ownerId={routeParams.userId}
                    currentUser={currentUser}
                />
            )}

            {/* Global Footer */}
            <Footer />

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
