import React, { useState, useEffect } from 'react';
import { X, Copy, Globe, Lock, Check, Share2, Loader2, Users } from 'lucide-react';
import { WhiteboardData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface ShareWhiteboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    whiteboard: WhiteboardData;
}

const ShareWhiteboardModal: React.FC<ShareWhiteboardModalProps> = ({ isOpen, onClose, whiteboard }) => {
    const { currentUser } = useAuth();
    const [isPublic, setIsPublic] = useState(whiteboard.isPublic || false);
    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Community share state
    const [showCommunityCaption, setShowCommunityCaption] = useState(false);
    const [caption, setCaption] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishSuccess, setPublishSuccess] = useState(false);

    const shareUrl = `${window.location.origin}/whiteboard/${whiteboard.id}`;

    useEffect(() => {
        if (isOpen) {
            setIsPublic(whiteboard.isPublic || false);
        } else {
            setCopied(false);
            setShowCommunityCaption(false);
            setCaption('');
            setPublishSuccess(false);
        }
    }, [isOpen, whiteboard.isPublic]);

    useEffect(() => {
        if (isOpen) {
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') onClose();
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    const handleTogglePublic = async (enabled: boolean) => {
        setIsPublic(enabled);
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'whiteboards', whiteboard.id), {
                isPublic: enabled,
                updatedAt: Date.now(),
            });
        } catch (err) {
            console.error('Error toggling public access:', err);
            setIsPublic(!enabled); // Revert on failure
        } finally {
            setIsSaving(false);
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
                type: 'whiteboard',
                assetId: whiteboard.id,
                assetUrl: shareUrl,
                caption: caption.trim() || '',
                title: whiteboard.title || 'Shared Whiteboard',
                content: caption.trim() || `Check out my system design!`,
                tags: ['whiteboard', 'showcase', 'system-design'],
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
            console.error('Error publishing whiteboard to community:', err);
        } finally {
            setIsPublishing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">

                {/* Header */}
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full text-emerald-600 dark:text-emerald-400">
                            <Share2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Share Whiteboard</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Manage public access</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 space-y-5">

                    {/* Toggle Public Access */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-3">
                            {isPublic ? <Globe className="text-green-500" size={20} /> : <Lock className="text-gray-400" size={20} />}
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                    {isPublic ? 'Public access is on' : 'Public access is off'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {isPublic ? 'Anyone with the link can view' : 'Only you can access this whiteboard'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleTogglePublic(!isPublic)}
                            disabled={isSaving}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isPublic ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${isPublic ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>

                    {/* Share Link - shown when public */}
                    {isPublic && (
                        <>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Share Link</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={shareUrl}
                                        readOnly
                                        className="flex-1 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 font-mono truncate"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className={`p-2.5 rounded-lg transition-all duration-200 ${copied ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Community Share Section */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Users size={16} className="text-emerald-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Share to Community Feed</span>
                                </div>

                                {publishSuccess ? (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                        <Check size={16} className="text-green-600 dark:text-green-400" />
                                        <span className="text-sm text-green-700 dark:text-green-300 font-medium">Published to Community Feed!</span>
                                    </div>
                                ) : showCommunityCaption ? (
                                    <div className="space-y-3">
                                        <textarea
                                            placeholder="Add a caption (optional)..."
                                            value={caption}
                                            onChange={(e) => setCaption(e.target.value)}
                                            rows={2}
                                            className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 resize-none focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowCommunityCaption(false)}
                                                className="flex-1 py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handlePublishToCommunity}
                                                disabled={isPublishing}
                                                className="flex-1 py-2 px-3 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {isPublishing ? <><Loader2 size={14} className="animate-spin" /> Publishing...</> : 'Publish'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowCommunityCaption(true)}
                                        className="w-full py-2.5 px-4 text-sm font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Share2 size={14} />
                                        Share to Community Feed
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareWhiteboardModal;
