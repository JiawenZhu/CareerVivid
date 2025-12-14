import React from 'react';
import { Loader2, Check } from 'lucide-react';
import { TemplateInfo, ResumeData } from '../../../types';
import TemplateThumbnail from './TemplateThumbnail';

interface TemplateSelectorProps {
    templates: TemplateInfo[];
    activeTemplate: TemplateInfo;
    sampleResume: ResumeData;
    isLoading: boolean;
    onSelect: (template: TemplateInfo) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
    templates,
    activeTemplate,
    sampleResume,
    isLoading,
    onSelect
}) => {
    return (
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
            {templates.map(template => (
                <div
                    key={template.id}
                    onClick={() => onSelect(template)}
                    className={`rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${activeTemplate.id === template.id ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'}`}
                >
                    <div className="p-2 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-600">
                        <h3 className="text-sm font-semibold text-center">{template.name}</h3>
                    </div>
                    <div className="relative group">
                        <TemplateThumbnail resume={sampleResume} template={template} />
                        {activeTemplate.id === template.id && (
                            <div className="absolute inset-0 bg-primary-500/10 flex items-center justify-center">
                                <div className="bg-primary-600 text-white rounded-full p-1 shadow-lg">
                                    <Check size={20} />
                                </div>
                            </div>
                        )}
                        {isLoading && activeTemplate.id === template.id && (
                            <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center">
                                <Loader2 className="animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TemplateSelector;
