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
    precision?: number;
    onChange: (value: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({ label, icon, value, min, max, step, unit = '', precision, onChange }) => {
    const decimals = precision ?? (step < 1 ? Math.min(step.toString().split('.')[1]?.length || 1, 2) : 0);

    return (
    <div className="space-y-1.5">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                {icon}
                <span>{label}</span>
            </div>
            <span className="min-w-[52px] rounded-md bg-primary-50 px-2 py-0.5 text-right text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                {value.toFixed(decimals)}{unit}
            </span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:bg-gray-700"
        />
    </div>
    );
};

const DesignControls: React.FC<DesignControlsProps> = ({
    resume,
    activeTemplate,
    onDesignChange
}) => {
    const formatting = {
        ...DEFAULT_FORMATTING_SETTINGS,
        ...(resume.formattingSettings || {}),
    };

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
        <div className="animate-fade-in space-y-5">
            {/* Theme Color Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <label className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-100">
                    <Palette size={16} className="text-primary-500" /> Theme Color
                </label>
                <div className="flex flex-wrap gap-3">
                    {activeTemplate.availableColors.map(color => (
                        <button
                            key={color}
                            onClick={() => onDesignChange({ themeColor: color })}
                            className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${resume.themeColor === color ? 'border-white ring-2 ring-primary-500 ring-offset-2' : 'border-transparent shadow-sm'}`}
                            style={{ backgroundColor: color }}
                            title={color}
                            aria-label={`Use theme color ${color}`}
                        />
                    ))}
                </div>
            </div>

            {/* Typography Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <label className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-100">
                    <TypeIcon size={16} className="text-primary-500" /> Typography
                </label>
                <div className="space-y-3">
                    <div>
                        <span className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">Headings</span>
                        <select
                            value={resume.titleFont}
                            onChange={e => onDesignChange({ titleFont: e.target.value })}
                            className="w-full rounded-md border border-gray-200 bg-white p-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                        >
                            {FONTS.map(font => <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>)}
                        </select>
                    </div>
                    <div>
                        <span className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">Body Text</span>
                        <select
                            value={resume.bodyFont}
                            onChange={e => onDesignChange({ bodyFont: e.target.value })}
                            className="w-full rounded-md border border-gray-200 bg-white p-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                        >
                            {FONTS.map(font => <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Advanced Formatting Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="mb-4 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-100">
                        <SlidersHorizontal size={16} className="text-primary-500" /> Advanced Formatting
                    </label>
                    <button
                        onClick={resetFormatting}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-primary-400"
                        title="Reset to Default"
                    >
                        <RotateCcw size={12} /> Reset
                    </button>
                </div>

                <div className="space-y-4">
                    <SliderControl
                        label="Font Scale"
                        icon={<TypeIcon size={14} />}
                        value={formatting.bodyScale}
                        min={0.85}
                        max={1.2}
                        step={0.05}
                        unit="x"
                        precision={2}
                        onChange={(val) => updateFormatting('bodyScale', val)}
                    />

                    <SliderControl
                        label="Line Spacing"
                        icon={<MoveVertical size={14} />}
                        value={formatting.lineHeight}
                        min={1.0}
                        max={2.0}
                        step={0.1}
                        precision={1}
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
                        precision={2}
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
                        precision={2}
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
                        precision={2}
                        onChange={(val) => updateFormatting('pageMargin', val)}
                    />
                </div>
            </div>
        </div>
    );
};

export default DesignControls;
