import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { Smartphone, Monitor, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import IntroOverlay from '../intro/IntroOverlay';
import { PortfolioData } from '../../types/portfolio';
import { normalizePortfolioData } from '../../utils/normalizePortfolioData';
import { getLazyPortfolioTemplate, resolvePortfolioTemplateKey } from '../../utils/lazyPortfolioTemplate';

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
    activeDevice: initialActiveDevice,
    viewMode,
    isMobile,
    onFocusField,
    onUpdate,
    onClosePreview
}) => {
    // Local state for device preview (defaults to prop, but can be toggled in toolbar)
    const [currentDevice, setCurrentDevice] = useState<'desktop' | 'mobile'>(initialActiveDevice);
    const [showIntro, setShowIntro] = useState(false);
    const [zoom, setZoom] = useState(1);

    // Sync with prop if it changes (optional, but good practice if parent controls it too)
    useEffect(() => {
        setCurrentDevice(initialActiveDevice);
    }, [initialActiveDevice]);

    const safePortfolioData = useMemo(
        () => portfolioData ? normalizePortfolioData(portfolioData) : null,
        [portfolioData]
    );

    // Memoize template to avoid unnecessary lookups
    const CurrentTemplate = useMemo(() => {
        if (!safePortfolioData) return getLazyPortfolioTemplate('minimalist');
        return getLazyPortfolioTemplate(resolvePortfolioTemplateKey(safePortfolioData));
    }, [safePortfolioData]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

    if (!safePortfolioData) return null;

    return (
        <div className={`
            flex-1 min-w-0 min-h-0 relative flex items-center justify-center p-3 pt-20 sm:p-4 sm:pt-20 lg:p-6 overflow-hidden
            bg-[#f9fafb] dark:bg-[#0b0c10] bg-dot-pattern
            ${isMobile && viewMode === 'edit' ? 'hidden' : 'flex'}
        `}>
            {/* Toolbar */}
            <div className="absolute inset-x-3 top-3 z-30 flex flex-wrap items-center justify-center gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:justify-end">
                {/* Zoom Controls */}
                <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1 sm:mr-2">
                    <button
                        onClick={handleZoomOut}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <div className="flex items-center px-1 text-xs font-mono text-gray-400">
                        {Math.round(zoom * 100)}%
                    </div>
                    <button
                        onClick={handleZoomIn}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn size={18} />
                    </button>
                </div>

                {safePortfolioData.linkInBio?.introPage?.enabled && (
                    <button
                        onClick={() => setShowIntro(true)}
                        className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-600 tooltip-trigger"
                        title="Replay Intro"
                    >
                        <RotateCcw size={18} />
                    </button>
                )}

                <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                    <button
                        onClick={() => setCurrentDevice('mobile')}
                        className={`p-2 rounded-md transition-colors ${currentDevice === 'mobile' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Mobile View"
                    >
                        <Smartphone size={18} />
                    </button>
                    <button
                        onClick={() => setCurrentDevice('desktop')}
                        className={`p-2 rounded-md transition-colors ${currentDevice === 'desktop' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Desktop View"
                    >
                        <Monitor size={18} />
                    </button>
                </div>

                {onClosePreview && (
                    <button
                        onClick={onClosePreview}
                        className="w-8 h-8 rounded-full bg-red-400 hover:bg-red-500 text-white flex items-center justify-center transition-colors shadow-sm ml-2"
                        title="Close Preview"
                    >
                        <span className="font-bold text-lg leading-none">&times;</span>
                    </button>
                )}
            </div>

            {/* Browser Frame with Zoom */}
            <div
                className={`
                    transition-all duration-300 shadow-2xl overflow-hidden relative
                    ${currentDevice === 'mobile' ? 'h-[min(750px,calc(100dvh-118px))] w-[min(375px,calc(100vw-28px))] rounded-[32px] border-[10px] border-gray-900 sm:rounded-[40px] sm:border-[12px]' : 'h-[min(100%,calc(100dvh-118px))] w-[min(1180px,calc(100vw-24px))] rounded-xl border border-gray-200'}
                `}
                style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center center'
                }}
            >
                {/* Intro Overlay Preview */}
                {safePortfolioData.linkInBio?.introPage?.enabled && showIntro && (
                    <div className="absolute inset-0 z-[100] rounded-[inherit] overflow-hidden">
                        <IntroOverlay
                            config={safePortfolioData.linkInBio.introPage}
                            onEnter={() => setShowIntro(false)}
                            position="absolute"
                            portfolioId={safePortfolioData.id}
                            isPreview={true}
                        />
                    </div>
                )}

                {/* Content Iframe / Component */}
                <div className="w-full h-full overflow-y-auto bg-white custom-scrollbar relative">
                    {/* Component Rendering */}
                    {(() => {
                        const theme = safePortfolioData.theme || { darkMode: false, primaryColor: '#000000' } as any;
                        const isDark = theme.darkMode;
                        const isExplicitlyLight = theme.backgroundColor?.toLowerCase() === '#ffffff' || theme.backgroundColor?.toLowerCase() === '#fff';
                        const wrapperBg = (isDark && isExplicitlyLight) ? '#0f1117' : (theme.backgroundColor || (isDark ? '#0f1117' : '#ffffff'));

                        return (
                            <div
                                id={`portfolio-preview-${safePortfolioData.id || 'draft'}`}
                                className="min-h-full transition-colors duration-500"
                                style={{ backgroundColor: wrapperBg }}
                            >
                                {/* Scoped custom CSS injection — AI Style tab writes here */}
                                {theme.customCss && (
                                    <style>{`#portfolio-preview-${safePortfolioData.id || 'draft'} { ${theme.customCss} }`}</style>
                                )}
                                <Suspense fallback={<div className="flex min-h-96 items-center justify-center text-sm text-gray-500">Loading preview...</div>}>
                                    <CurrentTemplate
                                        data={safePortfolioData}
                                        onEdit={onFocusField}
                                        onUpdate={onUpdate}
                                        isMobileView={currentDevice === 'mobile'}
                                    />
                                </Suspense>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

export default PortfolioPreview;
