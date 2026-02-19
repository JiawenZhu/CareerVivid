import React, { useState } from 'react';
import { X, Calendar, Flag, Layout, Type, FileText } from 'lucide-react';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (task: {
        title: string;
        description: string;
        priority: 'low' | 'medium' | 'high';
        status: 'todo' | 'in_progress' | 'review' | 'done';
        dueDate: string;
    }) => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [status, setStatus] = useState<'todo' | 'in_progress' | 'review' | 'done'>('todo');
    const [dueDate, setDueDate] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            title,
            description,
            priority,
            status,
            dueDate: dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Date'
        });
        // Reset form
        setTitle('');
        setDescription('');
        setPriority('medium');
        setStatus('todo');
        setDueDate('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div
                className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white">New Process Card</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form id="create-task-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Title */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <Type size={14} />
                                Task Title
                            </label>
                            <input
                                required
                                type="text"
                                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-serif text-lg text-gray-900 dark:text-white placeholder-gray-400"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Design Homepage Hero"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <FileText size={14} />
                                Description
                            </label>
                            <textarea
                                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] text-sm text-gray-700 dark:text-gray-300 resize-y"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Detailed requirements..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Priority */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <Flag size={14} />
                                    Priority
                                </label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                    value={priority}
                                    onChange={e => setPriority(e.target.value as any)}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            {/* Column */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <Layout size={14} />
                                    Stage
                                </label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                    value={status}
                                    onChange={e => setStatus(e.target.value as any)}
                                >
                                    <option value="todo">Requests / To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="review">Ready for Review</option>
                                    <option value="done">Completed</option>
                                </select>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <Calendar size={14} />
                                Due Date
                            </label>
                            <input
                                type="date"
                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-700 dark:text-gray-300"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                            />
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-900/50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-lg transition-all text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="create-task-form"
                        className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm font-bold shadow-sm"
                    >
                        Create Card
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTaskModal;
