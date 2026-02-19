import React, { useState } from 'react';
import { Save, Calendar, ArrowRight, User, Briefcase, FileText } from 'lucide-react';
import ProjectBoard from './ProjectBoard';

interface ClientData {
    id: string;
    businessName: string;
    contactName: string;
    currentStage: number;
    stages: string[];
    nextDeadline: string;
    financials: { total: number; paid: number };
    services: { name: string; status: string }[];
}

interface AdminDashboardProps {
    data: ClientData;
    onUpdate: (updatedData: Partial<ClientData>) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ data, onUpdate }) => {
    const [note, setNote] = useState('');

    const handleStageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdate({ currentStage: parseInt(event.target.value) });
    };

    const handleDeadlineChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ nextDeadline: event.target.value });
    };

    const handleNoteSave = () => {
        if (!note.trim()) return;
        // In a real app this would save to DB. For now mock interaction
        alert(`Note saved: "${note}"`);
        setNote('');
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-800 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-bold uppercase tracking-wide">Admin View</span>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Control Panel</h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                    Managing project for <span className="font-bold text-gray-900 dark:text-white">{data.businessName}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Stage Controller */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Briefcase size={18} className="text-blue-500" />
                        Project Stage
                    </h3>
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Current Project Phase
                        </label>
                        <select
                            value={data.currentStage}
                            onChange={handleStageChange}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                            {data.stages.map((stage, index) => (
                                <option key={stage} value={index}>
                                    {index + 1}. {stage}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500">
                            Changing this will instantly update the client's progress tracker progress bar.
                        </p>
                    </div>
                </div>

                {/* Deadline Controller */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-orange-500" />
                        Timeline
                    </h3>
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Next Milestone Due Date
                        </label>
                        <input
                            type="text"
                            value={data.nextDeadline}
                            onChange={handleDeadlineChange}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="e.g. Feb 25, 2026"
                        />
                        <p className="text-xs text-gray-500">
                            Updates the "Next Milestone" card on the dashboard.
                        </p>
                    </div>
                </div>

                {/* Project Notes */}
                <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <FileText size={18} className="text-gray-500" />
                        Internal Project Notes
                    </h3>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Add a note (e.g. 'Waiting for logo assets')..."
                        />
                        <button
                            onClick={handleNoteSave}
                            className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                            <Save size={18} />
                            Save
                        </button>
                    </div>
                </div>
            </div>

            {/* Project Board (Admin Mode) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mt-8">
                <ProjectBoard isAdmin={true} userName="Admin" projectId={data.id.toString()} />
            </div>
        </div>
    );
};

export default AdminDashboard;
