import React from 'react';
import { Loader2, Check } from 'lucide-react';
import { TemplateInfo, ResumeData } from '../../../types';
import TemplateThumbnail from './TemplateThumbnail';

interface TemplateSelectorProps {
    templates: TemplateInfo[];
    activeTemplate: TemplateInfo;
    sampleResume: ResumeData;
    isLoading: boolean;
    activeColor: string;
    onSelect: (template: TemplateInfo) => void;
    onColorSelect: (color: string) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
    templates,
    activeTemplate,
    sampleResume,
    isLoading,
    activeColor,
    onSelect,
    onColorSelect
}) => {
    return (
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
            {templates.map(template => (
                <div
                    key={template.id}
                    onClick={() => onSelect(template)}
                    className={`rounded-xl overflow-hidden cursor-pointer border-2 transition-all flex flex-col bg-white dark:bg-gray-800 ${
                        activeTemplate.id === template.id 
                            ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-950/30' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    }`}
                >
                    {/* Header */}
                    <div className="p-2 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                        <h3 className="text-xs font-bold text-center text-gray-800 dark:text-gray-200">
                            {template.name}
                        </h3>
                    </div>

                    {/* Thumbnail */}
                    <div className="relative group flex-grow">
                        <TemplateThumbnail resume={sampleResume} template={template} />
                        {activeTemplate.id === template.id && (
                            <div className="absolute inset-0 bg-primary-500/5 flex items-center justify-center">
                                <div className="bg-primary-600 text-white rounded-full p-1 shadow-lg">
                                    <Check size={16} />
                                </div>
                            </div>
                        )}
                        {isLoading && activeTemplate.id === template.id && (
                            <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center">
                                <Loader2 className="animate-spin text-primary-500" size={20} />
                            </div>
                        )}
                    </div>

                    {/* Inline Color Palette Selectors */}
                    <div 
                        className="p-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center gap-1.5 flex-wrap"
                        onClick={(e) => e.stopPropagation()} // Stop propagation so clicking blank space in swatch doesn't trigger card selection again
                    >
                        {template.availableColors.map(color => {
                            const isSelectedColor = activeTemplate.id === template.id && activeColor === color;
                            return (
                                <button
                                    key={color}
                                    onClick={() => {
                                        onSelect(template);
                                        onColorSelect(color);
                                    }}
                                    className={`w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600 transition-all hover:scale-125 hover:shadow-sm active:scale-95 ${
                                        isSelectedColor 
                                            ? 'ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-gray-800 scale-110 border-transparent shadow' 
                                            : 'opacity-85 hover:opacity-100'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                    aria-label={`Set theme color to ${color}`}
                                />
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TemplateSelector;
