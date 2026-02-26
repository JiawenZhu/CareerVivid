
import React, { useState, useEffect } from 'react';
import { X, Copy, Globe, Lock, Check, Share2, ExternalLink, AlertCircle, Users, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, deleteDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface SharePortfolioModalProps {
    isOpen: boolean;
    onClose: () => void;
    portfolioId: string;
    portfolioTitle?: string;
    portfolioData?: any; // Pass data if available to avoid refetching for publish
}

const SharePortfolioModal: React.FC<SharePortfolioModalProps> = ({
    isOpen,
    onClose,
    portfolioId,
    portfolioTitle = 'Portfolio',
    portfolioData
}) => {
    const { currentUser } = useAuth();
    const [isPublic, setIsPublic] = useState(false);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isOutOfSync, setIsOutOfSync] = useState(false);

    // Community share state
    const [showCommunityCaption, setShowCommunityCaption] = useState(false);
    const [caption, setCaption] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishSuccess, setPublishSuccess] = useState(false);

    // Construct the share URL using headline as slug if available
    const userSlug = portfolioData?.hero?.headline
        ? portfolioData.hero.headline.replace(/[^\w\s-]/g, '').replace(/\s+/g, '')
        : (currentUser?.email?.split('@')[0] || 'user');
    const shareUrl = `${window.location.origin}/portfolio/${userSlug}/${portfolioId}`;

    // Check initial public status
    useEffect(() => {
        if (isOpen && portfolioId) {
            checkPublicStatus();
        }
    }, [isOpen, portfolioId]);

    const checkPublicStatus = async () => {
        try {
            const docRef = doc(db, 'public_portfolios', portfolioId);
            const docSnap = await getDoc(docRef);
            setIsPublic(docSnap.exists());

            if (docSnap.exists() && portfolioData?.updatedAt) {
                const publicData = docSnap.data();

                // Compare updated timestamps
                // Ensure we convert both to milliseconds for comparison
                const publicTime = publicData.updatedAt?.toMillis ? publicData.updatedAt.toMillis() : new Date(publicData.updatedAt).getTime();
                const privateTime = typeof portfolioData.updatedAt === 'number' ? portfolioData.updatedAt : new Date(portfolioData.updatedAt).getTime();

                // If private version is significantly newer (> 2 seconds to avoid race conditions), show warning
                if (privateTime > publicTime + 2000) {
                    setIsOutOfSync(true);
                } else {
                    setIsOutOfSync(false);
                }
            }
        } catch (error) {
            console.error("Error checking public status:", error);
        }
    };

    const handleToggle = async (enabled: boolean) => {
        setLoading(true);
        try {
            if (enabled) {
                // Publish
                // Use headline as username/slug if available (from hero section), otherwise fallback to email prefix
                const userSlug = portfolioData?.hero?.headline
                    ? portfolioData.hero.headline.replace(/\s+/g, '') // Basic slugify: remove spaces
                    : (currentUser?.email?.split('@')[0] || 'user');

                if (portfolioData) {
                    // Sanitize data to remove undefined values (Firestore doesn't like them)
                    const sanitizedData = JSON.parse(JSON.stringify(portfolioData));

                    await setDoc(doc(db, 'public_portfolios', portfolioId), {
                        ...sanitizedData,
                        userId: currentUser?.uid,
                        updatedAt: new Date(),
                        templateId: portfolioData.templateId || 'minimalist',
                        username: userSlug, // Save slug for public URL routing
                        attachedResumeId: portfolioData.attachedResumeId || null // Explicitly handle potential undefined
                    });
                } else if (currentUser) {
                    // Fetch from private and publish (Dashboard scenario)
                    const privateRef = doc(db, 'users', currentUser.uid, 'portfolios', portfolioId);
                    const privateSnap = await getDoc(privateRef);

                    const username = currentUser?.email?.split('@')[0] || 'user';

                    if (privateSnap.exists()) {
                        const data = privateSnap.data();
                        // Sanitize data from fetching
                        const sanitizedData = JSON.parse(JSON.stringify(data));

                        await setDoc(doc(db, 'public_portfolios', portfolioId), {
                            ...sanitizedData,
                            userId: currentUser.uid,
                            updatedAt: new Date(),
                            username: username,
                            attachedResumeId: data.attachedResumeId || null // Explicitly handle potential undefined
                        });
                    } else {
                        alert("Could not find portfolio data to publish.");
                        return;
                    }
                }
                setIsPublic(true);
                setIsOutOfSync(false); // Clear stale warning
            } else {
                // Unpublish
                await deleteDoc(doc(db, 'public_portfolios', portfolioId));
                setIsPublic(false);
            }
        } catch (error) {
            console.error("Error toggling public status:", error);
            alert("Failed to update status.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePublishToCommunity = async () => {
        if (!currentUser) return;
        setIsPublishing(true);
        try {
            const payload: Record<string, any> = {
                type: 'portfolio',
                assetId: portfolioId,
                assetUrl: shareUrl,
                caption: caption.trim() || '',
                title: portfolioTitle || 'Shared Portfolio',
                content: caption.trim() || `Check out my portfolio!`,
                tags: ['portfolio', 'showcase'],
                readTime: 1,
                authorId: currentUser.uid,
                authorName: currentUser.displayName || 'Anonymous',
                authorAvatar: currentUser.photoURL || '',
                metrics: { likes: 0, comments: 0, views: 0 },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            Object.keys(payload).forEach(key => {
                if (payload[key] === undefined) delete payload[key];
            });

            await addDoc(collection(db, 'community_posts'), payload);
            setPublishSuccess(true);
            setShowCommunityCaption(false);
            setTimeout(() => setPublishSuccess(false), 4000);
        } catch (err) {
            console.error('Error publishing portfolio to community:', err);
        } finally {
            setIsPublishing(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setCopied(false);
            setIsPublic(false);
            setIsOutOfSync(false);
            setShowCommunityCaption(false);
            setCaption('');
            setPublishSuccess(false);
        } else {
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    onClose();
                }
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">

                {/* Header */}
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full text-indigo-600 dark:text-indigo-400">
                            <Share2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Share Portfolio</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Manage public access</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Toggle Switch */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {isPublic ? (
                                <Globe className="text-green-500" size={20} />
                            ) : (
                                <Lock className="text-gray-400" size={20} />
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {isPublic ? 'Public access is on' : 'Public access is off'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {isPublic ? 'Anyone with the link can view' : 'Only you can view this portfolio'}
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="w-11 h-6 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isPublic}
                                    onChange={(e) => handleToggle(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                            </label>
                        )}
                    </div>

                    {isPublic && (
                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                            {/* Stale Data Warning */}
                            {isOutOfSync && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-3 flex gap-3 items-start">
                                    <div className="bg-amber-100 dark:bg-amber-800/40 p-1.5 rounded-full text-amber-600 dark:text-amber-400 mt-0.5">
                                        <AlertCircle size={14} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-amber-800 dark:text-amber-200">Update Required</p>
                                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                                            New changes detected. Please toggle Public Access <span className="font-bold">OFF</span> and <span className="font-bold">ON</span> to update your live link.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Link Input */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Public Link
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={shareUrl}
                                        readOnly
                                        className="flex-1 p-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 focus:outline-none"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className={`p-2.5 rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 min-w-[90px] ${copied ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                    >
                                        {copied ? (
                                            <><Check size={16} /><span className="text-xs font-bold">Copied</span></>
                                        ) : (
                                            <><Copy size={16} /><span className="text-xs font-medium">Copy</span></>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                                    Open public link <ExternalLink size={14} />
                                </a>
                            </div>

                            {/* ── Community Publish Section ────────────────────────── */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                {publishSuccess ? (
                                    <div className="flex items-center gap-2 justify-center text-green-600 dark:text-green-400 font-semibold text-sm py-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                        <Check size={16} />
                                        Published to Community Feed!
                                    </div>
                                ) : showCommunityCaption ? (
                                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Add a caption <span className="lowercase font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={caption}
                                            onChange={e => setCaption(e.target.value)}
                                            placeholder="e.g., Check out my new minimalist React portfolio!"
                                            maxLength={200}
                                            className="w-full p-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowCommunityCaption(false)}
                                                className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handlePublishToCommunity}
                                                disabled={isPublishing}
                                                className="flex-1 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                            >
                                                {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                                                {isPublishing ? 'Publishing…' : 'Publish'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowCommunityCaption(true)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-all cursor-pointer"
                                    >
                                        <Users size={16} />
                                        Share to Community Feed
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SharePortfolioModal;
