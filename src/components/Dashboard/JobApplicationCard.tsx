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
    <div draggable onDragStart={onDragStart} onClick={onClick} className="bg-white dark:bg-gray-800 rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 flex flex-col p-4 relative group cursor-pointer transform hover:-translate-y-1">
        <div className="flex justify-between items-start mb-2">
            <div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{job.jobTitle}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{job.companyName}</p>
            </div>
            <div className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs font-semibold px-2.5 py-1 rounded-full">
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
