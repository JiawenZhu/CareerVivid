import React, { useState } from 'react';
import { Palette, Plus, Download } from 'lucide-react';
import ThemeGallery from '../ThemeGallery';
import { LinkTreeTheme } from '../../../../styles/linktreeThemes';
import { PortfolioData } from '../../../../types/portfolio';
import { extractThemeFromPortfolio, getThemeSummary, ExtractedTheme } from '../../../services/portfolioThemeService';

interface SidebarDesignEditorProps {
    portfolioData: PortfolioData;
    onUpdate: (data: Partial<PortfolioData>) => void;
    isLinkInBio: boolean;
    editorTheme: 'light' | 'dark';
    themeClasses: any;
    userThemes: LinkTreeTheme[];
    handleDeleteThemeClick: (themeId: string) => void;
    handleEditBackground: (theme: LinkTreeTheme) => void;
    handleSaveCustomThemeClick: () => void;
    onTogglePreview?: () => void;
    userPortfolios?: PortfolioData[]; // List of user's portfolios for import
    onImportTheme?: (theme: ExtractedTheme) => void; // Callback when theme is imported
}

const SidebarDesignEditor: React.FC<SidebarDesignEditorProps> = ({
    portfolioData,
    onUpdate,
    isLinkInBio,
    editorTheme,
    themeClasses,
    userThemes,
    handleDeleteThemeClick,
    handleEditBackground,
    handleSaveCustomThemeClick,
    onTogglePreview,
    userPortfolios = [],
    onImportTheme
}) => {
    const [selectedSourceId, setSelectedSourceId] = useState<string>('');
    const [previewTheme, setPreviewTheme] = useState<ExtractedTheme | null>(null);

    // Filter portfolios to only show link-in-bio ones
    const linkInBioPortfolios = userPortfolios.filter(p => p.mode === 'linkinbio');

    const handlePreviewTheme = (portfolioId: string) => {
        const sourcePortfolio = linkInBioPortfolios.find(p => p.id === portfolioId);
        if (sourcePortfolio) {
            const extracted = extractThemeFromPortfolio(sourcePortfolio);
            setPreviewTheme(extracted);
        }
    };

    const handleApplyTheme = () => {
        if (previewTheme && onImportTheme) {
            onImportTheme(previewTheme);
            setPreviewTheme(null);
            setSelectedSourceId('');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {isLinkInBio ? (
                <div className="space-y-6">
                    {/* Theme Gallery (Existing + Custom) */}
                    <div className="space-y-4">
                        <ThemeGallery
                            currentThemeId={portfolioData.linkInBio?.themeId}
                            onSelectTheme={(themeId) => onUpdate({
                                linkInBio: {
                                    ...(portfolioData.linkInBio || {
                                        links: [],
                                        showSocial: true,
                                        showEmail: true,
                                        displayName: 'Your Name',
                                        bio: 'Your Bio',
                                        profileImage: '',
                                        buttonLayout: 'stack'
                                    }),
                                    customStyle: {
                                        ...(portfolioData.linkInBio?.customStyle || {}),
                                        backgroundOverride: null as any
                                    },
                                    themeId
                                }
                            })}
                            onDoubleSelect={() => onTogglePreview?.()}
                            userThemes={userThemes}
                            onDeleteTheme={handleDeleteThemeClick}
                            onEditBackground={handleEditBackground}
                            isSnowEnabled={portfolioData.linkInBio?.customStyle?.enableSnow || false}
                            onToggleSnow={() => onUpdate({
                                linkInBio: {
                                    ...(portfolioData.linkInBio || {
                                        links: [],
                                        showSocial: true,
                                        showEmail: true,
                                        displayName: 'Your Name',
                                        bio: 'Your Bio',
                                        profileImage: '',
                                        buttonLayout: 'stack'
                                    }),
                                    customStyle: {
                                        ...(portfolioData.linkInBio?.customStyle || {}),
                                        enableSnow: !(portfolioData.linkInBio?.customStyle?.enableSnow)
                                    }
                                }
                            })}
                        />

                        <button
                            onClick={handleSaveCustomThemeClick}
                            className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={14} /> Save Current Design as Theme
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <h3 className="text-sm font-semibold text-indigo-400 mb-1 flex items-center gap-2">
                            <Palette size={14} />
                            Design & Theming
                        </h3>
                        <p className="text-xs text-gray-400">
                            Customize the look and feel of your portfolio.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Match Portfolio Design - Business Card Only */}
                        {portfolioData.mode === 'business_card' && (
                            <div className="p-4 border rounded-lg border-purple-500/20 bg-purple-500/5 space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Download size={14} className="text-purple-400" />
                                    <label className="block text-xs font-semibold text-purple-400 uppercase">
                                        Match Portfolio Design
                                    </label>
                                </div>
                                <p className="text-xs text-gray-400 mb-3">
                                    Import colors and fonts from your link-in-bio portfolios
                                </p>

                                {linkInBioPortfolios.length > 0 ? (
                                    <>
                                        <select
                                            value={selectedSourceId}
                                            onChange={(e) => {
                                                setSelectedSourceId(e.target.value);
                                                if (e.target.value) {
                                                    handlePreviewTheme(e.target.value);
                                                } else {
                                                    setPreviewTheme(null);
                                                }
                                            }}
                                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                                        >
                                            <option value="">Select a portfolio...</option>
                                            {linkInBioPortfolios.map(portfolio => (
                                                <option key={portfolio.id} value={portfolio.id}>
                                                    {portfolio.title || portfolio.hero?.headline || 'Untitled Portfolio'}
                                                </option>
                                            ))}
                                        </select>

                                        {previewTheme && (
                                            <div className="space-y-2">
                                                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                                    <p className="text-xs text-gray-400 mb-2">Preview:</p>
                                                    <p className="text-xs font-mono text-purple-300">
                                                        {getThemeSummary(previewTheme)}
                                                    </p>
                                                    <div className="flex gap-2 mt-2">
                                                        {previewTheme.primaryColor && (
                                                            <div
                                                                className="w-8 h-8 rounded border border-white/20"
                                                                style={{ backgroundColor: previewTheme.primaryColor }}
                                                                title={`Primary: ${previewTheme.primaryColor}`}
                                                            />
                                                        )}
                                                        {previewTheme.backgroundColor && (
                                                            <div
                                                                className="w-8 h-8 rounded border border-white/20"
                                                                style={{ backgroundColor: previewTheme.backgroundColor }}
                                                                title={`Background: ${previewTheme.backgroundColor}`}
                                                            />
                                                        )}
                                                        {previewTheme.textColor && (
                                                            <div
                                                                className="w-8 h-8 rounded border border-white/20"
                                                                style={{ backgroundColor: previewTheme.textColor }}
                                                                title={`Text: ${previewTheme.textColor}`}
                                                            />
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={handleApplyTheme}
                                                    className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    Apply Design
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
                                        <p className="text-xs text-gray-400 mb-2">No link-in-bio portfolios found</p>
                                        <p className="text-xs text-gray-500">
                                            Create a link-in-bio portfolio first to import its design
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Business Card Settings */}
                        {portfolioData.mode === 'business_card' && (
                            <div className="p-3 border rounded-lg border-indigo-500/20 bg-indigo-500/5">
                                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Card Orientation</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onUpdate({ businessCard: { ...portfolioData.businessCard, orientation: 'horizontal' } })}
                                        className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors border ${portfolioData.businessCard?.orientation !== 'vertical' // Default horizontal
                                            ? (editorTheme === 'dark' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700')
                                            : (editorTheme === 'dark' ? 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50')
                                            }`}
                                    >
                                        Horizontal
                                    </button>
                                    <button
                                        onClick={() => onUpdate({ businessCard: { ...portfolioData.businessCard, orientation: 'vertical' } })}
                                        className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors border ${portfolioData.businessCard?.orientation === 'vertical'
                                            ? (editorTheme === 'dark' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700')
                                            : (editorTheme === 'dark' ? 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50')
                                            }`}
                                    >
                                        Vertical
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Typography */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Typography</label>
                            <select
                                value={portfolioData.theme.fontFamily || 'Inter'}
                                onChange={(e) => onUpdate({ theme: { ...portfolioData.theme, fontFamily: e.target.value } })}
                                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 ${themeClasses.inputBg}`}
                            >
                                <option value="Inter">Inter (Sans-serif)</option>
                                <option value="Roboto">Roboto</option>
                                <option value="'Playfair Display', serif">Playfair Display (Serif)</option>
                                <option value="'Space Mono', monospace">Space Mono (Code)</option>
                            </select>
                        </div>

                        {/* Colors */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Theme Colors</label>
                            <div className="space-y-3">
                                <div className={`flex items-center justify-between p-3 rounded-lg border ${themeClasses.cardBg}`}>
                                    <span className={`text-sm ${themeClasses.textMain}`}>Primary Color</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full border overflow-hidden ${editorTheme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                                            <input
                                                type="color"
                                                value={portfolioData.theme.primaryColor}
                                                onChange={(e) => onUpdate({ theme: { ...portfolioData.theme, primaryColor: e.target.value } })}
                                                className="w-[150%] h-[150%] -m-1 cursor-pointer"
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500 font-mono">{portfolioData.theme.primaryColor}</span>
                                    </div>
                                </div>

                                <div className={`flex items-center justify-between p-3 rounded-lg border ${themeClasses.cardBg}`}>
                                    <span className={`text-sm ${themeClasses.textMain}`}>Text Color</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full border overflow-hidden ${editorTheme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                                            <input
                                                type="color"
                                                value={portfolioData.theme.textColor || '#ffffff'}
                                                onChange={(e) => onUpdate({ theme: { ...portfolioData.theme, textColor: e.target.value } })}
                                                className="w-[150%] h-[150%] -m-1 cursor-pointer"
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500 font-mono">{portfolioData.theme.textColor || 'Default'}</span>
                                    </div>
                                </div>

                                <div className={`flex items-center justify-between p-3 rounded-lg border ${themeClasses.cardBg}`}>
                                    <span className={`text-sm ${themeClasses.textMain}`}>Background Color</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full border overflow-hidden ${editorTheme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                                            <input
                                                type="color"
                                                value={portfolioData.theme.backgroundColor || '#000000'}
                                                onChange={(e) => onUpdate({ theme: { ...portfolioData.theme, backgroundColor: e.target.value } })}
                                                className="w-[150%] h-[150%] -m-1 cursor-pointer"
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500 font-mono">{portfolioData.theme.backgroundColor || 'Default'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SidebarDesignEditor;
