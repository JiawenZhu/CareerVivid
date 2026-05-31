import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, BookOpen, FileText, Globe, PenTool, AlertTriangle, ExternalLink, Send, Loader2, Linkedin } from 'lucide-react';
import { navigate } from '../../utils/navigation';
import { CommunityPost, useCommunity, useComments } from '../../hooks/useCommunity';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from 'react-i18next';
import { enUS, es, fr, de, zhCN } from 'date-fns/locale';
import UserProfileSnippet from './UserProfileSnippet';
import PostVisualSnapshot from './PostVisualSnapshot';
import PostTags from './PostTags';

const localeMap: Record<string, any> = {
    en: enUS,
    es,
    fr,
    de,
    zh: zhCN,
};

// ── Asset Type Config ────────────────────────────────────────────────────────
const ASSET_CONFIG = {
    resume: {
        icon: FileText,
        labelKey: 'community.feed.view_resume',
        accent: 'primary',
        bgPattern: 'bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/30 dark:to-indigo-950/20',
        badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
        btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    portfolio: {
        icon: Globe,
        labelKey: 'community.feed.view_portfolio',
        accent: 'indigo',
        bgPattern: 'bg-gradient-to-br from-violet-50/80 to-purple-50/60 dark:from-violet-950/30 dark:to-purple-950/20',
        badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
        btnClass: 'bg-violet-600 hover:bg-violet-700 text-white',
    },
    whiteboard: {
        icon: PenTool,
        labelKey: 'community.sidebar.whiteboards',
        accent: 'emerald',
        bgPattern: 'bg-gradient-to-br from-emerald-50/80 to-teal-50/60 dark:from-emerald-950/30 dark:to-teal-950/20',
        badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
        btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
} as const;

interface PostCardProps {
    post: CommunityPost;
}

// Helper to strip markdown for the feed snippet preview
const stripMarkdown = (text: string) => {
    if (!text) return '';
    return text
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, '')
        // Remove Images: ![alt](url) -> ""
        .replace(/!\[.*?\]\(.*?\)/g, '')
        // Remove raw image links starting with !http (sometimes BlockNote emits this)
        .replace(/!https?:\/\/\S+/g, '')
        // Replace Links with just their text: [text](url) -> "text"
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        // Replace headings: # Heading -> Heading
        .replace(/#{1,6}\s+(.*)/g, '$1')
        // Replace Bold/Italic: **text** -> text
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        // Remove raw urls (http:// or https://) entirely
        .replace(/https?:\/\/\S+/g, '')
        // Remove "video attachment", "audio attachment", "file attachment" text
        .replace(/(video|audio|file)\s+attachment/gi, '')
        // Remove remaining formatting characters
        .replace(/[`~>]/g, '')
        // Replace newlines with spaces
        .replace(/\n+/g, ' ')
        .trim();
};

// ── Comment Item ─────────────────────────────────────────────────────────────
const CommentItem: React.FC<{ comment: any; currentLocale: any }> = ({ comment, currentLocale }) => {
    const formattedDate = comment.createdAt?.toDate
        ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: currentLocale })
        : 'Just now';

    return (
        <div className="flex gap-3 py-3">
            <div className="flex-1 min-w-0">
                <UserProfileSnippet
                    userId={comment.authorId}
                    fallbackName={comment.authorName}
                    fallbackAvatar={comment.authorAvatar}
                    size="sm"
                    timestamp={formattedDate}
                />
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed ml-11">{comment.content}</p>
            </div>
        </div>
    );
};

const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const { currentUser } = useAuth();
    const { toggleLike, addComment } = useCommunity();
    const { t, i18n } = useTranslation();
    const currentLocale = localeMap[i18n.language?.split('-')[0]] || enUS;

    const [isLiked, setIsLiked] = React.useState(false);
    const [likesCount, setLikesCount] = React.useState(post.metrics?.likes ?? 0);
    const [showComments, setShowComments] = React.useState(false);
    const [commentText, setCommentText] = React.useState('');
    const [showFullContent, setShowFullContent] = React.useState(false);

    // Check if the current user already liked this post
    React.useEffect(() => {
        if (!currentUser?.uid) return;
        const likeId = `${post.id}_${currentUser.uid}`;
        getDoc(doc(db, 'community_post_likes', likeId)).then(snap => {
            if (snap.exists()) setIsLiked(true);
        }).catch(() => { });
    }, [currentUser?.uid, post.id]);

    // Sync likes count when post data updates from realtime listener
    React.useEffect(() => {
        setLikesCount(post.metrics?.likes ?? 0);
    }, [post.metrics?.likes]);

    const { comments, loading: commentsLoading } = useComments(showComments ? post.id : '');
    const [submitting, setSubmitting] = useState(false);

    // Auth interceptor for guest interactions
    const handleProtectedAction = (actionFn: () => void, e?: React.MouseEvent | React.FormEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!currentUser) {
            navigate('/signin?redirect=/community');
            return;
        }
        actionFn();
    };

    const handleLike = (e: React.MouseEvent) => {
        handleProtectedAction(async () => {
            const next = !isLiked;
            setIsLiked(next);
            setLikesCount(prev => next ? prev + 1 : prev - 1);

            try {
                await toggleLike(post.id);
            } catch {
                setIsLiked(!next);
                setLikesCount(post.metrics?.likes ?? 0);
            }
        }, e);
    };

    const toggleComments = (e: React.MouseEvent) => {
        handleProtectedAction(() => setShowComments(!showComments), e);
    };

    const handleSubmitComment = (e: React.FormEvent) => {
        handleProtectedAction(async () => {
            if (!commentText.trim()) return;
            setSubmitting(true);
            try {
                await addComment(post.id, commentText);
                setCommentText('');
            } catch (err) {
                console.error('Failed to post comment:', err);
            } finally {
                setSubmitting(false);
            }
        }, e);
    };

    const formattedDate = post.createdAt?.toDate
        ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: currentLocale })
        : 'Just now';

    const postType = post.type || 'article';
    const isAssetCard = postType !== 'article';
    const assetCfg = isAssetCard ? ASSET_CONFIG[postType as keyof typeof ASSET_CONFIG] : null;

    // Helper to resolve asset URL even if it's missing from search index
    const getResolvedAssetUrl = () => {
        if (post.assetUrl) return post.assetUrl;
        if (!isAssetCard || !post.assetId) return '';

        // Reconstruct based on App.tsx routing rules
        if (postType === 'whiteboard') return `${window.location.origin}/whiteboard/${post.assetId}`;
        if (postType === 'portfolio') return `${window.location.origin}/portfolio/${post.assetId}`;
        if (postType === 'resume') return `${window.location.origin}/shared/${post.authorId}/${post.assetId}`;
        return '';
    };

    const resolvedAssetUrl = getResolvedAssetUrl();
    // API-published whiteboards (diagrams with no assetId) should link to the post detail page, not an asset page
    const isApiWhiteboard = postType === 'whiteboard' && post.dataFormat === 'mermaid';
    const isAssetDisabled = isAssetCard && !resolvedAssetUrl && !isApiWhiteboard;

    const shareUrl = `https://careervivid.app/community/post/${post.id}`;

    // Highlight text helper
    const renderHighlightedText = (text: string, highlightResult?: any) => {
        if (!highlightResult || !highlightResult.title || !highlightResult.title.value) {
            return text;
        }

        // Algolia wraps matches in <em> tags by default
        const highlightedHtml = highlightResult.title.value;
        return <span dangerouslySetInnerHTML={{ __html: highlightedHtml.replace(/<em>/g, '<mark class="bg-yellow-200 dark:bg-yellow-900/50 text-gray-900 dark:text-white rounded px-0.5">').replace(/<\/em>/g, '</mark>') }} />;
    };

    // Determine click handler
    const handleCardClick = () => {
        if (isAssetDisabled) return;
        // API-published whiteboards link to the post detail page
        if (isApiWhiteboard) {
            navigate(`/community/post/${post.id}`, { from: window.location.pathname });
            return;
        }
        if (isAssetCard && resolvedAssetUrl) {
            const url = new URL(resolvedAssetUrl, window.location.origin);
            navigate(url.pathname, { from: window.location.pathname });
        } else {
            navigate(`/community/post/${post.id}`, { from: window.location.pathname });
        }
    };

    // ── Author row (shared across all types) ───────────────────────────
    const AuthorRow = (
        <div className="mb-3 md:mb-4">
            <UserProfileSnippet
                userId={post.authorId}
                fallbackName={post.authorName}
                fallbackAvatar={post.authorAvatar}
                fallbackRole={post.authorRole}
                timestamp={formattedDate}
                showTypeBadge={isAssetCard && !!assetCfg}
                typeBadgeLabel={postType}
                typeBadgeClass={assetCfg?.badge}
            />
        </div>
    );

    // ── Inline comments section ─────────────────────────────────────────
    const CommentsSection = showComments && (
        <div className="border-t border-gray-100 dark:border-gray-800 mt-3 pt-4" onClick={e => e.stopPropagation()}>
            {/* Comment input */}
            <form onSubmit={handleSubmitComment} className="flex gap-2 mb-4">
                {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
                        {currentUser?.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                )}
                <div className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200 focus:bg-white dark:focus:bg-gray-800 min-w-0"
                    />
                    <button
                        type="submit"
                        disabled={submitting || !commentText.trim()}
                        className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-40 flex items-center gap-1 text-sm font-medium"
                    >
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                </div>
            </form>

            {/* Comment list */}
            {commentsLoading ? (
                <div className="flex justify-center py-4">
                    <Loader2 size={18} className="animate-spin text-gray-400" />
                </div>
            ) : comments.length > 0 ? (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {comments.slice(0, 5).map(c => <CommentItem key={c.id} comment={c} currentLocale={currentLocale} />)}
                    {comments.length > 5 && (
                        <button
                            onClick={() => navigate(`/community/post/${post.id}#comments`, { from: window.location.pathname })}
                            className="text-sm text-primary-600 dark:text-primary-400 font-medium pt-3 hover:underline cursor-pointer"
                        >
                            View all {comments.length} {t('community.feed.comments').toLowerCase()} →
                        </button>
                    )}
                </div>
            ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3">No comments yet. Be the first!</p>
            )}
        </div>
    );

    // ── Actions row (shared across all types) ──────────────────────────
    const ActionsRow = (
        <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800 mt-3">
            <div className="flex items-center gap-1">
                {/* Like */}
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer
                        ${isLiked
                            ? 'bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    aria-label={isLiked ? 'Unlike post' : 'Like post'}
                >
                    <Heart size={17} className={isLiked ? 'fill-current' : ''} />
                    <span>{likesCount}</span>
                </button>

                {/* Comments toggle */}
                <button
                    onClick={e => { e.stopPropagation(); setShowComments(!showComments); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer
                        ${showComments
                            ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    aria-label="Toggle comments"
                >
                    <MessageSquare size={17} />
                    <span>{post.metrics?.comments ?? 0}</span>
                </button>

                {/* LinkedIn Share */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 text-[#0a66c2] hover:bg-[#0a66c2]/10 cursor-pointer"
                    aria-label="Share to LinkedIn"
                >
                    <Linkedin size={17} />
                    <span className="hidden sm:inline">Share</span>
                </button>
            </div>

            {/* Read time (articles) or asset type label */}
            <span className="flex items-center gap-1 text-[10px] md:text-xs text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">
                {isAssetCard ? (
                    <>{assetCfg && <assetCfg.icon size={12} className="md:w-3.5 md:h-3.5" />} Showcase</>
                ) : (
                    <><BookOpen size={12} className="md:w-3.5 md:h-3.5" /> {post.readTime ?? 1} {t('community.feed.min_read')}</>
                )}
            </span>
        </div>
    );

    // ── Asset card: disabled state ─────────────────────────────────────
    if (isAssetDisabled) {
        return (
            <article className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-gray-800/40 shadow-sm overflow-hidden opacity-70">
                <div className="p-4 sm:p-6">
                    {AuthorRow}
                    <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                        <AlertTriangle size={20} className="text-gray-400 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                This asset is no longer public.
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                The owner has removed public access.
                            </p>
                        </div>
                    </div>
                    {ActionsRow}
                    {CommentsSection}
                </div>
            </article>
        );
    }

    // ── Asset card: resume / portfolio / whiteboard ─────────────────────
    if (isAssetCard && assetCfg) {
        const AssetIcon = assetCfg.icon;
        return (
            <article
                onClick={handleCardClick}
                className={`group rounded-[24px] border border-white/60 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-white dark:hover:border-gray-600 transition-all duration-400 overflow-hidden cursor-pointer relative ${assetCfg.bgPattern}`}
            >
                {/* Overlay glow for consistent arrange feel */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent dark:via-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay" />
                
                <div className="p-4 sm:p-6 relative z-10">
                    {AuthorRow}

                    {/* Visual Preview */}
                    <div className="relative w-full aspect-[4/3] sm:aspect-video rounded-2xl overflow-hidden mb-4 md:mb-5 border border-white/50 dark:border-gray-700/50 shadow-inner bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <PostVisualSnapshot post={post} />
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>

                    {/* Caption / Title */}
                    <h2 className="text-lg md:text-xl font-extrabold text-gray-900 dark:text-white mb-2 leading-snug">
                        {post.title}
                    </h2>

                    {post.caption && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed line-clamp-2">
                            {post.caption}
                        </p>
                    )}

                    <PostTags tags={post.tags} />

                    {/* Large CTA button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                        className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm ${assetCfg.btnClass} cursor-pointer`}
                    >
                        <AssetIcon size={18} />
                        {isApiWhiteboard ? 'View Diagram' : t(assetCfg.labelKey)}
                        <ExternalLink size={14} className="opacity-60" />
                    </button>

                    {ActionsRow}
                    {CommentsSection}
                </div>
            </article>
        );
    }

    // ── Default: Article card ──────────────────────────────────────────
    const snippet = stripMarkdown(post.content || '').slice(0, 180);

    return (
        <article
            onClick={() => navigate(`/community/post/${post.id}`, { from: window.location.pathname })}
            className="group bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-[24px] border border-white/60 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-white dark:hover:border-gray-600 transition-all duration-400 overflow-hidden cursor-pointer relative"
        >
            {/* Overlay glow for consistent arrange feel */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent dark:via-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            {/* Cover image — aspect-video prevents stretch */}
            {post.coverImage && (
                <div className="w-full aspect-[4/3] sm:aspect-video overflow-hidden">
                    <img
                        src={post.coverImage}
                        alt={post.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                </div>
            )}

            <div className="p-4 sm:p-6 relative z-10">
                {AuthorRow}

                {/* Title */}
                <h2 className="text-lg md:text-xl font-extrabold text-gray-900 dark:text-white mb-3 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {post.title}
                </h2>

                <PostTags tags={post.tags} className="mb-3" />

                {/* Content snippet — only when no cover image */}
                {!post.coverImage && snippet && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                        {snippet}{snippet.length >= 180 && '…'}
                    </p>
                )}

                {ActionsRow}
                {CommentsSection}
            </div>
        </article>
    );
};

export default PostCard;
