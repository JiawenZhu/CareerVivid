import React from 'react';
import { Type, AlignLeft, AlignCenter, Square, Circle, Box, Palette } from 'lucide-react';
import { PortfolioData } from '../../types/portfolio';

interface AppearanceControlsProps {
    portfolioData: PortfolioData;
    onUpdate: (updates: Partial<PortfolioData>) => void;
    themeClasses: any;
    editorTheme: 'light' | 'dark';
    variant?: 'links' | 'profile';
}

const AppearanceControls: React.FC<AppearanceControlsProps> = ({
    portfolioData,
    onUpdate,
    themeClasses,
    editorTheme,
    variant = 'links' // Default to links to maintain backward compatibility if prop missing
}) => {
    return (
        <div className={`pt-6 border-t ${themeClasses.sectionBorder} animate-fade-in`}>
            <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    {variant === 'profile' ? 'Profile Appearance' : 'Buttons Appearance'}
                </h3>
                <p className="text-[10px] text-gray-400">
                    {variant === 'profile'
                        ? 'Customize text styles for your headline and bio.'
                        : 'Override button styles for your links.'}
                </p>
            </div>

            <div className="space-y-4">
                {/* === PROFILE VARIANT === */}
                {variant === 'profile' && (
                    <>
                        {/* Profile Font Family */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                                <Type size={12} /> Profile Font
                            </label>
                            <select
                                value={portfolioData.linkInBio?.customStyle?.profileFontFamily || ''}
                                onChange={(e) => onUpdate({
                                    linkInBio: {
                                        ...portfolioData.linkInBio!,
                                        customStyle: {
                                            ...portfolioData.linkInBio?.customStyle,
                                            profileFontFamily: e.target.value
                                        }
                                    }
                                })}
                                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 ${themeClasses.inputBg}`}
                            >
                                <option value="">Default (Theme)</option>
                                <option value="Inter">Inter</option>
                                <option value="DM Sans">DM Sans</option>
                                <option value="Roboto">Roboto</option>
                                <option value="'Playfair Display', serif">Playfair Display</option>
                                <option value="Montserrat">Montserrat</option>
                                <option value="'Space Mono', monospace">Space Mono</option>
                            </select>
                        </div>

                        {/* Profile Text Colors */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                                <Palette size={12} /> Text Colors
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Headline Color */}
                                <div className={`p-3 rounded-lg border ${themeClasses.cardBg}`}>
                                    <span className={`block text-[10px] mb-2 uppercase tracking-wide opacity-70 ${themeClasses.textMain}`}>Headline</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full border overflow-hidden ${editorTheme === 'dark' ? 'border-white/10' : 'border-gray-200'} relative`}>
                                            <input
                                                type="color"
                                                value={portfolioData.linkInBio?.customStyle?.profileTitleColor || '#000000'}
                                                onChange={(e) => onUpdate({
                                                    linkInBio: {
                                                        ...portfolioData.linkInBio!,
                                                        customStyle: { ...portfolioData.linkInBio?.customStyle, profileTitleColor: e.target.value }
                                                    }
                                                })}
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 cursor-pointer border-0"
                                            />
                                        </div>
                                        {portfolioData.linkInBio?.customStyle?.profileTitleColor && (
                                            <button
                                                onClick={() => onUpdate({
                                                    linkInBio: {
                                                        ...portfolioData.linkInBio!,
                                                        customStyle: { ...portfolioData.linkInBio?.customStyle, profileTitleColor: null as any }
                                                    }
                                                })}
                                                className="text-[10px] text-red-400 hover:text-red-500 underline"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Body/Bio Color */}
                                <div className={`p-3 rounded-lg border ${themeClasses.cardBg}`}>
                                    <span className={`block text-[10px] mb-2 uppercase tracking-wide opacity-70 ${themeClasses.textMain}`}>Bio / Body</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full border overflow-hidden ${editorTheme === 'dark' ? 'border-white/10' : 'border-gray-200'} relative`}>
                                            <input
                                                type="color"
                                                value={portfolioData.linkInBio?.customStyle?.profileTextColor || '#000000'}
                                                onChange={(e) => onUpdate({
                                                    linkInBio: {
                                                        ...portfolioData.linkInBio!,
                                                        customStyle: { ...portfolioData.linkInBio?.customStyle, profileTextColor: e.target.value }
                                                    }
                                                })}
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 cursor-pointer border-0"
                                            />
                                        </div>
                                        {portfolioData.linkInBio?.customStyle?.profileTextColor && (
                                            <button
                                                onClick={() => onUpdate({
                                                    linkInBio: {
                                                        ...portfolioData.linkInBio!,
                                                        customStyle: { ...portfolioData.linkInBio?.customStyle, profileTextColor: null as any }
                                                    }
                                                })}
                                                className="text-[10px] text-red-400 hover:text-red-500 underline"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}


                {/* === LINKS VARIANT (Default) === */}
                {variant === 'links' && (
                    <>
                        {/* 1. Font Family */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                                <Type size={12} /> Button Font
                            </label>
                            <select
                                value={portfolioData.linkInBio?.customStyle?.fontFamily || ''}
                                onChange={(e) => onUpdate({
                                    linkInBio: {
                                        ...portfolioData.linkInBio!,
                                        customStyle: {
                                            ...portfolioData.linkInBio?.customStyle,
                                            fontFamily: e.target.value
                                        }
                                    }
                                })}
                                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 ${themeClasses.inputBg}`}
                            >
                                <option value="">Default (Theme)</option>
                                <option value="Inter">Inter</option>
                                <option value="DM Sans">DM Sans</option>
                                <option value="Roboto">Roboto</option>
                                <option value="'Playfair Display', serif">Playfair Display</option>
                                <option value="Montserrat">Montserrat</option>
                                <option value="'Space Mono', monospace">Space Mono</option>
                            </select>
                        </div>

                        {/* 2. Button Shape */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                                <Box size={12} /> Button Shape
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'pill', label: 'Pill', icon: <Circle size={14} className="scale-x-125" /> },
                                    { id: 'rounded', label: 'Rounded', icon: <Box size={14} className="rounded-md" /> },
                                    { id: 'sharp', label: 'Sharp', icon: <Square size={14} /> },
                                ].map(shape => (
                                    <button
                                        key={shape.id}
                                        onClick={() => onUpdate({
                                            linkInBio: {
                                                ...portfolioData.linkInBio!,
                                                customStyle: {
                                                    ...portfolioData.linkInBio?.customStyle,
                                                    buttonShape: shape.id as any
                                                }
                                            }
                                        })}
                                        className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-[10px] transition-colors
                                    ${portfolioData.linkInBio?.customStyle?.buttonShape === shape.id
                                                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                                                : `border-transparent hover:bg-black/5 ${themeClasses.cardBg} ${themeClasses.textMuted}`
                                            }
                                `}
                                    >
                                        {shape.icon}
                                        {shape.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Button Layout (Alignment) */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                                <AlignLeft size={12} /> Button Text Alignment
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => onUpdate({
                                        linkInBio: {
                                            ...portfolioData.linkInBio!,
                                            customStyle: { ...portfolioData.linkInBio?.customStyle, buttonAlignment: 'center' }
                                        }
                                    })}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-xs transition-colors
                                ${portfolioData.linkInBio?.customStyle?.buttonAlignment === 'center' || !portfolioData.linkInBio?.customStyle?.buttonAlignment
                                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                                            : `border-transparent hover:bg-black/5 ${themeClasses.cardBg} ${themeClasses.textMuted}`
                                        }
                            `}
                                >
                                    <AlignCenter size={14} /> Center
                                </button>
                                <button
                                    onClick={() => onUpdate({
                                        linkInBio: {
                                            ...portfolioData.linkInBio!,
                                            customStyle: { ...portfolioData.linkInBio?.customStyle, buttonAlignment: 'left' }
                                        }
                                    })}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-xs transition-colors
                                ${portfolioData.linkInBio?.customStyle?.buttonAlignment === 'left'
                                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                                            : `border-transparent hover:bg-black/5 ${themeClasses.cardBg} ${themeClasses.textMuted}`
                                        }
                            `}
                                >
                                    <AlignLeft size={14} /> Left
                                </button>
                            </div>
                        </div>

                        {/* 4. Custom Colors */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                                <Palette size={12} /> Custom Colors
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className={`p-3 rounded-lg border ${themeClasses.cardBg}`}>
                                    <span className={`block text-[10px] mb-2 uppercase tracking-wide opacity-70 ${themeClasses.textMain}`}>Button Bg</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full border overflow-hidden ${editorTheme === 'dark' ? 'border-white/10' : 'border-gray-200'} relative`}>
                                            <input
                                                type="color"
                                                value={portfolioData.linkInBio?.customStyle?.buttonColor || '#ffffff'}
                                                onChange={(e) => onUpdate({
                                                    linkInBio: {
                                                        ...portfolioData.linkInBio!,
                                                        customStyle: { ...portfolioData.linkInBio?.customStyle, buttonColor: e.target.value }
                                                    }
                                                })}
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 cursor-pointer border-0"
                                            />
                                        </div>
                                        {portfolioData.linkInBio?.customStyle?.buttonColor && (
                                            <button
                                                onClick={() => onUpdate({
                                                    linkInBio: {
                                                        ...portfolioData.linkInBio!,
                                                        customStyle: { ...portfolioData.linkInBio?.customStyle, buttonColor: null as any }
                                                    }
                                                })}
                                                className="text-[10px] text-red-400 hover:text-red-500 underline"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className={`p-3 rounded-lg border ${themeClasses.cardBg}`}>
                                    <span className={`block text-[10px] mb-2 uppercase tracking-wide opacity-70 ${themeClasses.textMain}`}>Button Text</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full border overflow-hidden ${editorTheme === 'dark' ? 'border-white/10' : 'border-gray-200'} relative`}>
                                            <input
                                                type="color"
                                                value={portfolioData.linkInBio?.customStyle?.buttonTextColor || '#000000'}
                                                onChange={(e) => onUpdate({
                                                    linkInBio: {
                                                        ...portfolioData.linkInBio!,
                                                        customStyle: { ...portfolioData.linkInBio?.customStyle, buttonTextColor: e.target.value }
                                                    }
                                                })}
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 cursor-pointer border-0"
                                            />
                                        </div>
                                        {portfolioData.linkInBio?.customStyle?.buttonTextColor && (
                                            <button
                                                onClick={() => onUpdate({
                                                    linkInBio: {
                                                        ...portfolioData.linkInBio!,
                                                        customStyle: { ...portfolioData.linkInBio?.customStyle, buttonTextColor: null as any }
                                                    }
                                                })}
                                                className="text-[10px] text-red-400 hover:text-red-500 underline"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};

export default AppearanceControls;
