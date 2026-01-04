import React, { useMemo } from 'react';
import { PortfolioData } from '../../types/portfolio';
import { TEMPLATES } from '../../templates';

interface PortfolioPreviewProps {
    portfolioData: PortfolioData | null;
    activeDevice: 'desktop' | 'mobile';
    viewMode: 'edit' | 'preview';
    isMobile: boolean;
    onFocusField: (fieldId: string) => void;
    onUpdate: (updates: Partial<PortfolioData> | any) => void;
    onClosePreview?: () => void;
}

const PortfolioPreview: React.FC<PortfolioPreviewProps> = ({
    portfolioData,
    activeDevice,
    viewMode,
    isMobile,
    onFocusField,
    onUpdate,
    onClosePreview
}) => {

    // Memoize template to avoid unnecessary lookups, though object lookup is fast
    // Memoize template to avoid unnecessary lookups, though object lookup is fast
    const CurrentTemplate = useMemo(() => {
        if (!portfolioData) return TEMPLATES.minimalist;

        // Explicit override for Link-in-Bio mode to support dynamic themes
        // (e.g. if templateId is 'neo_xmas', it's not a component, so we map it to linktree_visual)
        if (portfolioData.mode === 'linkinbio') {
            const id = portfolioData.templateId as string;
            // If it is one of the structural keys, use it. Otherwise default to visual.
            if (['linktree_minimal', 'linktree_visual', 'linktree_corporate', 'linktree_bento'].includes(id)) {
                return TEMPLATES[id as keyof typeof TEMPLATES];
            }
            return TEMPLATES.linktree_visual;
        }

        return TEMPLATES[portfolioData.templateId as keyof typeof TEMPLATES] || TEMPLATES.minimalist;
    }, [portfolioData?.templateId, portfolioData?.mode]);

    if (!portfolioData) return null;

    return (
        <div className={`
            flex-1 relative flex items-center justify-center p-8 overflow-hidden 
            bg-[#f9fafb] dark:bg-[#0b0c10] bg-dot-pattern
            ${isMobile && viewMode === 'edit' ? 'hidden' : 'flex'}
        `}>
            {/* Browser Frame */}
            <div
                className={`
                    bg-white h-full shadow-2xl transition-all duration-500 ease-in-out flex flex-col rounded-xl overflow-hidden
                    ${activeDevice === 'mobile' ? 'w-[375px] max-h-[812px] border-[8px] border-gray-800' : 'w-full max-w-6xl border border-gray-800'}
                `}
            >
                {/* Browser Address Bar */}
                <div className="h-8 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 shrink-0 gap-2">
                    <div className="flex gap-1.5 group/traffic">
                        <button
                            onClick={onClosePreview}
                            className="w-2.5 h-2.5 rounded-full bg-red-400 hover:scale-125 hover:bg-red-500 transition-all cursor-pointer flex items-center justify-center group/close"
                            title="Close Preview"
                        >
                            <span className="opacity-0 group-hover/close:opacity-100 text-[8px] leading-none text-red-900 font-bold">×</span>
                        </button>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 mx-4 bg-white dark:bg-black/20 h-5 rounded flex items-center px-2 text-[10px] text-gray-400 font-mono overflow-hidden whitespace-nowrap">
                        careervivid.app/portfolio/{portfolioData.userId}
                    </div>
                </div>

                {/* Live Template Render */}
                {(() => {
                    const theme = portfolioData.theme || { darkMode: false, primaryColor: '#000000' } as any;
                    const isDark = theme.darkMode;
                    const isExplicitlyLight = theme.backgroundColor?.toLowerCase() === '#ffffff' || theme.backgroundColor?.toLowerCase() === '#fff';
                    const wrapperBg = (isDark && isExplicitlyLight) ? '#0f1117' : (theme.backgroundColor || (isDark ? '#0f1117' : '#ffffff'));

                    return (
                        <div
                            className="flex-1 overflow-y-auto text-gray-900 scroll-smooth transition-colors duration-500"
                            style={{ backgroundColor: wrapperBg }}
                        >
                            <CurrentTemplate
                                data={portfolioData}
                                onEdit={onFocusField}
                                onUpdate={onUpdate}
                                isMobileView={activeDevice === 'mobile'}
                            />
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

export default PortfolioPreview;
