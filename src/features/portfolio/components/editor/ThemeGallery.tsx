
import React from 'react';
import { LINKTREE_THEMES } from '../../styles/linktreeThemes';
import { Check, Snowflake, Image as ImageIcon } from 'lucide-react';

interface ThemeGalleryProps {
    currentThemeId?: string;
    onSelectTheme: (themeId: string) => void;
    onDoubleSelect?: (themeId: string) => void;
    userThemes?: any[];
    onDeleteTheme?: (themeId: string) => void;
    onEditBackground: (theme: any) => void;
    onPickBg?: (theme: any) => void;
    onToggleSnow?: () => void;
    isSnowEnabled?: boolean;
}

const ThemeGallery: React.FC<ThemeGalleryProps> = ({
    currentThemeId = 'air',
    onSelectTheme,
    onDoubleSelect,
    userThemes = [],
    onDeleteTheme,
    onEditBackground,
    onPickBg,
    onToggleSnow,
    isSnowEnabled
}) => {

    // Helper for Custom Shapes (Duplicated for preview simplicity)
    const getShapeStyle = (shape?: string): React.CSSProperties => {
        if (!shape) return {};
        if (shape === 'torn-paper') return { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 95%, 5% 100%, 10% 95%, 15% 100%, 20% 95%, 25% 100%, 30% 95%, 35% 100%, 40% 95%, 45% 100%, 50% 95%, 55% 100%, 60% 95%, 65% 100%, 70% 95%, 75% 100%, 80% 95%, 85% 100%, 90% 95%, 95% 100%, 100% 95%, 100% 100%, 0% 100%)' };
        if (shape === 'jagged') return { clipPath: 'polygon(0% 0%, 100% 0%, 95% 50%, 100% 100%, 0% 100%, 5% 50%)' };
        if (shape === 'wavy') return { borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' };
        return {};
    };

    const renderThemeCard = (theme: any, isCustom: boolean = false) => {
        const bgStyle = theme.backgroundConfig?.type === 'image'
            ? { backgroundImage: theme.backgroundConfig.value, backgroundSize: 'cover' }
            : theme.backgroundConfig?.type === 'gradient'
                ? { background: theme.backgroundConfig.value }
                : { background: theme.colors.background };

        return (
            <div key={theme.id} className="relative group">
                <button
                    onClick={() => onSelectTheme(theme.id)}
                    onDoubleClick={() => onDoubleSelect?.(theme.id)}
                    className={`group relative aspect-[3/4] rounded-xl overflow-hidden text-left transition-all w-full ${currentThemeId === theme.id
                        ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#1a1a1a]'
                        : 'hover:scale-[1.02] hover:shadow-lg'
                        }`}
                    style={bgStyle}
                >
                    {/* Overlay if present in config */}
                    {theme.backgroundConfig?.overlay && (
                        <div className="absolute inset-0" style={{ background: theme.backgroundConfig.overlay }} />
                    )}

                    {/* Selected Indicator */}
                    {currentThemeId === theme.id && (
                        <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-indigo-500 rounded-full text-white shadow-sm z-20">
                            <Check size={14} strokeWidth={3} />
                        </div>
                    )}

                    {/* Preview Elements */}
                    <div className="absolute inset-x-4 top-8 flex flex-col items-center gap-3 z-10">
                        {/* Avatar Circle */}
                        <div
                            className="w-10 h-10 rounded-full border-2"
                            style={{
                                borderColor: theme.colors.cardBg || 'rgba(255,255,255,0.2)',
                                background: theme.colors.accent,
                                opacity: 0.9,
                                boxShadow: theme.id === 'neon_nights' ? '0 0 10px rgba(255,0,255,0.5)' : undefined
                            }}
                        />

                        {/* Button Lines */}
                        <div
                            className="w-full h-8 flex items-center justify-center"
                            style={{
                                background: theme.buttons.style === 'outline' ? 'transparent' :
                                    theme.buttons.style === 'glass' ? 'rgba(255,255,255,0.2)' :
                                        theme.buttons.style === 'soft' ? (theme.colors.cardBg || '#fff') :
                                            theme.colors.accent,
                                border: theme.buttons.style === 'outline' ? `1px solid ${theme.colors.text}` :
                                    theme.buttons.style === 'glass' ? '1px solid rgba(255,255,255,0.3)' :
                                        theme.buttons.style === 'hard-shadow' ? '1px solid black' : 'none',
                                borderRadius: theme.buttons.radius === 'full' ? '999px' :
                                    theme.buttons.radius === 'lg' ? '6px' :
                                        theme.buttons.radius === 'sm' ? '2px' : '0px',
                                boxShadow: theme.buttons.style === 'hard-shadow' ? '2px 2px 0px rgba(0,0,0,1)' : theme.buttons.shadow,
                                ...getShapeStyle(theme.buttons.customShape)
                            }}
                        >
                            <div className="w-12 h-1 bg-current opacity-40 rounded-full" style={{ color: theme.colors.text }} />
                        </div>

                        <div
                            className="w-full h-8 flex items-center justify-center opacity-70"
                            style={{
                                background: theme.buttons.style === 'outline' ? 'transparent' :
                                    theme.buttons.style === 'glass' ? 'rgba(255,255,255,0.2)' :
                                        theme.buttons.style === 'soft' ? (theme.colors.cardBg || '#fff') :
                                            theme.colors.accent,
                                border: theme.buttons.style === 'outline' ? `1px solid ${theme.colors.text}` :
                                    theme.buttons.style === 'glass' ? '1px solid rgba(255,255,255,0.3)' :
                                        theme.buttons.style === 'hard-shadow' ? '1px solid black' : 'none',
                                borderRadius: theme.buttons.radius === 'full' ? '999px' :
                                    theme.buttons.radius === 'lg' ? '6px' :
                                        theme.buttons.radius === 'sm' ? '2px' : '0px',
                                boxShadow: theme.buttons.style === 'hard-shadow' ? '2px 2px 0px rgba(0,0,0,1)' : theme.buttons.shadow,
                                ...getShapeStyle(theme.buttons.customShape)
                            }}
                        />
                    </div>

                    {/* Label Badge */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white tracking-wide truncate flex-1 min-w-0">{theme.name}</span>

                        {/* Edit Background Button (All Themes) */}
                        <div className="flex gap-2">
                            {onToggleSnow && (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleSnow();
                                    }}
                                    className={`p-1.5 rounded-full items-center justify-center transition-all hidden group-hover:flex backdrop-blur-md cursor-pointer border ${isSnowEnabled ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray-900/80 hover:bg-gray-800 text-gray-300 border-white/10'}`}
                                    title={isSnowEnabled ? "Disable Snow" : "Enable Snow"}
                                >
                                    <Snowflake size={14} />
                                </div>
                            )}

                            {/* Background Controls */}
                            <div className="flex gap-1">
                                {/* 1. Change Background (Stock) - Always Visible */}
                                {onPickBg && (
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPickBg(theme);
                                        }}
                                        className="px-2 py-1.5 bg-gray-900/90 hover:bg-black text-[11px] font-medium items-center text-gray-100 rounded-l-full transition-all hidden group-hover:flex whitespace-nowrap backdrop-blur-md cursor-pointer border border-white/10 shadow-sm"
                                        title="Change Background Image"
                                    >
                                        <ImageIcon size={12} />
                                    </div>
                                )}

                                {/* 2. Edit AI - Visible only if Image exists */}
                                {onEditBackground && (theme.backgroundConfig?.type === 'image' || String(theme.colors?.background || '').includes('url(')) && (
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Fallback to stock picker if no image, but UI implies AI edit
                                            onEditBackground(theme);
                                        }}
                                        className={`px-2 py-1.5 bg-gray-900/90 hover:bg-black text-[11px] font-medium items-center text-gray-100 ${onPickBg ? 'rounded-r-full border-l-0' : 'rounded-full'} transition-all hidden group-hover:flex whitespace-nowrap backdrop-blur-md cursor-pointer border border-white/10 shadow-sm`}
                                        title="Edit with AI"
                                    >
                                        {/* Show Sparkles if image, else maybe just Text? But we rely on parent logic mostly. Use Sparkles for AI. */}
                                        <span className="text-xs">✨</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </button>

                {/* Delete Button for Custom Themes */}
                {
                    isCustom && onDeleteTheme && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTheme(theme.id);
                            }}
                            className="absolute top-2 left-2 z-30 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Theme"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        </button>
                    )
                }
            </div >
        );
    };

    return (
        <div className="space-y-6">
            {/* Custom/Saved Themes */}
            {userThemes.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Your Themes</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {userThemes.map(theme => renderThemeCard(theme, true))}
                    </div>
                </div>
            )}

            {/* Presets */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Presets</h3>
                <div className="grid grid-cols-2 gap-3">
                    {Object.values(LINKTREE_THEMES).map(theme => renderThemeCard(theme))}
                </div>
            </div>
        </div>
    );
};

export default ThemeGallery;
