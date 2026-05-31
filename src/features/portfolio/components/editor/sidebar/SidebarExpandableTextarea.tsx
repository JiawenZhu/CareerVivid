import React, { useState } from 'react';

interface SidebarExpandableTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    editorTheme: 'light' | 'dark';
    compactRows?: number;
    expandedRows?: number;
}

const SidebarExpandableTextarea: React.FC<SidebarExpandableTextareaProps> = ({
    editorTheme,
    compactRows = 2,
    expandedRows = 9,
    className = '',
    onFocus,
    onBlur,
    value,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const textLength = typeof value === 'string' ? value.length : 0;

    const compactTheme = editorTheme === 'dark'
        ? 'border-white/10 bg-black/10 text-gray-400 placeholder:text-gray-600'
        : 'border-transparent bg-gray-100 text-gray-600 placeholder:text-gray-400';

    const focusedTheme = editorTheme === 'dark'
        ? 'border-indigo-400/60 bg-[#0f1117] text-white shadow-[0_18px_50px_rgba(0,0,0,0.32)] ring-4 ring-indigo-500/10'
        : 'border-indigo-500 bg-white text-gray-950 shadow-[0_18px_50px_rgba(79,70,229,0.16)] ring-4 ring-indigo-100';

    return (
        <div className={`relative ${isFocused ? 'z-20' : ''}`}>
            <textarea
                {...props}
                value={value}
                rows={isFocused ? expandedRows : compactRows}
                onFocus={(event) => {
                    setIsFocused(true);
                    onFocus?.(event);
                }}
                onBlur={(event) => {
                    setIsFocused(false);
                    onBlur?.(event);
                }}
                className={[
                    'w-full resize-none rounded-xl border px-3 py-2 text-sm leading-6 outline-none transition-all duration-200',
                    isFocused ? focusedTheme : compactTheme,
                    isFocused ? 'min-h-[220px]' : 'min-h-[58px]',
                    className
                ].join(' ')}
            />
            {isFocused && (
                <div className={`pointer-events-none absolute bottom-2 right-3 rounded-full px-2 py-1 text-[10px] font-semibold ${
                    editorTheme === 'dark'
                        ? 'bg-white/10 text-gray-300'
                        : 'bg-indigo-50 text-indigo-600'
                }`}>
                    {textLength} characters
                </div>
            )}
        </div>
    );
};

export default SidebarExpandableTextarea;
