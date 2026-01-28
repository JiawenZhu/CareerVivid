import React from 'react';
import { User, Upload, Loader2, Brush, Trash2, Type, AlignLeft, MousePointer, Link as LinkIcon, FileText, Phone, Mail } from 'lucide-react';
import AppearanceControls from '../AppearanceControls';
import { PortfolioData } from '../../../types/portfolio';

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
    return (
        <div className="space-y-4 animate-fade-in">
            {/* Avatar Section */}
            <div className={`p-4 rounded-lg border ${themeClasses.cardBg}`}>
                <label className="block text-xs font-semibold text-gray-500 mb-3 uppercase">Profile Photo / Avatar</label>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 ${editorTheme === 'dark' ? 'bg-white/10 border-white/10' : 'bg-gray-200 border-gray-200'} shadow-sm`}>
                            {portfolioData.hero.avatarUrl ? (
                                <img src={portfolioData.hero.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <User size={24} />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 flex-1">
                            {/* Upload Button */}
                            <button
                                onClick={() => onImageUploadTrigger('hero.avatarUrl')}
                                disabled={isImageUploading}
                                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border text-[10px] sm:text-xs font-medium transition-colors
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
                                className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border border-transparent bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 text-[10px] sm:text-xs font-medium transition-colors"
                            >
                                <span className="text-lg">📷</span>
                                Library
                            </button>

                            {/* AI Button - Always Visible */}
                            <button
                                onClick={() => onAIImageEdit('hero.avatarUrl', portfolioData.hero.avatarUrl || '', 'avatar')}
                                className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border border-transparent bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 text-[10px] sm:text-xs font-medium transition-colors"
                            >
                                <Brush size={16} />
                                {portfolioData.hero.avatarUrl ? 'Edit AI' : 'Create AI'}
                            </button>

                            {portfolioData.hero.avatarUrl && (
                                <>
                                    {/* Remove Button */}
                                    <button
                                        onClick={() => onNestedUpdate('hero', 'avatarUrl', '')}
                                        className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border border-transparent bg-red-500/5 text-red-500 hover:bg-red-500/10 text-[10px] sm:text-xs font-medium transition-colors"
                                    >
                                        <Trash2 size={16} />
                                        Remove
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center sm:text-left">Recommended: Square JPG/PNG, max 2MB</p>
                </div>

                {/* Image Size Controls */}
                {portfolioData.hero.avatarUrl && (
                    <div className="mt-4 px-1 border-t border-gray-100 dark:border-white/5 pt-4">
                        <label className="text-[10px] uppercase font-semibold text-gray-400 mb-2 block">Avatar Size</label>
                        <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1 gap-1">
                            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => {
                                const currentSize = portfolioData.linkInBio?.customStyle?.profileImageSize || 'md';
                                const isActive = currentSize === size;
                                return (
                                    <button
                                        key={size}
                                        onClick={() => {
                                            const currentCustomStyle = portfolioData.linkInBio?.customStyle || {};
                                            onUpdate({
                                                linkInBio: {
                                                    ...portfolioData.linkInBio!,
                                                    customStyle: {
                                                        ...currentCustomStyle,
                                                        profileImageSize: size
                                                    }
                                                }
                                            });
                                        }}
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
                )}
            </div>

            {/* Headline */}
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] uppercase font-semibold text-gray-400 flex items-center gap-1.5">
                        <Type size={12} /> Headline
                    </label>
                    <span className="text-[10px] text-gray-400">
                        {portfolioData.hero.headline.length} / 40 characters
                    </span>
                </div>
                <input
                    id="hero.headline"
                    type="text"
                    className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors ${themeClasses.inputBg} h-10`}
                    value={portfolioData.hero.headline}
                    onChange={(e) => onNestedUpdate('hero', 'headline', e.target.value)}
                    maxLength={40}
                />
            </div>

            {/* Sub-headline & CTA - Hidden for NFC Cards */}
            {!portfolioData.templateId?.startsWith('card_') && (
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
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                                <MousePointer size={12} /> CTA Text
                            </label>
                            <input
                                id="hero.ctaPrimaryLabel"
                                type="text"
                                className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors ${themeClasses.inputBg} h-10`}
                                value={portfolioData.hero.ctaPrimaryLabel}
                                onChange={(e) => onNestedUpdate('hero', 'ctaPrimaryLabel', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                                <LinkIcon size={12} /> CTA URL
                            </label>
                            <input
                                id="hero.ctaPrimaryUrl"
                                type="text"
                                className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors ${themeClasses.inputBg} h-10`}
                                value={portfolioData.hero.ctaPrimaryUrl}
                                onChange={(e) => onNestedUpdate('hero', 'ctaPrimaryUrl', e.target.value)}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
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

            {/* About Section */}
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] uppercase font-semibold text-gray-400 flex items-center gap-1.5">
                        <FileText size={12} /> About Me Label & Bio
                    </label>
                    <span className="text-[10px] text-gray-400">
                        Label: {(portfolioData.sectionLabels?.about || 'About Me').length}/30 &bull; Bio: {portfolioData.about?.length || 0}/130
                    </span>
                </div>

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
                <textarea
                    id="about"
                    rows={6}
                    className={`w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors resize-none ${themeClasses.inputBg}`}
                    value={portfolioData.about}
                    onChange={(e) => onUpdate({ about: e.target.value })}
                    maxLength={130}
                    placeholder="Write a short bio..."
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
