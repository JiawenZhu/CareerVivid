import React, { useState } from 'react';
import { Info, X as XIcon, CheckCircle, XCircle, ChevronDown, ChevronRight, BarChart3, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Draggable from 'react-draggable';
import { ResumeMatchAnalysis } from '../../../types';

interface OptimizationJob {
    title: string;
    description: string;
    analysis?: ResumeMatchAnalysis;
}

interface OptimizationPanelProps {
    job: OptimizationJob | null;
    onClear: () => void;
}

const OptimizationPanel: React.FC<OptimizationPanelProps> = ({ job, onClear }) => {
    const { t } = useTranslation();
    const nodeRef = React.useRef(null);
    const [isKeywordsExpanded, setIsKeywordsExpanded] = useState(false);
    const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);

    if (!job) return null;

    const { analysis } = job;
    const matchPercentage = analysis ? Math.round(analysis.matchPercentage) : 0;
    const matchColor = matchPercentage >= 70 ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' :
        matchPercentage >= 40 ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    const progressBarColor = matchPercentage >= 70 ? 'bg-green-500' : matchPercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <Draggable nodeRef={nodeRef} handle=".drag-handle">
            <div ref={nodeRef} className="fixed top-24 right-4 z-[30] bg-white dark:bg-gray-800 shadow-xl rounded-lg border dark:border-gray-700 w-full max-w-sm flex flex-col max-h-[85vh] resize-y overflow-hidden transition-all duration-200">
                {/* Header */}
                <div className="drag-handle cursor-move p-3 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0 bg-gray-50 dark:bg-gray-900 rounded-t-lg select-none">
                    <div className="flex items-center gap-2">
                        <Info size={18} className="text-primary-500" />
                        <h3 className="font-bold text-md text-gray-800 dark:text-gray-200">{t('editor.job_context')}</h3>
                    </div>
                    <button onClick={onClear} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500">
                        <XIcon size={18} />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {/* Analysis Section */}
                    {analysis && (
                        <div className="p-4 border-b dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10">
                            <div className="flex justify-between items-center mb-2 cursor-pointer" onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}>
                                <h4 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                    <BarChart3 size={16} className="text-blue-500" />
                                    Match Analysis
                                </h4>
                                {isAnalysisExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>

                            {isAnalysisExpanded && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {/* Score */}
                                    <div className="flex items-center gap-3">
                                        <div className={`text-2xl font-bold px-3 py-1 rounded-md ${matchColor}`}>
                                            {matchPercentage}%
                                        </div>
                                        <div className="flex-grow">
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex justify-between">
                                                <span>Match Score</span>
                                                <span>{analysis.matchedKeywords.length}/{analysis.totalKeywords} Keywords</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div className={`${progressBarColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${matchPercentage}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed border-l-2 border-blue-400 pl-3 italic">
                                        "{analysis.summary}"
                                    </p>

                                    {/* Keywords Toggle */}
                                    <div>
                                        <button
                                            onClick={() => setIsKeywordsExpanded(!isKeywordsExpanded)}
                                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1"
                                        >
                                            {isKeywordsExpanded ? 'Hide Keywords' : 'Show Keyword details'}
                                            {isKeywordsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </button>

                                        {isKeywordsExpanded && (
                                            <div className="mt-3 grid grid-cols-1 gap-3 animate-in fade-in zoom-in-95 duration-200">
                                                <div>
                                                    <h5 className="text-xs font-bold text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                                                        <CheckCircle size={12} /> Matched
                                                    </h5>
                                                    <div className="flex flex-wrap gap-1">
                                                        {analysis.matchedKeywords.map(k => (
                                                            <span key={k} className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-[10px] rounded border border-green-200 dark:border-green-800">
                                                                {k}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h5 className="text-xs font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
                                                        <XCircle size={12} /> Missing
                                                    </h5>
                                                    <div className="flex flex-wrap gap-1">
                                                        {analysis.missingKeywords.map(k => (
                                                            <span key={k} className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-[10px] rounded border border-red-200 dark:border-red-800">
                                                                {k}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Job Details */}
                    <div className="p-4">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Job Description</h4>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">{job.title}</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {job.description}
                        </div>
                    </div>
                </div>
            </div>
        </Draggable>
    );
};

export default OptimizationPanel;
