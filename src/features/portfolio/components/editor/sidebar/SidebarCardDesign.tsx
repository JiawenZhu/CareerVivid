import React from 'react';
import { PortfolioData } from '../../../types/portfolio';
import { CARD_TEMPLATES } from '../../../constants/cardTemplates';
import { Check, Image as ImageIcon } from 'lucide-react';

interface SidebarCardDesignProps {
    portfolioData: PortfolioData;
    onUpdate: (data: Partial<PortfolioData>) => void;
    editorTheme: 'light' | 'dark';
}

const SidebarCardDesign: React.FC<SidebarCardDesignProps> = ({ portfolioData, onUpdate, editorTheme }) => {

    // Group templates by category
    const categories = {
        'Minimal': ['card_minimal', 'card_modern', 'card_photo'],
        'Neo-Brutalism': ['brutalist_yellow', 'brutalist_pink', 'brutalist_blue', 'brutalist_orange', 'brutalist_bw'],
        'Professional': ['pro_executive', 'pro_clean', 'tech_future'],
        'Creative': ['creative_gradient', 'card_creative_dark', 'nature_calm', 'abstract_art']
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <h3 className="text-sm font-semibold text-indigo-400 mb-1">Card Templates</h3>
                <p className="text-xs text-gray-400">Choose a style for your NFC digital card.</p>
            </div>

            {Object.entries(categories).map(([categoryName, templateIds]) => (
                <div key={categoryName} className="space-y-3">
                    <h4 className={`text-xs font-semibold uppercase ${editorTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        {categoryName}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        {templateIds.map(id => {
                            const template = CARD_TEMPLATES[id];
                            if (!template) return null;

                            const isSelected = portfolioData.templateId === id;
                            const isPhotoMode = isSelected && portfolioData.businessCard?.usePhotoBackground;

                            // Handler for main click (Standard Theme)
                            const handleSelectTheme = () => {
                                onUpdate({
                                    templateId: id as any,
                                    businessCard: {
                                        ...portfolioData.businessCard,
                                        orientation: portfolioData.businessCard?.orientation || 'horizontal',
                                        usePhotoBackground: false // Default to standard mode
                                    }
                                });
                            };

                            // Handler for Photo Toggle
                            const handleTogglePhoto = (e: React.MouseEvent) => {
                                e.stopPropagation(); // Prevent parent click
                                onUpdate({
                                    templateId: id as any,
                                    businessCard: {
                                        ...portfolioData.businessCard,
                                        orientation: portfolioData.businessCard?.orientation || 'horizontal',
                                        usePhotoBackground: true // Force photo mode
                                    }
                                });
                            };

                            return (
                                <div key={id} className="relative group">
                                    <button
                                        onClick={handleSelectTheme}
                                        className={`
                                            w-full relative overflow-hidden rounded-lg aspect-[1.58] border transition-all duration-200 text-left
                                            ${isSelected && !isPhotoMode
                                                ? 'ring-2 ring-indigo-500 border-transparent shadow-lg shadow-indigo-500/20'
                                                : editorTheme === 'dark' ? 'border-white/10 hover:border-white/30' : 'border-gray-200 hover:border-gray-400'}
                                        `}
                                    >
                                        {/* Preview Background */}
                                        <div
                                            className="absolute inset-0 z-0 bg-cover bg-center transition-opacity"
                                            style={{
                                                backgroundColor: template.baseColor || '#1a1a1a',
                                                backgroundImage: template.textureUrl ? `url(${template.textureUrl})` : undefined
                                            }}
                                        />

                                        {/* Overlay Styles */}
                                        {template.overlayStyle.glass && (
                                            <div className="absolute inset-0 z-10" style={{
                                                backdropFilter: `blur(${template.overlayStyle.blur}px)`,
                                                backgroundColor: `rgba(255,255,255,${template.overlayStyle.opacity * 0.1})`,
                                                background: template.overlayStyle.gradient
                                            }} />
                                        )}
                                        {template.overlayStyle.border && (
                                            <div className="absolute inset-2 z-20 pointer-events-none" style={{ border: template.overlayStyle.border }} />
                                        )}

                                        {/* Label */}
                                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent z-30 flex items-center justify-between">
                                            <span className="text-white text-xs font-medium drop-shadow-md">{template.label}</span>
                                        </div>

                                        {/* Standard Selection Check */}
                                        {isSelected && !isPhotoMode && (
                                            <div className="absolute top-2 right-2 z-40 bg-indigo-500 text-white rounded-full p-1 shadow-md">
                                                <Check size={12} />
                                            </div>
                                        )}
                                    </button>

                                    {/* Photo Mode Toggle (Bottom Right/Overlay) */}
                                    <button
                                        onClick={handleTogglePhoto}
                                        className={`
                                            absolute bottom-2 right-2 z-50 p-1.5 rounded-md transition-all shadow-sm border
                                            ${isPhotoMode
                                                ? 'bg-indigo-500 text-white border-indigo-500 shadow-indigo-500/30'
                                                : 'bg-white/90 text-gray-500 border-gray-200 hover:bg-white hover:text-indigo-600'}
                                        `}
                                        title="Use Photo Background"
                                    >
                                        <ImageIcon size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div >
    );
};

export default SidebarCardDesign;
