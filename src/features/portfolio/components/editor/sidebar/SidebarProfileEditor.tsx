import React from 'react';
import { User, Upload, Loader2, Brush, Trash2, Type, AlignLeft, MousePointer, Link as LinkIcon, FileText, Phone, Mail } from 'lucide-react';
import AppearanceControls from '../AppearanceControls';
import { PortfolioData } from '../../../../types/portfolio';

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
    isLinkInBio
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

                            {portfolioData.hero.avatarUrl && (
                                <>
                                    {/* Edit AI Button */}
                                    <button
                                        onClick={() => onAIImageEdit('hero.avatarUrl', portfolioData.hero.avatarUrl!, 'avatar')}
                                        className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border border-transparent bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 text-[10px] sm:text-xs font-medium transition-colors"
                                    >
                                        <Brush size={16} />
                                        Edit with AI
                                    </button>

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
            </div>

            <div>
                <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                    <Type size={12} /> Headline
                </label>
                <input
                    id="hero.headline"
                    type="text"
                    className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors ${themeClasses.inputBg} h-10`}
                    value={portfolioData.hero.headline}
                    onChange={(e) => onNestedUpdate('hero', 'headline', e.target.value)}
                />
            </div>
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

            <div>
                <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                    <FileText size={12} /> About Me Label & Bio
                </label>
                <input
                    id="sectionLabels.about"
                    type="text"
                    className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors mb-2 ${themeClasses.inputBg} h-10`}
                    value={portfolioData.sectionLabels?.about || 'About Me'}
                    onChange={(e) => onUpdate({
                        sectionLabels: { ...portfolioData.sectionLabels, about: e.target.value }
                    })}
                />
                <textarea
                    id="about"
                    rows={6}
                    className={`w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors resize-none ${themeClasses.inputBg}`}
                    value={portfolioData.about}
                    onChange={(e) => onUpdate({ about: e.target.value })}
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
