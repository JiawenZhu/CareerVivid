import React from 'react';
import { LINKTREE_THEMES } from '../../../styles/linktreeThemes';
import { PortfolioData } from '../../../types/portfolio';

interface SidebarThemeSelectorProps {
    portfolioData: PortfolioData;
    onUpdate: (data: Partial<PortfolioData>) => void;
    currentSelection: string;
    editorTheme: 'light' | 'dark';
    themeClasses: any;
}

const SidebarThemeSelector: React.FC<SidebarThemeSelectorProps> = ({
    portfolioData,
    onUpdate,
    currentSelection,
    editorTheme,
    themeClasses
}) => {

    const handleTemplateChange = (value: string) => {
        // Check if the selected value is specific visual theme or structural
        const isVisualTheme = Object.keys(LINKTREE_THEMES).includes(value);

        if (isVisualTheme) {
            onUpdate({
                templateId: 'linktree_visual',
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
                    themeId: value
                }
            });
        } else {
            onUpdate({ templateId: value as any });
        }
    };

    return (
        <div className={`p-3 border-b ${themeClasses.sectionBorder}`}>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Visual Theme</label>
            <select
                value={currentSelection}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors border ${editorTheme === 'dark' ? 'bg-[#1a1d24] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
            >
                {portfolioData.mode === 'linkinbio' ? (
                    <optgroup label="Link in Bio">
                        <option value="linktree_minimal">Minimal (Tech)</option>
                        <option value="linktree_corporate">Corporate (Pro)</option>
                        <option value="linktree_bento">Bento (Grid)</option>
                        {/* Visual Themes */}
                        {Object.values(LINKTREE_THEMES).map(theme => (
                            <option key={theme.id} value={theme.id}>
                                {theme.isPremium ? '💎 ' : ''}{theme.name} {theme.isPremium ? '(PRO)' : `(${theme.category})`}
                            </option>
                        ))}
                    </optgroup>
                ) : portfolioData.mode === 'business_card' ? (
                    <optgroup label="NFC Digital Cards">
                        <option value="card_minimal">Minimal Card</option>
                        <option value="card_photo">Photo Card</option>
                        <option value="card_modern">Modern Card</option>
                    </optgroup>
                ) : (
                    <>
                        <optgroup label="Core">
                            <option value="minimalist">Minimalist (Tech)</option>
                            <option value="corporate">Corporate (Pro)</option>
                        </optgroup>
                        <optgroup label="Technology">
                            <option value="dev_terminal">Dev Terminal</option>
                        </optgroup>
                        <optgroup label="Professional">
                            <option value="writer_editorial">Editorial / Writer</option>
                        </optgroup>
                    </>
                )}
            </select>
        </div>
    );
};

export default SidebarThemeSelector;
