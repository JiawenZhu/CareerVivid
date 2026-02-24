import React, { useState } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';

interface GenerateDiagramModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (prompt: string) => Promise<void>;
}

const GenerateDiagramModal: React.FC<GenerateDiagramModalProps> = ({ isOpen, onClose, onGenerate }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        setError(null);
        try {
            await onGenerate(prompt);
            setPrompt(''); // Clear prompt on success
            onClose();     // Close after generation
        } catch (err: any) {
            setError(err.message || 'Failed to generate diagram. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-primary-500" size={20} />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Diagram Generator</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Describe the system, flowchart, or diagram you want to build. Our AI will automatically translate it onto your canvas.
                    </p>

                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., Create a system design for a ride-sharing app with users, payment gateway, and matching service..."
                        className="w-full h-32 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary-500 rounded-xl outline-none text-gray-900 dark:text-white placeholder-gray-400 resize-none transition-colors"
                        disabled={isGenerating}
                        maxLength={1000}
                    />
                    <p className={`text-xs text-right -mt-2 ${prompt.length >= 900 ? 'text-orange-500' : 'text-gray-400'}`}>
                        {prompt.length}/1000
                    </p>

                    {error && (
                        <div className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800/50">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || isGenerating}
                        className="flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                Generate
                                <Sparkles size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateDiagramModal;
