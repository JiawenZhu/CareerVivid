import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { usePublicProfile, OverviewItem } from '../../../hooks/usePublicProfile';
import { useAuth } from '../../../contexts/AuthContext';
import {
    Loader2, Github, Linkedin, Globe, Twitter, LayoutTemplate, FileText, PenTool,
    ExternalLink, MessageSquare, ArrowRight, Sparkles,
} from 'lucide-react';
import PostCard from '../../../components/Community/PostCard';
import { CommunityPost } from '../../../hooks/useCommunity';

// ── Tab type ─────────────────────────────────────────────────────────────────
type TabType = 'overview' | 'posts' | 'comments';

// ── Comment card ─────────────────────────────────────────────────────────────
const CommentCard: React.FC<{ comment: OverviewItem['comment'] }> = ({ comment }) => {
    if (!comment) return null;

    const timeAgo = comment.createdAt
        ? formatDistanceToNow(
            comment.createdAt.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt.seconds * 1000),
            { addSuffix: true }
        )
        : '';

    return (
        <a
            href={`/community/post/${comment.postId}`}
            className="group block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-200"
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
                    <MessageSquare size={15} className="text-indigo-500 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">
                        Commented{' '}
                        <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            on "{comment.parentPostTitle}"
                        </span>
                        {timeAgo && <> · {timeAgo}</>}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {comment.content}
                    </p>
                </div>
                <ArrowRight
                    size={16}
                    className="shrink-0 text-gray-300 group-hover:text-indigo-500 transition-colors mt-1"
                />
            </div>
        </a>
    );
};

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-dashed border-gray-200 dark:border-gray-800">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
            {icon}
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">{subtitle}</p>
    </div>
);

// ── Overview feed item ────────────────────────────────────────────────────────
const OverviewFeedItem: React.FC<{ item: OverviewItem }> = ({ item }) => {
    if (item.type === 'post' && item.post) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <PostCard post={item.post as CommunityPost} />
            </div>
        );
    }
    if (item.type === 'comment' && item.comment) {
        return <CommentCard comment={item.comment} />;
    }
    return null;
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const PublicProfilePage: React.FC = () => {
    // Parse profileId from URL path — avoids react-router-dom dependency
    // since this component is rendered outside the <Router> context.
    const segments = window.location.pathname.split('/').filter(Boolean);
    // /portfolio/:id  →  segments = ['portfolio', 'id']
    const profileId = segments[segments.length - 1] !== 'portfolio'
        ? segments[segments.length - 1]
        : null;

    const { currentUser } = useAuth();
    const goToCommunity = () => { window.location.href = '/community'; };

    const { profileData, loading, error } = usePublicProfile(profileId || null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    useEffect(() => {
        if (profileData?.displayName) {
            document.title = `${profileData.displayName}'s Profile | CareerVivid`;
        }
    }, [profileData]);

    // ── Guards ────────────────────────────────────────────────────────────────
    if (!profileId) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Invalid Profile Link</h1>
                <button onClick={goToCommunity} className="text-indigo-600 hover:text-indigo-800 font-medium">
                    Return to Community
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (error || !profileData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <span className="text-4xl">👤</span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Profile Not Found</h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                    This user doesn't exist, or they haven't made their profile public yet.
                </p>
                <button
                    onClick={goToCommunity}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
                >
                    Back to Community
                </button>
            </div>
        );
    }

    const isOwner = currentUser?.uid === profileId;

    const TAB_CONFIG: { key: TabType; label: string; count?: number }[] = [
        { key: 'overview', label: 'Overview' },
        { key: 'posts', label: 'Posts', count: profileData.recentPosts.length },
        { key: 'comments', label: 'Comments', count: profileData.comments.length },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">

            {/* ── Hero Banner ── */}
            <div className="relative bg-gradient-to-b from-indigo-50/60 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800">
                {/* Subtle grid texture */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">

                        {/* Avatar */}
                        <div className="shrink-0">
                            {profileData.avatar ? (
                                <img
                                    src={profileData.avatar}
                                    alt={profileData.displayName}
                                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-2xl ring-2 ring-indigo-100 dark:ring-indigo-900"
                                />
                            ) : (
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-5xl text-white font-black border-4 border-white dark:border-gray-800 shadow-2xl">
                                    {profileData.displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
                                {profileData.displayName}
                            </h1>

                            {profileData.role && (
                                <p className="text-base text-indigo-600 dark:text-indigo-400 font-semibold mb-4">
                                    {profileData.role}
                                </p>
                            )}

                            {profileData.bio && (
                                <p className="text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed mb-5 text-sm md:text-base">
                                    {profileData.bio}
                                </p>
                            )}

                            {/* CTA — External Portfolio Link */}
                            {profileData.portfolioUrl && (
                                <a
                                    href={profileData.portfolioUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-indigo-200 dark:hover:shadow-indigo-900 transition-all duration-200 mb-5"
                                >
                                    <Sparkles size={16} />
                                    Visit External Portfolio
                                    <ExternalLink size={14} />
                                </a>
                            )}

                            {/* Social Links */}
                            {Object.keys(profileData.socialLinks).length > 0 && (
                                <div className="flex items-center justify-center md:justify-start gap-4 mb-5">
                                    {profileData.socialLinks.github && (
                                        <a href={profileData.socialLinks.github} target="_blank" rel="noreferrer"
                                            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" aria-label="GitHub">
                                            <Github className="w-5 h-5" />
                                        </a>
                                    )}
                                    {profileData.socialLinks.linkedin && (
                                        <a href={profileData.socialLinks.linkedin} target="_blank" rel="noreferrer"
                                            className="text-gray-400 hover:text-blue-600 transition-colors" aria-label="LinkedIn">
                                            <Linkedin className="w-5 h-5" />
                                        </a>
                                    )}
                                    {profileData.socialLinks.twitter && (
                                        <a href={profileData.socialLinks.twitter} target="_blank" rel="noreferrer"
                                            className="text-gray-400 hover:text-sky-500 transition-colors" aria-label="Twitter/X">
                                            <Twitter className="w-5 h-5" />
                                        </a>
                                    )}
                                    {profileData.socialLinks.website && (
                                        <a href={profileData.socialLinks.website} target="_blank" rel="noreferrer"
                                            className="text-gray-400 hover:text-indigo-500 transition-colors" aria-label="Website">
                                            <Globe className="w-5 h-5" />
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Stats chips */}
                            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full">
                                    <PenTool size={12} />
                                    {profileData.recentPosts.length} {profileData.recentPosts.length === 1 ? 'Post' : 'Posts'}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-xs font-semibold rounded-full">
                                    <MessageSquare size={12} />
                                    {profileData.comments.length} {profileData.comments.length === 1 ? 'Comment' : 'Comments'}
                                </span>
                                {profileData.publicResumes.length > 0 && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                                        <FileText size={12} />
                                        {profileData.publicResumes.length} {profileData.publicResumes.length === 1 ? 'Resume' : 'Resumes'}
                                    </span>
                                )}
                                {profileData.publicPortfolios.length > 0 && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                                        <LayoutTemplate size={12} />
                                        {profileData.publicPortfolios.length} {profileData.publicPortfolios.length === 1 ? 'Portfolio' : 'Portfolios'}
                                    </span>
                                )}
                            </div>

                            {isOwner && (
                                <button
                                    onClick={() => { window.location.href = '/settings'; }}
                                    className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors text-xs border border-gray-200 dark:border-gray-700"
                                >
                                    Edit Profile Settings
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
                <div className="border-b border-gray-200 dark:border-gray-800 flex gap-1 mb-8 overflow-x-auto no-scrollbar">
                    {TAB_CONFIG.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`pb-4 px-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${activeTab === tab.key
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`py-0.5 px-2 rounded-full text-xs transition-colors ${activeTab === tab.key
                                    ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Tab Content ── */}
                <div className="min-h-[400px] pb-8">

                    {/* OVERVIEW: unified chronological feed */}
                    {activeTab === 'overview' && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            {profileData.overviewFeed.length > 0 ? (
                                profileData.overviewFeed.map(item => (
                                    <OverviewFeedItem key={item.id} item={item} />
                                ))
                            ) : (
                                <EmptyState
                                    icon={<Sparkles className="w-7 h-7 text-gray-300 dark:text-gray-600" />}
                                    title="No activity yet"
                                    subtitle="This user hasn't published any posts or comments yet."
                                />
                            )}
                        </div>
                    )}

                    {/* POSTS TAB */}
                    {activeTab === 'posts' && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            {profileData.recentPosts.length > 0 ? (
                                profileData.recentPosts.map(post => (
                                    <div key={post.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                                        <PostCard post={post} />
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    icon={<PenTool className="w-7 h-7 text-gray-300 dark:text-gray-600" />}
                                    title="No posts yet"
                                    subtitle={`${profileData.displayName} hasn't published anything to the community feed.`}
                                />
                            )}
                        </div>
                    )}

                    {/* COMMENTS TAB */}
                    {activeTab === 'comments' && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                            {profileData.comments.length > 0 ? (
                                profileData.comments.map(comment => (
                                    <CommentCard key={comment.id} comment={comment} />
                                ))
                            ) : (
                                <EmptyState
                                    icon={<MessageSquare className="w-7 h-7 text-gray-300 dark:text-gray-600" />}
                                    title="No comments yet"
                                    subtitle={`${profileData.displayName} hasn't commented on any posts yet.`}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicProfilePage;
