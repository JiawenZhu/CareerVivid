
import React, { useState, useEffect } from 'react';
import { X, Copy, Globe, Lock, Check, Share2, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
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
        } catch (error) {
            console.error("Error checking public status:", error);
        }
    };

    const handleToggle = async (enabled: boolean) => {
        setLoading(true);
        try {
            if (enabled) {
                // Publish
                // If we have data passed (from Editor), use it. Otherwise, we might need to fetch it (from Dashboard scenario? logic TBD)
                // For now, assuming if we are in Dashboard we might only have ID. 
                // Ideally, we should fetch private data then copy. 
                // BUT, if we are in Editor, we have 'portfolioData'. 

                // Use headline as username/slug if available (from hero section), otherwise fallback to email prefix
                const userSlug = portfolioData?.hero?.headline
                    ? portfolioData.hero.headline.replace(/\s+/g, '') // Basic slugify: remove spaces
                    : (currentUser?.email?.split('@')[0] || 'user');

                if (portfolioData) {
                    // Sanitize data to remove undefined values (Firestore doesn't like them)
                    const sanitizedData = JSON.parse(JSON.stringify(portfolioData));

                    await setDoc(doc(db, 'public_portfolios', portfolioId), {
                        ...sanitizedData,
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

    useEffect(() => {
        if (!isOpen) {
            setCopied(false);
            setIsPublic(false); // Reset/Consistency? Actually better to re-fetch on open.
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SharePortfolioModal;
