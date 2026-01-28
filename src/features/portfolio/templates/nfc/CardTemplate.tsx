import React, { useState } from 'react';
import { PortfolioData } from '../../types/portfolio';
import { CARD_TEMPLATES } from '../../constants/cardTemplates';
import {
    Phone, Mail, MapPin, Globe, Linkedin, Twitter,
    Instagram, Github, Youtube, Share2,
    Download, QrCode, ExternalLink, User, RotateCcw
} from 'lucide-react';
import { FaTiktok, FaWeixin, FaWeibo, FaFacebookF } from 'react-icons/fa';
import QRCodeSVG from 'react-qr-code';

// --- Types ---

interface CardTemplateProps {
    data: PortfolioData;
    variant?: 'minimal' | 'photo' | 'modern' | 'corporate';
    onEdit?: (section: string) => void;
    onUpdate?: (updates: Partial<PortfolioData>) => void;
    isFlipped?: boolean;
    onToggleFlip?: (flipped: boolean) => void;
    isEmbed?: boolean;
}

// --- Helpers ---

const getPlatformFromUrl = (url: string): string => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('linkedin')) return 'linkedin';
    if (lowerUrl.includes('twitter') || lowerUrl.includes('x.com')) return 'twitter';
    if (lowerUrl.includes('instagram')) return 'instagram';
    if (lowerUrl.includes('github')) return 'github';
    if (lowerUrl.includes('facebook')) return 'facebook';
    if (lowerUrl.includes('youtube')) return 'youtube';
    if (lowerUrl.includes('tiktok')) return 'tiktok';
    if (lowerUrl.includes('weixin') || lowerUrl.includes('wechat')) return 'wechat';
    if (lowerUrl.includes('weibo')) return 'weibo';
    return 'web';
};

const SocialIcon = ({ type, className }: { type: string, className?: string }) => {
    switch (type.toLowerCase()) {
        case 'linkedin': return <Linkedin size={18} className={className} />;
        case 'twitter': return <Twitter size={18} className={className} />;
        case 'instagram': return <Instagram size={18} className={className} />;
        case 'github': return <Github size={18} className={className} />;
        case 'facebook': return <FaFacebookF size={18} className={className} />;
        case 'youtube': return <Youtube size={18} className={className} />;
        case 'tiktok': return <FaTiktok size={18} className={className} />;
        case 'wechat': return <FaWeixin size={18} className={className} />;
        case 'weibo': return <FaWeibo size={18} className={className} />;
        default: return <Globe size={18} className={className} />;
    }
};

// Generates a vCard string (simplified)
const generateVCard = (data: PortfolioData) => {
    const name = data.hero.headline; // Assuming headline is name for now, simpler
    const tel = data.phone || '';
    const email = data.contactEmail || '';
    const url = typeof window !== 'undefined' ? window.location.href : '';

    return `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL:${tel}
EMAIL:${email}
URL:${url}
END:VCARD`;
};

const handleDownloadVCard = (data: PortfolioData) => {
    const vcard = generateVCard(data);
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.hero.headline.replace(/\s+/g, '_')}_contact.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Returns classes for editable elements to hint interaction
const getEditTriggerClasses = (canEdit: boolean) =>
    canEdit ? "cursor-pointer hover:opacity-70 hover:scale-[1.02] active:scale-95 transition-all duration-200 border border-transparent hover:border-indigo-500/30 hover:bg-indigo-500/10 rounded px-1 -mx-1" : "";

// --- Components ---

const CardTemplate: React.FC<CardTemplateProps> = ({ data, onEdit, onUpdate, isFlipped: controlledFlipped, onToggleFlip, isEmbed }) => {
    // Determine Template Configuration
    const templateId = data.templateId || 'card_modern';
    // Fallback to minimal if ID not found in registry (e.g. legacy IDs)
    const config = CARD_TEMPLATES[templateId] || CARD_TEMPLATES['card_minimal'];

    // --- Dynamic Data ---
    const usePhotoBg = data.businessCard?.usePhotoBackground;

    // Flip State
    const [internalFlipped, setInternalFlipped] = useState(false);
    const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

    const handleFlip = (startFlipped: boolean) => {
        if (onToggleFlip) {
            onToggleFlip(startFlipped);
        } else {
            setInternalFlipped(startFlipped);
        }
    };

    // Profile URL for QR Code - Uses Share Portfolio URL format
    const username = (data as any).username || data.hero?.headline?.replace(/\s+/g, '').toLowerCase() || 'user';
    const profileUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/portfolio/${username}/${data.id}`
        : `https://careervivid.app/portfolio/${username}/${data.id}`;

    // Customization Handlers
    const handleUpdate = (updates: Partial<typeof data.businessCard>) => {
        if (onUpdate) {
            onUpdate({
                businessCard: {
                    orientation: 'horizontal',
                    usePhotoBackground: usePhotoBg,
                    ...(data.businessCard || {}),
                    ...updates
                }
            });
        }
    };

    // --- Computed Styles ---
    const customTextColor = data.businessCard?.customTextColor;
    const customFont = data.businessCard?.customFont;
    const customFontSize = data.businessCard?.customFontSize || 'md';
    const blurLevel = data.businessCard?.blurLevel ?? 0;

    const containerStyle: React.CSSProperties = {
        backgroundColor: config.baseColor,
        color: customTextColor || config.textColor,
        fontFamily: customFont || config.fontFamily,
        backgroundImage: usePhotoBg && data.hero.avatarUrl
            ? `url(${data.hero.avatarUrl})`
            : (config.textureUrl ? `url(${config.textureUrl})` : undefined),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    // Overlay Logic
    const needsThemeOverlay = usePhotoBg && config.id !== 'card_photo' && !config.overlayStyle.gradient;

    const themeGradient = needsThemeOverlay
        ? `linear-gradient(to bottom, transparent 30%, ${config.baseColor} 90%)`
        : config.overlayStyle.gradient;

    // If blurLevel is explicitly set (including 0), use it. Otherwise, fallback to theme default or 10px global default.
    const effectiveBlur = data.businessCard?.blurLevel ?? (needsThemeOverlay ? 4 : (config.overlayStyle.blur || 10));

    const overlayStyle: React.CSSProperties = {
        backdropFilter: (config.overlayStyle.glass || needsThemeOverlay || effectiveBlur > 0)
            ? `blur(${effectiveBlur}px)`
            : undefined,
        backgroundColor: config.overlayStyle.glass
            ? `rgba(255,255,255,${config.overlayStyle.opacity})`
            : undefined,
        background: themeGradient,
        border: config.overlayStyle.border,
    };


    // Font Scaling
    const headlineSize = usePhotoBg
        ? (customFontSize === 'sm' ? 'text-xl' : customFontSize === 'lg' ? 'text-3xl' : 'text-2xl')
        : (customFontSize === 'sm' ? 'text-2xl' : customFontSize === 'lg' ? 'text-4xl' : 'text-3xl');

    // Brutalist specific text styles
    const isBrutalist = config.category === 'brutalist';

    // Text Shadow for Readability
    const hasPhotoBg = config.category === 'photo' || usePhotoBg;
    const textShadowStyle = (hasPhotoBg && !isBrutalist) ? '0 2px 4px rgba(0,0,0,0.5)' : 'none';
    const subTextShadowStyle = (hasPhotoBg && !isBrutalist) ? '0 1px 2px rgba(0,0,0,0.5)' : 'none';

    // Layout Logic
    const avatarUrl = data.hero.avatarUrl;

    // EMBED FIX: If embedded, use transparent and centered layout, no min-height
    const containerClasses = isEmbed
        ? "w-full h-full flex flex-col items-center justify-center font-sans bg-transparent"
        : "min-h-screen bg-gray-100 dark:bg-black flex flex-col items-center justify-center p-4 sm:p-8 font-sans";

    const orientation = data.businessCard?.orientation || 'horizontal';
    const isVertical = orientation === 'vertical';
    // EMBED: Remove aspect ratio entirely so card fills full iframe container
    const aspectRatioClass = isEmbed
        ? "w-full h-full"  // No aspect ratio - just fill iframe
        : (isVertical ? "aspect-[1/1.586] max-w-[320px]" : "aspect-[1.586/1] max-w-[480px]");
    const paddingClass = hasPhotoBg ? 'p-4' : 'p-6';
    const cardBaseClasses = `${isEmbed ? 'w-full h-full' : `w-full ${aspectRatioClass}`} rounded-2xl shadow-2xl relative overflow-hidden transition-all duration-500 hover:scale-[1.02] flex flex-col justify-between ${paddingClass} z-10`;

    const handleEdit = (e: React.MouseEvent, section: string) => {
        if (onEdit) {
            e.preventDefault();
            e.stopPropagation();
            onEdit(section);
        }
    };
    const canEdit = !!onEdit; // Only show edit hints/toolbar if handler is provided
    const editClass = getEditTriggerClasses(canEdit);

    return (
        <div className={containerClasses}>

            {/* 3D Perspective Container with Orientation Animation */}
            <div
                className={`${isEmbed ? 'w-full h-full' : aspectRatioClass + ' w-full'} transition-all duration-700 ease-in-out`}
                style={{
                    perspective: '1000px',
                    transformOrigin: 'center center'
                }}
            >
                {/* Flipper - rotates on Y axis */}
                <div
                    className="relative w-full h-full transition-transform duration-700"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                >
                    {/* FRONT FACE - Hidden when flipped for mobile compatibility */}
                    <div
                        className={`absolute inset-0 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between ${paddingClass} ${isFlipped ? 'pointer-events-none' : 'pointer-events-auto'}`}
                        style={{
                            ...containerStyle,
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            visibility: isFlipped ? 'hidden' : 'visible',
                            opacity: isFlipped ? 0 : 1,
                            transition: 'visibility 0s 0.35s, opacity 0.35s'
                        }}
                    >
                        {/* Overlay Layer */}
                        {(config.textureUrl || themeGradient || needsThemeOverlay || blurLevel > 0) && (
                            <div className="absolute inset-0 z-0 pointer-events-none rounded-2xl" style={overlayStyle} />
                        )}

                        {/* Content Layer */}
                        <div className="relative z-10 h-full flex flex-col justify-between">

                            {/* Header: Logo/QR */}
                            <div className="flex justify-between items-start">
                                {!usePhotoBg && (
                                    avatarUrl ? (
                                        <div onClick={(e) => handleEdit(e, 'hero')} className={`w-16 h-16 rounded-full overflow-hidden border-2 ${isBrutalist ? 'border-black' : 'border-white/20'}`}>
                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-white/10 ${isBrutalist ? 'border-2 border-black text-black' : 'text-current'}`}>
                                            <User size={24} />
                                        </div>
                                    )
                                )}
                                {usePhotoBg ? <div /> : null}

                                <button
                                    onClick={() => handleFlip(true)}
                                    className={`p-2 bg-white/90 rounded-lg cursor-pointer hover:scale-105 transition-transform ${isBrutalist ? 'border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}`}
                                    title="View QR Code"
                                >
                                    <QrCode size={24} className="text-black" />
                                </button>
                            </div>

                            {/* Main Info */}
                            <div className={`mt-auto ${hasPhotoBg ? 'mb-3' : 'mb-6'}`}>
                                <h1 onClick={(e) => handleEdit(e, 'hero')}
                                    className={`${headlineSize} font-bold leading-tight mb-1 ${editClass}`}
                                    style={{ textShadow: textShadowStyle }}
                                >
                                    {data.hero.headline}
                                </h1>
                                <p onClick={(e) => handleEdit(e, 'hero')}
                                    className={`${hasPhotoBg ? 'text-xs' : 'text-sm'} opacity-90 uppercase tracking-widest ${editClass}`}
                                    style={{ textShadow: subTextShadowStyle }}
                                >
                                    {data.about?.split('.')[0] || 'Digital Creator'}
                                </p>
                            </div>

                            {/* Footer - Contact Info */}
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    {data.phone && (
                                        <div className="flex items-center gap-3 text-sm opacity-90">
                                            <Phone size={14} /> <span>{data.phone}</span>
                                        </div>
                                    )}
                                    {data.contactEmail && (
                                        <div className="flex items-center gap-3 text-sm opacity-90">
                                            <Mail size={14} /> <span>{data.contactEmail}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BACK FACE - Visible only when flipped for mobile compatibility */}
                    <div
                        className={`absolute inset-0 rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center justify-center p-6 ${isFlipped ? 'pointer-events-auto' : 'pointer-events-none'}`}
                        style={{
                            backgroundColor: config.baseColor,
                            color: customTextColor || config.textColor,
                            fontFamily: customFont || config.fontFamily,
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            visibility: isFlipped ? 'visible' : 'hidden',
                            opacity: isFlipped ? 1 : 0,
                            transition: 'visibility 0s 0.35s, opacity 0.35s'
                        }}
                    >
                        {/* Back to Front Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleFlip(false);
                            }}
                            className={`absolute top-4 right-4 p-2 bg-white/90 rounded-lg cursor-pointer hover:scale-105 transition-transform pointer-events-auto z-50 ${isBrutalist ? 'border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}`}
                            title="Back to Front"
                        >
                            <RotateCcw size={20} className="text-black" />
                        </button>

                        {/* QR Code Container - properly oriented */}
                        <div
                            className="flex flex-col items-center justify-center"
                            style={{ transform: 'none' }}
                        >
                            <div className="bg-white p-4 rounded-xl shadow-lg">
                                <QRCodeSVG
                                    value={profileUrl}
                                    size={isVertical ? 160 : 120}
                                    level="H"
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                />
                            </div>

                            {/* Simplified Label */}
                            <p className={`mt-4 text-sm font-bold uppercase tracking-wider ${isBrutalist ? 'text-black' : ''}`}>
                                Scan to Connect
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor Action Bar */}
            {canEdit && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4 p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 max-w-xl mx-auto animate-fade-in-up">

                    {/* Orientation Toggle */}
                    <div className="flex items-center gap-2 border-r border-gray-300 dark:border-white/20 pr-4">
                        <button
                            onClick={() => handleUpdate({ orientation: isVertical ? 'horizontal' : 'vertical' })}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-1 group"
                            title="Toggle Orientation"
                        >
                            <div className={`w-5 h-5 rounded border-2 border-current transition-transform duration-300 ${isVertical ? 'rotate-90' : ''}`} />
                            <span className="text-[10px] uppercase font-bold opacity-60 group-hover:opacity-100">Rotate</span>
                        </button>
                    </div>

                    {/* Blur Slider */}
                    <div className="flex flex-col gap-1 w-32 border-r border-gray-300 dark:border-white/20 pr-4">
                        <div className="flex justify-between text-[10px] font-bold uppercase opacity-60">
                            <span>Blur</span>
                            <span>{blurLevel}px</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={blurLevel}
                            onChange={(e) => handleUpdate({ blurLevel: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>

                    {/* Text Customization */}
                    <div className="flex items-center gap-3 pl-2">
                        {/* Color Picker */}
                        <div className="relative group">
                            <input
                                type="color"
                                value={customTextColor || config.textColor}
                                onChange={(e) => handleUpdate({ customTextColor: e.target.value })}
                                className="w-8 h-8 rounded-full overflow-hidden border-none p-0 cursor-pointer shadow-sm"
                            />
                            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase opacity-0 group-hover:opacity-60 transition-opacity">Color</span>
                        </div>

                        {/* Font Size */}
                        <button
                            onClick={() => handleUpdate({ customFontSize: customFontSize === 'sm' ? 'md' : customFontSize === 'md' ? 'lg' : 'sm' })}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-1 group"
                        >
                            <span className="text-lg font-serif leading-none">Aa</span>
                            <span className="text-[10px] uppercase font-bold opacity-60 group-hover:opacity-100">{customFontSize}</span>
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
};

export default CardTemplate;
