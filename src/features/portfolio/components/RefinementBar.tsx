import React, { useState, useEffect } from 'react';
import { Send, ImageIcon, Loader2, X, Sparkles } from 'lucide-react';

interface RefinementBarProps {
    onRefine: (prompt: string, imageContext?: string) => Promise<void>;
    onClose: () => void;
    isLoading: boolean;
}

const SUGGESTIONS = [
    "Switch to dark mode",
    "Add a 'Hire Me' button",
    "Change font to Inter",
    "Add a 'Contact' section",
    "Make the page fade in",
    "Add a blue 'Subscribe' button"
];

export const RefinementBar: React.FC<RefinementBarProps> = ({ onRefine, onClose, isLoading }) => {
    const [prompt, setPrompt] = useState('');
    const [suggestionIdx, setSuggestionIdx] = useState(0);

    // Rotate suggestions
    useEffect(() => {
        const interval = setInterval(() => {
            setSuggestionIdx((prev) => (prev + 1) % SUGGESTIONS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        await onRefine(prompt);
        setPrompt('');
    };

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 pointer-events-auto flex flex-col gap-3">

            {/* Suggestions / Tips */}
            <div className="flex justify-center">
                <button
                    onClick={() => setPrompt(SUGGESTIONS[suggestionIdx])}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 hover:bg-zinc-800 hover:text-white transition-colors animate-in fade-in slide-in-from-bottom-2"
                >
                    <Sparkles size={12} className="text-amber-400" />
                    <span>Try: "{SUGGESTIONS[suggestionIdx]}"</span>
                </button>
            </div>

            <form
                onSubmit={handleSubmit}
                className="relative flex items-center gap-2 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full p-1.5 shadow-2xl ring-1 ring-black/20"
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="p-2.5 text-zinc-400 hover:text-red-400 transition-colors rounded-full hover:bg-white/10"
                    title="Close Refinement Bar"
                >
                    <X size={18} />
                </button>

                {/* Input */}
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask AI to change layout, add buttons, or styles..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-500 text-sm px-2 disabled:opacity-50 font-medium"
                />

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!prompt.trim() || isLoading}
                    className={`
                        p-2.5 rounded-full transition-all duration-200 flex items-center justify-center
                        ${prompt.trim() && !isLoading
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}
                    `}
                >
                    {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Send size={16} className="ml-0.5" /> // Optical adjustment
                    )}
                </button>
            </form>
        </div>
    );
};
