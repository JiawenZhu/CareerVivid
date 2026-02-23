import React from 'react';

interface SidebarHeaderProps {
    activeSectionLabel: string;
    onTogglePreview?: () => void;
    viewMode: 'edit' | 'preview';
    editorTheme: 'light' | 'dark';
    themeClasses: any;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
    activeSectionLabel,
    onTogglePreview,
    viewMode,
    editorTheme,
    themeClasses
}) => {
    return (
        <div className={`sticky top-0 z-30 px-4 py-3 border-b flex items-center justify-between backdrop-blur-md ${editorTheme === 'dark' ? 'bg-[#0f1117]/80 border-white/5' : 'bg-white/80 border-gray-200'}`}>
            <h2 className={`font-semibold text-sm ${themeClasses.textMain}`}>
                {activeSectionLabel}
            </h2>
            <button
                onClick={() => onTogglePreview?.()}
                className={`p-2 rounded-full ${editorTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'}`}
            >
                <span className="sr-only">Preview</span>
                {/* Toggle Icon */}
                <div className="w-5 h-5 flex items-center justify-center">
                    {viewMode === 'edit' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    )}
                </div>
            </button>
        </div>
    );
};

export default SidebarHeader;
