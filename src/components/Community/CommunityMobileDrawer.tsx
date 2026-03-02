import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, Sparkles, TrendingUp, Briefcase, FileText, Terminal, StickyNote, Globe, PenTool, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { navigate } from '../../utils/navigation';
import { slugifyTag } from '../../utils/tagUtils';
import { CommunityPostType } from '../../hooks/useCommunity';

interface CommunityMobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    typeFilter: CommunityPostType | undefined;
    setTypeFilter: (type: CommunityPostType | undefined) => void;
    popularTags: any[];
    tagsLoading: boolean;
}

const CommunityMobileDrawer: React.FC<CommunityMobileDrawerProps> = ({
    isOpen,
    onClose,
    typeFilter,
    setTypeFilter,
    popularTags,
    tagsLoading
}) => {
    const { t } = useTranslation();

    // Prevent body scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleNavigate = (path: string) => {
        navigate(path);
        onClose();
    };

    const handleFilter = (type: CommunityPostType | undefined) => {
        setTypeFilter(type);
        onClose();
    };

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

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-950 shadow-2xl z-50 overflow-y-auto flex flex-col md:hidden"
                    >
                        <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                            <span className="font-bold text-gray-900 dark:text-white text-lg">Menu</span>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                                aria-label="Close menu"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 space-y-6 flex-1">
                            {/* Navigation */}
                            <nav className="space-y-1">
                                <NavItem
                                    icon={<Home size={18} />}
                                    label={t('community.sidebar.home', 'Home')}
                                    active
                                    onClick={() => handleNavigate('/community')}
                                />
                                <NavItem
                                    icon={<Sparkles size={18} />}
                                    label={t('community.sidebar.product_features', 'Platform Overview')}
                                    onClick={() => handleNavigate('/product')}
                                />
                                <NavItem
                                    icon={<TrendingUp size={18} />}
                                    label={t('community.sidebar.trending', 'Trending')}
                                    onClick={() => handleNavigate('/community?sort=trending')}
                                />
                                <NavItem
                                    icon={<Briefcase size={18} />}
                                    label={t('community.sidebar.job_listings', 'Job Listings')}
                                    onClick={() => handleNavigate('/job-market')}
                                />
                                <NavItem
                                    icon={<FileText size={18} />}
                                    label={t('community.sidebar.guidelines', 'Guidelines')}
                                    onClick={() => handleNavigate('/community/guidelines')}
                                />
                                <NavItem
                                    icon={<Terminal size={18} />}
                                    label={t('community.sidebar.professional_api', 'Professional API')}
                                    onClick={() => handleNavigate('/developers/api')}
                                />
                            </nav>

                            {/* Filters */}
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 px-1 mt-4">
                                    {t('community.sidebar.showcases', 'Filters')}
                                </h3>
                                <div className="space-y-1">
                                    {[
                                        { type: undefined as CommunityPostType | undefined, icon: <Home size={16} />, label: t('community.sidebar.all_posts', 'All Posts') },
                                        { type: 'article' as CommunityPostType, icon: <StickyNote size={16} />, label: `📝 ${t('community.sidebar.articles', 'Articles')}` },
                                        { type: 'resume' as CommunityPostType, icon: <FileText size={16} />, label: `📄 ${t('community.sidebar.resumes', 'Resumes')}` },
                                        { type: 'portfolio' as CommunityPostType, icon: <Globe size={16} />, label: `🌐 ${t('community.sidebar.portfolios', 'Portfolios')}` },
                                        { type: 'whiteboard' as CommunityPostType, icon: <PenTool size={16} />, label: `🖌️ ${t('community.sidebar.whiteboards', 'Whiteboards')}` },
                                    ].map(item => (
                                        <button
                                            key={item.label}
                                            onClick={() => handleFilter(item.type)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer
                                                ${typeFilter === item.type
                                                    ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            <span className={typeFilter === item.type ? 'text-primary-500' : 'text-gray-400'}>{item.icon}</span>
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Popular Tags */}
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 mt-4">
                                    {t('community.sidebar.popular_tags', 'Popular Tags')}
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
                                            <button
                                                key={entry.tag}
                                                onClick={() => {
                                                    navigate(`/community?tag=${slugifyTag(entry.tag)}`);
                                                    onClose();
                                                }}
                                                className={`inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-colors duration-150 ${TAG_COLORS[i % TAG_COLORS.length]}`}
                                            >
                                                <Hash size={12} />
                                                {entry.tag}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors duration-150 rounded-xl cursor-pointer
            ${active
                ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900'
            }`}
    >
        <span className={active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}>{icon}</span>
        {label}
    </button>
);

export default CommunityMobileDrawer;
