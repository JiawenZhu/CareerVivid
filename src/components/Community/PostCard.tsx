import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, BookOpen, FileText, Globe, PenTool, AlertTriangle, ExternalLink } from 'lucide-react';
import { navigate } from '../../utils/navigation';
import { CommunityPost, useCommunity } from '../../hooks/useCommunity';
import { useAuth } from '../../contexts/AuthContext';

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
        label: '📄 View Resume',
        accent: 'primary',
        bgPattern: 'bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/30 dark:to-indigo-950/20',
        badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
        btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    portfolio: {
        icon: Globe,
        label: '🌐 View Portfolio',
        accent: 'indigo',
        bgPattern: 'bg-gradient-to-br from-violet-50/80 to-purple-50/60 dark:from-violet-950/30 dark:to-purple-950/20',
        badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
        btnClass: 'bg-violet-600 hover:bg-violet-700 text-white',
    },
    whiteboard: {
        icon: PenTool,
        label: '🖌️ View System Design',
        accent: 'emerald',
        bgPattern: 'bg-gradient-to-br from-emerald-50/80 to-teal-50/60 dark:from-emerald-950/30 dark:to-teal-950/20',
        badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
        btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
} as const;

interface PostCardProps {
    post: CommunityPost;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const { currentUser } = useAuth();
    const { toggleLike } = useCommunity();

    const [isLiked, setIsLiked] = React.useState(false);
    const [likesCount, setLikesCount] = React.useState(post.metrics?.likes ?? 0);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) { navigate('/signin'); return; }

        const next = !isLiked;
        setIsLiked(next);
        setLikesCount(prev => next ? prev + 1 : prev - 1);

        try {
            await toggleLike(post.id);
        } catch {
            setIsLiked(!next);
            setLikesCount(post.metrics?.likes ?? 0);
        }
    };

    const formattedDate = post.createdAt?.toDate
        ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })
        : 'Just now';

    const postType = post.type || 'article';
    const isAssetCard = postType !== 'article';
    const assetCfg = isAssetCard ? ASSET_CONFIG[postType as keyof typeof ASSET_CONFIG] : null;
    const isAssetDisabled = isAssetCard && !post.assetUrl;

    // Determine click handler
    const handleCardClick = () => {
        if (isAssetDisabled) return;
        if (isAssetCard && post.assetUrl) {
            // Navigate using internal routing
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

                {/* Comments */}
                <button
                    onClick={e => { e.stopPropagation(); navigate(`/community/post/${post.id}#comments`); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-150 cursor-pointer"
                    aria-label="View comments"
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
                    <><BookOpen size={14} /> {post.readTime ?? 1} min read</>
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
                        {assetCfg.label}
                        <ExternalLink size={14} className="opacity-60" />
                    </button>

                    {ActionsRow}
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
            </div>
        </article>
    );
};

export default PostCard;
