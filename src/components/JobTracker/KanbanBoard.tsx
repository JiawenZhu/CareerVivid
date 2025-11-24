import React, { useState } from 'react';
import { JobApplicationData, ApplicationStatus, APPLICATION_STATUSES } from '../../types';
import JobCard from './JobCard';

interface KanbanBoardProps {
  applications: JobApplicationData[];
  onCardClick: (job: JobApplicationData) => void;
  onUpdateApplication: (id: string, data: Partial<JobApplicationData>) => void;
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  'To Apply': 'bg-gray-500',
  'Applied': 'bg-blue-500',
  'Interviewing': 'bg-yellow-500',
  'Offered': 'bg-green-500',
  'Rejected': 'bg-red-500',
};

const KanbanColumn: React.FC<{
  status: ApplicationStatus;
  applications: JobApplicationData[];
  onCardClick: (job: JobApplicationData) => void;
  onUpdateApplication: (id: string, data: Partial<JobApplicationData>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragOver: boolean;
}> = ({ status, applications, onCardClick, onUpdateApplication, onDragOver, onDrop, onDragLeave, isDragOver }) => (
    <div 
        className={`flex-1 min-w-[300px] bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4 transition-colors ${isDragOver ? 'bg-primary-100 dark:bg-primary-900/30' : ''}`}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragLeave={onDragLeave}
    >
        <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[status]}`}></div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{status}</h3>
            <span className="text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5">{applications.length}</span>
        </div>
        <div className="space-y-4">
            {applications.map(app => (
                <JobCard 
                    key={app.id} 
                    job={app} 
                    onClick={() => onCardClick(app)} 
                    onUpdate={(id, data) => onUpdateApplication(id, data)}
                />
            ))}
        </div>
    </div>
);


const KanbanBoard: React.FC<KanbanBoardProps> = ({ applications, onCardClick, onUpdateApplication }) => {
    const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, job: JobApplicationData) => {
        e.dataTransfer.setData('application/job-id', job.id);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: ApplicationStatus) => {
        e.preventDefault();
        const jobId = e.dataTransfer.getData('application/job-id');
        if (jobId) {
            onUpdateApplication(jobId, { applicationStatus: status });
        }
        setDragOverColumn(null);
    };

    return (
        <div className="flex gap-6 overflow-x-auto pb-4">
            {APPLICATION_STATUSES.map(status => (
                <KanbanColumn 
                    key={status}
                    status={status}
                    applications={applications.filter(app => app.applicationStatus === status)}
                    onCardClick={onCardClick}
                    onUpdateApplication={onUpdateApplication}
                    onDragOver={(e) => { e.preventDefault(); setDragOverColumn(status); }}
                    onDrop={(e) => handleDrop(e, status)}
                    onDragLeave={() => setDragOverColumn(null)}
                    isDragOver={dragOverColumn === status}
                />
            ))}
        </div>
    );
};

export default KanbanBoard;
