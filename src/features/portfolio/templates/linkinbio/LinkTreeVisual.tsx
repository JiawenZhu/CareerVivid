import React, { useEffect, useState } from 'react';
import { PortfolioTemplateProps } from '../../types/portfolio';
import * as Icons from 'lucide-react';
import { getTheme } from '../../styles/linktreeThemes';
import { nanoid } from 'nanoid';
import { parseTextWithEmojis } from '../../../../utils/emojiParser';
import SocialLinkWrapper from '../../components/SocialLinkWrapper';
import { usePortfolioAdminAccess } from '../../hooks/usePortfolioAdminAccess';
import AlertModal from '../../../../components/AlertModal';
import MessageModal from '../../components/MessageModal';
import CosmicInvaders from '../../components/games/CosmicInvaders';
import CyberPong from '../../components/games/CyberPong';
import BrutalSnake from '../../components/games/BrutalSnake';
import ZenStacker from '../../components/games/ZenStacker';
import { downloadResume } from '../../utils/resumeDownload';
import { ProductShowcase } from '../../../commerce/components/ProductShowcase';
import BackgroundEffects from '../../components/effects/BackgroundEffects';
import { getAvatarShapeClasses, getAvatarPositionClasses } from '../../utils/avatar';
import {
    AnimatedLinkButton,
    SantaHatDecoration,
    getGoogleFontUrl,
    getLinkIcon,
    getShapeStyle,
    useTypewriter,
} from './LinkTreeVisualParts';

const LinkTreeVisual: React.FC<PortfolioTemplateProps> = ({ data, onEdit }) => {
    const linkInBio = data.linkInBio || {
        links: [],
        showSocial: true,
        showEmail: true,
        displayName: 'Your Name',
        bio: 'Add a bio to tell your story',
        profileImage: '',
        themeId: 'sunset_surf',
        buttonLayout: 'stack'
};

    const [isDownloading, setIsDownloading] = useState(false);
    const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' });
    const [messageModalOpen, setMessageModalOpen] = useState(false);

    // Admin Access Hook
    const { longPressProps } = usePortfolioAdminAccess({ data, onEdit });

    // isPublicView check is now handled inside the hook, but we need onEdit for other things.
    // The hook provides longPressProps which handles the interaction.

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

    // Use hero fields as source of truth to match Editor Sidebar
    const displayName = data.hero?.headline || linkInBio.displayName || 'Your Name';
    const bio = data.about || linkInBio.bio || 'Add a bio to tell your story';
    const profileImage = data.hero?.avatarUrl || linkInBio.profileImage || '';

    // Get the current theme and merge with user customization
    const baseTheme = getTheme(linkInBio.themeId);
    const theme = {
        ...baseTheme,
        effects: {
            ...baseTheme.effects,
            ...linkInBio.customStyle?.effects,
            // Support legacy snow toggle
            particles: baseTheme.effects?.particles || linkInBio.customStyle?.effects?.particles || linkInBio.customStyle?.enableSnow
        }

    };

    const displayTitle = useTypewriter(displayName, 100, theme.effects?.typewriter);

    // Font Loading
    useEffect(() => {
        const fontUrl = getGoogleFontUrl(theme, linkInBio.customStyle?.fontFamily, linkInBio.customStyle?.profileFontFamily);
        if (fontUrl) {
            const link = document.createElement('link');
            link.href = fontUrl;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            return () => {
                document.head.removeChild(link);

            };

        }
    }, [theme.id, linkInBio.customStyle?.fontFamily, linkInBio.customStyle?.profileFontFamily]);

    // Construct dynamic styles
    const backgroundStyle = (): React.CSSProperties => {
        // 1. Custom Override (Highest Priority)
        const override = linkInBio.customStyle?.backgroundOverride;
        if (override) {
            // Check if it looks like a URL
            if (override.startsWith('http') || override.startsWith('url(') || override.startsWith('/')) {
                const urlValue = override.startsWith('url(') ? override : `url("${override}")`;
                return {
                    backgroundImage: urlValue,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed',

                };

            }
            // Otherwise treat as CSS color/gradient
            return { background: override };

        }

        // 2. Theme Defaults
        if (theme.backgroundConfig?.type === 'image') {
            return {
                backgroundImage: theme.backgroundConfig.value,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',

            };

        }
        if (theme.backgroundConfig?.type === 'gradient') {
            return { background: theme.backgroundConfig.value };

        }
        return { background: theme.colors.background };

    };

    const containerStyle: React.CSSProperties = {
        ...backgroundStyle(),
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
        minHeight: '100vh',

    };

    const buttonStyle = (variant: string): React.CSSProperties => {
        // Resolve Shape Overrides
        let borderRadius = theme.buttons.radius === 'full' ? '9999px' :
            theme.buttons.radius === 'xl' ? '24px' :
                theme.buttons.radius === 'lg' ? '12px' :
                    theme.buttons.radius === 'md' ? '8px' :
                        theme.buttons.radius === 'sm' ? '4px' : '0px';

        if (linkInBio.customStyle?.buttonShape) {
            switch (linkInBio.customStyle.buttonShape) {
                case 'pill': borderRadius = '9999px'; break;
                case 'rounded': borderRadius = '12px'; break;
                case 'sharp': borderRadius = '0px'; break;
            }
        }

        const baseStyle: React.CSSProperties = {
            borderRadius,
            fontFamily: linkInBio.customStyle?.fontFamily || theme.buttons.fontFamily || theme.fonts.body,
            boxShadow: theme.buttons.shadow || 'none',
            border: theme.buttons.border || 'none',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            ...getShapeStyle(theme.buttons.customShape),

        };

        const textColor = linkInBio.customStyle?.buttonTextColor || theme.colors.buttonText || theme.colors.text;
        const bgColor = linkInBio.customStyle?.buttonColor;

        // Custom Overrides (Style prop on link would go here if fully implemented)

        // 1. Outline Variant
        if (variant === 'outline') {
            return {
                ...baseStyle,
                background: 'transparent',
                border: `2px solid ${textColor}`,
                color: textColor,
                boxShadow: 'none',

            };

        }

        // 2. Ghost Variant
        if (variant === 'ghost') {
            return {
                ...baseStyle,
                background: 'transparent',
                border: 'none',
                color: textColor,
                boxShadow: 'none',

            };

        }

        // 3. Secondary Variant (Muted/Alternative)
        if (variant === 'secondary') {
            const isGradient = (c?: string) => c && (c.includes('gradient') || c.includes('url'));
            // Heuristic: If using default subtext bg, use main background for text (often inverted) 
            // unless main background is complex (gradient/image)
            const adaptiveColor = (!bgColor && !isGradient(theme.colors.background))
                ? theme.colors.background
                : textColor;

            return {
                ...baseStyle,
                background: bgColor || theme.colors.subtext,
                color: adaptiveColor,
                border: 'none',

            };

        }

        // 4. Primary / Theme Default (Solid, Hard Shadow, Glass, etc)
        // Handled by theme configuration primarily

        if (theme.buttons.style === 'glass') {
            return {
                ...baseStyle,
                background: bgColor || 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(12px)',
                border: theme.buttons.border || '1px solid rgba(255, 255, 255, 0.2)',
                color: textColor,

            };

        }

        if (theme.buttons.style === 'hard-shadow') {
            return {
                ...baseStyle,
                background: bgColor || theme.colors.cardBg || theme.colors.accent,
                color: textColor,
                boxShadow: theme.buttons.shadow || '4px 4px 0px rgba(0,0,0,1)',
                border: theme.buttons.border || '2px solid black',

            };

        }

        // Default Solid
        return {
            ...baseStyle,
            background: bgColor || theme.colors.cardBg || theme.colors.accent || '#ffffff',
            color: textColor,

        };

    };

    const getAvatarSizeClass = () => {
        const size = data.hero?.avatarSize || 'md';
        switch (size) {
            case 'sm': return 'w-20 h-20';
            case 'lg': return 'w-36 h-36';
            case 'xl': return 'w-48 h-48';
            default: return 'w-28 h-28';
        }
    };
    const avatarSizeClass = getAvatarSizeClass();

    return (
        <div style={containerStyle} className="relative w-full min-h-screen transition-all duration-500 ease-in-out scroll-smooth">
            {/* Overlay for readability if image background */}
            {theme.backgroundConfig?.overlay && (
                <div className="absolute inset-0 pointer-events-none" style={{ background: theme.backgroundConfig.overlay }} />
            )}

            {/* Centralized Background Effects */}
            <BackgroundEffects theme={theme} />

            {theme.id === 'game_invaders' && <CosmicInvaders />}
            {theme.id === 'game_pong' && <CyberPong />}
            {theme.id === 'game_snake' && <BrutalSnake />}
            {theme.id === 'game_stacker' && <ZenStacker />}

            <div className="relative z-20 max-w-md mx-auto min-h-screen px-6 py-16 flex flex-col">
                {/* Profile Section */}
                <div className={`flex flex-col mb-12 ${theme.layout?.profileAlign === 'left' ? 'items-start text-left' : 'items-center text-center'}`}>
                    {/* Avatar */}
                    {profileImage && (
                        <div
                            className={`${avatarSizeClass} ${getAvatarShapeClasses(data.hero?.avatarShape)} ${getAvatarPositionClasses(data.hero?.avatarPosition)} mb-6 overflow-hidden shadow-2xl transition-transform duration-700 ${theme.effects?.spinAvatar ? 'hover:rotate-[360deg]' : ''} ${onEdit ? 'cursor-pointer hover:scale-105' : ''}`}
                            style={{
                                border: `4px solid ${theme.colors.cardBg || 'rgba(255,255,255,0.3)'}`,
                                boxShadow: theme.id === 'neon_nights' ? '0 0 20px rgba(255,0,255,0.5)' : undefined
                            }}
                            // If editing, use standard click. If public, use long press props.
                            {...(onEdit
                                ? { onClick: () => onEdit('hero.avatarUrl') }
                                : longPressProps)}
                        >
                            <div className="relative w-full h-full">
                                <img
                                    src={profileImage}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                />
                                {theme.avatarDecoration === 'christmas-hat' && (
                                    <SantaHatDecoration className="absolute -top-[35%] -left-[15%] w-[130%] pointer-events-none rotate-[-10deg] z-50 filter drop-shadow-lg" />
                                )}
                            </div>
                        </div>
                    )}

                    {!profileImage && (
                        <div
                            className={`w-28 h-28 mb-6 ${getAvatarShapeClasses(data.hero?.avatarShape)} ${getAvatarPositionClasses(data.hero?.avatarPosition)} flex items-center justify-center text-5xl font-bold shadow-xl transition-transform duration-700 ${theme.effects?.spinAvatar ? 'hover:rotate-[360deg]' : ''} ${onEdit ? 'cursor-pointer' : ''}`}
                            style={{
                                background: theme.colors.accent,
                                color: '#ffffff',
                                border: `4px solid ${theme.colors.cardBg || 'rgba(255,255,255,0.3)'}`
                            }}
                            {...(onEdit
                                ? { onClick: () => onEdit('hero.avatarUrl') }
                                : longPressProps)}
                        >
                            <div className="relative w-full h-full flex items-center justify-center">
                                {displayName.charAt(0).toUpperCase()}
                                {theme.avatarDecoration === 'christmas-hat' && (
                                    <SantaHatDecoration className="absolute -top-[55%] -left-[30%] w-[160%] pointer-events-none rotate-[-15deg] z-50 filter drop-shadow-lg" />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Name & Bio */}
                    <div className="min-h-[40px]">
                        <h1
                            className={`text-2xl md:text-3xl font-bold mb-3 transition-opacity tracking-tight ${onEdit ? 'cursor-pointer hover:opacity-80' : ''}`}
                            style={{
                                fontFamily: linkInBio.customStyle?.profileFontFamily || theme.fonts.heading,
                                color: linkInBio.customStyle?.profileTitleColor || linkInBio.customStyle?.profileTextColor || theme.colors.text,
                                textShadow: theme.id === 'neon_nights' ? '0 0 10px rgba(255,255,255,0.5)' : undefined
                            }}
                            onClick={() => onEdit?.('hero.headline')}
                        >
                            {displayTitle}
                            {theme.effects?.typewriter && <span className="animate-pulse">|</span>}
                        </h1>
                    </div>
                    <p
                        className={`text-base md:text-lg max-w-[85%] leading-relaxed transition-opacity ${onEdit ? 'cursor-pointer hover:opacity-80' : ''}`}
                        style={{
                            fontFamily: linkInBio.customStyle?.profileFontFamily || theme.fonts.body,
                            color: linkInBio.customStyle?.profileTextColor || theme.colors.subtext
                        }}
                        onClick={() => onEdit?.('about')}
                    >
                        {parseTextWithEmojis(bio)}
                    </p>
                </div>

                {/* Links Stack */}
                <div className={`flex flex-col w-full flex-grow ${theme.layout?.buttonSpacing === 'loose' ? 'gap-6' : theme.layout?.buttonSpacing === 'tight' ? 'gap-3' : 'gap-4'}`}>
                    {linkInBio.links.filter(l => l.enabled).length > 0 ? (
                        linkInBio.links.filter(l => l.enabled).map(link => {
                            // Link-specific overrides to prevent navigation issues
                            const effectiveLink = link.icon === 'Mail' ? { ...link, url: '#' } : link;

                            return (
                                <AnimatedLinkButton
                                    key={link.id}
                                    link={effectiveLink}
                                    theme={theme}
                                    buttonStyle={buttonStyle}
                                    customStyle={linkInBio.customStyle}
                                    LinkWrapper={SocialLinkWrapper}
                                    getIcon={getLinkIcon}
                                    onLinkClick={(linkItem: any, e: any) => {
                                        if (linkItem.icon === 'FileText' && data.attachedResumeId) {
                                            handleResumeDownload();
                                            return true; // Signal to prevent default
                                        }
                                        console.log('Link Click:', linkItem);
                                        if (linkItem.icon === 'Mail') {
                                            // window.location.href = `mailto:${linkItem.url}`;
                                            setMessageModalOpen(true);
                                            return true;
                                        }
                                        return false;
                                    }}
                                />
                            );
                        })
                    ) : (
                        // Empty State
                        onEdit && (
                            <div className="text-center py-12 opacity-60 border-2 border-dashed rounded-2xl px-6"
                                style={{ borderColor: theme.colors.subtext }}>
                                <Icons.LinkIcon className="w-10 h-10 mx-auto mb-3" />
                                <p className="text-base font-medium">Add your first link in the editor!</p>
                            </div>
                        )
                    )}
                </div>

                {/* Commerce / Store Section */}
                {linkInBio.enableStore && (
                    <div className="mt-8 mb-8 w-full">
                        <ProductShowcase
                            userId={data.userId}
                            theme={theme.buttons.style === 'glass' ? 'glass' : (theme.id === 'minimal_mono' ? 'light' : 'glass')}
                        />
                    </div>
                )}

                {/* Social Icons (Footer) */}
                {
                    linkInBio.showSocial && (data.socialLinks || []).length > 0 && (
                        <div className="flex flex-wrap justify-center gap-6 mt-16 mb-8">
                            {(data.socialLinks || []).slice(0, 6).map(social => {
                                const getSocialIcon = (label?: string) => {
                                    const lower = (label || '').toLowerCase();
                                    if (lower.includes('github')) return <Icons.Github size={24} />;
                                    if (lower.includes('twitter')) return <Icons.Twitter size={24} />;
                                    if (lower.includes('linkedin')) return <Icons.Linkedin size={24} />;
                                    if (lower.includes('instagram')) return <Icons.Instagram size={24} />;
                                    if (lower.includes('youtube')) return <Icons.Youtube size={24} />;
                                    return <Icons.Globe size={24} />;

                                };

                                return (
                                    <SocialLinkWrapper
                                        key={social.id || nanoid()}
                                        url={social.url}
                                        type={social.label}
                                        className="transition-transform hover:scale-110 hover:-translate-y-1 p-2 rounded-full"
                                    >
                                        <div
                                            style={{
                                                color: theme.colors.text,
                                                backgroundColor: theme.id === 'neon_nights' ? 'rgba(255,255,255,0.1)' : 'transparent'
                                            }}
                                            className="p-2 rounded-full"
                                        >
                                            {getSocialIcon(social.label)}
                                        </div>
                                    </SocialLinkWrapper>
                                );
                            })}
                        </div>
                    )
                }

                {/* Branding footer */}
                {
                    !linkInBio.settings?.removeBranding && (
                        <div className="text-center mt-auto pt-8 opacity-40 text-[10px] font-bold uppercase tracking-[0.2em]"
                            style={{ color: theme.colors.subtext }}>
                            Created with CareerVivid
                        </div>
                    )
                }
            </div>

            {/* Modals */}
            <MessageModal
                isOpen={messageModalOpen}
                onClose={() => setMessageModalOpen(false)}
                ownerId={data.userId}
                ownerName={displayName}
                portfolioId={data.id}
            />

            <AlertModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                title={errorModal.title}
                message={errorModal.message}
            />
</div >
    );

};

export default LinkTreeVisual;
