import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { navigate } from '../../utils/navigation';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Heart, MessageSquare, BookOpen, Loader2, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { CommunityPost, useCommunity } from '../../hooks/useCommunity';
import { usePostComments } from '../../hooks/usePostComments';

const COLLECTION = 'community_posts';

const CommunityPostPage: React.FC = () => {
    const pathParts = window.location.pathname.split('/');
    const postId = pathParts[3] ?? '';

    const { currentUser } = useAuth();
    const { toggleLike } = useCommunity();
    const { comments, loading: commentsLoading, submitting, addComment } = usePostComments(postId);

    const [post, setPost] = useState<CommunityPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [commentText, setCommentText] = useState('');

    // Check if user already liked this post
    useEffect(() => {
        if (!currentUser || !postId) return;
        const likeId = `${postId}_${currentUser.uid}`;
        getDoc(doc(db, 'community_post_likes', likeId)).then(snap => {
            if (snap.exists()) setIsLiked(true);
        }).catch(() => { });
    }, [currentUser, postId]);

    useEffect(() => {
        if (window.location.hash === '#comments') {
            setTimeout(() => {
                document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        }
    }, [loading]);

    useEffect(() => {
        if (!postId) {
            setError('Post not found.');
            setLoading(false);
            return;
        }

        const docRef = doc(db, COLLECTION, postId);
        const unsub = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                const data = { id: snap.id, ...snap.data() } as CommunityPost;
                setPost(data);
                setLikesCount(data.metrics?.likes ?? 0);
            } else {
                setError('This post does not exist or has been removed.');
            }
            setLoading(false);
        }, (err) => {
            console.error('[CommunityPostPage] onSnapshot error:', err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsub();
    }, [postId]);

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!currentUser) { navigate('/signin'); return; }
        const next = !isLiked;
        setIsLiked(next);
        setLikesCount(prev => next ? prev + 1 : prev - 1);
        try {
            await toggleLike(postId);
        } catch {
            setIsLiked(!next);
            setLikesCount(post?.metrics?.likes ?? 0);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) { navigate('/signin'); return; }
        if (!commentText.trim()) return;

        try {
            await addComment(commentText);
            setCommentText('');
        } catch (err) {
            console.error('Failed to post comment:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950 text-center px-4">
                <p className="text-5xl">😕</p>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Post Not Found</h1>
                <p className="text-gray-500 max-w-sm">{error ?? 'This article may have been removed or the link is incorrect.'}</p>
                <button
                    onClick={() => navigate('/community')}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-colors cursor-pointer mt-2"
                >
                    Back to Community
                </button>
            </div>
        );
    }

    const formattedDate = post.createdAt?.toDate
        ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })
        : 'Recently';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Top nav */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={() => navigate('/community')}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={18} /> Community
                    </button>
                </div>
            </div>

            <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
                {/* Cover image */}
                {post.coverImage && (
                    <div className="w-full aspect-video overflow-hidden rounded-2xl mb-8 shadow-lg">
                        <img src={post.coverImage} alt={post.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    </div>
                )}

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                    {post.title}
                </h1>

                {/* Author row */}
                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
                    <button onClick={() => navigate(`/portfolio/${post.authorId}`)} className="shrink-0 cursor-pointer">
                        {post.authorAvatar ? (
                            <img src={post.authorAvatar} alt={post.authorName} className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                {post.authorName?.charAt(0)?.toUpperCase()}
                            </div>
                        )}
                    </button>
                    <div>
                        <button onClick={() => navigate(`/portfolio/${post.authorId}`)} className="font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">
                            {post.authorName}
                        </button>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                            {post.authorRole && <span>{post.authorRole}</span>}
                            {post.authorRole && <span>·</span>}
                            <span>{formattedDate}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1"><BookOpen size={13} /> {post.readTime ?? 1} min read</span>
                        </div>
                    </div>
                </div>

                {/* Tags */}
                {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        {post.tags.map(tag => (
                            <span key={tag} className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Body */}
                <div className="prose prose-lg dark:prose-invert max-w-none mb-12 prose-headings:font-black prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-pre:bg-gray-900 prose-pre:dark:bg-gray-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                </div>

                {/* Like / comment actions */}
                <div className="flex items-center gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 mb-12">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all cursor-pointer ${isLiked ? 'bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                        <Heart size={18} className={isLiked ? 'fill-current' : ''} />
                        {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
                    </button>
                    <a href="#comments" className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer">
                        <MessageSquare size={18} />
                        {comments.length} Comments
                    </a>
                </div>

                {/* Comments section */}
                <div id="comments" className="scroll-mt-20">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        Comments ({comments.length})
                    </h2>

                    {/* Comment input */}
                    {currentUser ? (
                        <form onSubmit={handleSubmitComment} className="flex gap-3 mb-8">
                            {currentUser.photoURL ? (
                                <img src={currentUser.photoURL} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                    {currentUser.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                                </div>
                            )}
                            <div className="flex-1 flex gap-2">
                                <textarea
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    placeholder="Share your thoughts..."
                                    rows={2}
                                    className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={submitting || !commentText.trim()}
                                    className="self-end px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-40 flex items-center gap-2 text-sm font-semibold"
                                >
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Post
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                <button onClick={() => navigate('/signin')} className="text-primary-600 dark:text-primary-400 font-semibold hover:underline cursor-pointer">Sign in</button>
                                {' '}to join the conversation.
                            </p>
                        </div>
                    )}

                    {/* Comments list */}
                    {commentsLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 size={24} className="animate-spin text-gray-400" />
                        </div>
                    ) : comments.length > 0 ? (
                        <div className="space-y-1 divide-y divide-gray-100 dark:divide-gray-800">
                            {comments.map(comment => {
                                const commentDate = comment.createdAt?.toDate
                                    ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })
                                    : 'Just now';

                                return (
                                    <div key={comment.id} className="flex gap-3 py-4">
                                        <button onClick={() => navigate(`/portfolio/${comment.authorId}`)} className="shrink-0 cursor-pointer">
                                            {comment.authorAvatar ? (
                                                <img src={comment.authorAvatar} alt={comment.authorName} className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-700" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {comment.authorName?.charAt(0)?.toUpperCase() ?? '?'}
                                                </div>
                                            )}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <button onClick={() => navigate(`/portfolio/${comment.authorId}`)} className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm cursor-pointer">
                                                    {comment.authorName}
                                                </button>
                                                <span className="text-xs text-gray-400 dark:text-gray-500">{commentDate}</span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{comment.content}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 text-gray-500">
                            <MessageSquare size={32} className="mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No comments yet.</p>
                            <p className="text-sm text-gray-400 mt-1">Be the first to share your thoughts!</p>
                        </div>
                    )}
                </div>
            </article>
        </div>
    );
};

export default CommunityPostPage;
