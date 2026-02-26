import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePublicProfile } from '../../../hooks/usePublicProfile';
import { useAuth } from '../../../contexts/AuthContext';
import { getAuth } from 'firebase/auth'; // For guest checking
import { Loader2, Github, Linkedin, Globe, MapPin, Briefcase, Calendar, LayoutTemplate, FileText, PenTool, ExternalLink } from 'lucide-react';
import PostCard from '../../../components/Community/PostCard';
// Assuming you have components like ResumeCard and PortfolioCard elsewhere, 
// we will import them or build simple previews if they are heavily tied to editing context.
// For now, let's create lightweight read-only cards if the main ones are too complex to untangle.

// Tab enum
type TabType = 'overview' | 'resumes' | 'articles';

const PublicProfilePage: React.FC = () => {
    // URL pattern is /portfolio/:id
    const { id: profileId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const { profileData, loading, error } = usePublicProfile(profileId || null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Update document title dynamically
    useEffect(() => {
        if (profileData?.displayName) {
            document.title = `${profileData.displayName}'s Profile | CareerVivid`;
        }
    }, [profileData]);

    // Handle missing or invalid profile
    if (!profileId) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Invalid Profile Link</h1>
                <button onClick={() => navigate('/community')} className="text-indigo-600 hover:text-indigo-800 font-medium">
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
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                    <span className="text-3xl">👤</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Profile Not Found</h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                    This user doesn't exist, or they haven't made their profile public yet.
                </p>
                <button
                    onClick={() => navigate('/community')}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
                >
                    Back to Community
                </button>
            </div>
        );
    }

    const isOwner = currentUser?.uid === profileId;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
            {/* 1. Profile Hero Section */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">

                        {/* Avatar */}
                        <div className="shrink-0">
                            {profileData.avatar ? (
                                <img
                                    src={profileData.avatar}
                                    alt={profileData.displayName}
                                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-xl"
                                />
                            ) : (
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-5xl text-white font-bold border-4 border-white dark:border-gray-800 shadow-xl">
                                    {profileData.displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Info Header */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                                {profileData.displayName}
                            </h1>

                            {profileData.role && (
                                <p className="text-lg text-indigo-600 dark:text-indigo-400 font-semibold mb-4">
                                    {profileData.role}
                                </p>
                            )}

                            {profileData.bio && (
                                <p className="text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed mb-6">
                                    {profileData.bio}
                                </p>
                            )}

                            {/* Social Links Row */}
                            {profileData.socialLinks && Object.keys(profileData.socialLinks).length > 0 && (
                                <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                                    {profileData.socialLinks.github && (
                                        <a href={profileData.socialLinks.github} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors" aria-label="GitHub">
                                            <Github className="w-6 h-6" />
                                        </a>
                                    )}
                                    {profileData.socialLinks.linkedin && (
                                        <a href={profileData.socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-blue-600 transition-colors" aria-label="LinkedIn">
                                            <Linkedin className="w-6 h-6" />
                                        </a>
                                    )}
                                    {profileData.socialLinks.website && (
                                        <a href={profileData.socialLinks.website} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-indigo-500 transition-colors" aria-label="Personal Website">
                                            <Globe className="w-6 h-6" />
                                        </a>
                                    )}
                                </div>
                            )}

                            {isOwner && (
                                <button
                                    onClick={() => navigate('/settings')}
                                    className="px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors text-sm border border-gray-200 dark:border-gray-700"
                                >
                                    Edit Profile Settings
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Content Tabs */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
                <div className="border-b border-gray-200 dark:border-gray-800 flex gap-8 mb-8 overflow-x-auto no-scrollbar scroll-smooth">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('resumes')}
                        className={`pb-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'resumes' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                    >
                        Resumes & Portfolios
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 py-0.5 px-2 rounded-full text-xs">
                            {(profileData.publicResumes.length + profileData.publicPortfolios.length) || 0}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('articles')}
                        className={`pb-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'articles' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                    >
                        Articles
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 py-0.5 px-2 rounded-full text-xs">
                            {profileData.recentPosts.length || 0}
                        </span>
                    </button>
                </div>

                {/* 3. Tab Content */}
                <div className="min-h-[400px]">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                            {/* Left Col: Badges / Stats */}
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Credentials</h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                                <LayoutTemplate size={16} />
                                            </div>
                                            <span>{profileData.publicPortfolios.length} Public Portfolios</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                                                <FileText size={16} />
                                            </div>
                                            <span>{profileData.publicResumes.length} Public Resumes</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                                                <PenTool size={16} />
                                            </div>
                                            <span>{profileData.recentPosts.length} Published Articles</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Right Col: Recent Activity PREVIEWS */}
                            <div className="md:col-span-2 space-y-8">

                                {/* Featured Article Preview */}
                                {profileData.recentPosts.length > 0 && (
                                    <section>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Latest Article</h3>
                                            <button onClick={() => setActiveTab('articles')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all</button>
                                        </div>
                                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <PostCard post={profileData.recentPosts[0]} />
                                        </div>
                                    </section>
                                )}

                                {/* Readonly Portfolios/Resumes List */}
                                {(profileData.publicPortfolios.length > 0 || profileData.publicResumes.length > 0) && (
                                    <section>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Public Assets</h3>
                                            <button onClick={() => setActiveTab('resumes')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all</button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Take up to 2 items total for the preview */}
                                            {[...profileData.publicPortfolios, ...profileData.publicResumes].slice(0, 2).map((item, idx) => {
                                                const isPortfolio = 'hero' in item || 'templateId' in item;
                                                const title = isPortfolio ? (item.hero?.heading || item.title || 'Portfolio') : (item.title || 'Resume');
                                                const url = isPortfolio
                                                    ? `/portfolio/${item.username || item.userId}/${item.id}`
                                                    : `/resume/shared/${item.id}`;

                                                return (
                                                    <a
                                                        key={idx}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="group block bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:shadow-sm"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 block">
                                                                    {isPortfolio ? 'Portfolio' : 'Resume'}
                                                                </span>
                                                                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                                                    {title}
                                                                </h4>
                                                            </div>
                                                            <ExternalLink size={16} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                                                        </div>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </section>
                                )}

                                {/* Empty State if NOTHING is public */}
                                {profileData.recentPosts.length === 0 && profileData.publicPortfolios.length === 0 && profileData.publicResumes.length === 0 && (
                                    <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-6">
                                        <p className="text-gray-500 dark:text-gray-400">No public activity yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* RESUMES & PORTFOLIOS TAB */}
                    {activeTab === 'resumes' && (
                        <div className="space-y-8 animate-in fade-in duration-300">

                            {/* Portfolios Group */}
                            {profileData.publicPortfolios.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <LayoutTemplate size={20} className="text-blue-500" />
                                        Portfolios
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {profileData.publicPortfolios.map((portfolio) => (
                                            <a
                                                key={portfolio.id}
                                                href={`/portfolio/${portfolio.username || portfolio.userId}/${portfolio.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all"
                                            >
                                                {/* Mini Preview Placeholder */}
                                                <div className="h-32 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-center relative overflow-hidden">
                                                    <div className="absolute inset-0 opacity-10 pattern-grid-lg text-blue-600"></div>
                                                    <LayoutTemplate className="w-10 h-10 text-gray-300 dark:text-gray-600 group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <div className="p-4">
                                                    <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                                                        {portfolio.hero?.heading || portfolio.title || 'Untitled Portfolio'}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                        View Interactive Site <ExternalLink size={12} />
                                                    </p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resumes Group */}
                            {profileData.publicResumes.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FileText size={20} className="text-green-500" />
                                        Resumes
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {profileData.publicResumes.map((resume) => (
                                            <a
                                                key={resume.id}
                                                href={`/resume/shared/${resume.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-green-400 hover:shadow-lg transition-all"
                                            >
                                                {/* Mini Preview Placeholder */}
                                                <div className="h-32 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-center relative overflow-hidden">
                                                    <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <div className="p-4">
                                                    <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-green-600 transition-colors">
                                                        {resume.title || resume.personalDetails?.firstName || 'Resume'}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                        View Document <ExternalLink size={12} />
                                                    </p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {profileData.publicPortfolios.length === 0 && profileData.publicResumes.length === 0 && (
                                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                                    <p className="text-gray-500">No public resumes or portfolios found.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ARTICLES TAB */}
                    {activeTab === 'articles' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {profileData.recentPosts.length > 0 ? (
                                <div className="grid gap-6">
                                    {profileData.recentPosts.map(post => (
                                        <div key={post.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                                            <PostCard post={post} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                                    <PenTool className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Articles Yet</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto">
                                        {profileData.displayName} hasn't published any articles to the community feed.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default PublicProfilePage;
