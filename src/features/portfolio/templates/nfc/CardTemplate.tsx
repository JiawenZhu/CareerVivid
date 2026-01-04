import React, { useMemo } from 'react';
import { PortfolioData } from '../../types/portfolio';
import {
    Phone, Mail, MapPin, Globe, Linkedin, Twitter,
    Instagram, Github, Youtube, Share2,
    Download, QrCode, ExternalLink, User
} from 'lucide-react';
import { FaTiktok, FaWeixin, FaWeibo, FaFacebookF } from 'react-icons/fa';

// --- Types ---

interface CardTemplateProps {
    data: PortfolioData;
    variant?: 'minimal' | 'photo' | 'modern' | 'corporate';
    onEdit?: (section: string) => void;
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

const CardTemplate: React.FC<CardTemplateProps> = ({ data, variant = 'modern', onEdit }) => {

    const containerClasses = "min-h-screen bg-gray-100 dark:bg-black flex flex-col items-center justify-center p-4 sm:p-8 font-sans";

    // Credit Card Aspect Ratio ~ 1.586
    // Horizontal: aspect-[1.586/1]
    // Vertical: aspect-[1/1.586]
    const orientation = data.businessCard?.orientation || 'horizontal';
    const isVertical = orientation === 'vertical';

    const aspectRatioClass = isVertical ? "aspect-[1/1.586] max-w-[320px]" : "aspect-[1.586/1] max-w-[480px]";

    const cardBaseClasses = `w-full ${aspectRatioClass} rounded-2xl shadow-2xl relative overflow-hidden transition-all duration-500 hover:scale-[1.02]`;

    // Helper to safely trigger edit
    const handleEdit = (e: React.MouseEvent, section: string) => {
        if (onEdit) {
            e.preventDefault();
            e.stopPropagation();
            onEdit(section);
        }
    };

    // Render logic per variant
    const renderCardContent = () => {
        const canEdit = !!onEdit;
        const editClass = getEditTriggerClasses(canEdit);

        switch (variant) {
            case 'minimal':
                return (
                    <div className={`${cardBaseClasses} bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-800 flex flex-col p-6 shadow-xl`}>
                        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                            <QrCode size={isVertical ? 80 : 120} />
                        </div>

                        <div className="flex-1 z-10 flex flex-col justify-center">
                            <h1
                                onClick={(e) => handleEdit(e, 'hero')}
                                className={`${isVertical ? 'text-2xl mt-8' : 'text-3xl'} font-bold tracking-tight mb-1 ${editClass}`}
                            >
                                {data.hero.headline}
                            </h1>
                            <p
                                onClick={(e) => handleEdit(e, 'hero')}
                                className={`text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-6 ${editClass}`}
                            >
                                {data.about?.split('.')[0].slice(0, 30)}
                            </p>

                            <div className="space-y-3 text-sm">
                                {data.phone && (
                                    <div onClick={(e) => handleEdit(e, 'hero')} className={`flex items-center gap-3 hover:text-black dark:hover:text-white text-gray-600 dark:text-gray-400 transition-colors group ${editClass}`}>
                                        <Phone size={16} className="group-hover:stroke-[2.5px]" />
                                        <span>{data.phone}</span>
                                    </div>
                                )}
                                {data.contactEmail && (
                                    <div onClick={(e) => handleEdit(e, 'hero')} className={`flex items-center gap-3 hover:text-black dark:hover:text-white text-gray-600 dark:text-gray-400 transition-colors group ${editClass}`}>
                                        <Mail size={16} className="group-hover:stroke-[2.5px]" />
                                        <span className={`truncate ${isVertical ? 'max-w-[200px]' : 'max-w-[280px]'}`}>{data.contactEmail}</span>
                                    </div>
                                )}
                                {data.location && (
                                    <div onClick={(e) => handleEdit(e, 'hero')} className={`flex items-center gap-3 text-gray-600 dark:text-gray-400 ${editClass}`}>
                                        <MapPin size={16} />
                                        <span>{data.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`pt-4 mt-auto border-t border-gray-100 dark:border-zinc-800 flex ${isVertical ? 'flex-col gap-4' : 'justify-between'} items-center z-10`}>
                            <div className="flex gap-4" onClick={(e) => handleEdit(e, 'hero')}> {/* Socials often in hero/profile */}
                                {data.socialLinks?.slice(0, 3).map((link, i) => (
                                    <div key={i} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer">
                                        <SocialIcon type={getPlatformFromUrl(link.url)} />
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => handleDownloadVCard(data)}
                                className={`bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full text-xs font-bold hover:opacity-80 transition-opacity flex items-center gap-2 ${isVertical ? 'w-full justify-center' : ''}`}
                            >
                                <Download size={14} /> Save Contact
                            </button>
                        </div>
                    </div>
                );

            case 'photo':
                return (
                    <div className={`${cardBaseClasses} bg-gray-900 text-white group`}>
                        {/* Background Image */}
                        {data.hero.avatarUrl ? (
                            <div className="absolute inset-0 z-0" onClick={(e) => handleEdit(e, 'hero')}>
                                <img src={data.hero.avatarUrl} alt="Bg" className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity duration-500 scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" onClick={(e) => handleEdit(e, 'hero')} />
                        )}

                        <div className="relative z-10 flex flex-col h-full p-6 justify-end">
                            <div className="mb-6">
                                <h1 onClick={(e) => handleEdit(e, 'hero')} className={`${isVertical ? 'text-3xl' : 'text-4xl'} font-bold text-white mb-2 shadow-sm leading-tight ${editClass}`}>{data.hero.headline}</h1>
                                <p onClick={(e) => handleEdit(e, 'hero')} className={`text-gray-300 text-sm font-medium ${editClass}`}>{data.about?.slice(0, 50)}</p>
                            </div>

                            <div className={`flex ${isVertical ? 'flex-col gap-3' : 'items-center justify-between'} backdrop-blur-md bg-white/10 p-4 rounded-2xl border border-white/10`}>
                                <div className={`flex ${isVertical ? 'justify-center' : ''} gap-4`}>
                                    <button onClick={(e) => handleEdit(e, 'hero')} className="p-2.5 bg-white/20 rounded-xl hover:bg-white text-white hover:text-black transition-all">
                                        <Phone size={20} />
                                    </button>
                                    <button onClick={(e) => handleEdit(e, 'hero')} className="p-2.5 bg-white/20 rounded-xl hover:bg-white text-white hover:text-black transition-all">
                                        <Mail size={20} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleDownloadVCard(data)}
                                    className={`px-5 py-2.5 bg-white text-black rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 ${isVertical ? 'w-full' : ''}`}
                                >
                                    Save Contact
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'corporate':
                return (
                    <div className={`${cardBaseClasses} bg-white flex overflow-hidden shadow-2xl`}>
                        {/* Left Side: Photo (35% width usually appropriate for split) */}
                        <div
                            className="w-[35%] h-full relative"
                            onClick={(e) => handleEdit(e, 'hero')}
                        >
                            {data.hero.avatarUrl ? (
                                <img src={data.hero.avatarUrl} alt="Profile" className="w-full h-full object-cover grayscale-[20%]" />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                    <User size={32} />
                                </div>
                            )}
                        </div>

                        {/* Right Side: Content & Branding */}
                        <div className="flex-1 flex flex-col relative">

                            {/* Brand Stripe / Background */}
                            <div className="absolute inset-0 bg-white z-0">
                                {/* Diagonal decorative shape using primary brand color */}
                                <div
                                    className="absolute -top-10 -right-10 w-40 h-40 transform rotate-45 rounded-xl opacity-10"
                                    style={{ backgroundColor: data.theme.primaryColor || '#1a202c' }}
                                />
                                <div
                                    className="absolute bottom-0 right-0 w-2 h-full"
                                    style={{ backgroundColor: data.theme.primaryColor || '#1a202c' }}
                                />
                            </div>

                            <div className="relative z-10 flex-1 p-6 flex flex-col justify-center">
                                {/* Company Logo */}
                                {data.businessCard?.companyLogoUrl && (
                                    <div className="mb-4 h-8 flex items-center" onClick={(e) => handleEdit(e, 'businessCard')}>
                                        <img src={data.businessCard.companyLogoUrl} alt="Company Logo" className="h-full object-contain" />
                                    </div>
                                )}

                                <h1
                                    onClick={(e) => handleEdit(e, 'hero')}
                                    className={`text-2xl font-bold text-gray-900 leading-tight mb-1 ${editClass}`}
                                >
                                    {data.hero.headline}
                                </h1>
                                <p
                                    onClick={(e) => handleEdit(e, 'hero')}
                                    className={`text-xs font-semibold uppercase tracking-wider text-gray-500 mb-6 ${editClass}`}
                                >
                                    {data.about?.split('.')[0] || 'Position Title'}
                                </p>

                                <div className="space-y-2 mb-6">
                                    {data.phone && (
                                        <div onClick={(e) => handleEdit(e, 'hero')} className={`flex items-center gap-3 text-sm text-gray-600 ${editClass}`}>
                                            <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0">
                                                <Phone size={12} className="text-gray-900" />
                                            </div>
                                            <span className="truncate">{data.phone}</span>
                                        </div>
                                    )}
                                    {data.contactEmail && (
                                        <div onClick={(e) => handleEdit(e, 'hero')} className={`flex items-center gap-3 text-sm text-gray-600 ${editClass}`}>
                                            <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0">
                                                <Mail size={12} className="text-gray-900" />
                                            </div>
                                            <span className="truncate max-w-[170px]">{data.contactEmail}</span>
                                        </div>
                                    )}
                                    {data.location && (
                                        <div onClick={(e) => handleEdit(e, 'hero')} className={`flex items-center gap-3 text-sm text-gray-600 ${editClass}`}>
                                            <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0">
                                                <MapPin size={12} className="text-gray-900" />
                                            </div>
                                            <span className="truncate">{data.location}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Row */}
                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex gap-2" onClick={(e) => handleEdit(e, 'hero')}>
                                        {data.socialLinks?.slice(0, 3).map((link, i) => (
                                            <div key={i} className="text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">
                                                <SocialIcon type={getPlatformFromUrl(link.url)} className="w-4 h-4" />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <QrCode size={24} className="text-gray-300" />
                                        <button
                                            onClick={() => handleDownloadVCard(data)}
                                            style={{ backgroundColor: data.theme.primaryColor || '#1a202c' }}
                                            className="text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide hover:opacity-90 transition-opacity flex items-center gap-1"
                                        >
                                            <Download size={10} /> Save
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                );

            case 'modern':
            default:
                return (
                    <div className={`${cardBaseClasses} relative overflow-hidden bg-white dark:bg-[#0f1117]`}>
                        {/* Decorative Gradient Blob */}
                        <div className="absolute top-[-50%] right-[-20%] w-[300px] h-[300px] rounded-full bg-indigo-500 blur-[80px] opacity-20 dark:opacity-40 animate-pulse" />
                        <div className="absolute bottom-[-20%] left-[-20%] w-[250px] h-[250px] rounded-full bg-purple-500 blur-[80px] opacity-20 dark:opacity-40 animate-pulse" style={{ animationDelay: '2s' }} />

                        {/* Glass Overlay */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-black/20 backdrop-blur-[2px]" />

                        <div className="relative z-10 h-full p-8 flex flex-col justify-between">
                            <div className={`flex ${isVertical ? 'flex-col items-center text-center gap-4' : 'justify-between items-start'}`}>
                                <div className={`flex ${isVertical ? 'flex-col' : ''} items-center gap-4`}>
                                    <div onClick={(e) => handleEdit(e, 'hero')} className={`w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-[2px] shadow-lg ${canEdit ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}>
                                        <div className="w-full h-full rounded-[14px] overflow-hidden bg-white dark:bg-black">
                                            {data.hero.avatarUrl ? (
                                                <img src={data.hero.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-indigo-500">
                                                    {data.hero.headline.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h1 onClick={(e) => handleEdit(e, 'hero')} className={`text-xl font-bold text-gray-900 dark:text-white ${editClass}`}>{data.hero.headline}</h1>
                                        <p onClick={(e) => handleEdit(e, 'hero')} className={`text-xs font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase mt-0.5 ${editClass}`}>
                                            {data.about?.split('.')[0] || 'Professional'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-black p-2 rounded-xl shadow-sm border border-gray-100 dark:border-white/10">
                                    <QrCode size={28} className="text-gray-900 dark:text-white" />
                                </div>
                            </div>

                            <div className={`space-y-3 my-auto ${isVertical ? 'text-center' : 'pl-1'}`}>
                                {data.phone && (
                                    <div onClick={(e) => handleEdit(e, 'hero')} className={`flex items-center ${isVertical ? 'justify-center' : ''} gap-3 text-sm text-gray-600 dark:text-gray-300 ${editClass}`}>
                                        <Phone size={16} className="text-indigo-500" />
                                        <span>{data.phone}</span>
                                    </div>
                                )}
                                {data.contactEmail && (
                                    <div onClick={(e) => handleEdit(e, 'hero')} className={`flex items-center ${isVertical ? 'justify-center' : ''} gap-3 text-sm text-gray-600 dark:text-gray-300 ${editClass}`}>
                                        <Mail size={16} className="text-indigo-500" />
                                        <span className="truncate">{data.contactEmail}</span>
                                    </div>
                                )}
                                {data.location && (
                                    <div onClick={(e) => handleEdit(e, 'hero')} className={`flex items-center ${isVertical ? 'justify-center' : ''} gap-3 text-sm text-gray-600 dark:text-gray-300 ${editClass}`}>
                                        <MapPin size={16} className="text-indigo-500" />
                                        <span>{data.location}</span>
                                    </div>
                                )}
                            </div>

                            <div className={`flex ${isVertical ? 'flex-col gap-4' : 'justify-between'} items-center pt-6 border-t border-gray-200/50 dark:border-white/5`}>
                                <div className="flex -space-x-2 overflow-hidden py-1" onClick={(e) => handleEdit(e, 'hero')}>
                                    {data.socialLinks?.slice(0, 4).map((link, i) => (
                                        <div
                                            key={i}
                                            className={`inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#0f1117] bg-white dark:bg-[#1a1d24] flex items-center justify-center text-gray-500 hover:text-indigo-500 hover:z-10 relative transition-all ${canEdit ? 'cursor-pointer' : ''}`}
                                        >
                                            <SocialIcon type={getPlatformFromUrl(link.url)} className="w-4 h-4" />
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handleDownloadVCard(data)}
                                    className={`bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 ${isVertical ? 'w-full' : ''}`}
                                >
                                    <Share2 size={14} /> Connect
                                </button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className={containerClasses}>
            {renderCardContent()}

            <div className="mt-8 text-center space-y-2 opacity-60">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    NFC Business Card &bull; {variant.charAt(0).toUpperCase() + variant.slice(1)} Template &bull; {isVertical ? 'Vertical' : 'Horizontal'}
                </p>
                <div className="flex gap-2 justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600 animate-bounce [animation-delay:0.1s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600 animate-bounce [animation-delay:0.2s]" />
                </div>
            </div>
        </div>
    );
};

export default CardTemplate;
