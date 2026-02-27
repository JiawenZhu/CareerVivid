import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, BookOpen, FileText, Globe, PenTool, AlertTriangle, ExternalLink, Send, Loader2 } from 'lucide-react';
import { navigate } from '../../utils/navigation';
import { CommunityPost, useCommunity } from '../../hooks/useCommunity';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { usePostComments, PostComment } from '../../hooks/usePostComments';
import { useTranslation } from 'react-i18next';
import { enUS, es, fr, de, zhCN } from 'date-fns/locale';

const localeMap: Record<string, any> = {
    en: enUS,
    es,
    fr,
    de,
    zh: zhCN,
};

// Tag palette — cycles for visual interest
const TAG_COLORS = [
    'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60',
    'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60',
    'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
    'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60',
    'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60',
];

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

// ── Comment Item ─────────────────────────────────────────────────────────────
const CommentItem: React.FC<{ comment: PostComment; currentLocale: any }> = ({ comment, currentLocale }) => {
    const formattedDate = comment.createdAt?.toDate
        ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: currentLocale })
        : 'Just now';

    return (
        <div className="flex gap-3 py-3">
            <button
                onClick={() => navigate(`/portfolio/${comment.authorId}`)}
                className="shrink-0 cursor-pointer"
            >
                {comment.authorAvatar ? (
                    <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className="w-8 h-8 rounded-full object-cover border border-gray-100 dark:border-gray-700"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                        {comment.authorName?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                )}
            </button>
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                    <button
                        onClick={() => navigate(`/portfolio/${comment.authorId}`)}
                        className="text-sm font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                    >
                        {comment.authorName}
                    </button>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formattedDate}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">{comment.content}</p>
            </div>
        </div>
    );
};

const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const { currentUser } = useAuth();
    const { toggleLike } = useCommunity();
    const { t, i18n } = useTranslation();
    const currentLocale = localeMap[i18n.language?.split('-')[0]] || enUS;

    const [isLiked, setIsLiked] = React.useState(false);
    const [likesCount, setLikesCount] = React.useState(post.metrics?.likes ?? 0);
    const [showComments, setShowComments] = React.useState(false);
    const [commentText, setCommentText] = React.useState('');

    // Check if the current user already liked this post
    React.useEffect(() => {
        if (!currentUser) return;
        const likeId = `${post.id}_${currentUser.uid}`;
        getDoc(doc(db, 'community_post_likes', likeId)).then(snap => {
            if (snap.exists()) setIsLiked(true);
        }).catch(() => { });
    }, [currentUser, post.id]);

    // Sync likes count when post data updates from realtime listener
    React.useEffect(() => {
        setLikesCount(post.metrics?.likes ?? 0);
    }, [post.metrics?.likes]);

    const { comments, loading: commentsLoading, submitting, addComment } = usePostComments(showComments ? post.id : '');

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
            try {
                await addComment(commentText);
                setCommentText('');
            } catch (err) {
                console.error('Failed to post comment:', err);
            }
        }, e);
    };

    const formattedDate = post.createdAt?.toDate
        ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: currentLocale })
        : 'Just now';

    const postType = post.type || 'article';
    const isAssetCard = postType !== 'article';
    const assetCfg = isAssetCard ? ASSET_CONFIG[postType as keyof typeof ASSET_CONFIG] : null;
    const isAssetDisabled = isAssetCard && !post.assetUrl;

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/community/post/${post.id}` : '';

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
        if (isAssetCard && post.assetUrl) {
            const url = new URL(post.assetUrl, window.location.origin);
            navigate(url.pathname);
        } else {
            navigate(`/community/post/${post.id}`);
        }
    };

    // ── Author row (shared across all types) ───────────────────────────
    const AuthorRow = (
        <div className="flex items-center gap-3 mb-4">
            <button
                onClick={e => { e.stopPropagation(); navigate(`/portfolio/${post.authorId}`); }}
                className="shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer"
                aria-label={`View ${post.authorName}'s profile`}
            >
                {post.authorAvatar ? (
                    <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        loading="lazy"
                        decoding="async"
                        className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-700 hover:opacity-80 transition-opacity"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        {post.authorName?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                )}
            </button>
            <div className="min-w-0">
                <button
                    onClick={e => { e.stopPropagation(); navigate(`/portfolio/${post.authorId}`); }}
                    className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm text-left cursor-pointer"
                >
                    {post.authorName}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {post.authorRole && <span>{post.authorRole} · </span>}
                    {formattedDate}
                </p>
            </div>
            {/* Type badge for asset cards */}
            {isAssetCard && assetCfg && (
                <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${assetCfg.badge}`}>
                    {postType}
                </span>
            )}
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
                        className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:outline-none"
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
                            onClick={() => navigate(`/community/post/${post.id}#comments`)}
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
            </div>

            {/* Read time (articles) or asset type label */}
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 font-medium">
                {isAssetCard ? (
                    <>{assetCfg && <assetCfg.icon size={14} />} Showcase</>
                ) : (
                    <><BookOpen size={14} /> {post.readTime ?? 1} {t('community.feed.min_read')}</>
                )}
            </span>
        </div>
    );

    // ── Asset card: disabled state ─────────────────────────────────────
    if (isAssetDisabled) {
        return (
            <article className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden opacity-70">
                <div className="p-6">
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
                className={`group rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200 overflow-hidden cursor-pointer ${assetCfg.bgPattern}`}
            >
                <div className="p-6">
                    {AuthorRow}

                    {/* Caption / Title */}
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2 leading-snug">
                        {post.title}
                    </h2>

                    {post.caption && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed line-clamp-2">
                            {post.caption}
                        </p>
                    )}

                    {/* Tags */}
                    {post.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            {post.tags.map((tag, i) => (
                                <span
                                    key={tag}
                                    className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-md ${TAG_COLORS[i % TAG_COLORS.length]}`}
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Large CTA button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                        className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm ${assetCfg.btnClass} cursor-pointer`}
                    >
                        <AssetIcon size={18} />
                        {t(assetCfg.labelKey)}
                        <ExternalLink size={14} className="opacity-60" />
                    </button>

                    {ActionsRow}
                    {CommentsSection}
                </div>
            </article>
        );
    }

    // ── Default: Article card ──────────────────────────────────────────
    const snippet = post.content
        ?.replace(/```[\s\S]*?```/g, '') // strip code blocks
        ?.replace(/#+\s/g, '')           // strip md headings
        ?.replace(/[_*`[\]()]/g, '')     // strip inline md
        ?.trim()
        ?.slice(0, 180) ?? '';

    return (
        <article
            onClick={() => navigate(`/community/post/${post.id}`)}
            className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200 overflow-hidden cursor-pointer"
        >
            {/* Cover image — aspect-video prevents stretch */}
            {post.coverImage && (
                <div className="w-full aspect-video overflow-hidden">
                    <img
                        src={post.coverImage}
                        alt={post.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                </div>
            )}

            <div className="p-6">
                {AuthorRow}

                {/* Title */}
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-3 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {post.title}
                </h2>

                {/* Tags */}
                {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.map((tag, i) => (
                            <span
                                key={tag}
                                className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-md ${TAG_COLORS[i % TAG_COLORS.length]}`}
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

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
