import React, { useState } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';

interface GuestPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (headline: string) => void;
}

const GuestPromptModal: React.FC<GuestPromptModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [headline, setHeadline] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (headline.trim()) {
            onSubmit(headline.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                    <Sparkles size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Start Building</h3>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Enter your headline or name to personalize your URL.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Headline / Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={headline}
                                onChange={(e) => setHeadline(e.target.value)}
                                placeholder="e.g. Steven Liu or Product Designer"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
                                autoFocus
                                required
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                                This will be part of your portfolio link: <br />
                                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                    careervivid.app/portfolio/{headline || 'headline'}/...
                                </span>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!headline.trim()}
                                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                            >
                                Start Designing
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GuestPromptModal;
