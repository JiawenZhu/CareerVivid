import React from 'react';
import { ArrowRight, Instagram, Twitter, Youtube } from 'lucide-react';
import { navigate } from '../../../../App';

interface TemplateCardProps {
    id: string;
    name: string;
    category: string;
    thumbnailSrc?: string;
    previewStyle?: React.CSSProperties;
    onSelect?: () => void;
    avatarUrl?: string;
    userName?: string;
    sampleLinks?: string[];
}

const TemplateCard: React.FC<TemplateCardProps> = ({
    id, name, category, thumbnailSrc, previewStyle, onSelect,
    avatarUrl, userName, sampleLinks
}) => {
    return (
        <div className="group relative rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300">
            {/* Thumbnail */}
            <div className="aspect-[4/5] relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                {thumbnailSrc ? (
                    <img
                        src={thumbnailSrc}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div
                        className="absolute inset-0 flex flex-col items-center pt-8 px-6 text-center transition-transform duration-500 group-hover:scale-105"
                        style={previewStyle || {}}
                    >
                        {/* Avatar */}
                        {avatarUrl && (
                            <div className="w-16 h-16 rounded-full border-2 border-current/20 mb-3 overflow-hidden shadow-sm flex-shrink-0">
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                        )}

                        {/* Name */}
                        {userName && (
                            <div className="mb-6">
                                <h3 className="font-bold text-sm tracking-wide opacity-95">{userName}</h3>
                                <p className="opacity-75 text-[10px] uppercase tracking-wider mt-0.5 font-medium">Product Designer</p>
                            </div>
                        )}

                        {!previewStyle && (
                            <>
                                <span className="text-4xl mb-2">✨</span>
                                <span className="text-gray-400 font-medium">Preview Coming Soon</span>
                            </>
                        )}

                        {/* Mock Buttons for Preview Effect */}
                        {previewStyle && (
                            <div className="w-full max-w-[85%] flex flex-col gap-2.5 opacity-90">
                                {sampleLinks ? sampleLinks.map((link, i) => (
                                    <div key={i} className="h-9 px-3 rounded-lg bg-current/10 backdrop-blur-md border border-current/10 shadow-sm w-full flex items-center justify-center transition-transform hover:scale-[1.02]">
                                        <span className="text-[10px] font-semibold opacity-90">{link}</span>
                                    </div>
                                )) : (
                                    <>
                                        <div className="h-10 rounded-lg bg-current/5 backdrop-blur-sm border border-current/10 shadow-sm w-full"></div>
                                        <div className="h-10 rounded-lg bg-current/5 backdrop-blur-sm border border-current/10 shadow-sm w-full"></div>
                                        <div className="h-10 rounded-lg bg-current/5 backdrop-blur-sm border border-current/10 shadow-sm w-full"></div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Social Icons Row - Linktree Style */}
                        {previewStyle && (
                            <div className="flex gap-3 mt-auto mb-4 opacity-70">
                                <Instagram size={14} className="opacity-80" />
                                <Twitter size={14} className="opacity-80" />
                                <Youtube size={14} className="opacity-80" />
                            </div>
                        )}
                    </div>
                )}

                {/* Hover Overlay - Linktree Style */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-[3px]">
                    <p className="text-white/80 text-sm mb-2 transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300">Explore</p>
                    <h4 className="text-white font-bold text-xl mb-4 transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">{name}</h4>
                    <button
                        onClick={onSelect}
                        className="px-6 py-3 bg-white text-gray-900 rounded-full font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100 flex items-center gap-2 hover:bg-gray-100 shadow-lg"
                    >
                        Use Template
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 bg-white dark:bg-gray-800 z-10 relative">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>
                            {category}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateCard;
