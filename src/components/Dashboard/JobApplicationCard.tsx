import React from 'react';
import { Trash2 } from 'lucide-react';
import { JobApplicationData } from '../../types';

interface JobApplicationCardProps {
    job: JobApplicationData;
    onClick: () => void;
    onDelete: (id: string) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}

const JobApplicationCard: React.FC<JobApplicationCardProps> = ({ job, onClick, onDelete, onDragStart }) => (
    <div draggable onDragStart={onDragStart} onClick={onClick} className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 hover:border-indigo-500/40 dark:hover:border-indigo-400/40 shadow-sm hover:shadow-md hover:shadow-indigo-500/[0.03] flex flex-col p-5 relative group cursor-pointer overflow-hidden">
        <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0 pr-2">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate">{job.jobTitle}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{job.companyName}</p>
            </div>
            <div className="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 text-[11px] font-bold px-2 py-0.5 rounded-full border border-indigo-100/50 dark:border-indigo-900/30 flex-shrink-0 flex items-center justify-center self-start">
                {job.applicationStatus}
            </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Updated: {job.updatedAt?.toDate ? job.updatedAt.toDate().toLocaleDateString() : new Date(job.updatedAt as any).toLocaleDateString()}</p>
        <div className="mt-auto flex justify-end">
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(job.id); }}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-opacity opacity-0 group-hover:opacity-100"
                title="Delete this job application"
            >
                <Trash2 size={18} />
            </button>
        </div>
    </div>
);

export default JobApplicationCard;
