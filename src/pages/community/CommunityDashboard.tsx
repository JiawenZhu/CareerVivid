import React, { lazy, Suspense, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { navigate } from '../../utils/navigation';
import { useCommunity } from '../../hooks/useCommunity';
import { usePopularTags, useHiringCompanies } from '../../hooks/useCommunityMeta';
import {
    Home, TrendingUp, Briefcase, FileText,
    Loader2, PenLine, Hash, ExternalLink, Terminal
} from 'lucide-react';

const PostCard = lazy(() => import('../../components/Community/PostCard'));

const PostCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
            <div className="space-y-2 flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            </div>
        </div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-4/5" />
        <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        </div>
        <div className="flex gap-4">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
    </div>
);

// ── Tag pill colors — rotates for visual variety ──────────────────────────────
const TAG_COLORS = [
    'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950',
    'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950',
    'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950',
    'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950',
    'text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950',
    'text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950',
    'text-fuchsia-600 dark:text-fuchsia-400 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950',
    'text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950',
];

const CommunityDashboard: React.FC = () => {
    const { posts, loading, isFetchingNextPage, hasMore, error, fetchMorePosts } = useCommunity();
    const { tags: popularTags, loading: tagsLoading } = usePopularTags();
    const { companies, loading: companiesLoading } = useHiringCompanies();

    const { ref: sentinelRef, inView } = useInView({
        threshold: 0,
        rootMargin: '200px',
    });

    useEffect(() => {
        if (inView && hasMore && !isFetchingNextPage) {
            fetchMorePosts();
        }
    }, [inView, hasMore, isFetchingNextPage, fetchMorePosts]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-8 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Page Header */}
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Community
                        </h1>
                        <p className="text-base text-gray-500 dark:text-gray-400 mt-1">
                            Connect, share, and grow your career.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/community/new')}
                        className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all duration-200 shadow-md shadow-primary-500/20 cursor-pointer"
                    >
                        <PenLine size={18} />
                        <span>Write Article</span>
                    </button>
                </header>

                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* ── Left Column ─────────────────────────────────────── */}
                    <aside className="hidden md:flex flex-col gap-5 w-64 shrink-0 lg:sticky lg:top-24">
                        {/* Navigation */}
                        <nav className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                            <NavItem
                                icon={<Home size={18} />}
                                label="Home"
                                active
                                onClick={() => { }}
                            />
                            <NavItem
                                icon={<TrendingUp size={18} />}
                                label="Trending"
                                onClick={() => { }}
                            />
                            <NavItem
                                icon={<Briefcase size={18} />}
                                label="Job Listings"
                                onClick={() => navigate('/job-market')}
                            />
                            <NavItem
                                icon={<FileText size={18} />}
                                label="Guidelines"
                                onClick={() => navigate('/community/guidelines')}
                            />
                            <NavItem
                                icon={<Terminal size={18} />}
                                label="Professional API"
                                onClick={() => navigate('/developers/api')}
                            />
                        </nav>

                        {/* Popular Tags */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                                Popular Tags
                            </h3>
                            {tagsLoading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-7 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {popularTags.map((entry, i) => (
                                        <span
                                            key={entry.tag}
                                            className={`inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full cursor-pointer transition-colors duration-150 ${TAG_COLORS[i % TAG_COLORS.length]}`}
                                        >
                                            <Hash size={12} />
                                            {entry.tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* ── Center Column: Feed ──────────────────────────────── */}
                    <main className="flex-1 min-w-0">
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl mb-6 border border-red-100 dark:border-red-800 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        {loading && (
                            <div className="space-y-5">
                                {[1, 2, 3].map(i => <PostCardSkeleton key={i} />)}
                            </div>
                        )}

                        {!loading && posts.length === 0 && (
                            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <div className="text-5xl mb-4" role="img" aria-label="seedling">🌱</div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">No posts yet!</p>
                                <p className="text-gray-500 mb-6 text-sm">Be the first to share knowledge with the community.</p>
                                <button
                                    onClick={() => navigate('/community/new')}
                                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all cursor-pointer"
                                >
                                    Publish First Article
                                </button>
                            </div>
                        )}

                        {!loading && posts.length > 0 && (
                            <div className="space-y-5">
                                <Suspense fallback={<PostCardSkeleton />}>
                                    {posts.map(post => (
                                        <PostCard key={post.id} post={post} />
                                    ))}
                                </Suspense>

                                {/* Infinite scroll sentinel */}
                                <div ref={sentinelRef} className="h-1" aria-hidden="true" />

                                {isFetchingNextPage && (
                                    <div className="flex justify-center py-8">
                                        <Loader2 size={28} className="animate-spin text-primary-500" />
                                    </div>
                                )}

                                {!hasMore && !isFetchingNextPage && (
                                    <p className="text-center text-gray-400 dark:text-gray-600 text-sm py-8 font-medium">
                                        You've reached the end ✨
                                    </p>
                                )}
                            </div>
                        )}
                    </main>

                    {/* ── Right Column: Widgets ─────────────────────────── */}
                    <aside className="hidden xl:flex flex-col gap-5 w-72 shrink-0 sticky top-24">
                        {/* Write CTA */}
                        <div className="bg-gradient-to-br from-primary-600 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
                            <div className="relative z-10">
                                <p className="text-2xl mb-1">✍️</p>
                                <h3 className="font-extrabold text-xl mb-2">Write an Article</h3>
                                <p className="text-white/80 text-sm mb-5 leading-relaxed">
                                    Build your brand. Share insights. Get discovered.
                                </p>
                                <button
                                    onClick={() => navigate('/community/new')}
                                    className="w-full py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm transition-all hover:bg-gray-50 cursor-pointer"
                                >
                                    Start Writing →
                                </button>
                            </div>
                        </div>

                        {/* Hiring Companies */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Briefcase size={14} /> Companies Hiring
                            </h3>
                            {companiesLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse shrink-0" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-24 animate-pulse" />
                                                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-32 animate-pulse" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {companies.map((company, i) => (
                                        <div key={company.id} className={`flex items-start gap-3 ${i < companies.length - 1 ? 'pb-4 border-b border-gray-100 dark:border-gray-800' : ''}`}>
                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-primary-100 to-blue-100 dark:from-primary-900/30 dark:to-blue-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm shrink-0">
                                                {company.logoUrl
                                                    ? <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover rounded-lg" loading="lazy" />
                                                    : company.name.charAt(0)
                                                }
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{company.name}</p>
                                                {company.hiringFor && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        Hiring: {company.hiringFor}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => navigate('/job-market')}
                                        className="w-full text-center text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline flex items-center justify-center gap-1 cursor-pointer pt-1"
                                    >
                                        View all jobs <ExternalLink size={13} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </aside>

                </div>
            </div>
        </div>
    );
};

// ── NavItem sub-component ────────────────────────────────────────────────────
interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
}
const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition-colors duration-150 cursor-pointer
            ${active
                ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border-l-2 border-primary-600'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border-l-2 border-transparent'
            }`}
    >
        <span className={active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}>{icon}</span>
        {label}
    </button>
);

export default CommunityDashboard;
