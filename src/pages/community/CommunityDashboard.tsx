import React, { lazy, Suspense, useEffect, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { navigate } from '../../utils/navigation';
import { useCommunity, useCommunityFeed, CommunityPostType, CommunitySortMode } from '../../hooks/useCommunity';
import { usePopularTags, useHiringCompanies } from '../../hooks/useCommunityMeta';
import {
    Home, TrendingUp, Briefcase, FileText,
    Loader2, PenLine, Hash, ExternalLink, Terminal,
    Globe, PenTool, StickyNote, UserPlus, LayoutDashboard, Sparkles, Menu, X,
    Star, Github
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelect from '../../components/LanguageSelect';
import SearchBar from '../../components/Community/SearchBar';
import AnimatedCommunityTitle from '../../components/Community/AnimatedCommunityTitle';
import { displayTag, slugifyTag } from '../../utils/tagUtils';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';


import CommunityMobileDrawer from '../../components/Community/CommunityMobileDrawer';
import { useCommunityStats } from '../../hooks/useCommunityMeta';

// Initialize Algolia client
// TODO: Replace with env variables in production
const appId = import.meta.env.VITE_ALGOLIA_APP_ID || 'dummy_app_id';
const apiKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY || 'dummy_search_key';
const searchClient = algoliasearch(appId, apiKey);
const REPO_URL = 'https://github.com/Jastalk/CareerVivid';

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

interface MobileTabProps {
    label: string;
    icon: React.ReactNode;
    active: boolean;
    onClick: () => void;
}

const MobileTab: React.FC<MobileTabProps> = ({ label, icon, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all shrink-0 snap-start
            ${active
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'}`}
    >
        {icon}
        {label}
    </button>
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
    const [typeFilter, setTypeFilter] = useState<CommunityPostType | undefined>(undefined);
    const [activeTag, setActiveTag] = useState<string>('');
    const [sortMode, setSortMode] = useState<CommunitySortMode>('newest');

    // Read URL params on mount and on back/forward navigation
    useEffect(() => {
        const readParams = () => {
            const params = new URLSearchParams(window.location.search);
            setActiveTag(params.get('tag') || '');
            setSortMode((params.get('sort') as CommunitySortMode) || 'newest');
        };
        readParams();
        window.addEventListener('popstate', readParams);
        return () => window.removeEventListener('popstate', readParams);
    }, []);

    const { posts, loading, isFetchingNextPage, hasMore, error, fetchMorePosts } = useCommunityFeed({
        typeFilter,
    });
    const { userProfile } = useCommunity();
    const { tags: popularTags, loading: tagsLoading } = usePopularTags();
    const { companies, loading: companiesLoading } = useHiringCompanies();
    const { currentUser } = useAuth();
    const { t } = useTranslation();

    const { memberCount, loading: statsLoading } = useCommunityStats();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Track scroll position to pause title animation
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                if (!isScrolled) setIsScrolled(true);
            } else {
                if (isScrolled) setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isScrolled]);

    const performAlgoliaSearch = useCallback(async (query: string, tag?: string, sort?: CommunitySortMode) => {
        setSearchError(null);

        // Define which index to use
        const indexName = sort === 'trending' ? 'community_posts_trending' : 'community_posts';

        // If no query and no tag and not trending, we show the default Firestore feed
        if (!query.trim() && !tag && sort !== 'trending') {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        if (appId === 'dummy_app_id' || apiKey === 'dummy_search_key') {
            setSearchError('Search is currently unavailable: Missing Algolia credentials.');
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const cleanTag = tag ? tag.replace(/^#+/, '') : '';
            // Instead of brittle facetFilters, we combine the tag into the text query
            // for robust, case-insensitive matching.
            const combinedQuery = [cleanTag, query].filter(Boolean).join(' ');

            console.log("Executing Algolia Search with Query:", combinedQuery);

            const { results } = await searchClient.search({
                requests: [
                    {
                        indexName: indexName,
                        query: combinedQuery,
                        hitsPerPage: 20
                    }
                ]
            });
            const firstResult = results[0] as any;
            const hits = firstResult.hits;

            // Map Algolia hits — many fields may be missing if docs were indexed before those fields existed
            let mappedHits = hits.map((hit: any) => ({
                id: hit.objectID,
                ...hit,
                authorId: hit.authorId || hit.userId || hit.author_id || hit.ownerId || null,
                _highlightResult: hit._highlightResult
            }));

            // For ANY hit missing authorId OR missing assetUrl/assetId on asset-type posts,
            // fetch the full document from Firestore to hydrate the missing fields.
            const ASSET_TYPES = new Set(['resume', 'portfolio', 'whiteboard']);
            const incompleteIds = mappedHits
                .filter((h: any) =>
                    !h.authorId ||
                    (ASSET_TYPES.has(h.type) && !h.assetUrl && !h.assetId)
                )
                .map((h: any) => h.id);

            if (incompleteIds.length > 0) {
                try {
                    const fetches = incompleteIds.map((postId: string) =>
                        getDoc(doc(db, 'community_posts', postId))
                    );
                    const snaps = await Promise.all(fetches);
                    // Build a map of postId → full Firestore data
                    const firestoreMap: Record<string, Record<string, any>> = {};
                    snaps.forEach(docSnap => {
                        if (docSnap.exists()) {
                            firestoreMap[docSnap.id] = docSnap.data() as Record<string, any>;
                        }
                    });

                    // Merge: Algolia data wins for fields it has; Firestore fills the gaps
                    mappedHits = mappedHits.map((h: any) => {
                        const fs = firestoreMap[h.id];
                        if (!fs) return h;
                        return {
                            // Start with Firestore data as base (has all fields)
                            ...fs,
                            // Overlay the mapped hit (Algolia + our id/authorId fixes)
                            ...h,
                            // Resolve the critical missing fields from Firestore
                            authorId: h.authorId || fs['authorId'] || null,
                            assetUrl: h.assetUrl || fs['assetUrl'] || null,
                            assetId: h.assetId || fs['assetId'] || null,
                            type: h.type || fs['type'] || 'article',
                            // Rich asset data is too large for Algolia — always use Firestore
                            resumeData: fs['resumeData'] || h.resumeData || null,
                            portfolioData: fs['portfolioData'] || h.portfolioData || null,
                            whiteboardData: fs['whiteboardData'] || h.whiteboardData || null,
                        };
                    });
                } catch (fetchErr) {
                    console.warn('[Search] Firestore hydration fallback failed:', fetchErr);
                }
            }

            setSearchResults(mappedHits);
        } catch (err) {
            console.error('Algolia Search Error:', err);
            setSearchError('Search failed. Please try again later.');
        } finally {
            setIsSearching(false);
        }
    }, [appId, apiKey]);

    // Reactive search triggered by query, tag, or sort changes
    useEffect(() => {
        performAlgoliaSearch(searchQuery, activeTag, sortMode);
    }, [searchQuery, activeTag, sortMode, performAlgoliaSearch]);

    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const { ref: sentinelRef, inView } = useInView({
        threshold: 0,
        rootMargin: '200px',
    });

    useEffect(() => {
        if (inView && hasMore && !isFetchingNextPage && !searchQuery) {
            fetchMorePosts();
        }
    }, [inView, hasMore, isFetchingNextPage, fetchMorePosts, searchQuery]);

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/80 pt-8 pb-16 relative overflow-hidden">
            {/* Ambient Base Glow */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-400/20 dark:bg-primary-600/10 blur-[120px] pointer-events-none z-[-1]" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[120px] pointer-events-none z-[-1]" />
            
            {/* Mobile Drawer Navigation */}
            <CommunityMobileDrawer
                isOpen={isMobileDrawerOpen}
                onClose={() => setIsMobileDrawerOpen(false)}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                popularTags={popularTags}
                tagsLoading={tagsLoading}
            />

            <div className="max-w-7xl mx-auto px-0 md:px-6 lg:px-8">

                <header className="mb-6 md:mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8 w-full relative z-20 px-4 md:px-0">
                    <div className="shrink-0 flex flex-col">
                        <div className="flex items-center justify-between w-full lg:w-auto">
                            <AnimatedCommunityTitle isPaused={isSearchFocused || isMobileDrawerOpen || isScrolled} />

                            {/* Mobile Hamburger Menu */}
                            <button
                                onClick={() => setIsMobileDrawerOpen(true)}
                                className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                                aria-label="Open mobile menu"
                            >
                                <Menu size={24} />
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-3 md:mt-2">
                            <p className="text-base text-gray-500 dark:text-gray-400 max-w-lg">
                                {t('nav.community_desc' as string, {
                                    members: statsLoading ? '...' : memberCount.toLocaleString(),
                                    defaultValue: 'Join {{members}}+ members'
                                })}
                            </p>
                            <a
                                href={REPO_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden shrink-0"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Star size={13} className="text-yellow-400 fill-yellow-400" />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Star on GitHub</span>
                                <Github size={14} className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                            </a>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col sm:flex-row items-center justify-end w-full gap-3">
                        <div className="flex-1 w-full max-w-xl lg:max-w-3xl">
                            <SearchBar
                                onSearchChange={handleSearchChange}
                                isSearching={isSearching}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                            />
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap justify-end">
                            <LanguageSelect />

                            {currentUser ? (
                                <>
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 shadow-sm cursor-pointer text-sm"
                                    >
                                        <LayoutDashboard size={16} className="sm:w-[18px] sm:h-[18px]" />
                                        <span className="hidden sm:inline">{t('common.dashboard', 'Dashboard')}</span>
                                    </button>
                                    <button
                                        onClick={() => navigate('/community/new')}
                                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all duration-200 shadow-md shadow-primary-500/20 cursor-pointer whitespace-nowrap text-sm"
                                    >
                                        <PenLine size={16} className="sm:w-[18px] sm:h-[18px]" />
                                        <span className="hidden xs:inline">{t('community.feed.write_article', 'Write')}</span>
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigate('/signin?redirect=/community')}
                                        className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                        {t('auth.login', 'Sign In')}
                                    </button>
                                    <button
                                        onClick={() => navigate('/signup?redirect=/community')}
                                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-md shadow-primary-500/20 text-sm cursor-pointer whitespace-nowrap"
                                    >
                                        {t('auth.signup', 'Sign Up')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Mobile Filter Tabs (High Visibility) */}
                <div className="md:hidden flex overflow-x-auto scrollbar-hide py-3 px-4 gap-2 mb-4 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 sticky top-14 z-10 w-[calc(100%+2rem)] -mx-4">
                    {[
                        { type: undefined, icon: <Home size={16} />, label: t('community.sidebar.all_posts', 'All') },
                        { type: 'article', icon: <StickyNote size={16} />, label: t('community.sidebar.articles', 'Articles') },
                        { type: 'whiteboard', icon: <PenTool size={16} />, label: t('community.sidebar.whiteboards', 'Diagrams') },
                        { type: 'resume', icon: <FileText size={16} />, label: t('community.sidebar.resumes', 'Resumes') },
                        { type: 'portfolio', icon: <Globe size={16} />, label: t('community.sidebar.portfolios', 'Portfolios') },
                    ].map(item => (
                        <button
                            key={item.label}
                            onClick={() => setTypeFilter(item.type as CommunityPostType | undefined)}
                            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all
                                ${typeFilter === item.type
                                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'}`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* ── Left Column ─────────────────────────────────────── */}
                    <aside className="hidden md:flex flex-col gap-5 w-64 shrink-0 lg:sticky lg:top-24">
                        {/* Navigation */}
                        <nav className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] border border-white/50 dark:border-gray-800/50 shadow-sm overflow-hidden">
                            <NavItem
                                icon={<Home size={18} />}
                                label={t('community.sidebar.home')}
                                active={!activeTag && sortMode === 'newest'}
                                onClick={() => navigate('/community')}
                            />
                            <NavItem
                                icon={<Sparkles size={18} />}
                                label={t('community.sidebar.product_features', 'Platform Overview')}
                                onClick={() => navigate('/product')}
                            />
                            <NavItem
                                icon={<TrendingUp size={18} />}
                                label={t('community.sidebar.trending')}
                                active={sortMode === 'trending' && !activeTag}
                                onClick={() => navigate('/community?sort=trending')}
                            />
                            <NavItem
                                icon={<Briefcase size={18} />}
                                label={t('community.sidebar.job_listings')}
                                onClick={() => navigate('/job-market')}
                            />
                            <NavItem
                                icon={<FileText size={18} />}
                                label={t('community.sidebar.guidelines')}
                                onClick={() => navigate('/community/guidelines')}
                            />
                            <NavItem
                                icon={<Terminal size={18} />}
                                label={t('community.sidebar.professional_api')}
                                onClick={() => navigate('/developers/api')}
                            />
                        </nav>

                        {/* Showcases Filter */}
                        <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] border border-white/50 dark:border-gray-800/50 shadow-sm p-4">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 px-1">
                                {t('community.sidebar.showcases')}
                            </h3>
                            <div className="space-y-1">
                                {[
                                    { type: undefined as CommunityPostType | undefined, icon: <Home size={16} />, label: t('community.sidebar.all_posts') },
                                    { type: 'article' as CommunityPostType, icon: <StickyNote size={16} />, label: `📝 ${t('community.sidebar.articles')}` },
                                    { type: 'resume' as CommunityPostType, icon: <FileText size={16} />, label: `📄 ${t('community.sidebar.resumes')}` },
                                    { type: 'portfolio' as CommunityPostType, icon: <Globe size={16} />, label: `🌐 ${t('community.sidebar.portfolios')}` },
                                    { type: 'whiteboard' as CommunityPostType, icon: <PenTool size={16} />, label: `🖌️ ${t('community.sidebar.whiteboards')}` },
                                ].map(item => (
                                    <button
                                        key={item.label}
                                        onClick={() => setTypeFilter(item.type)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer
                                            ${typeFilter === item.type
                                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:shadow-sm'
                                            }`}
                                    >
                                        <span className={typeFilter === item.type ? 'text-primary-500' : 'text-gray-400'}>{item.icon}</span>
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Popular Tags */}
                        <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] p-5 border border-white/50 dark:border-gray-800/50 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                                {t('community.sidebar.popular_tags')}
                            </h3>
                            {tagsLoading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-7 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {popularTags.map((entry, i) => {
                                        const slug = slugifyTag(entry.tag);
                                        const isActive = activeTag === slug;
                                        return (
                                            <button
                                                key={entry.tag}
                                                onClick={() => navigate(`/community?tag=${slug}`)}
                                                className={`inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full transition-colors duration-150 cursor-pointer
                                                    ${isActive
                                                        ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 ring-1 ring-primary-400'
                                                        : TAG_COLORS[i % TAG_COLORS.length]
                                                    }`}
                                            >
                                                <Hash size={12} />
                                                {entry.tag}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* ── Center Column: Feed ──────────────────────────────── */}
                    <main className="flex-1 min-w-0">

                        {/* Active Tag / Sort Filter Banner */}
                        {(activeTag || sortMode === 'trending') && !loading && (
                            <div className="mx-4 md:mx-0 mb-4 flex items-center gap-2 px-4 py-2.5 bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 rounded-xl">
                                <span className="text-sm font-semibold text-primary-700 dark:text-primary-300 flex items-center gap-1.5 flex-1">
                                    {activeTag && <><Hash size={14} />Showing: <span className="font-bold">#{displayTag(activeTag)}</span></>}
                                    {sortMode === 'trending' && !activeTag && <><TrendingUp size={14} />Showing Trending (last 30 days)</>}
                                    {sortMode === 'trending' && activeTag && <span className="ml-1 text-xs opacity-70">· Trending</span>}
                                </span>
                                <button
                                    onClick={() => navigate('/community')}
                                    className="flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 transition-colors cursor-pointer"
                                >
                                    <X size={14} /> Clear
                                </button>
                            </div>
                        )}

                        {error && !searchQuery && (
                            <div className="px-4 md:px-0 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl mb-6 border border-red-100 dark:border-red-800 text-sm font-medium mx-4 md:mx-0">
                                {error}
                            </div>
                        )}

                        {loading && !searchQuery && (
                            <div className="flex flex-col gap-4 md:space-y-5 px-3 md:px-0">
                                {[1, 2, 3].map(i => <PostCardSkeleton key={i} />)}
                            </div>
                        )}

                        {/* Search Results / Tag Filter Results / Trending Results */}
                        {(searchQuery || activeTag || sortMode === 'trending') && !loading && !searchError && (
                            <>
                                {isSearching ? (
                                    <div className="flex flex-col gap-4 md:space-y-5 px-3 md:px-0">
                                        {[1, 2].map(i => <PostCardSkeleton key={i} />)}
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="flex flex-col gap-4 md:space-y-5 px-3 md:px-0">
                                        <Suspense fallback={<div className="px-3 md:px-0"><PostCardSkeleton /></div>}>
                                            {searchResults.map((post) => (
                                                <PostCard key={post.id} post={post as any} />
                                            ))}
                                        </Suspense>
                                    </div>
                                ) : (
                                    <div className="mx-4 md:mx-0 text-center py-20 bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] border border-white/50 dark:border-gray-800/50 shadow-sm">
                                        <div className="text-5xl mb-4" role="img" aria-label="sad">🔍</div>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('community.search_no_results', 'No results found')}</p>
                                        <p className="text-gray-500 mb-6 text-sm">
                                            {activeTag
                                                ? `We couldn't find any posts tagged with #${activeTag}`
                                                : `We couldn't find anything matching "${searchQuery}"`}
                                        </p>
                                        <button
                                            onClick={() => navigate('/community')}
                                            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all cursor-pointer text-sm"
                                        >
                                            Clear All Filters
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Default Firebase Feed (Newest / Type Filtered) */}
                        {!loading && !searchQuery && !activeTag && sortMode !== 'trending' && posts.length === 0 && (
                            <div className="mx-4 md:mx-0 text-center py-20 bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] border border-white/50 dark:border-gray-800/50 shadow-sm">
                                <div className="text-5xl mb-4" role="img" aria-label="seedling">🌱</div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('community.feed.empty_title')}</p>
                                <p className="text-gray-500 mb-6 text-sm">{t('community.feed.empty_desc')}</p>
                                <button
                                    onClick={() => navigate('/community/new')}
                                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all cursor-pointer"
                                >
                                    {t('community.feed.publish_first')}
                                </button>
                            </div>
                        )}

                        {!loading && !searchQuery && !activeTag && sortMode !== 'trending' && posts.length > 0 && (
                            <div className="flex flex-col gap-4 md:space-y-5 px-3 md:px-0">
                                <Suspense fallback={<div className="px-3 md:px-0"><PostCardSkeleton /></div>}>
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
                                        {t('community.feed.reached_end')}
                                    </p>
                                )}
                            </div>
                        )}
                    </main>

                    {/* ── Right Column: Widgets ─────────────────────────── */}
                    <aside className="hidden xl:flex flex-col gap-5 w-72 shrink-0 sticky top-24">
                        {currentUser ? (
                            /* Write CTA */
                            <div className="bg-gradient-to-br from-primary-600 to-blue-600 rounded-[24px] p-6 text-white relative overflow-hidden shadow-xl shadow-primary-500/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                                <div className="relative z-10">
                                    <p className="text-2xl mb-1">✍️</p>
                                    <h3 className="font-extrabold text-xl mb-2">{t('community.feed.write_article')}</h3>
                                    <p className="text-white/80 text-sm mb-5 leading-relaxed">
                                        {t('community.feed.write_cta_desc')}
                                    </p>
                                    <button
                                        onClick={() => navigate('/community/new')}
                                        className="w-full py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm transition-all hover:bg-gray-50 cursor-pointer"
                                    >
                                        {t('community.feed.start_writing')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Guest Signup CTA */
                            <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] p-6 border border-white/50 dark:border-gray-800/50 shadow-sm relative overflow-hidden hover:shadow-lg transition-all duration-300">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-blue-500" />
                                <div className="relative z-10">
                                    <h3 className="font-extrabold text-xl mb-2 text-gray-900 dark:text-white">{t('community.guestCta.join_community')}</h3>
                                    <p className="whitespace-pre-line text-gray-500 dark:text-gray-400 text-sm mb-5 leading-relaxed">
                                        {t('community.guestCta.welcome_message')}
                                    </p>
                                    <button
                                        onClick={() => navigate('/signup?redirect=/community')}
                                        className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <UserPlus size={16} />
                                        {t('community.guestCta.sign_up_free')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Hiring Companies */}
                        <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] p-5 border border-white/50 dark:border-gray-800/50 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Briefcase size={14} /> {t('community.companies.companies_hiring')}
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
                                                        {t('community.companies.hiring', { role: company.hiringFor })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => navigate('/job-market')}
                                        className="w-full text-center text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline flex items-center justify-center gap-1 cursor-pointer pt-1"
                                    >
                                        {t('community.companies.view_all_jobs')} <ExternalLink size={13} />
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
        className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition-colors duration-150 cursor-pointer relative
            ${active
                ? 'text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800/40'
            }`}
    >
        {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r-full shadow-[0_0_8px_rgba(var(--color-primary-500),0.6)]" />}
        <span className={active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}>{icon}</span>
        {label}
    </button>
);

export default CommunityDashboard;
