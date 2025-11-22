
import React, { useState, useEffect, useRef, useLayoutEffect, Suspense } from 'react';
import { ResumeData, SharePermission } from '../types';
import { Loader2, AlertCircle, Download, MessageSquare, Send, User, X } from 'lucide-react';
import ResumePreview from '../components/ResumePreview';
import PublicHeader from '../components/PublicHeader';

// Lazy load the Editor to keep initial bundle size small for viewers
const Editor = React.lazy(() => import('./Editor'));

const CommentsPanel: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    resumeId: string; 
    ownerId: string 
}> = ({ isOpen, onClose, resumeId, ownerId }) => {
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState<Array<{text: string, date: Date, user: string}>>([]); // Mock comments for now

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;
        
        // In a real app, we would save to a subcollection 'comments' in Firestore
        const newComment = {
            text: comment,
            date: new Date(),
            user: 'Guest Visitor' 
        };
        setComments([newComment, ...comments]);
        setComment('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700 animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare size={18}/> Comments
                </h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    <X size={20} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm italic mt-10">No comments yet. Be the first to leave feedback!</p>
                ) : (
                    comments.map((c, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                    <User size={12}/> {c.user}
                                </span>
                                <span className="text-xs text-gray-400">{c.date.toLocaleTimeString()}</span>
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{c.text}</p>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="relative">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm resize-none"
                        rows={3}
                    />
                    <button 
                        type="submit" 
                        disabled={!comment.trim()}
                        className="absolute bottom-3 right-3 p-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </form>
        </div>
    );
};

const PublicResumePage: React.FC = () => {
    const [resume, setResume] = useState<ResumeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [scale, setScale] = useState(0.2);
    const [isExporting, setIsExporting] = useState(false);
    const [showComments, setShowComments] = useState(false);
    
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    
    const [routeParams, setRouteParams] = useState<{userId: string, resumeId: string} | null>(null);

    useEffect(() => {
        const fetchResume = async () => {
            const hash = window.location.hash;
            // Remove any query params from the hash path before splitting
            const cleanHash = hash.split('?')[0];
            const parts = cleanHash.split('/');
            
            // Expected: ["#", "shared", "userId", "resumeId"]
            if (parts.length < 4) {
                setError("Invalid link format.");
                setLoading(false);
                return;
            }
            
            const userId = parts[2];
            const resumeId = parts[3];
            setRouteParams({ userId, resumeId });

            try {
                // Use Cloud Function to bypass client-side security rules for unauthenticated access
                // Ensure the project ID corresponds to your deployment
                const projectId = 'jastalk-firebase'; // Check if this matches your project ID
                // Updated to correct region: us-west1
                const url = `https://us-west1-${projectId}.cloudfunctions.net/getPublicResume?userId=${encodeURIComponent(userId)}&resumeId=${encodeURIComponent(resumeId)}`;
                
                const response = await fetch(url);
                
                if (response.ok) {
                    const data = await response.json() as ResumeData;
                    setResume(data);
                } else if (response.status === 403) {
                    setError("This resume is private or no longer shared.");
                } else if (response.status === 404) {
                    setError("Resume not found.");
                } else {
                    // Log specific status for debugging
                    console.error(`Fetch error: ${response.status} ${response.statusText}`);
                    throw new Error("Failed to fetch resume.");
                }
            } catch (err: any) {
                console.error("Error fetching resume:", err);
                if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
                    setError("Connection failed. Note to Admin: Ensure 'getPublicResume' Cloud Function has 'allUsers' permission.");
                } else {
                    setError("Unable to load resume. Please try again later.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchResume();
    }, []);

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

    const handleDownload = async () => {
        if (!resume || !previewRef.current) return;
        setIsExporting(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${resume.title.replace(/\s/g, '_')}.png`; 
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to download. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleSharedUpdate = async (updatedData: Partial<ResumeData>) => {
        if (!routeParams || !resume) return;
        // Optimistic Update
        const newResume = { ...resume, ...updatedData };
        setResume(newResume);

        try {
            const projectId = 'jastalk-firebase';
            // Use Cloud Function to update, as client-side rules block unauthorized writes
            // Updated to correct region: us-west1
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
                <PublicHeader />
                <div className="flex-grow flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                </div>
            </div>
        );
    }

    if (error || !resume || !routeParams) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
                <PublicHeader />
                <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                    <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unable to View Resume</h1>
                    <p className="text-gray-600 dark:text-gray-400">{error || "The link might be expired or incorrect."}</p>
                </div>
            </div>
        );
    }

    const permission = resume.shareConfig?.permission || 'viewer';

    // --- EDITOR MODE ---
    if (permission === 'editor') {
        return (
            <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>}>
                <Editor 
                    initialData={resume} 
                    isShared={true} 
                    onSharedUpdate={handleSharedUpdate} 
                />
            </Suspense>
        );
    }

    // --- VIEWER / COMMENTER MODE ---
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col font-sans relative overflow-hidden">
            <PublicHeader />
            
            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pt-24 pb-4 px-4 shadow-sm sticky top-0 z-30">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate max-w-md">{resume.title}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Shared by {resume.personalDetails.firstName} {resume.personalDetails.lastName}
                        </p>
                    </div>
                    <div className="flex gap-3">
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
                            disabled={isExporting}
                            className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-6 rounded-full hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                            {isExporting ? 'Processing...' : 'Download'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="flex-grow p-4 sm:p-8 overflow-y-auto relative" ref={previewContainerRef}>
                <div className={`max-w-5xl mx-auto flex justify-center transition-all duration-300 ${showComments ? 'mr-[320px]' : ''}`}>
                    <div 
                        className="bg-white shadow-2xl rounded-sm overflow-hidden transition-transform origin-top"
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
                />
            )}
        </div>
    );
};

export default PublicResumePage;
