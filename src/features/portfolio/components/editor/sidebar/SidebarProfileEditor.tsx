import React from 'react';
import { User, Upload, Loader2, Brush, Trash2, Type, AlignLeft, MousePointer, Link as LinkIcon, FileText, Phone, Mail, Plus } from 'lucide-react';
import AppearanceControls from '../AppearanceControls';
import { PortfolioButton, PortfolioData } from '../../../types/portfolio';

interface SidebarProfileEditorProps {
    portfolioData: PortfolioData;
    onUpdate: (data: Partial<PortfolioData>) => void;
    onNestedUpdate: (section: keyof PortfolioData, field: string, value: any) => void;
    onImageUploadTrigger: (field: string) => void;
    onAIImageEdit: (field: string, currentSrc: string, type: 'avatar' | 'project') => void;
    isImageUploading: boolean;
    themeClasses: any;
    editorTheme: 'light' | 'dark';
    isLinkInBio: boolean;
    onStockPhotoTrigger?: (field: string) => void;
}

const SidebarProfileEditor: React.FC<SidebarProfileEditorProps> = ({
    portfolioData,
    onUpdate,
    onNestedUpdate,
    onImageUploadTrigger,
    onAIImageEdit,
    isImageUploading,
    themeClasses,
    editorTheme,
    isLinkInBio,
    onStockPhotoTrigger
}) => {
    const isBusinessCard = portfolioData.mode === 'business_card';
    const isPortfolio = !isLinkInBio && !isBusinessCard;
    const headlineLabel = isBusinessCard ? 'Name' : isLinkInBio ? 'Display Name' : 'Headline';
    const aboutLabel = isBusinessCard ? 'Card Tagline' : isLinkInBio ? 'Bio' : 'About Me Label & Bio';
    const aboutPlaceholder = isBusinessCard
        ? 'Add a short role, company, or tagline...'
        : isLinkInBio
            ? 'Write a short bio for your link page...'
            : 'Write a short bio...';
    const aboutValue = portfolioData.about || (isLinkInBio ? portfolioData.linkInBio?.bio || portfolioData.hero.subheadline : '');
    const aboutMaxLength = isBusinessCard ? 120 : isLinkInBio ? 160 : 130;

    const updateHeadline = (headline: string) => {
        onUpdate({
            hero: { ...portfolioData.hero, headline },
            ...(isLinkInBio && portfolioData.linkInBio
                ? { linkInBio: { ...portfolioData.linkInBio, displayName: headline } }
                : {})
        });
    };

    const updateAbout = (about: string) => {
        onUpdate({
            about,
            ...(isLinkInBio && portfolioData.linkInBio
                ? { linkInBio: { ...portfolioData.linkInBio, bio: about } }
                : {})
        });
    };

    const getVisibleHeroButtons = (): PortfolioButton[] => {
        if (Array.isArray(portfolioData.hero.buttons)) {
            return portfolioData.hero.buttons;
        }

        const legacyButtons: PortfolioButton[] = [];
        if (portfolioData.hero.ctaPrimaryLabel || portfolioData.hero.ctaPrimaryUrl) {
            legacyButtons.push({
                id: 'primary',
                label: portfolioData.hero.ctaPrimaryLabel || 'View Work',
                url: portfolioData.hero.ctaPrimaryUrl || '#projects',
                variant: 'primary',
                type: 'link',
            });
        }
        if (portfolioData.hero.ctaSecondaryLabel || portfolioData.hero.ctaSecondaryUrl) {
            legacyButtons.push({
                id: 'secondary',
                label: portfolioData.hero.ctaSecondaryLabel || 'Contact Me',
                url: portfolioData.hero.ctaSecondaryUrl || `mailto:${portfolioData.contactEmail || ''}`,
                variant: 'outline',
                type: 'link',
            });
        }
        return legacyButtons;
    };

    const heroButtons = getVisibleHeroButtons();

    const persistHeroButtons = (buttons: PortfolioButton[]) => {
        const [primary, secondary] = buttons;
        onUpdate({
            hero: {
                ...portfolioData.hero,
                buttons,
                ctaPrimaryLabel: primary?.label || '',
                ctaPrimaryUrl: primary?.url || '',
                ctaSecondaryLabel: secondary?.label || '',
                ctaSecondaryUrl: secondary?.url || '',
            },
        });
    };

    const updateHeroButton = (index: number, updates: Partial<PortfolioButton>) => {
        const nextButtons = heroButtons.map((button, idx) => (
            idx === index ? { ...button, ...updates } : button
        ));
        persistHeroButtons(nextButtons);
    };

    const addHeroButton = (kind: 'contact' | 'link') => {
        const emailHref = `mailto:${portfolioData.contactEmail || 'you@example.com'}`;
        const newButton: PortfolioButton = {
            id: `${kind}-${Date.now()}`,
            label: kind === 'contact' ? 'Contact Me' : 'New Button',
            url: kind === 'contact' ? emailHref : '#projects',
            variant: heroButtons.length === 0 ? 'primary' : 'outline',
            type: 'link',
        };
        persistHeroButtons([...heroButtons, newButton]);
    };

    const removeHeroButton = (index: number) => {
        persistHeroButtons(heroButtons.filter((_, idx) => idx !== index));
    };

    const hasContactButton = heroButtons.some(button => {
        const value = `${button.label || ''} ${button.url || ''}`.toLowerCase();
        return value.includes('contact') || value.includes('mailto:');
    });

    return (
        <div id="hero" className="space-y-4 animate-fade-in">
            {/* Avatar Section */}
            <div className={`p-4 rounded-lg border ${themeClasses.cardBg}`}>
                <label className="block text-xs font-semibold text-gray-500 mb-3 uppercase">
                    {isBusinessCard ? 'Card Photo / Avatar' : 'Profile Photo / Avatar'}
                </label>
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                        <div className={`w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 ${editorTheme === 'dark' ? 'bg-white/10 border-white/10' : 'bg-gray-200 border-gray-200'} shadow-sm`}>
                            {portfolioData.hero.avatarUrl ? (
                                <img src={portfolioData.hero.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <User size={24} />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 flex-1 min-w-0">
                            {/* Upload Button */}
                            <button
                                id="hero.avatarUrl"
                                onClick={() => onImageUploadTrigger('hero.avatarUrl')}
                                disabled={isImageUploading}
                                className={`flex min-h-[52px] flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors
                                    ${isImageUploading
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : `hover:bg-indigo-50/50 hover:border-indigo-200/50 hover:text-indigo-500 ${themeClasses.cardBg} ${themeClasses.textMuted} border-transparent`
                                    }
                                `}
                            >
                                {isImageUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                Upload
                            </button>

                            {/* Library Button */}
                            <button
                                onClick={() => onStockPhotoTrigger?.('hero.avatarUrl')}
                                className="flex min-h-[52px] flex-col items-center justify-center gap-1.5 rounded-lg border border-transparent bg-indigo-500/10 px-2 py-2 text-[11px] font-medium text-indigo-500 transition-colors hover:bg-indigo-500/20"
                            >
                                <span className="text-base">📷</span>
                                Library
                            </button>

                            {/* AI Button - Always Visible */}
                            <button
                                onClick={() => onAIImageEdit('hero.avatarUrl', portfolioData.hero.avatarUrl || '', 'avatar')}
                                className="flex min-h-[52px] flex-col items-center justify-center gap-1.5 rounded-lg border border-transparent bg-indigo-500/10 px-2 py-2 text-[11px] font-medium text-indigo-500 transition-colors hover:bg-indigo-500/20"
                            >
                                <Brush size={16} />
                                {portfolioData.hero.avatarUrl ? 'Edit AI' : 'Create AI'}
                            </button>

                            {portfolioData.hero.avatarUrl && (
                                <>
                                    {/* Remove Button */}
                                    <button
                                        onClick={() => onNestedUpdate('hero', 'avatarUrl', '')}
                                        className="flex min-h-[52px] flex-col items-center justify-center gap-1.5 rounded-lg border border-transparent bg-red-500/5 px-2 py-2 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-500/10"
                                    >
                                        <Trash2 size={16} />
                                        Remove
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400">Recommended: Square JPG/PNG, max 2MB</p>
                </div>

                {/* Avatar Styling Controls */}
                {portfolioData.hero.avatarUrl && !isBusinessCard && (
                    <div className="mt-4 px-1 border-t border-gray-100 dark:border-white/5 pt-4 space-y-4">
                        {/* Size Control */}
                        <div>
                            <label className="text-[10px] uppercase font-semibold text-gray-400 mb-2 block">Avatar Size</label>
                            <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1 gap-1">
                                {(['sm', 'md', 'lg', 'xl'] as const).map((size) => {
                                    const currentSize = portfolioData.hero.avatarSize || 'md';
                                    const isActive = currentSize === size;
                                    return (
                                        <button
                                            key={size}
                                            onClick={() => onNestedUpdate('hero', 'avatarSize', size)}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${isActive
                                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                                }`}
                                        >
                                            {size.toUpperCase()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Shape Control */}
                        <div>
                            <label className="text-[10px] uppercase font-semibold text-gray-400 mb-2 block">Avatar Shape</label>
                            <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1 gap-1">
                                {(['circle', 'rounded', 'square'] as const).map((shape) => {
                                    const currentShape = portfolioData.hero.avatarShape || 'circle';
                                    const isActive = currentShape === shape;
                                    return (
                                        <button
                                            key={shape}
                                            onClick={() => onNestedUpdate('hero', 'avatarShape', shape)}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${isActive
                                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                                }`}
                                        >
                                            {shape}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Position Control */}
                        <div>
                            <label className="text-[10px] uppercase font-semibold text-gray-400 mb-2 block">Avatar Position</label>
                            <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1 gap-1">
                                {(['left', 'center', 'right'] as const).map((pos) => {
                                    const currentPos = portfolioData.hero.avatarPosition || 'left';
                                    const isActive = currentPos === pos;
                                    return (
                                        <button
                                            key={pos}
                                            onClick={() => onNestedUpdate('hero', 'avatarPosition', pos)}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${isActive
                                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                                }`}
                                        >
                                            {pos}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Headline */}
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] uppercase font-semibold text-gray-400 flex items-center gap-1.5">
                        <Type size={12} /> {headlineLabel}
                    </label>
                    <span className="text-[10px] text-gray-400">
                        {portfolioData.hero.headline.length} / {isBusinessCard ? 60 : 40} characters
                    </span>
                </div>
                <input
                    id="hero.headline"
                    type="text"
                    className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors ${themeClasses.inputBg} h-10`}
                    value={portfolioData.hero.headline}
                    onChange={(e) => updateHeadline(e.target.value)}
                    maxLength={isBusinessCard ? 60 : 40}
                />
            </div>

            {/* Portfolio hero actions stay portfolio-only. Bio links use the Links tab; cards use contact links. */}
            {isPortfolio && (
                <>
                    <div>
                        <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                            <AlignLeft size={12} /> Sub-headline
                        </label>
                        <input
                            id="hero.subheadline"
                            type="text"
                            className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors ${themeClasses.inputBg} h-10`}
                            value={portfolioData.hero.subheadline}
                            onChange={(e) => onNestedUpdate('hero', 'subheadline', e.target.value)}
                        />
                    </div>
                    <div className={`rounded-lg border p-4 outline-none ${themeClasses.cardBg}`} id="hero.buttons" tabIndex={-1}>
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                                <label className="text-[10px] uppercase font-semibold text-gray-400 flex items-center gap-1.5">
                                    <MousePointer size={12} /> Hero Buttons
                                </label>
                                <p className="mt-1 text-[11px] leading-4 text-gray-400">
                                    Add or remove the buttons shown under your headline.
                                </p>
                            </div>
                            <div className="flex shrink-0 gap-2">
                                <button
                                    type="button"
                                    onClick={() => addHeroButton('contact')}
                                    disabled={hasContactButton}
                                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${hasContactButton
                                            ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-white/5'
                                            : 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200'
                                        }`}
                                >
                                    <Mail size={12} /> Add Contact
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addHeroButton('link')}
                                    className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-500 transition-colors hover:bg-indigo-500/20"
                                >
                                    <Plus size={12} /> Add Link
                                </button>
                            </div>
                        </div>

                        {heroButtons.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-xs leading-5 text-gray-400 dark:border-white/10">
                                No hero buttons are shown. Add Contact for email or Add Link for projects, resume, calendar, or any URL.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {heroButtons.map((button, index) => (
                                    <div key={button.id || index} className={`rounded-lg border p-3 ${editorTheme === 'dark' ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white'}`}>
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-gray-500">Button {index + 1}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeHeroButton(index)}
                                                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-500/10"
                                                title="Remove button"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div>
                                                <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                                                    <Type size={12} /> Label
                                                </label>
                                                <input
                                                    id={`hero.buttons.${index}.label`}
                                                    type="text"
                                                    className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg} h-10`}
                                                    value={button.label || ''}
                                                    onChange={(e) => updateHeroButton(index, { label: e.target.value })}
                                                    placeholder="Contact Me"
                                                    maxLength={48}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                                                    <LinkIcon size={12} /> Link
                                                </label>
                                                <input
                                                    id={`hero.buttons.${index}.url`}
                                                    type="text"
                                                    className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg} h-10`}
                                                    value={button.url || ''}
                                                    onChange={(e) => updateHeroButton(index, { url: e.target.value, type: 'link' })}
                                                    placeholder={`#projects or mailto:${portfolioData.contactEmail || 'you@example.com'}`}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 block">Style</label>
                                                <select
                                                    id={`hero.buttons.${index}.variant`}
                                                    value={button.variant || 'outline'}
                                                    onChange={(e) => updateHeroButton(index, { variant: e.target.value as PortfolioButton['variant'] })}
                                                    className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors border ${themeClasses.inputBg} h-10`}
                                                >
                                                    <option value="primary">Primary</option>
                                                    <option value="secondary">Secondary</option>
                                                    <option value="outline">Outline</option>
                                                    <option value="ghost">Ghost</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {(isPortfolio || isBusinessCard) && (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div>
                        <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                            <Phone size={12} /> Phone Number
                        </label>
                        <input
                            id="phone"
                            type="text"
                            className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors ${themeClasses.inputBg} h-10`}
                            value={portfolioData.phone || ''}
                            onChange={(e) => onUpdate({ phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                            <Mail size={12} /> Email Address
                        </label>
                        <input
                            id="contactEmail"
                            type="email"
                            className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors ${themeClasses.inputBg} h-10`}
                            value={portfolioData.contactEmail || ''}
                            onChange={(e) => onUpdate({ contactEmail: e.target.value })}
                            placeholder="you@example.com"
                        />
                    </div>
                </div>
            )}

            {/* About Section */}
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] uppercase font-semibold text-gray-400 flex items-center gap-1.5">
                        <FileText size={12} /> {aboutLabel}
                    </label>
                    <span className="text-[10px] text-gray-400">
                        {isPortfolio
                            ? `Label: ${(portfolioData.sectionLabels?.about || 'About Me').length}/30 | Bio: ${portfolioData.about?.length || 0}/${aboutMaxLength}`
                            : `${aboutValue.length}/${aboutMaxLength}`}
                    </span>
                </div>

                {isPortfolio && (
                    <input
                        id="sectionLabels.about"
                        type="text"
                        className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors mb-2 ${themeClasses.inputBg} h-10`}
                        value={portfolioData.sectionLabels?.about || 'About Me'}
                        onChange={(e) => onUpdate({
                            sectionLabels: { ...portfolioData.sectionLabels, about: e.target.value }
                        })}
                        maxLength={30}
                        placeholder="Section Label (e.g. About Me)"
                    />
                )}
                <textarea
                    id="about"
                    rows={isBusinessCard ? 3 : 6}
                    className={`w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors resize-none ${themeClasses.inputBg}`}
                    value={aboutValue}
                    onChange={(e) => updateAbout(e.target.value)}
                    maxLength={aboutMaxLength}
                    placeholder={aboutPlaceholder}
                />
            </div>

            {/* NEW: Appearance Controls in Profile Tab */}
            {isLinkInBio && (
                <AppearanceControls
                    portfolioData={portfolioData}
                    onUpdate={onUpdate}
                    themeClasses={themeClasses}
                    editorTheme={editorTheme}
                    variant="profile"
                />
            )}
        </div>
    );
};

export default SidebarProfileEditor;
