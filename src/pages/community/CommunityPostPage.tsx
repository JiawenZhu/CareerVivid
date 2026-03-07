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
import { usePostComments } from '../../hooks/usePostComments';
import { generateGEOStructuredData } from '../../utils/geoUtils';

// ── Mermaid Diagram Renderer ──────────────────────────────────────────────────
const MermaidDiagram: React.FC<{ chart: string }> = ({ chart }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [svg, setSvg] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const render = async () => {
            try {
                const mermaid = (await import('mermaid')).default;
                mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: 'loose', // Support all diagram types securely
                    theme: 'dark',
                    themeVariables: {
                        primaryColor: '#0f172a',
                        primaryTextColor: '#f8fafc',
                        primaryBorderColor: '#334155',
                        lineColor: '#64748b',
                        secondaryColor: '#1e293b',
                        clusterBkg: '#0d1117',
                        clusterBorder: '#30363d',
                    },
                    fontFamily: 'Inter, system-ui, sans-serif',
                });
                const id = `mermaid-${Date.now()}`;
                const { svg: rendered } = await mermaid.render(id, chart);
                if (!cancelled) setSvg(rendered);
            } catch (e: any) {
                if (!cancelled) setError(e.message ?? 'Failed to render diagram');
            }
        };
        render();
        return () => { cancelled = true; };
    }, [chart]);

    if (error) {
        return (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Diagram rendering error</p>
                <pre className="text-xs text-red-600 dark:text-red-300 overflow-x-auto">{error}</pre>
            </div>
        );
    }

    if (!svg) {
        return (
            <div className="flex items-center justify-center h-64 rounded-xl bg-gray-900 border border-gray-800">
                <Loader2 size={28} className="animate-spin text-gray-500" />
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className="w-full overflow-x-auto rounded-xl bg-[#0d1117] border border-gray-800 p-6 [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:mx-auto [&_svg]:block"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

const COLLECTION = 'community_posts';

const CommunityPostPage: React.FC = () => {
    const pathParts = window.location.pathname.split('/');
    const postId = pathParts[3] ?? '';

    const { currentUser } = useAuth();
    const { toggleLike } = useCommunity();
    const { comments, loading: commentsLoading, submitting, addComment, updateComment, deleteComment } = usePostComments(postId);

    const [post, setPost] = useState<CommunityPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [commentText, setCommentText] = useState('');

    // Comment Edit State
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');

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

    const handleEditComment = (commentId: string, currentText: string) => {
        setEditingCommentId(commentId);
        setEditingCommentText(currentText);
    };

    const handleSaveEditComment = async (commentId: string) => {
        if (!editingCommentText.trim()) return;
        try {
            await updateComment(commentId, editingCommentText);
            setEditingCommentId(null);
            setEditingCommentText('');
        } catch (err) {
            console.error('Failed to update comment:', err);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            try {
                await deleteComment(commentId);
            } catch (err) {
                console.error('Failed to delete comment:', err);
            }
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
                            {post.dataFormat !== 'mermaid' && (
                                <>
                                    <span>·</span>
                                    <span className="flex items-center gap-1"><BookOpen size={13} /> {post.readTime ?? 1} min read</span>
                                </>
                            )}
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
                {post.dataFormat === 'mermaid' ? (
                    <div className="mb-12">
                        <MermaidDiagram chart={post.content || ''} />
                    </div>
                ) : (
                    <div className="prose prose-lg max-w-none prose-slate dark:prose-invert 
                    leading-loose tracking-[0.015em]
                    prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:mb-8 
                    prose-headings:font-bold prose-headings:tracking-tight prose-headings:mt-10 prose-headings:mb-4 prose-headings:text-gray-900 dark:prose-headings:text-white
                    prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                    prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6
                    prose-li:my-2 prose-li:leading-relaxed prose-li:text-gray-700 dark:prose-li:text-gray-300
                    prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
                    prose-code:bg-gray-100 dark:prose-code:bg-gray-800/60 prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-gray-900 dark:prose-pre:bg-[#0d1117] prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:shadow-sm prose-pre:p-5
                    prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-900/50 prose-blockquote:py-2 prose-blockquote:px-5 prose-blockquote:not-italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300 prose-blockquote:rounded-r-lg
                    prose-img:rounded-xl prose-img:shadow-md
                    prose-hr:border-gray-200 dark:prose-hr:border-gray-800
                    mb-12"
                    >
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                            components={{
                                br({ ...props }: any) {
                                    return <span className="block h-6 content-['']" aria-hidden="true" {...props} />;
                                },
                                code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                        <SyntaxHighlighter
                                            style={vscDarkPlus as any}
                                            language={match[1]}
                                            PreTag="div"
                                            className="!m-0 !rounded-xl !bg-[#0d1117] shadow-sm text-sm"
                                            {...props}
                                        >
                                            {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                    ) : (
                                        <code className="bg-gray-100 dark:bg-gray-800/80 rounded-md px-1.5 py-0.5 text-[0.9em] font-mono text-primary-600 dark:text-primary-400" {...props}>
                                            {children}
                                        </code>
                                    );
                                },
                                a({ node, href, children, ...props }: any) {
                                    if (!href) return <a {...props}>{children}</a>;
                                    const isVideo = /\.(mp4|webm)$/i.test(href.split('?')[0]);
                                    const isAudio = /\.(mp3|wav|ogg)$/i.test(href.split('?')[0]);

                                    if (isVideo) {
                                        return (
                                            <div className="w-full my-6 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 bg-black">
                                                <video controls className="w-full aspect-video outline-none">
                                                    <source src={href} />
                                                    Your browser does not support the video tag.
                                                </video>
                                            </div>
                                        );
                                    }

                                    if (isAudio) {
                                        return (
                                            <div className="w-full my-6 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-2">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Audio Attachment</span>
                                                <audio controls className="w-full max-w-md outline-none">
                                                    <source src={href} />
                                                    Your browser does not support the audio element.
                                                </audio>
                                            </div>
                                        );
                                    }

                                    return (
                                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline underline-offset-2 transition-colors" {...props}>
                                            {children}
                                        </a>
                                    );
                                }
                            }}
                        >
                            {post.content}
                        </ReactMarkdown>
                    </div>
                )}
                {/* Like / comment actions */}
                <div className="flex items-center gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 mb-12 flex-wrap">
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

                    <button
                        onClick={() => {
                            const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-[#0a66c2] hover:bg-[#0a66c2]/90 text-white transition-all cursor-pointer ml-auto"
                    >
                        <Linkedin size={18} />
                        Share to LinkedIn
                    </button>
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
                                        <div className="flex-1 min-w-0 group relative">
                                            <div className="flex items-baseline justify-between gap-2 mb-1">
                                                <div className="flex items-baseline gap-2">
                                                    <button onClick={() => navigate(`/portfolio/${comment.authorId}`)} className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm cursor-pointer">
                                                        {comment.authorName}
                                                    </button>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">{commentDate}</span>
                                                </div>

                                                {currentUser?.uid === comment.authorId && editingCommentId !== comment.id && (
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEditComment(comment.id, comment.content)}
                                                            className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-xs font-medium flex items-center gap-1 transition-colors"
                                                        >
                                                            <Edit size={12} /> Edit
                                                        </button>
                                                        <span className="text-gray-300 dark:text-gray-700">|</span>
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="text-gray-400 hover:text-red-500 text-xs font-medium flex items-center gap-1 transition-colors"
                                                        >
                                                            <Trash2 size={12} /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {editingCommentId === comment.id ? (
                                                <div className="mt-2">
                                                    <textarea
                                                        value={editingCommentText}
                                                        onChange={(e) => setEditingCommentText(e.target.value)}
                                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow resize-none"
                                                        rows={2}
                                                        autoFocus
                                                    />
                                                    <div className="flex items-center gap-2 justify-end mt-2">
                                                        <button
                                                            onClick={() => setEditingCommentId(null)}
                                                            className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveEditComment(comment.id)}
                                                            disabled={submitting || !editingCommentText.trim()}
                                                            className="px-3 py-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{comment.content}</p>
                                            )}
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
