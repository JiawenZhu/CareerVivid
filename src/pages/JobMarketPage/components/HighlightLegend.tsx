import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { HIGHLIGHT_LEGEND } from '../constants/highlightPatterns';

interface HighlightLegendProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HighlightLegend: React.FC<HighlightLegendProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Smart Highlight Guide</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Important keywords are automatically highlighted to help you scan faster.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={20} className="text-gray-500" /></button>
                </div>
                <div className="p-6 space-y-4">
                    {HIGHLIGHT_LEGEND.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-4">
                            <div className={`w-6 h-6 rounded flex-shrink-0 mt-0.5 ${item.color}`}></div>
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white">{item.label}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{item.examples}</div>
                            </div>
                        </div>
                    ))}
                    <div className="flex items-start gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="w-6 h-6 flex-shrink-0 mt-0.5 flex items-center justify-center text-indigo-600"><ExternalLink size={16} /></div>
                        <div>
                            <div className="font-semibold text-gray-900 dark:text-white">Links & Emails</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Clickable URLs and email addresses</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
