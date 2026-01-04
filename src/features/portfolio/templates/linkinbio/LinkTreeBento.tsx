import React from 'react';
import { PortfolioTemplateProps } from '../../types/portfolio';
import AlertModal from '../../../../components/AlertModal';
import * as Icons from 'lucide-react';
import { nanoid } from 'nanoid';
import { downloadResume } from '../../utils/resumeDownload';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import MessageModal from '../../components/MessageModal';
import { usePortfolioAdminAccess } from '../../hooks/usePortfolioAdminAccess';

/**
 * LinkTreeBento - Bento grid style for link-in-bio
 * Matches "Bento Grid (Personal)" theme from user's screenshot
 * Features: card-based layout, mixed sizes, personality-driven
 */
const LinkTreeBento: React.FC<PortfolioTemplateProps> = ({ data, onEdit, onUpdate, isMobileView }) => {
    const theme = data.theme || { darkMode: false, primaryColor: '#f59e0b' };
    const isDark = theme.darkMode;

    // Admin Access Hook
    const { longPressProps, AdminAccessModal } = usePortfolioAdminAccess({ data, onEdit });

    const linkInBio = data.linkInBio || {
        links: [],
        showSocial: true,
        showEmail: true,
        backgroundColor: isDark ? '#0a0a0a' : '#fafaf9',
        buttonLayout: 'grid'
    } as any;

    const [isDownloading, setIsDownloading] = useState(false);
    const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' });
    const [messageModalOpen, setMessageModalOpen] = useState(false);

    // Use hero fields as source of truth to match Editor Sidebar
    const displayName = data.hero?.headline || linkInBio.displayName || 'Your Name';
    const bio = data.about || linkInBio.bio || 'Living life one link at a time';
    const profileImage = data.hero?.avatarUrl || linkInBio.profileImage || '';

    const getIcon = (iconName?: string) => {
        if (!iconName) return null;
        const IconComponent = (Icons as any)[iconName];
        return IconComponent ? <IconComponent size={24} /> : null;
    };

    const handleLinkClick = (linkId: string, url: string, icon?: string) => {
        if (icon === 'FileText') {
            handleResumeDownload();
            return;
        }

        if (icon === 'Mail') {
            setMessageModalOpen(true);
            return;
        }

        console.log('[Analytics] Link clicked:', linkId);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleResumeDownload = async () => {
        if (!data.attachedResumeId || isDownloading) return;

        downloadResume({
            userId: data.userId,
            resumeId: data.attachedResumeId,
            title: displayName ? `${displayName}_Resume` : 'Resume',
            onStart: () => setIsDownloading(true),
            onComplete: () => setIsDownloading(false),
            onError: (err) => {
                console.error(err);
                setIsDownloading(false);
                setErrorModal({
                    isOpen: true,
                    title: 'Download Failed',
                    message: 'Failed to download resume. Please try again or check your connection.'
                });
            }
        });
    };

    // Color palette for different cards
    const cardColors = [
        'from-rose-400 to-pink-600',
        'from-blue-400 to-cyan-600',
        'from-amber-400 to-orange-600',
        'from-green-400 to-emerald-600',
        'from-purple-400 to-indigo-600',
        'from-teal-400 to-blue-600'
    ];

    const renderGridButton = (button: typeof linkInBio.links[0], index: number) => {
        if (!button.enabled) return null;

        const colorGradient = cardColors[index % cardColors.length];
        const isLarge = index % 5 === 0; // Every 5th item is larger

        // Edit interaction wrapper
        const handleClick = (e: React.MouseEvent) => {
            if (onEdit) {
                e.preventDefault();
                e.stopPropagation();
                onEdit('links'); // Focus Links section
            } else {
                handleLinkClick(button.id, button.url, button.icon);
            }
        };

        const editClasses = onEdit ? 'cursor-pointer hover:ring-2 hover:ring-white hover:ring-offset-2 hover:ring-offset-transparent' : '';

        return (
            <button
                key={button.id}
                onClick={handleClick}
                className={`
                    group relative overflow-hidden rounded-3xl
                    bg-gradient-to-br ${colorGradient}
                    hover:scale-[1.02] hover:shadow-2xl
                    transition-all duration-300
                    ${isLarge ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'}
                    ${isMobileView ? 'min-h-[140px]' : 'min-h-[120px]'}
                    ${editClasses}
                `}
            >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }} />
                </div>

                {/* Content */}
                <div className="relative z-10 h-full p-5 flex flex-col justify-between text-white">
                    <div className="flex items-start justify-between">
                        {button.icon && (
                            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                                {getIcon(button.icon)}
                            </div>
                        )}
                        {onEdit ? (
                            <Icons.Edit2 size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <Icons.ArrowUpRight
                                size={20}
                                className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                            />
                        )}
                    </div>

                    <div>
                        <h3 className={`font-bold ${isLarge ? 'text-2xl' : 'text-lg'} leading-tight`}>
                            {button.label}
                        </h3>
                        {button.thumbnail && isLarge && (
                            <div className="mt-3 rounded-lg overflow-hidden">
                                <img
                                    src={button.thumbnail}
                                    alt={button.label}
                                    className="w-full h-24 object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Hover shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
            </button>
        );
    };

    return (
        <div
            className="min-h-screen p-4 md:p-8 transition-colors duration-500"
            style={{
                backgroundColor: linkInBio.backgroundColor || (isDark ? '#0a0a0a' : '#fafaf9')
            }
            }
        >
            <div className="w-full max-w-5xl mx-auto">
                {/* Profile Header - Bento Style */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Avatar Card */}
                    <div
                        className={`bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 flex items-center justify-center transition-transform shadow-xl ${onEdit ? 'cursor-pointer hover:scale-[1.02] hover:ring-4 hover:ring-purple-500/50' : ''}`}
                        {...(onEdit ? { onClick: () => onEdit('hero.avatarUrl') } : longPressProps)}
                    >
                        <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white/30 shadow-2xl">
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/20 backdrop-blur-md text-white text-5xl font-bold">
                                    {displayName && displayName.length > 0 ? displayName.charAt(0).toUpperCase() : '?'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                        <h1
                            className={`text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 transition-colors ${onEdit ? 'cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 hover:underline decoration-dashed decoration-2' : ''}`}
                            onClick={() => onEdit?.('hero.headline')}
                        >
                            {displayName}
                        </h1>

                        <p
                            className={`text-gray-600 dark:text-gray-400 text-lg transition-colors ${onEdit ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl p-2 -m-2 border border-transparent hover:border-gray-200 dark:hover:border-gray-700' : ''}`}
                            onClick={() => onEdit?.('about')}
                        >
                            {bio}
                        </p>
                    </div>
                </div>

                {/* Links Grid */}
                <div
                    className={`
                        grid gap-4 mb-6
                        animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100
                        ${isMobileView ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}
                        auto-rows-fr
                    `}
                >
                    {linkInBio.links
                        .filter((link: any) => link.enabled)
                        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                        .map((link: any, index: any) => renderGridButton(link, index))}

                    {linkInBio.links.filter((l: any) => l.enabled).length === 0 && !data.attachedResumeId && onEdit && (
                        <div
                            className="col-span-2 md:col-span-4 text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group"
                            onClick={() => onEdit('links')}
                        >
                            <Icons.LayoutGrid className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700 group-hover:text-purple-500" />
                            <p className="text-lg font-semibold text-gray-500 dark:text-gray-500 group-hover:text-purple-600">Your bento grid awaits</p>
                            <p className="text-sm text-gray-400 dark:text-gray-600 mt-2">Add colorful links to fill your space</p>
                        </div>
                    )}
                </div>

                {/* Footer Card */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 animate-in fade-in duration-700 delay-200">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Social Links */}
                        {linkInBio.showSocial && data.socialLinks.length > 0 && (
                            <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                                {data.socialLinks.slice(0, 6).map(social => {
                                    const getSocialIcon = (label?: string) => {
                                        const lower = (label || '').toLowerCase();
                                        if (lower.includes('github')) return <Icons.Github size={20} />;
                                        if (lower.includes('twitter')) return <Icons.Twitter size={20} />;
                                        if (lower.includes('linkedin')) return <Icons.Linkedin size={20} />;
                                        if (lower.includes('instagram')) return <Icons.Instagram size={20} />;
                                        if (lower.includes('youtube')) return <Icons.Youtube size={20} />;
                                        return <Icons.Globe size={20} />;
                                    };

                                    return (
                                        <a
                                            key={social.id || nanoid()}
                                            href={social.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all hover:scale-110 shadow-sm"
                                            title={social.label}
                                        >
                                            {getSocialIcon(social.label)}
                                        </a>
                                    );
                                })}
                            </div>
                        )}

                        {/* Email Contact */}
                        {linkInBio.showEmail && data.contactEmail && (
                            <a
                                href={`mailto:${data.contactEmail}`}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all"
                            >
                                <Icons.Mail size={18} />
                                Get in touch
                            </a>
                        )}
                    </div>

                    <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-xs text-gray-400 dark:text-gray-600">
                            🎨 Made with CareerVivid
                        </p>
                    </div>
                </div>
            </div>

            <MessageModal
                isOpen={messageModalOpen}
                onClose={() => setMessageModalOpen(false)}
                ownerId={data.userId}
                ownerName={displayName}
                portfolioId={data.id}
            />
        </div >
    );
};

export default LinkTreeBento;
