import React from 'react';
import { PortfolioTemplateProps } from '../../types/portfolio';
import QuickAuthModal from '../../../../components/QuickAuthModal';
import AlertModal from '../../../../components/AlertModal';
import MessageModal from '../../components/MessageModal';
import * as Icons from 'lucide-react';
import { nanoid } from 'nanoid';
import { downloadResume } from '../../utils/resumeDownload';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { usePortfolioAdminAccess } from '../../hooks/usePortfolioAdminAccess';

/**
 * LinkTreeCorporate - Professional, formal design for link-in-bio
 * Matches "Corporate (Pro)" theme from user's screenshot
 * Features: formal typography, subtle animations, business aesthetics
 */
const LinkTreeCorporate: React.FC<PortfolioTemplateProps> = ({ data, onEdit, onUpdate, isMobileView }) => {
    const theme = data.theme || { darkMode: false, primaryColor: '#1e40af' };
    const isDark = theme.darkMode;
    const primaryColor = theme.primaryColor || '#1e40af';

    // Admin Access Hook
    const { longPressProps, AdminAccessModal } = usePortfolioAdminAccess({ data, onEdit });

    const linkInBio = data.linkInBio || {
        links: [],
        showSocial: true,
        showEmail: true,
        backgroundColor: isDark ? '#0f1117' : '#f8fafc',
        buttonLayout: 'stack'
    } as any;

    const [isDownloading, setIsDownloading] = useState(false);
    const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' });
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [messageModalOpen, setMessageModalOpen] = useState(false);

    const { currentUser } = useAuth();

    // Use hero fields as source of truth to match Editor Sidebar
    const displayName = data.hero?.headline || linkInBio.displayName || 'Executive Name';
    const bio = data.about || linkInBio.bio || 'Professional Bio';
    const profileImage = data.hero?.avatarUrl || linkInBio.profileImage || '';

    const getIcon = (iconName?: string) => {
        if (!iconName) return null;
        const IconComponent = (Icons as any)[iconName];
        return IconComponent ? <IconComponent size={18} strokeWidth={2.5} /> : null;
    };

    const handleLinkClick = (link: typeof linkInBio.links[0]) => {
        if (link.icon === 'FileText') {
            handleResumeDownload();
            return;
        }

        if (link.icon === 'Mail') {
            setMessageModalOpen(true);
            return;
        }

        console.log('[Analytics] Link clicked:', link.id);
        window.open(link.url, '_blank', 'noopener,noreferrer');
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

    const renderButton = (button: typeof linkInBio.links[0]) => {
        if (!button.enabled) return null;

        // Edit interaction wrapper
        const handleClick = (e: React.MouseEvent) => {
            if (onEdit) {
                e.preventDefault();
                e.stopPropagation();
                onEdit('links'); // Focus Links section
            } else {
                handleLinkClick(button);
            }
        };

        return (
            <button
                key={button.id}
                onClick={handleClick}
                className={`
                    group relative w-full px-6 py-4 
                    bg-white dark:bg-gray-900 
                    border-2 border-gray-200 dark:border-gray-800 
                    rounded-lg font-semibold text-gray-900 dark:text-white
                    transition-all duration-200
                    hover:border-blue-600 dark:hover:border-blue-500
                    hover:shadow-lg
                    flex items-center justify-between
                    ${onEdit ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-2' : ''}
                `}
                style={{
                    borderColor: button.variant === 'primary' ? primaryColor : undefined,
                    backgroundColor: button.variant === 'primary' ? `${primaryColor}10` : undefined
                }}
            >
                <div className="flex items-center gap-3">
                    {button.icon && (
                        <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center
                            ${button.variant === 'primary'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }
                        `}>
                            {getIcon(button.icon)}
                        </div>
                    )}
                    <span className="text-left font-medium">{button.label}</span>
                </div>

                {onEdit ? (
                    <Icons.Edit2
                        size={18}
                        className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                    />
                ) : (
                    <Icons.ChevronRight
                        size={20}
                        className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all"
                    />
                )}
            </button>
        );
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 md:p-8 transition-colors duration-500"
            style={{ backgroundColor: linkInBio.backgroundColor || (isDark ? '#0f1117' : '#f8fafc') }}
        >
            <div className="w-full max-w-2xl mx-auto">
                {/* Header Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 md:p-12 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div
                            className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg transition-shadow ${onEdit ? 'cursor-pointer hover:shadow-xl hover:ring-4 hover:ring-blue-500/30' : ''}`}
                            {...(onEdit ? { onClick: () => onEdit('hero.avatarUrl') } : longPressProps)}
                        >
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                                    {displayName && displayName.length > 0 ? displayName.charAt(0).toUpperCase() : '?'}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1
                                className={`text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors ${onEdit ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline decoration-dashed decoration-2' : ''}`}
                                onClick={() => onEdit?.('hero.headline')}
                            >
                                {displayName}
                            </h1>

                            <p
                                className={`text-gray-600 dark:text-gray-400 text-base leading-relaxed transition-colors ${onEdit ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg p-2 -m-2 border border-transparent hover:border-blue-200 dark:hover:border-blue-800' : ''}`}
                                onClick={() => onEdit?.('about')}
                            >
                                {bio}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Links Section */}
                <div className="flex flex-col gap-3 mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    {linkInBio.links
                        .filter((link: any) => link.enabled)
                        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                        .map(renderButton)}

                    {linkInBio.links.filter((l: any) => l.enabled).length === 0 && !data.attachedResumeId && onEdit && (
                        <div
                            className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                            onClick={() => onEdit('links')}
                        >
                            <Icons.Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700 group-hover:text-blue-500" />
                            <p className="text-sm text-gray-500 dark:text-gray-500 font-medium group-hover:text-blue-600">No links added yet</p>
                            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Add professional links to your profile</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 mb-6 animate-in fade-in duration-700 delay-200">
                {/* Social Links */}
                {linkInBio.showSocial && data.socialLinks.length > 0 && (
                    <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-4">Connect</h3>
                        <div className="flex flex-wrap gap-2">
                            {data.socialLinks.slice(0, 6).map(social => {
                                const getSocialIcon = (label?: string) => {
                                    const lower = (label || '').toLowerCase();
                                    if (lower.includes('github')) return <Icons.Github size={18} />;
                                    if (lower.includes('twitter')) return <Icons.Twitter size={18} />;
                                    if (lower.includes('linkedin')) return <Icons.Linkedin size={18} />;
                                    if (lower.includes('facebook')) return <Icons.Facebook size={18} />;
                                    if (lower.includes('youtube')) return <Icons.Youtube size={18} />;
                                    return <Icons.Globe size={18} />;
                                };

                                return (
                                    <a
                                        key={social.id || nanoid()}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-sm font-medium"
                                        title={social.label}
                                    >
                                        {getSocialIcon(social.label)}
                                        <span>{social.label}</span>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Email Contact */}
                {linkInBio.showEmail && data.contactEmail && (
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-3">Email</h3>
                        <a
                            href={`mailto:${data.contactEmail}`}
                            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                        >
                            <Icons.Mail size={18} />
                            {data.contactEmail}
                        </a>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="text-center">
                <p className="text-xs text-gray-400 dark:text-gray-600">
                    Powered by CareerVivid
                </p>
            </div>

            <MessageModal
                isOpen={messageModalOpen}
                onClose={() => setMessageModalOpen(false)}
                ownerId={data.userId}
                ownerName={displayName}
                portfolioId={data.id}
            />

            <AdminAccessModal />
        </div>

    );
};

export default LinkTreeCorporate;
