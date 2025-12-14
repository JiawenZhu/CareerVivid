import React from 'react';
import { ChevronLeft, Monitor, Smartphone, Share2, Sparkles, Sun, Moon } from 'lucide-react';

interface PortfolioHeaderProps {
    title: string;
    onTitleChange: (newTitle: string) => void;
    editorTheme: 'light' | 'dark';
    onToggleTheme: () => void;
    activeDevice: 'desktop' | 'mobile';
    isRefinementBarVisible: boolean;
    onBack: () => void;
    onDeviceChange: (device: 'desktop' | 'mobile') => void;
    onToggleRefinementBar: () => void;
    onShare: () => void;
}

const PortfolioHeader: React.FC<PortfolioHeaderProps> = ({
    title,
    onTitleChange,
    editorTheme,
    onToggleTheme,
    activeDevice,
    isRefinementBarVisible,
    onBack,
    onDeviceChange,
    onToggleRefinementBar,
    onShare
}) => {
    return (
        <div className={`h-14 border-b px-4 flex items-center justify-between shrink-0 z-20 transition-colors
            ${editorTheme === 'dark' ? 'bg-[#0f1117] border-white/5' : 'bg-white border-gray-200'}
        `}>
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className={`p-2 rounded-lg transition-colors ${editorTheme === 'dark' ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                    title="Back to Dashboard"
                >
                    <ChevronLeft size={20} />
                </button>
                <input
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className={`font-semibold text-sm bg-transparent outline-none min-w-[200px] transition-colors
                        ${editorTheme === 'dark' ? 'text-gray-300 focus:text-white' : 'text-gray-700 focus:text-black'}
                    `}
                    placeholder="Enter Portfolio Title"
                />
            </div>

            {/* Device Toggle */}
            <div className={`flex rounded-lg p-1 border transition-colors ${editorTheme === 'dark' ? 'bg-[#1a1d24] border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                <button
                    onClick={() => onDeviceChange('desktop')}
                    className={`p-1.5 rounded-md transition-all ${activeDevice === 'desktop' ? 'bg-indigo-600 text-white shadow-md' : (editorTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black')}`}
                    title="Desktop View"
                >
                    <Monitor size={18} />
                </button>
                <button
                    onClick={() => onDeviceChange('mobile')}
                    className={`p-1.5 rounded-md transition-all ${activeDevice === 'mobile' ? 'bg-indigo-600 text-white shadow-md' : (editorTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black')}`}
                    title="Mobile View"
                >
                    <Smartphone size={18} />
                </button>
            </div>

            <div className="flex items-center gap-2">
                {/* Editor Theme Toggle */}
                <button
                    onClick={onToggleTheme}
                    className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium
                        ${editorTheme === 'dark' ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}
                    `}
                    title={`Switch to ${editorTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                    {editorTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Re-open Refinement Bar if closed */}
                {!isRefinementBarVisible && (
                    <button
                        onClick={onToggleRefinementBar}
                        className="px-3 py-2 bg-indigo-500/10 text-indigo-400 text-sm font-semibold rounded-lg hover:bg-indigo-500/20 flex items-center gap-2 transition-colors"
                    >
                        <Sparkles size={16} />
                        AI Refine
                    </button>
                )}

                <button
                    onClick={onShare}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 border transition-colors
                        ${editorTheme === 'dark'
                            ? 'bg-white text-black hover:bg-gray-200 border-transparent'
                            : 'bg-black text-white hover:bg-gray-800 border-transparent'}
                    `}
                >
                    <Share2 size={16} />
                    Share
                </button>
            </div>
        </div>
    );
};

export default PortfolioHeader;
