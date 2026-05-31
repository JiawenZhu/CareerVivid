import React from 'react';
import { Sparkles, X, Zap } from 'lucide-react';

type ActiveTab = 'edit' | 'generate' | 'style';
type Step = 'INPUT' | 'PREVIEW';

interface AIPortfolioModalHeaderProps {
    activeTab: ActiveTab;
    step: Step;
    isDark: boolean;
    onClose: () => void;
    onTabChange: (tab: ActiveTab) => void;
}

const tabs: { id: ActiveTab; label: string; title: string }[] = [
    { id: 'edit', label: '✏️ Edit', title: 'Edit Portfolio' },
    { id: 'generate', label: '📄 From Resume', title: 'Generate from Resume' },
    { id: 'style', label: '🎨 AI Style', title: 'CSS & Animation' },
];

const AIPortfolioModalHeader: React.FC<AIPortfolioModalHeaderProps> = ({
    activeTab,
    step,
    isDark,
    onClose,
    onTabChange,
}) => {
    return (
        <header className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/10 bg-[#0f1117]' : 'border-gray-100 bg-white'}`}>
            <div className="flex items-center gap-3 flex-wrap">
                <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-xl">
                    <Sparkles className="text-indigo-600 dark:text-indigo-400 fill-indigo-600/20" size={22} />
                </div>
                <div>
                    <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Portfolio Editor</h2>
                    <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Powered by Gemini 2.5 Flash <Zap size={10} className="text-yellow-400 fill-yellow-400" />
                    </p>
                </div>

                {step === 'INPUT' && (
                    <div className={`ml-4 flex rounded-xl p-1 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                title={tab.title}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? isDark ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 shadow-sm'
                                        : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X size={20} />
            </button>
        </header>
    );
};

export default AIPortfolioModalHeader;
