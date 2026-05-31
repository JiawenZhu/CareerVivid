import React, { useEffect } from 'react';
import { Calendar, Clock, Eye, FileText, Mail, MoreVertical, Star, ThumbsDown, ThumbsUp } from 'lucide-react';
import { JobApplication } from '../../types';

interface CandidateCardProps {
    application: JobApplication;
    candidateName: string;
    candidateEmail?: string;
    onViewResume: () => void;
    onQuickAction: (action: 'advance' | 'reject' | 'email' | 'schedule') => void;
    onDragStart: (e: React.DragEvent) => void;
    matchScore?: number;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
    application,
    candidateName,
    candidateEmail,
    onViewResume,
    onQuickAction,
    onDragStart,
    matchScore,
}) => {
    const [showActions, setShowActions] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowActions(false);
            }
        };

        if (showActions) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showActions]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    const getRatingStars = (rating?: number) => {
        if (!rating) return null;
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={12} className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                ))}
            </div>
        );
    };

    const getMatchScoreColor = (score?: number) => {
        if (!score) return 'bg-gray-100 text-gray-600';
        if (score >= 80) return 'bg-green-100 text-green-700';
        if (score >= 60) return 'bg-yellow-100 text-yellow-700';
        return 'bg-red-100 text-red-700';
    };

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDoubleClick={onViewResume}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group select-none"
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {candidateName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate max-w-[120px]">{candidateName}</h4>
                        {candidateEmail && <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{candidateEmail}</p>}
                    </div>
                </div>
                <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setShowActions(!showActions)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical size={14} className="text-gray-500" />
                    </button>
                    {showActions && (
                        <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[140px]">
                            <button onClick={() => { onViewResume(); setShowActions(false); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                <Eye size={14} /> View Resume
                            </button>
                            <button onClick={() => { onQuickAction('email'); setShowActions(false); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                <Mail size={14} /> Send Email
                            </button>
                            <button onClick={() => { onQuickAction('schedule'); setShowActions(false); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                <Calendar size={14} /> Schedule
                            </button>
                            <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                            <button onClick={() => { onQuickAction('advance'); setShowActions(false); }} className="w-full text-left px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2">
                                <ThumbsUp size={14} /> Advance
                            </button>
                            <button onClick={() => { onQuickAction('reject'); setShowActions(false); }} className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                <ThumbsDown size={14} /> Reject
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
                {matchScore && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMatchScoreColor(matchScore)}`}>{matchScore}% Match</span>}
                {getRatingStars(application.rating)}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{formatDate(application.appliedAt)}</span>
                </div>
                <button onClick={onViewResume} className="flex items-center gap-1 text-primary-600 hover:text-primary-700">
                    <FileText size={12} />
                    Resume
                </button>
            </div>
        </div>
    );
};

export default CandidateCard;
