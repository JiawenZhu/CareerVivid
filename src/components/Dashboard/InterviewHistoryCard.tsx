import React from 'react';
import { ExternalLink, Trash2, Sparkles, BarChart } from 'lucide-react';
import { PracticeHistoryEntry } from '../../types';
import { navigate } from '../../utils/navigation';
import { useState } from 'react';
import { useWorkspaceItemActions } from '../../hooks/useWorkspaceItemActions';
import { SidebarContextMenu } from '../Navigation/SidebarContextMenu';
import { createPortal } from 'react-dom';
import ConfirmationModal from '../ConfirmationModal';
import MoveToModal from '../Navigation/MoveToModal';

interface InterviewHistoryCardProps {
    entry: PracticeHistoryEntry;
    onShowReport: (entry: PracticeHistoryEntry) => void;
    onDelete: (id: string) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}

const InterviewHistoryCard: React.FC<InterviewHistoryCardProps> = ({ entry, onShowReport, onDelete, onDragStart }) => {
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
        sessionStorage.setItem('practiceJob', JSON.stringify(entry));
        navigate('/interview-studio');
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
            className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200/60 dark:border-gray-800 transition-all duration-300 hover:border-primary-500/30 dark:hover:border-primary-400/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col p-5 relative group cursor-grab active:cursor-grabbing overflow-hidden"
        >
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
                    onClick={handleDelete}
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
                    onMove={() => {
                        onMove();
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

            <MoveToModal
                isOpen={isMoveModalOpen}
                currentNodeId={`interview-${entry.id}`}
                currentNodeText={entry.job.title}
                nodes={nodes}
                onClose={() => setIsMoveModalOpen(false)}
                onSelect={(targetId) => {
                    confirmMove(targetId);
                }}
            />
        </div>
    );
};

export default InterviewHistoryCard;
