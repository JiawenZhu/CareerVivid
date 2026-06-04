import React from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import type { RewriteState } from './AIOptimizerPanelTypes';

interface AIRewriteSuggestionCardProps {
    jobId: string;
    bulletIndex: number;
    rewrite: RewriteState;
    loadingKey: string;
    themeColorClass: string;
    headerText: string;
    isRefining: boolean;
    userPrompt: string;
    onTextareaChange: (loadingKey: string, value: string) => void;
    onPromptChange: (loadingKey: string, value: string) => void;
    onRefine: (jobId: string, bulletIndex: number, currentText: string, userPrompt: string) => void;
    onApply: (jobId: string, bulletIndex: number, newText: string) => void;
    onCancel: (loadingKey: string) => void;
}

const getThemeClasses = (themeColorClass: string) => {
    if (themeColorClass === 'purple') {
        return {
            card: 'bg-purple-500/[0.03] border-purple-500/10 dark:border-purple-500/20',
            label: 'text-purple-600 dark:text-purple-400',
        };
    }
    if (themeColorClass === 'indigo') {
        return {
            card: 'bg-indigo-500/[0.03] border-indigo-500/10 dark:border-indigo-500/20',
            label: 'text-indigo-600 dark:text-indigo-400',
        };
    }
    return {
        card: 'bg-blue-500/[0.03] border-blue-500/10 dark:border-blue-500/20',
        label: 'text-blue-600 dark:text-blue-400',
    };
};

const AIRewriteSuggestionCard: React.FC<AIRewriteSuggestionCardProps> = ({
    jobId,
    bulletIndex,
    rewrite,
    loadingKey,
    themeColorClass,
    headerText,
    isRefining,
    userPrompt,
    onTextareaChange,
    onPromptChange,
    onRefine,
    onApply,
    onCancel,
}) => {
    const theme = getThemeClasses(themeColorClass);

    return (
        <div className={`border rounded-xl p-3.5 space-y-3.5 animate-in fade-in duration-200 ${theme.card}`}>
            <div className={`flex items-center gap-1.5 text-[10px] font-bold ${theme.label}`}>
                {isRefining ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                <span>{isRefining ? 'ADJUSTING WITH AI...' : headerText}</span>
            </div>

            <div className="space-y-1">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Edit suggested text (adjust numbers or achievements inline):</span>
                <textarea
                    value={rewrite.editedText}
                    onChange={(event) => onTextareaChange(loadingKey, event.target.value)}
                    disabled={isRefining}
                    className="w-full text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg p-2.5 min-h-[90px] leading-relaxed resize-y focus:outline-none transition-all duration-150 disabled:opacity-50"
                    placeholder="Suggested rewrite text..."
                />
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal italic">"{rewrite.explanation}"</p>

            <div className="pt-1.5 border-t border-gray-100 dark:border-gray-800/80 space-y-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Ask AI to adjust this rewrite:</span>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="e.g., 'Make it shorter', 'Focus on leadership', 'Tweak numbers'"
                        value={userPrompt}
                        onChange={(event) => onPromptChange(loadingKey, event.target.value)}
                        disabled={isRefining}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && userPrompt.trim()) {
                                onRefine(jobId, bulletIndex, rewrite.editedText, userPrompt);
                            }
                        }}
                        className="flex-grow text-[11px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-medium focus:outline-none dark:text-white"
                    />
                    <button
                        onClick={() => onRefine(jobId, bulletIndex, rewrite.editedText, userPrompt)}
                        disabled={!userPrompt.trim() || isRefining}
                        className="bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/20 dark:hover:bg-primary-950/30 text-primary-600 dark:text-primary-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center min-w-[64px]"
                    >
                        {isRefining ? <Loader2 className="animate-spin" size={12} /> : 'Adjust'}
                    </button>
                </div>
            </div>

            <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-800/80">
                <button onClick={() => onApply(jobId, bulletIndex, rewrite.editedText)} disabled={isRefining} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors active:scale-95 flex items-center gap-1 shadow-sm disabled:opacity-50">
                    <Check size={12} className="stroke-[2.5]" />
                    <span>Apply Rewrite</span>
                </button>
                <button onClick={() => onCancel(loadingKey)} disabled={isRefining} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default AIRewriteSuggestionCard;
