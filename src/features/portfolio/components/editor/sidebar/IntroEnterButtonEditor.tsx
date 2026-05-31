import React from 'react';

interface IntroEnterButtonEditorProps {
    introConfig: any;
    themeClasses: any;
    onUpdate: (updates: any) => void;
}

const IntroEnterButtonEditor: React.FC<IntroEnterButtonEditorProps> = ({
    introConfig,
    themeClasses,
    onUpdate
}) => {
    return (
        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <label className={`text-xs font-semibold uppercase tracking-wider ${themeClasses.textMuted}`}>
                Enter Button
            </label>
            <div>
                <label className="text-xs text-gray-500 block mb-1">Button Text</label>
                <input
                    type="text"
                    value={introConfig.buttonText}
                    onChange={(event) => onUpdate({ buttonText: event.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${themeClasses.inputBg}`}
                />
            </div>
            <div>
                <label className="text-xs text-gray-500 block mb-1">Button Style</label>
                <div className="flex gap-2">
                    {['outline', 'solid', 'glass'].map((style) => (
                        <button
                            key={style}
                            onClick={() => onUpdate({ buttonStyle: style })}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${introConfig.buttonStyle === style
                                ? 'bg-pink-50 border-pink-200 text-pink-600 dark:bg-pink-900/30 dark:border-pink-800 dark:text-pink-400'
                                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                                }`}
                        >
                            {style.charAt(0).toUpperCase() + style.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default IntroEnterButtonEditor;
