import React from 'react';
import { Palette, Type as TypeIcon, SlidersHorizontal, RotateCcw, MoveVertical, AlignVerticalSpaceAround, Pilcrow, Square } from 'lucide-react';
import { TemplateInfo, ResumeData, FormattingSettings, DEFAULT_FORMATTING_SETTINGS } from '../../../types';
import { FONTS } from '../../../constants';

interface DesignControlsProps {
    resume: ResumeData;
    activeTemplate: TemplateInfo;
    onDesignChange: (updatedData: Partial<ResumeData>) => void;
}

interface SliderControlProps {
    label: string;
    icon: React.ReactNode;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    onChange: (value: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({ label, icon, value, min, max, step, unit = '', onChange }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                {icon}
                <span>{label}</span>
            </div>
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded">
                {value.toFixed(step < 1 ? (step.toString().split('.')[1]?.length || 1) : 0)}{unit}
            </span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
    </div>
);

const DesignControls: React.FC<DesignControlsProps> = ({
    resume,
    activeTemplate,
    onDesignChange
}) => {
    const formatting = resume.formattingSettings || DEFAULT_FORMATTING_SETTINGS;

    const updateFormatting = (key: keyof FormattingSettings, value: number) => {
        onDesignChange({
            formattingSettings: {
                ...formatting,
                [key]: value,
            }
        });
    };

    const resetFormatting = () => {
        onDesignChange({ formattingSettings: { ...DEFAULT_FORMATTING_SETTINGS } });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Theme Color Section */}
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

            {/* Typography Section */}
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

            {/* Advanced Formatting Section */}
            <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-bold flex items-center gap-2">
                        <SlidersHorizontal size={16} className="text-primary-500" /> Advanced Formatting
                    </label>
                    <button
                        onClick={resetFormatting}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                        title="Reset to Default"
                    >
                        <RotateCcw size={12} /> Reset
                    </button>
                </div>

                <div className="space-y-5">
                    <SliderControl
                        label="Font Scale"
                        icon={<TypeIcon size={14} />}
                        value={formatting.bodyScale}
                        min={0.85}
                        max={1.2}
                        step={0.05}
                        unit="x"
                        onChange={(val) => updateFormatting('bodyScale', val)}
                    />

                    <SliderControl
                        label="Line Spacing"
                        icon={<MoveVertical size={14} />}
                        value={formatting.lineHeight}
                        min={1.0}
                        max={2.0}
                        step={0.1}
                        onChange={(val) => updateFormatting('lineHeight', val)}
                    />

                    <SliderControl
                        label="Section Spacing"
                        icon={<AlignVerticalSpaceAround size={14} />}
                        value={formatting.sectionGap}
                        min={0.5}
                        max={3}
                        step={0.25}
                        unit="rem"
                        onChange={(val) => updateFormatting('sectionGap', val)}
                    />

                    <SliderControl
                        label="Paragraph Spacing"
                        icon={<Pilcrow size={14} />}
                        value={formatting.paragraphGap}
                        min={0}
                        max={1}
                        step={0.125}
                        unit="rem"
                        onChange={(val) => updateFormatting('paragraphGap', val)}
                    />

                    <SliderControl
                        label="Page Margins"
                        icon={<Square size={14} />}
                        value={formatting.pageMargin}
                        min={1}
                        max={4}
                        step={0.25}
                        unit="rem"
                        onChange={(val) => updateFormatting('pageMargin', val)}
                    />
                </div>
            </div>
        </div>
    );
};

export default DesignControls;

