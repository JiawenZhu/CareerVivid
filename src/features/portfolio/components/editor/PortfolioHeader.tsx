import React from 'react';
import { ChevronLeft, Monitor, Smartphone, Share2, Sun, Moon, BarChart3, Store, X, Wand2 } from 'lucide-react';

interface PortfolioHeaderProps {
    title: string;
    onTitleChange: (newTitle: string) => void;
    editorTheme: 'light' | 'dark';
    onToggleTheme: () => void;
    surfaceMode?: 'portfolio' | 'linkinbio' | 'business_card';

    activeDevice: 'desktop' | 'mobile';
    onBack: () => void;
    onDeviceChange: (device: 'desktop' | 'mobile') => void;

    // View State
    activeView: 'editor' | 'analytics' | 'commerce';
    onViewChange: (view: 'editor' | 'analytics' | 'commerce') => void;

    onShare: () => void;
    onAIEdit?: () => void;
}

const PortfolioHeader: React.FC<PortfolioHeaderProps> = ({
    title,
    onTitleChange,
    editorTheme,
    onToggleTheme,
    surfaceMode = 'portfolio',
    activeDevice,
    onBack,
    onDeviceChange,
    activeView,
    onViewChange,
    onShare,
    onAIEdit,
}) => {
    const showCommerceHub = surfaceMode === 'linkinbio';

    return (
        <div className={`min-h-14 border-b px-3 md:px-4 grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(180px,1fr)_auto_auto] items-center gap-2 shrink-0 z-20 transition-colors
            ${editorTheme === 'dark' ? 'bg-[#0f1117] border-white/5' : 'bg-white border-gray-200'}
        `}>
            {/* Left: Back & Title */}
            <div className="flex items-center gap-2 min-w-0">
                <button
                    onClick={onBack}
                    className={`p-2 rounded-lg shrink-0 transition-colors ${editorTheme === 'dark' ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                    title="Back to Dashboard"
                >
                    <ChevronLeft size={20} />
                </button>
                <input
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className={`font-semibold text-sm bg-transparent outline-none w-full min-w-0 truncate transition-colors rounded-md px-2 py-1.5 border
                        ${editorTheme === 'dark' ? 'text-gray-300 focus:text-white' : 'text-gray-700 focus:text-black'}
                        ${editorTheme === 'dark' ? 'border-white/10 focus:border-indigo-500/60' : 'border-gray-200 focus:border-indigo-300'}
                    `}
                    placeholder="Enter Portfolio Title"
                />
            </div>

            {/* Center: Device Toggle */}
            <div className="hidden md:flex items-center justify-center shrink-0">
                {/* Device Toggle (Hidden on Mobile Viewport) */}
                <div className={`flex rounded-lg p-1 border transition-colors shrink-0
                    ${editorTheme === 'dark' ? 'bg-[#1a1d24] border-white/5' : 'bg-gray-100 border-gray-200'}
                `}>
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
            </div>

            {/* Right: Actions */}
            <div className="flex min-w-0 items-center justify-end gap-1 overflow-x-auto md:gap-2 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {/* AI Portfolio Edit Button */}
                    <button
                        onClick={onAIEdit}
                        className={`p-2 md:px-3 md:py-2 text-sm font-medium rounded-lg flex items-center gap-2 border transition-all
                            ${editorTheme === 'dark'
                                ? 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border-indigo-500/30 hover:border-indigo-500/60'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200 hover:border-indigo-400'
                            }
                        `}
                        title="AI Portfolio Editor"
                    >
                        <Wand2 size={16} />
                        <span className="hidden lg:inline font-semibold">AI Edit</span>
                    </button>

                    {/* Editor Theme Toggle */}
                    <button
                        onClick={onToggleTheme}
                        className={`p-2 rounded-lg transition-colors flex items-center justify-center text-sm font-medium
                            ${editorTheme === 'dark' ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}
                        `}
                        title={`Switch to ${editorTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
                    >
                        {editorTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    {showCommerceHub && (
                        <button
                            onClick={() => onViewChange(activeView === 'commerce' ? 'editor' : 'commerce')}
                            className={`p-2 md:px-3 md:py-2 text-sm font-medium rounded-lg flex items-center gap-2 border transition-all
                                ${activeView === 'commerce'
                                    ? 'bg-indigo-600 text-white border-transparent shadow-sm'
                                    : (editorTheme === 'dark' ? 'hover:bg-white/5 text-gray-400 hover:text-white border-transparent' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent')
                                }
                            `}
                            title={activeView === 'commerce' ? "Close Commerce Hub" : "Commerce Hub"}
                        >
                            {activeView === 'commerce' ? <X size={18} /> : <Store size={18} />}
                            <span className="hidden lg:inline">{activeView === 'commerce' ? 'Close' : 'Commerce Hub'}</span>
                        </button>
                    )}

                    {/* Analytics Toggle */}
                    <button
                        onClick={() => onViewChange(activeView === 'analytics' ? 'editor' : 'analytics')}
                        className={`p-2 md:px-3 md:py-2 text-sm font-medium rounded-lg flex items-center gap-2 border transition-all
                            ${activeView === 'analytics'
                                ? 'bg-indigo-600 text-white border-transparent shadow-sm'
                                : (editorTheme === 'dark' ? 'hover:bg-white/5 text-gray-400 hover:text-white border-transparent' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent')
                            }
                        `}
                        title={activeView === 'analytics' ? "Close Analytics" : "User Engagement & Analytics"}
                    >
                        {activeView === 'analytics' ? <X size={18} /> : <BarChart3 size={18} />}
                        <span className="hidden lg:inline">{activeView === 'analytics' ? 'Close' : 'Analytics'}</span>
                    </button>

                    <div className={`w-px h-6 mx-1 ${editorTheme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />

                    <button
                        onClick={onShare}
                        className={`p-2 md:px-4 md:py-2 text-sm font-semibold rounded-lg flex items-center gap-2 border transition-colors
                            ${editorTheme === 'dark'
                                ? 'bg-white text-black hover:bg-gray-200 border-transparent'
                                : 'bg-black text-white hover:bg-gray-800 border-transparent'}
                        `}
                        title="Share"
                    >
                        <Share2 size={16} />
                        <span className="hidden lg:inline">Share</span>
                    </button>
            </div>
        </div>
    );
};

export default PortfolioHeader;
