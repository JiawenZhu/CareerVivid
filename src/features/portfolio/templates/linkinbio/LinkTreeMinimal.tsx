import React from 'react';
import { PortfolioTemplateProps } from '../../types/portfolio';
import * as Icons from 'lucide-react';
import { FaWeixin, FaWeibo, FaTiktok } from 'react-icons/fa';
import { nanoid } from 'nanoid';
import { parseTextWithEmojis } from '../../../../utils/emojiParser';

/**
 * LinkTreeMinimal - Clean minimal design for link-in-bio
 * Matches "Minimalist (Tech)" theme from user's screenshot
 */
const LinkTreeMinimal: React.FC<PortfolioTemplateProps> = ({ data, onEdit, onUpdate, isMobileView }) => {
    const theme = data.theme || { darkMode: false, primaryColor: '#2563eb' };
    const isDark = theme.darkMode;
    const linkInBio = data.linkInBio || {
        links: [],
        showSocial: true,
        showEmail: true,
        backgroundColor: isDark ? '#0f1117' : '#ffffff',
        buttonLayout: 'stack'
    } as any;

    // Use hero fields as source of truth to match Editor Sidebar
    const displayName = data.hero?.headline || linkInBio.displayName || 'Your Name';
    const bio = data.about || linkInBio.bio || 'Add a bio to tell your story';
    const profileImage = data.hero?.avatarUrl || linkInBio.profileImage || '';

    // Get Lucide icon component by name or custom SVG
    const getIcon = (iconName?: string) => {
        if (!iconName) return null;

        // Custom Icons for Platforms
        if (iconName === 'Tiktok' || iconName === 'Douyin') {
            return <FaTiktok size={20} />;
        }
        if (iconName === 'Wechat') {
            return <FaWeixin size={20} />;
        }
        if (iconName === 'Weibo') {
            return <FaWeibo size={20} />;
        }

        const IconComponent = (Icons as any)[iconName];
        return IconComponent ? <IconComponent size={20} /> : null;
    };

    // Handle link click for analytics
    const handleLinkClick = (linkId: string, url: string) => {
        // Track click (will implement analytics service later)
        console.log('[Analytics] Link clicked:', linkId);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Get button classes based on variant
    const getButtonClasses = (button: typeof linkInBio.links[0]) => {
        const baseClasses = 'w-full py-4 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-3 group';

        const customStyle = button.style || {};
        const primaryColor = theme.primaryColor || '#2563eb';

        switch (button.variant) {
            case 'primary':
                return `${baseClasses} bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:scale-[1.02] shadow-sm hover:shadow-md`;
            case 'secondary':
                return `${baseClasses} bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700`;
            case 'outline':
                return `${baseClasses} border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900`;
            case 'ghost':
                return `${baseClasses} text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800`;
            case 'custom':
                return baseClasses;
            default:
                return `${baseClasses} bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:scale-[1.02]`;
        }
    };

    const renderButton = (button: typeof linkInBio.links[0]) => {
        if (!button.enabled) return null;

        const buttonClasses = getButtonClasses(button);
        const customStyle = button.variant === 'custom' && button.style ? {
            backgroundColor: button.style.backgroundColor,
            color: button.style.textColor,
            borderColor: button.style.borderColor,
            borderWidth: button.style.borderColor ? '2px' : undefined,
            borderRadius: button.style.borderRadius
        } : undefined;

        // Edit interaction wrapper
        const handleClick = (e: React.MouseEvent) => {
            if (onEdit) {
                e.preventDefault();
                e.stopPropagation();
                onEdit('links'); // Focus Links section
            } else {
                handleLinkClick(button.id, button.url);
            }
        };

        const editClasses = onEdit ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 hover:ring-offset-transparent' : '';

        return (
            <button
                key={button.id}
                onClick={handleClick}
                className={`${buttonClasses} ${editClasses}`}
                style={customStyle}
            >
                {button.icon && (
                    <span className="opacity-80 group-hover:opacity-100 transition-opacity">
                        {getIcon(button.icon)}
                    </span>
                )}
                <span className="flex-1 text-center">{button.label}</span>
                {onEdit ? (
                    <Icons.Edit2 size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                ) : (
                    <Icons.ExternalLink size={16} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                )}
            </button>
        );
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 md:p-8 transition-colors duration-500"
            style={{ backgroundColor: linkInBio.backgroundColor || (isDark ? '#0f1117' : '#ffffff') }}
        >
            <div className="w-full max-w-xl mx-auto">
                {/* Profile Section */}
                <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Avatar */}
                    <div
                        className={`w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-lg transition-transform ${onEdit ? 'cursor-pointer hover:ring-4 hover:ring-indigo-500 hover:scale-105' : ''}`}
                        onClick={() => onEdit?.('hero.avatarUrl')}
                    >
                        {profileImage ? (
                            <img
                                src={profileImage}
                                alt={displayName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl font-bold">
                                {displayName && displayName.length > 0 ? displayName.charAt(0).toUpperCase() : '?'}
                            </div>
                        )}
                    </div>

                    {/* Display Name */}
                    <h1
                        className={`text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 transition-all ${onEdit ? 'cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline decoration-dashed decoration-2 underline-offset-4' : ''}`}
                        onClick={() => onEdit?.('hero.headline')}
                    >
                        {displayName}
                    </h1>

                    {/* Bio */}
                    <p
                        className={`text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-md mx-auto transition-all ${onEdit ? 'cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300 rounded-lg p-2 -m-2 border border-transparent hover:border-indigo-500/20' : ''}`}
                        onClick={() => onEdit?.('about')}
                    >
                        {parseTextWithEmojis(bio)}
                    </p>
                </div>

                {/* Links Section */}
                <div className="flex flex-col gap-3 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    {linkInBio.links
                        .filter(link => link.enabled)
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map(renderButton)}

                    {linkInBio.links.filter(l => l.enabled).length === 0 && onEdit && (
                        <div className="text-center py-12 text-gray-400">
                            <Icons.LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No links yet. Click to add your first link!</p>
                        </div>
                    )}
                </div>

                {/* Social Links */}
                {linkInBio.showSocial && data.socialLinks.length > 0 && (
                    <div className="flex items-center justify-center gap-4 mb-6 animate-in fade-in duration-700 delay-200">
                        {data.socialLinks.slice(0, 6).map(social => {
                            // Map common social platforms to icons
                            const getSocialIcon = (label?: string) => {
                                const lower = (label || '').toLowerCase();
                                if (lower.includes('github')) return <Icons.Github size={20} />;
                                if (lower.includes('twitter') || lower.includes('x.com')) return <Icons.Twitter size={20} />;
                                if (lower.includes('linkedin')) return <Icons.Linkedin size={20} />;
                                if (lower.includes('instagram')) return <Icons.Instagram size={20} />;
                                if (lower.includes('youtube')) return <Icons.Youtube size={20} />;
                                if (lower.includes('facebook')) return <Icons.Facebook size={20} />;
                                return <Icons.ExternalLink size={20} />;
                            };

                            return (
                                <a
                                    key={social.id || nanoid()}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900 transition-all hover:scale-110"
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
                    <div className="text-center animate-in fade-in duration-700 delay-300">
                        <a
                            href={`mailto:${data.contactEmail}`}
                            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <Icons.Mail size={16} />
                            {data.contactEmail}
                        </a>
                    </div>
                )}

                {/* Branding footer */}
                {!linkInBio.settings?.removeBranding && (
                    <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-xs text-gray-400 dark:text-gray-600">
                            Created with CareerVivid
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LinkTreeMinimal;
