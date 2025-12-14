import React from 'react';
import { Palette, Type as TypeIcon } from 'lucide-react';
import { TemplateInfo, ResumeData } from '../../../types';
import { FONTS } from '../../../constants';

interface DesignControlsProps {
    resume: ResumeData;
    activeTemplate: TemplateInfo;
    onDesignChange: (updatedData: Partial<ResumeData>) => void;
}

const DesignControls: React.FC<DesignControlsProps> = ({
    resume,
    activeTemplate,
    onDesignChange
}) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700">
                <label className="text-sm font-bold flex items-center gap-2 mb-4">
                    <Palette size={16} className="text-primary-500" /> Theme Color
                </label>
                <div className="flex flex-wrap gap-3">
                    {activeTemplate.availableColors.map(color => (
                        <button
                            key={color}
                            onClick={() => onDesignChange({ themeColor: color })}
                            className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${resume.themeColor === color ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent shadow-sm'}`}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700">
                <label className="text-sm font-bold flex items-center gap-2 mb-4">
                    <TypeIcon size={16} className="text-primary-500" /> Typography
                </label>
                <div className="space-y-4">
                    <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Headings</span>
                        <select
                            value={resume.titleFont}
                            onChange={e => onDesignChange({ titleFont: e.target.value })}
                            className="w-full p-2.5 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-2 focus:ring-primary-500"
                        >
                            {FONTS.map(font => <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>)}
                        </select>
                    </div>
                    <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Body Text</span>
                        <select
                            value={resume.bodyFont}
                            onChange={e => onDesignChange({ bodyFont: e.target.value })}
                            className="w-full p-2.5 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-2 focus:ring-primary-500"
                        >
                            {FONTS.map(font => <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignControls;
