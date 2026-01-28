import React from 'react';
import { ExternalLink, Trash2, Sparkles, BarChart } from 'lucide-react';
import { PracticeHistoryEntry } from '../../types';
import { navigate } from '../../utils/navigation';

interface InterviewHistoryCardProps {
    entry: PracticeHistoryEntry;
    onShowReport: (entry: PracticeHistoryEntry) => void;
    onDelete: (id: string) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}

const InterviewHistoryCard: React.FC<InterviewHistoryCardProps> = ({ entry, onShowReport, onDelete, onDragStart }) => {
    const handlePracticeAgain = () => {
        sessionStorage.setItem('practiceJob', JSON.stringify(entry));
        navigate('/interview-studio');
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    return (
        <div draggable onDragStart={onDragStart} className="bg-white dark:bg-gray-800 rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 flex flex-col p-4 relative group cursor-grab active:cursor-grabbing transform hover:-translate-y-1">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center">
                        {entry.job.title}
                        {entry.job.url && <a href={entry.job.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-gray-400 hover:text-primary-500"><ExternalLink size={16} /></a>}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{entry.job.company}</p>
                </div>
                {entry.interviewHistory?.length > 0 && (
                    <div className="bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {entry.interviewHistory.length} practice{entry.interviewHistory.length > 1 ? 's' : ''}
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Last activity: {formatDate(entry.timestamp)}</p>

            <div className="mt-auto flex justify-between items-center">
                <button
                    onClick={() => onDelete(entry.id)}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete this history entry"
                >
                    <Trash2 size={18} />
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={handlePracticeAgain}
                        className="flex items-center gap-2 text-sm font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors"
                    >
                        <Sparkles size={16} /> Practice Again
                    </button>
                    <button
                        onClick={() => onShowReport(entry)}
                        disabled={!entry.interviewHistory || entry.interviewHistory.length === 0}
                        className="flex items-center gap-2 text-sm font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/80 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <BarChart size={16} /> Report
                    </button>
                </div>
            </div>
        </div>
    );
}

export default InterviewHistoryCard;
