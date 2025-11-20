import React, { useState } from 'react';
import { Wand2, X, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { improveSection } from '../services/geminiService';
import AutoResizeTextarea from './AutoResizeTextarea';

interface AIImprovementPanelProps {
    userId: string;
    sectionName: string;
    currentText: string;
    language: string;
    onAccept: (newText: string) => void;
    onClose: () => void;
    onError: (title: string, message: string) => void;
    contextType?: string;
}

const AIImprovementPanel: React.FC<AIImprovementPanelProps> = ({ userId, sectionName, currentText, language, onAccept, onClose, onError, contextType = 'resume' }) => {
    const [instruction, setInstruction] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [improvedText, setImprovedText] = useState('');

    const handleGenerate = async () => {
        if (!instruction.trim()) {
            onError('Input Required', 'Please provide an instruction for the AI.');
            return;
        }
        setIsLoading(true);
        try {
            const result = await improveSection(userId, sectionName, currentText, instruction, language, contextType);
            setImprovedText(result);
        } catch (error) {
            onError('AI Improvement Failed', error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 animate-fade-in shadow-inner">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold flex items-center gap-2 text-primary-600 dark:text-primary-400">
                    <Wand2 size={16} /> AI Assistant
                </h4>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={16} />
                </button>
            </div>

            {!improvedText ? (
                <>
                    <AutoResizeTextarea
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        placeholder={`How should I improve this? (e.g., "Fix grammar", "Make it punchier", "Translate to Spanish")`}
                        className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md mb-3 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        maxHeight={200}
                        autoFocus
                    />
                    <div className="flex justify-end">
                        <button 
                            onClick={handleGenerate} 
                            disabled={isLoading || !instruction.trim()} 
                            className="bg-primary-600 text-white text-sm py-2 px-4 rounded-md hover:bg-primary-700 disabled:bg-primary-300 flex items-center gap-2 transition-colors"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                            {isLoading ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </>
            ) : (
                <div className="space-y-3">
                     <div className="bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Suggestion:</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{improvedText}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => setImprovedText('')} 
                            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                        >
                            Try Again
                        </button>
                         <button 
                            onClick={() => onAccept(improvedText)} 
                            className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-md flex items-center gap-2 transition-colors"
                        >
                            <CheckCircle size={14} /> Apply Change
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIImprovementPanel;