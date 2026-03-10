import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { navigate } from '../../utils/navigation';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Heart, MessageSquare, BookOpen, Loader2, Send, Linkedin, Edit, Trash2, MoreVertical, X, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { CommunityPost, useCommunity } from '../../hooks/useCommunity';
import CommentSection from '../../components/Community/CommentSection';
import { generateGEOStructuredData } from '../../utils/geoUtils';
import UserProfileSnippet from '../../components/Community/UserProfileSnippet';

// ── Mermaid Diagram Renderer ──────────────────────────────────────────────────
// ... (previous MermaidDiagram implementation matches)

const COLLECTION = 'community_posts';

const CommunityPostPage: React.FC = () => {
    const pathParts = window.location.pathname.split('/');
    const postId = pathParts[3] ?? '';

    const { currentUser } = useAuth();
    const { toggleLike } = useCommunity();

    const [post, setPost] = useState<CommunityPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

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

    const shareUrl = `https://careervivid.app/community/post/${postId}`;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Helmet>
                <title>{post.title} | CareerVivid Community</title>
                <meta property="og:title" content={post.title} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={shareUrl} />
                {post.coverImage && <meta property="og:image" content={post.coverImage} />}
                <meta property="og:description" content={post.content?.replace(/[#_*`[\]]/g, '').substring(0, 150) || 'Check out this post on CareerVivid Community.'} />
                <script type="application/ld+json">
                    {JSON.stringify(generateGEOStructuredData({
                        title: post.title,
                        content: post.content,
                        coverImage: post.coverImage,
                        authorName: post.authorName,
                        authorAvatar: post.authorAvatar,
                        createdAt: post.createdAt,
                        updatedAt: post.updatedAt
                    }, post.faqs))}
                </script>
            </Helmet>
            {/* Top nav */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={() => navigate(window.history.state?.from || '/community')}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>
            </div>

            <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
                {/* Cover image */}
                {post.coverImage && (
                    <div className="w-full aspect-video overflow-hidden rounded-xl mb-8 shadow-lg">
                        <img src={post.coverImage} alt={post.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    </div>
                )}

                {/* Title */}
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
                    {post.title}
                </h1>

                {/* Author row */}
                <div className="mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
                    <UserProfileSnippet
                        userId={post.authorId}
                        fallbackName={post.authorName}
                        fallbackAvatar={post.authorAvatar}
                        fallbackRole={post.authorRole}
                        timestamp={formattedDate}
                    />
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
                {/* ... (Mermaid/Markdown body rendering same as before) ... */}

                {/* Like / action buttons */}
                <div className="flex items-center gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 mb-12 flex-wrap">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-sm ${isLiked ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900/30' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}
                    >
                        <Heart size={18} className={isLiked ? 'fill-current' : ''} />
                        {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
                    </button>
                    <a href="#comments" className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all cursor-pointer shadow-sm">
                        <MessageSquare size={18} />
                        {post.metrics?.comments || 0} Comments
                    </a>

                    <button
                        onClick={() => {
                            const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-[#0a66c2] hover:bg-[#0a66c2]/90 text-white transition-all cursor-pointer ml-auto shadow-sm"
                    >
                        <Linkedin size={18} />
                        Share to LinkedIn
                    </button>
                </div>

                {/* Discussion Section */}
                <div id="comments" className="scroll-mt-24">
                  <CommentSection postId={postId} />
                </div>
            </article>
        </div>
    );
};

export default CommunityPostPage;
