
import React, { useEffect } from 'react';
import { PortfolioTemplateProps } from '../../types/portfolio';
import * as Icons from 'lucide-react';
import { FaWeixin, FaWeibo, FaTiktok } from 'react-icons/fa';
import { getTheme, LinkTreeTheme } from '../../styles/linktreeThemes';
import { nanoid } from 'nanoid';
import { parseTextWithEmojis } from '../../../../utils/emojiParser';
import SocialLinkWrapper from '../../components/SocialLinkWrapper';
import useLongPress from '../../../../hooks/useLongPress';
import { useAuth } from '../../../../contexts/AuthContext';
import { navigate } from '../../../../App';
import { usePortfolioAdminAccess } from '../../hooks/usePortfolioAdminAccess';
import QuickAuthModal from '../../../../components/QuickAuthModal';
import AlertModal from '../../../../components/AlertModal';
import MessageModal from '../../components/MessageModal';
import confetti from 'canvas-confetti';
import CosmicInvaders from '../../components/games/CosmicInvaders';
import CyberPong from '../../components/games/CyberPong';
import BrutalSnake from '../../components/games/BrutalSnake';
import ZenStacker from '../../components/games/ZenStacker';
import { downloadResume } from '../../utils/resumeDownload';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { ProductShowcase } from '../../../commerce/components/ProductShowcase';

// --- Animation Helpers ---

const useTypewriter = (text: string, speed = 100, enabled = false) => {
    const [displayText, setDisplayText] = React.useState('');

    useEffect(() => {
        if (!enabled) {
            setDisplayText(text);
            return;
        }

        let i = 0;
        setDisplayText('');

        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayText(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed, enabled]);

    return displayText;

};

const MatrixRain: React.FC = () => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%';
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops: number[] = [];

        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#0F0';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = letters.charAt(Math.floor(Math.random() * letters.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }

        };

        const interval = setInterval(draw, 33);
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

        };

        window.addEventListener('resize', handleResize);
        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);

        };

    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0 opacity-20"
        />
    );
};

// Tilt Hook
const useTilt = (active: boolean) => {
    const ref = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!active || !ref.current) return;

        const el = ref.current;
        const handleMove = (e: MouseEvent) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg
            const rotateY = ((x - centerX) / centerX) * 10;

            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;

        };

        const handleLeave = () => {
            el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';

        };

        el.addEventListener('mousemove', handleMove);
        el.addEventListener('mouseleave', handleLeave);

        return () => {
            el.removeEventListener('mousemove', handleMove);
            el.removeEventListener('mouseleave', handleLeave);

        };

    }, [active]);

    return ref;

};

// Helper to get Google Font URL
const getGoogleFontUrl = (theme: LinkTreeTheme, customFont?: string, profileFont?: string) => {
    const fonts = [customFont, profileFont, theme.fonts.heading, theme.fonts.body].filter(Boolean) as string[];
    const uniqueFonts = [...new Set(fonts.map(f => f.split(',')[0].replace(/['"]/g, '').trim()))];
    if (uniqueFonts.length === 0) return null;
    return `https://fonts.googleapis.com/css2?family=${uniqueFonts.map(f => f.replace(/ /g, '+')).join('&family=')}:wght@400;600;700&display=swap`;

};

// Helper for Custom Shapes
const getShapeStyle = (shape?: string): React.CSSProperties => {
    if (!shape) return {};

    if (shape === 'torn-paper') {
        return {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 95%, 2% 96%, 4% 94%, 6% 96%, 8% 94%, 10% 96%, 12% 94%, 14% 96%, 16% 94%, 18% 96%, 20% 94%, 22% 96%, 24% 94%, 26% 96%, 28% 94%, 30% 96%, 32% 94%, 34% 96%, 36% 94%, 38% 96%, 40% 94%, 42% 96%, 44% 94%, 46% 96%, 48% 94%, 50% 96%, 52% 94%, 54% 96%, 56% 94%, 58% 96%, 60% 94%, 62% 96%, 64% 94%, 66% 96%, 68% 94%, 70% 96%, 72% 94%, 74% 96%, 76% 94%, 78% 96%, 80% 94%, 82% 96%, 84% 94%, 86% 96%, 88% 94%, 90% 96%, 92% 94%, 94% 96%, 96% 94%, 98% 96%, 100% 94%, 100% 100%, 0% 100%)',
            // Simple approximation for bottom tear. For full effect usually requires SVG mask or complex polygon.
            // Simplified version for durability:
            // clipPath: 'polygon(0% 10px, 5% 0px, 10% 10px, 15% 0px, 20% 10px, 25% 0px, 30% 10px, 35% 0px, 40% 10px, 45% 0px, 50% 10px, 55% 0px, 60% 10px, 65% 0px, 70% 10px, 75% 0px, 80% 10px, 85% 0px, 90% 10px, 95% 0px, 100% 10px, 100% 100%, 0% 100%)',

        };

    }

    if (shape === 'jagged') {
        return {
            clipPath: 'polygon(0% 0%, 100% 0%, 95% 50%, 100% 100%, 0% 100%, 5% 50%)', // Arrow-ish jagged
            // Changing to simple sawtooth

        };

    }

    // Wavy is hard with just clip-path polygon, usually needs SVG. 
    // We will simulate 'wavy' with border-radius tricks or ignore for pure CSS implementation constraints.
    if (shape === 'wavy') {
        return {
            borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px', // Hand-drawn feel
        }
    }

    return {};
};


// Button Component to handle Hooks per item
const AnimatedLinkButton = ({
    link,
    theme,
    buttonStyle,
    customStyle,
    LinkWrapper,
    getIcon,
    onLinkClick
}: any) => {
    const tiltRef = useTilt(theme.effects?.tilt || false);

    const handleClick = (e: React.MouseEvent) => {
        if (onLinkClick) {
            const shouldPreventDefault = onLinkClick(link, e);
            if (shouldPreventDefault) {
                e.preventDefault();
                return;
            }
        }

        if (theme.effects?.confetti) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

    };

    return (
        <LinkWrapper
            url={link.url}
            type={link.icon}
            className="block w-full"
            onClick={handleClick}
        >
            <div
                ref={tiltRef}
                className={`
                    group relative w-full p-4 md:p-5 flex items-center hover:scale-[1.02] active:scale-[0.98]
                    ${customStyle?.buttonAlignment === 'center' ? 'justify-center' : 'justify-between'}
                `}
                style={buttonStyle(link.variant || 'primary')}
            >
                <div className={`flex items-center gap-4 ${customStyle?.buttonAlignment === 'center' ? 'w-full justify-center' : ''}`}>
                    {link.thumbnail && (
                        <img src={link.thumbnail} alt="" className="w-12 h-12 rounded-md object-cover" />
                    )}
                    {!link.thumbnail && link.icon && (
                        <div className={theme.id === 'air' ? "text-gray-900" : ""}>
                            {getIcon(link.icon)}
                        </div>
                    )}
                    <span className="font-semibold text-lg tracking-wide">{link.label}</span>
                </div>

                {/* Share/Arrow Icon */}
                <div className="opacity-60 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
                    {theme.buttons.customShape === 'torn-paper' ? null :
                        theme.buttons.style === 'glass' || theme.buttons.style === 'outline' ?
                            <Icons.ArrowUpRight size={20} /> :
                            <Icons.ChevronRight size={20} />
                    }
                </div>
            </div>
        </LinkWrapper>
    );

};

const SnowEffect = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {Array.from({ length: 50 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute top-0 text-white animate-fall"
                    style={{
                        left: `${Math.random() * 100}%`,
                        animationDuration: `${Math.random() * 5 + 5}s`,
                        animationDelay: `-${Math.random() * 5}s`,
                        fontSize: `${Math.random() * 10 + 10}px`,
                        opacity: Math.random() * 0.5 + 0.3
                    }}
                >
                    ❄
                </div>
            ))}
            <style>
                {`
                @keyframes fall {
                    0% { transform: translateY(-10vh) translateX(0); }
                    100% { transform: translateY(110vh) translateX(20px); }
                }
                .animate-fall {
                    animation-name: fall;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
                `}
            </style>
        </div>
    );
};

const LinkTreeVisual: React.FC<PortfolioTemplateProps> = ({ data, onEdit, isMobileView }) => {
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

    const { currentUser } = useAuth();

    // Admin Access Hook
    const { longPressProps, AdminAccessModal } = usePortfolioAdminAccess({ data, onEdit });

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
            ...linkInBio.customStyle?.effects
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

    // Helper for icons
    const getIcon = (iconName?: string) => {
        if (!iconName) return null;

        // Custom Icons for Platforms using React Icons
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

    return (
        <div style={containerStyle} className="relative w-full min-h-screen transition-all duration-500 ease-in-out scroll-smooth">
            {/* Overlay for readability if image background */}
            {theme.backgroundConfig?.overlay && (
                <div className="absolute inset-0 pointer-events-none" style={{ background: theme.backgroundConfig.overlay }} />
            )}

            {/* Matrix Rain Effect */}
            {theme.effects?.matrix && <MatrixRain />}

            {/* Background Effects */}
            {theme.effects?.blobs && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] rounded-full bg-purple-500/30 blur-[80px] animate-blob" />
                    <div className="absolute bottom-[20%] left-[10%] w-[250px] h-[250px] rounded-full bg-blue-500/30 blur-[80px] animate-blob animation-delay-2000" />
                </div>
            )}

            {theme.effects?.scanlines && (
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] pointer-events-none z-10 opacity-30" />
            )}

            {theme.effects?.noise && (
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-10" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
            )}

            {theme.id === 'game_invaders' && <CosmicInvaders />}
            {theme.id === 'game_pong' && <CyberPong />}
            {theme.id === 'game_snake' && <BrutalSnake />}
            {theme.id === 'game_stacker' && <ZenStacker />}

            {(theme.effects?.particles || linkInBio.customStyle?.enableSnow) && <SnowEffect />}

            <div className="relative z-20 max-w-md mx-auto min-h-screen px-6 py-16 flex flex-col">
                {/* Profile Section */}
                <div className={`flex flex-col mb-12 ${theme.layout?.profileAlign === 'left' ? 'items-start text-left' : 'items-center text-center'}`}>
                    {/* Avatar */}
                    {profileImage && (
                        <div
                            className={`w-28 h-28 mb-6 overflow-hidden shadow-2xl transition-transform duration-700 ${theme.effects?.spinAvatar ? 'hover:rotate-[360deg]' : ''} ${onEdit ? 'cursor-pointer hover:scale-105' : ''}`}
                            style={{
                                borderRadius: '50%',
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
                                    <div className="absolute -top-[35%] -left-[15%] w-[130%] pointer-events-none rotate-[-10deg] z-50 filter drop-shadow-lg">
                                        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                                            {/* Santa Hat SVG */}
                                            <path d="M116.5 393.1c-19.1-16.7-33.8-38.3-43.2-62.7-18.4-44.1-12.8-95.6 15.6-135 23.4-32.5 59-54 99.4-62.3 35.1-7.2 73.4 3.7 103.7 26.6 23.9 18.1 39.3 45.4 43.6 74.8 2 13.5 1.5 27.6-1.5 40.8-5.3 22.8-16.3 43.8-31.5 61.4-12.4 14.3-27.4 26.4-44.1 35.5-16.1 8.8-33.6 14.7-51.7 17.5-30.1 4.7-61-1.6-88.6-16.2z" fill="#D32F2F" />
                                            <path d="M428.6 376.5c-15.6-11.2-28.7-25-39.7-40.2-22.3-30.8-34.9-68.5-44.1-105.8-9.4-38.3-15.3-77.9-22-116.6-4.9-28.3-10.4-56.5-17.6-84.3-3.6-13.9-8.4-27.4-14.7-40.3-6.5-13.3-15.2-25.2-26.4-34.6-5.8-4.9-12.4-8.8-19.7-11.3s-15.3-3.3-22.9-2.1c-15 2.5-28.3 10.1-39.1 20.8-10.7 10.6-17.7 24.3-19.7 39.3-3.5 16.7 1.8 34.3 12.8 46.8 11.2 12.7 27.2 19.9 44.1 20.2 16.4.3 32.5-6.2 44.2-17.8 7.3-7.2 12.7-16.1 15.6-26 2.4-8.1 3-16.8 1.4-25.1-1.3-6.8-4.1-13.2-8.3-18.4-5.3-6.6-13.4-10.5-21.8-10.8-14.2-.5-27.1 9.4-30 23.3-1.6 7.6-.6 15.7 2.8 22.6 4.7 9.4 15.2 14.9 25.6 13.8 10.4-1.2 19.4-8.7 21.8-19 1.4-6.1.7-12.6-2.1-18.2-3.1-6.1-9.3-10.2-16.2-10.9-6.3-.6-12.6 1.8-16.7 6.6-3.8 4.4-4.8 10.7-3.2 16.3 2.1 7.2 8.7 12 16.2 11.8 7.5-.2 14.1-5.3 16-12.6 1.2-4.6.3-9.6-2.5-13.3-2.9-3.9-7.8-5.9-12.6-5.3-4.2.6-7.8 3.7-8.8 7.8-.8 3.5.3 7.2 2.9 9.8 2.3 2.3 5.8 3.1 8.9 2.1" fill="#FFFFFF" />
                                            <path d="M124.6 405.6c-4.4 2.8-9 5.4-13.8 7.7-27.3 13.2-59 14.8-87.7 5.7-26.6-8.4-48.5-28.5-57.9-54.8-1.5-4.1-2.5-8.4-3.1-12.7 3.9 10.3 10.4 19.5 18.9 26.8 15.4 13.2 35.6 18.7 55.4 18.1 20.3-.6 39.8-7.9 56.4-19.8 12.9-9.2 23.3-21.3 31-35.3 5.1-9.3 8.7-19.4 10.6-29.8 1.9-10.8 2.2-22 0-32.9l8.6 3.8c-1.4 10.1-4.8 19.6-9.9 28.3-8.8 14.9-21.4 27.2-36.4 36.1-17.6 10.4-37.9 15.3-58 13.9-19-.3-37.4-7.4-51.5-19.4-5.3-4.5-9.8-9.8-13.4-15.8-2.6-4.4-4.7-9.2-6.1-14.1-1.3-4.5-2-9.2-2.1-13.9.7 13.6 5.8 26.5 14.3 36.9 14.5 17.7 36.6 27.9 59.2 27.3 22.8-.6 44.5-9.7 60.5-25.5 10.1-10 17.5-22.3 21.6-35.8 2-6.6 3.1-13.6 3-20.6l8.8 2.2c1.4 11.2-1.3 22.5-6.6 32.2-6.2 11.2-15 20.7-25.1 28.5-17.5 13.5-39.7 19.9-61.6 18-20.7-1.7-40.4-10.7-54.3-25.2-11.8-12.2-18.6-28.8-18.9-45.7-.1-3.6.4-7.2 1.4-10.7-5.1 11.6-4.5 25.4 1.7 36.7 10.6 19.5 31.7 31.5 53.6 32.5 11 .5 22-1.4 32.3-5.6z" fill="#FFFFFF" />
                                            {/* White Pom Pom */}
                                            <circle cx="430" cy="80" r="45" fill="#FFFFFF" />
                                            {/* White Trim */}
                                            <rect x="50" y="320" width="220" height="60" rx="30" fill="#FFFFFF" transform="rotate(-15 160 350)" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!profileImage && (
                        <div
                            className={`w-28 h-28 mb-6 flex items-center justify-center text-5xl font-bold shadow-xl transition-transform duration-700 ${theme.effects?.spinAvatar ? 'hover:rotate-[360deg]' : ''} ${onEdit ? 'cursor-pointer' : ''}`}
                            style={{
                                borderRadius: '50%',
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
                                    <div className="absolute -top-[55%] -left-[30%] w-[160%] pointer-events-none rotate-[-15deg] z-50 filter drop-shadow-lg">
                                        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                                            {/* Santa Hat SVG */}
                                            <path d="M116.5 393.1c-19.1-16.7-33.8-38.3-43.2-62.7-18.4-44.1-12.8-95.6 15.6-135 23.4-32.5 59-54 99.4-62.3 35.1-7.2 73.4 3.7 103.7 26.6 23.9 18.1 39.3 45.4 43.6 74.8 2 13.5 1.5 27.6-1.5 40.8-5.3 22.8-16.3 43.8-31.5 61.4-12.4 14.3-27.4 26.4-44.1 35.5-16.1 8.8-33.6 14.7-51.7 17.5-30.1 4.7-61-1.6-88.6-16.2z" fill="#D32F2F" />
                                            <path d="M428.6 376.5c-15.6-11.2-28.7-25-39.7-40.2-22.3-30.8-34.9-68.5-44.1-105.8-9.4-38.3-15.3-77.9-22-116.6-4.9-28.3-10.4-56.5-17.6-84.3-3.6-13.9-8.4-27.4-14.7-40.3-6.5-13.3-15.2-25.2-26.4-34.6-5.8-4.9-12.4-8.8-19.7-11.3s-15.3-3.3-22.9-2.1c-15 2.5-28.3 10.1-39.1 20.8-10.7 10.6-17.7 24.3-19.7 39.3-3.5 16.7 1.8 34.3 12.8 46.8 11.2 12.7 27.2 19.9 44.1 20.2 16.4.3 32.5-6.2 44.2-17.8 7.3-7.2 12.7-16.1 15.6-26 2.4-8.1 3-16.8 1.4-25.1-1.3-6.8-4.1-13.2-8.3-18.4-5.3-6.6-13.4-10.5-21.8-10.8-14.2-.5-27.1 9.4-30 23.3-1.6 7.6-.6 15.7 2.8 22.6 4.7 9.4 15.2 14.9 25.6 13.8 10.4-1.2 19.4-8.7 21.8-19 1.4-6.1.7-12.6-2.1-18.2-3.1-6.1-9.3-10.2-16.2-10.9-6.3-.6-12.6 1.8-16.7 6.6-3.8 4.4-4.8 10.7-3.2 16.3 2.1 7.2 8.7 12 16.2 11.8 7.5-.2 14.1-5.3 16-12.6 1.2-4.6.3-9.6-2.5-13.3-2.9-3.9-7.8-5.9-12.6-5.3-4.2.6-7.8 3.7-8.8 7.8-.8 3.5.3 7.2 2.9 9.8 2.3 2.3 5.8 3.1 8.9 2.1" fill="#FFFFFF" />
                                            <path d="M124.6 405.6c-4.4 2.8-9 5.4-13.8 7.7-27.3 13.2-59 14.8-87.7 5.7-26.6-8.4-48.5-28.5-57.9-54.8-1.5-4.1-2.5-8.4-3.1-12.7 3.9 10.3 10.4 19.5 18.9 26.8 15.4 13.2 35.6 18.7 55.4 18.1 20.3-.6 39.8-7.9 56.4-19.8 12.9-9.2 23.3-21.3 31-35.3 5.1-9.3 8.7-19.4 10.6-29.8 1.9-10.8 2.2-22 0-32.9l8.6 3.8c-1.4 10.1-4.8 19.6-9.9 28.3-8.8 14.9-21.4 27.2-36.4 36.1-17.6 10.4-37.9 15.3-58 13.9-19-.3-37.4-7.4-51.5-19.4-5.3-4.5-9.8-9.8-13.4-15.8-2.6-4.4-4.7-9.2-6.1-14.1-1.3-4.5-2-9.2-2.1-13.9.7 13.6 5.8 26.5 14.3 36.9 14.5 17.7 36.6 27.9 59.2 27.3 22.8-.6 44.5-9.7 60.5-25.5 10.1-10 17.5-22.3 21.6-35.8 2-6.6 3.1-13.6 3-20.6l8.8 2.2c1.4 11.2-1.3 22.5-6.6 32.2-6.2 11.2-15 20.7-25.1 28.5-17.5 13.5-39.7 19.9-61.6 18-20.7-1.7-40.4-10.7-54.3-25.2-11.8-12.2-18.6-28.8-18.9-45.7-.1-3.6.4-7.2 1.4-10.7-5.1 11.6-4.5 25.4 1.7 36.7 10.6 19.5 31.7 31.5 53.6 32.5 11 .5 22-1.4 32.3-5.6z" fill="#FFFFFF" />
                                            {/* White Pom Pom */}
                                            <circle cx="430" cy="80" r="45" fill="#FFFFFF" />
                                            {/* White Trim */}
                                            <rect x="50" y="320" width="220" height="60" rx="30" fill="#FFFFFF" transform="rotate(-15 160 350)" />
                                        </svg>
                                    </div>
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
                                    getIcon={getIcon}
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
                    linkInBio.showSocial && data.socialLinks.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-6 mt-16 mb-8">
                            {data.socialLinks.slice(0, 6).map(social => {
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


        </div>
    );

};

export default LinkTreeVisual;
