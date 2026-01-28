import React from 'react';
import { ArrowRight, Instagram, Twitter, Youtube } from 'lucide-react';
import { navigate } from '../../../../utils/navigation';

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
    variant?: 'default' | 'brutalist';
}

const TemplateCard: React.FC<TemplateCardProps> = ({
    id, name, category, thumbnailSrc, previewStyle, onSelect,
    avatarUrl, userName, userBio, sampleLinks, variant = 'default'
}) => {
    const isBrutalist = variant === 'brutalist';

    return (
        <div className={`group relative overflow-hidden transition-all duration-300 ${isBrutalist
            ? 'bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]'
            : 'rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl'
            }`}>
            {/* Thumbnail */}
            <div className={`aspect-[4/5] relative overflow-hidden ${isBrutalist ? 'bg-white border-b-4 border-black' : 'bg-gray-100 dark:bg-gray-900'}`}>
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
                            <div className={`w-16 h-16 rounded-full border-2 border-current/20 mb-3 overflow-hidden flex-shrink-0 ${isBrutalist ? 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-black' : 'shadow-sm'}`}>
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                        )}

                        {/* Name */}
                        {userName && (
                            <div className="mb-6">
                                <h3 className="font-bold text-sm tracking-wide opacity-95">{userName}</h3>
                                {userBio && (
                                    <p className="text-[10px] mt-1 opacity-80 leading-tight max-w-[90%] mx-auto">{userBio}</p>
                                )}
                                {!userBio && <p className="opacity-75 text-[10px] uppercase tracking-wider mt-0.5 font-medium">Product Designer</p>}
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
                                    <div key={i} className={`h-9 px-3 bg-current/10 backdrop-blur-md border border-current/10 w-full flex items-center justify-center transition-transform hover:scale-[1.02] ${isBrutalist ? 'rounded-none border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'rounded-lg shadow-sm'}`}>
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
                <div className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-[3px]`}>
                    <p className="text-white/80 text-sm mb-2 transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300">Explore</p>
                    <h4 className="text-white font-bold text-xl mb-4 transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">{name}</h4>
                    <button
                        onClick={onSelect}
                        className={`px-6 py-3 bg-white text-gray-900 font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100 flex items-center gap-2 hover:bg-gray-100 ${isBrutalist ? 'border-2 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] rounded-none' : 'rounded-full shadow-lg'}`}
                    >
                        Use Template
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className={`relative z-10 ${isBrutalist ? 'p-4 bg-white' : 'p-4 bg-white dark:bg-gray-800'}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className={`font-bold text-lg ${isBrutalist ? 'text-black uppercase tracking-tight' : 'text-gray-900 dark:text-white'}`}>{name}</h3>
                        <p className={`text-sm capitalize flex items-center gap-1 mt-1 ${isBrutalist ? 'text-gray-900 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${isBrutalist ? 'bg-black' : 'bg-indigo-500'}`}></span>
                            {category}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateCard;
