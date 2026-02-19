import React, { useState } from 'react';
import {
    MessageSquare, Calendar, Trash2,
    X, Send, User, Shield, MoreHorizontal, ArrowRight
} from 'lucide-react';

export interface Comment {
    id: string;
    user: string;
    role: 'admin' | 'client';
    text: string;
    date: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high';
    date: string;
    comments: Comment[];
}

interface TaskCardProps {
    task: Task;
    isAdmin: boolean;
    onMove: (taskId: string, newStatus: Task['status']) => void;
    onDelete: (taskId: string) => void;
    onComment: (taskId: string, text: string) => void;
}

const PriorityBadge = ({ priority }: { priority: Task['priority'] }) => {
    const colors = {
        low: 'bg-blue-50 text-blue-700 border-blue-100',
        medium: 'bg-orange-50 text-orange-700 border-orange-100',
        high: 'bg-red-50 text-red-700 border-red-100'
    };
    return (
        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${colors[priority]}`}>
            {priority}
        </span>
    );
};

const TaskCard: React.FC<TaskCardProps> = ({ task, isAdmin, onMove, onDelete, onComment }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newComment, setNewComment] = useState('');

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        onComment(task.id, newComment);
        setNewComment('');
    };

    // Calculate next stage for the quick-move button
    const getNextStage = (current: Task['status']): Task['status'] | null => {
        const flow: Task['status'][] = ['todo', 'in_progress', 'review', 'done'];
        const idx = flow.indexOf(current);
        return idx < flow.length - 1 ? flow[idx + 1] : null;
    };

    const nextStage = getNextStage(task.status);

    return (
        <>
            {/* --- The Resume-Style Card --- */}
            <div
                className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
            >
                {/* Clickable Area for Detail View */}
                <div onClick={() => setIsModalOpen(true)} className="p-5 cursor-pointer flex-1">
                    {/* Meta Header */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {task.date}
                            </span>
                            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                            <PriorityBadge priority={task.priority} />
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif font-bold text-gray-900 dark:text-white text-lg leading-snug mb-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {task.title}
                    </h3>

                    {/* Footer / Stats */}
                    <div className="flex items-center justify-between mt-4 border-t border-gray-50 dark:border-gray-700 pt-3">
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                            <MessageSquare size={14} />
                            <span>{task.comments.length}</span>
                        </div>
                        {task.comments.length > 0 && (
                            <div className="flex -space-x-2">
                                {task.comments.slice(-3).map((c, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500 uppercase">
                                        {c.user.charAt(0)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Admin Quick Actions Footer */}
                {isAdmin && (
                    <div className="bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 p-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this task?')) onDelete(task.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={14} />
                        </button>

                        {nextStage ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMove(task.id, nextStage);
                                }}
                                className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
                            >
                                Next <ArrowRight size={12} />
                            </button>
                        ) : (
                            <span className="text-[10px] uppercase font-bold text-emerald-600 px-2">Done</span>
                        )}
                    </div>
                )}
            </div>

            {/* --- The Detail Modal --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div
                        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <PriorityBadge priority={task.priority} />
                                    <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">{task.status.replace('_', ' ')}</span>
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
                                    {task.title}
                                </h2>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Description */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">About This Task</h4>
                                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                    {task.description || "No description provided."}
                                </div>
                            </div>

                            {/* Admin Detailed Actions */}
                            {isAdmin && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Admin Controls</h4>
                                    <div className="flex flex-wrap gap-3 p-4 border border-gray-100 dark:border-gray-700 rounded-xl">
                                        <select
                                            value={task.status}
                                            onChange={(e) => {
                                                onMove(task.id, e.target.value as Task['status']);
                                                setIsModalOpen(false);
                                            }}
                                            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                                        >
                                            <option value="todo">To Do</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="review">Ready for Review</option>
                                            <option value="done">Completed</option>
                                        </select>

                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this task?')) {
                                                    onDelete(task.id);
                                                    setIsModalOpen(false);
                                                }
                                            }}
                                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <Trash2 size={16} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Comments / Activity */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                    Project Discussion
                                </h4>
                                <div className="space-y-6 mb-6">
                                    {task.comments.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                                            <p className="text-sm text-gray-400 italic">No comments yet. Start the conversation!</p>
                                        </div>
                                    ) : (
                                        task.comments.map((comment) => (
                                            <div key={comment.id} className={`flex gap-4 ${comment.role === 'admin' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`
                                                    w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-sm
                                                    ${comment.role === 'admin' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-emerald-600'}
                                                `}>
                                                    {comment.role === 'admin' ? <Shield size={14} /> : <User size={14} />}
                                                </div>
                                                <div className={`
                                                    max-w-[85%] p-4 rounded-2xl text-sm shadow-sm
                                                    ${comment.role === 'admin'
                                                        ? 'bg-gray-900 text-gray-100 rounded-tr-sm'
                                                        : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'}
                                                `}>
                                                    <div className={`flex justify-between items-center gap-4 mb-2 text-[10px] uppercase font-bold tracking-wider ${comment.role === 'admin' ? 'text-gray-400' : 'text-gray-400'}`}>
                                                        <span>{comment.user}</span>
                                                        <span>{comment.date}</span>
                                                    </div>
                                                    <p className="leading-relaxed">{comment.text}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Comment Input */}
                                <form onSubmit={handleCommentSubmit} className="relative mt-4">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Type a message..."
                                        className="w-full pl-4 pr-12 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all shadow-sm"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim()}
                                        className="absolute right-2 top-2 p-1.5 bg-gray-900 dark:bg-emerald-600 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TaskCard;
