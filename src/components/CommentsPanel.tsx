import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, User, Send, Loader2 } from 'lucide-react';
import { addComment, subscribeToComments, Comment } from '../services/commentService';

interface CommentsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    resumeId: string;
    ownerId: string;
    currentUser?: any;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({ isOpen, onClose, resumeId, ownerId, currentUser }) => {
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const unsubscribe = subscribeToComments(ownerId, resumeId, (newComments) => {
            setComments(newComments);
        });

        return () => unsubscribe();
    }, [isOpen, ownerId, resumeId]);

    // Auto-scroll to bottom when new comments arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;

        setIsSubmitting(true);
        try {
            const authorName = currentUser
                ? `${currentUser.displayName || 'User'}`
                : 'Guest Visitor';

            await addComment(ownerId, resumeId, comment, authorName, currentUser?.uid);
            setComment('');
        } catch (error) {
            console.error("Failed to add comment:", error);
            alert("Failed to post comment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isOwner = (commentUserId?: string) => {
        return commentUserId === ownerId;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                        <MessageSquare size={20} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Comments</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label="Close comments"
                >
                    <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                            <MessageSquare size={32} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">No comments yet</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs">Be the first to leave feedback!</p>
                    </div>
                ) : (
                    comments.map((c) => {
                        const isCommentOwner = isOwner(c.userId);
                        return (
                            <div key={c.id} className={`flex flex-col ${isCommentOwner ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-start gap-3 max-w-[85%] ${isCommentOwner ? 'flex-row-reverse' : ''}`}>
                                    {/* Avatar */}
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isCommentOwner
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-gray-500 dark:bg-gray-600 text-white'
                                        }`}>
                                        <User size={18} />
                                    </div>

                                    {/* Message Bubble */}
                                    <div className="flex flex-col gap-1">
                                        <div className={`p-3 rounded-lg text-sm ${isCommentOwner
                                                ? 'bg-indigo-500 text-white rounded-tr-none'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-none'
                                            }`}>
                                            <p className="font-semibold text-xs mb-1 opacity-90">{c.author}</p>
                                            <p className="whitespace-pre-wrap leading-relaxed">{c.text}</p>
                                        </div>

                                        {/* Timestamp */}
                                        <p className={`text-xs text-gray-400 dark:text-gray-500 px-1 ${isCommentOwner ? 'text-right' : 'text-left'}`}>
                                            {c.createdAt ? c.createdAt.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Just now'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="relative">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={currentUser ? `Comment as ${currentUser.displayName}...` : "Add a comment as Guest..."}
                        className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none text-sm resize-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100"
                        rows={3}
                        disabled={isSubmitting}
                    />
                    <button
                        type="submit"
                        disabled={!comment.trim() || isSubmitting}
                        className="absolute bottom-3 right-3 p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none"
                        aria-label="Send comment"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CommentsPanel;
