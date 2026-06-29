import React from 'react';
import { Clock, ExternalLink, Trash2, Sparkles, BarChart } from 'lucide-react';
import { PracticeHistoryEntry } from '../../types';
import { navigate } from '../../utils/navigation';
import { useState } from 'react';
import { useWorkspaceItemActions } from '../../hooks/useWorkspaceItemActions';
import { SidebarContextMenu } from '../Navigation/SidebarContextMenu';
import { createPortal } from 'react-dom';
import ConfirmationModal from '../ConfirmationModal';

interface InterviewHistoryCardProps {
    entry: PracticeHistoryEntry;
    onShowReport: (entry: PracticeHistoryEntry) => void;
    onDelete: (id: string) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onPracticeAgain?: (entry: PracticeHistoryEntry) => void;
}

const InterviewHistoryCard: React.FC<InterviewHistoryCardProps> = ({ entry, onShowReport, onDelete, onDragStart, onPracticeAgain }) => {
    const draftQuestions = entry.activeInterviewDraft?.questions?.length ? entry.activeInterviewDraft.questions : entry.questions;
    const hasResumableDraft = !!entry.activeInterviewDraft?.transcript?.length &&
        !!draftQuestions?.length &&
        entry.activeInterviewDraft.questionIndex < draftQuestions.length;
    const draftQuestionLabel = hasResumableDraft
        ? `Q${Math.min((entry.activeInterviewDraft?.questionIndex ?? 0) + 1, draftQuestions?.length || 1)}/${draftQuestions?.length || 1}`
        : null;
    const {
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        isMoveModalOpen,
        setIsMoveModalOpen,
        isEditing,
        setIsEditing,
        handleRename,
        handleDelete,
        confirmDelete,
        onMove,
        confirmMove,
        nodes
    } = useWorkspaceItemActions(`interview-${entry.id}`, entry.job.title);

    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

    const handlePracticeAgain = () => {
        if (onPracticeAgain) {
            // Already on InterviewStudio — call directly to avoid stale sessionStorage/useEffect issue
            onPracticeAgain(entry);
        } else {
            // Coming from another page — use sessionStorage + navigation
            sessionStorage.setItem('practiceJob', JSON.stringify(entry));
            navigate('/interview-studio');
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onContextMenu={handleContextMenu}
            className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 hover:border-indigo-500/40 dark:hover:border-indigo-400/40 shadow-sm hover:shadow-md hover:shadow-indigo-500/[0.03] flex flex-col p-5 relative group cursor-grab active:cursor-grabbing overflow-hidden"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-1.5 leading-snug">
                        <span className="truncate">{entry.job.title}</span>
                        {entry.job.url && (
                            <a 
                                href={entry.job.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center justify-center text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors flex-shrink-0"
                            >
                                <ExternalLink size={15} />
                            </a>
                        )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{entry.job.company}</p>
                </div>
                {(entry.interviewHistory?.length > 0 || draftQuestionLabel) && (
                    <div className="flex flex-shrink-0 flex-col items-end gap-1 self-start">
                        {entry.interviewHistory?.length > 0 && (
                            <div className="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 text-[11px] font-bold px-2 py-0.5 rounded-full border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-center">
                                {entry.interviewHistory.length} practice{entry.interviewHistory.length > 1 ? 's' : ''}
                            </div>
                        )}
                        {draftQuestionLabel && (
                            <div className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
                                {draftQuestionLabel}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="mb-4 flex h-5 min-w-0 items-center gap-1.5 text-xs">
                {hasResumableDraft && (
                    <>
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/25 dark:text-amber-200 dark:ring-amber-900/50">
                            Saved draft
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                    </>
                )}
                <span className="truncate text-gray-500 dark:text-gray-400">Last activity: {formatDate(entry.timestamp)}</span>
            </div>

            <div className="mt-auto flex justify-between items-center">
                <button
                    onClick={handleDelete}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete this history entry"
                >
                    <Trash2 size={18} />
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={handlePracticeAgain}
                        aria-label={hasResumableDraft ? 'Resume session' : 'Practice Again'}
                        className="flex items-center gap-2 text-sm font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors"
                    >
                        {hasResumableDraft ? <Clock size={16} /> : <Sparkles size={16} />}
                        {hasResumableDraft ? 'Resume' : 'Practice Again'}
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

            {/* Context Menu */}
            {contextMenu && createPortal(
                <SidebarContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    nodeTitle={entry.job.title}
                    onClose={() => setContextMenu(null)}
                    onRename={() => {
                        // Rename might not apply to history title easily without database changes,
                        // but we'll leave the option or hide it if necessary.
                        // For now we'll allow it via the hook's text.
                        setIsEditing(true);
                        setContextMenu(null);
                    }}
                    onDelete={() => {
                        handleDelete();
                        setContextMenu(null);
                    }}
                />,
                document.body
            )}

            {/* Modals */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Delete Interview Entry"
                message={`Are you sure you want to delete the interview history for "${entry.job.title}"? This cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                onConfirm={() => {
                    confirmDelete();
                    onDelete(entry.id);
                }}
                onCancel={() => setIsDeleteModalOpen(false)}
            />
        </div>
    );
};

export default InterviewHistoryCard;
