import React, { useState, useRef, useEffect } from 'react';
import { JobApplicationData, WorkModel, WORK_MODELS } from '../../types';
import { Briefcase } from 'lucide-react';

interface JobCardProps {
  job: JobApplicationData;
  onClick: () => void;
  onUpdate: (id: string, data: Partial<JobApplicationData>) => void;
}

const InlineSelect: React.FC<{
    value: string;
    options: readonly string[];
    onSave: (newValue: string) => void;
    placeholder: string;
    className: string;
}> = ({ value, options, onSave, placeholder, className }) => {
    const [isEditing, setIsEditing] = useState(false);
    const selectRef = useRef<HTMLSelectElement>(null);

    useEffect(() => {
        if (isEditing) {
            selectRef.current?.focus();
        }
    }, [isEditing]);
    
    if (isEditing) {
        return (
            <select
                ref={selectRef}
                value={value || ''}
                onChange={(e) => {
                    onSave(e.target.value);
                    setIsEditing(false);
                }}
                onBlur={() => setIsEditing(false)}
                className={`${className} cursor-pointer`}
            >
                <option value="" disabled>{placeholder}</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        );
    }

    return (
        <span onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className={`${className} cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600`}>
            {value || placeholder}
        </span>
    );
};

const JobCard: React.FC<JobCardProps> = ({ job, onClick, onUpdate }) => {
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('application/job-id', job.id);
        e.stopPropagation(); // Prevent card click from firing
    };
    
    return (
        <div 
            draggable 
            onDragStart={handleDragStart}
            onClick={onClick}
            className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md hover:border-primary-400 dark:hover:border-primary-500 transition-all cursor-pointer"
        >
            <div className="flex items-start gap-3">
                 <div className="flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center">
                    <Briefcase size={18} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-grow">
                    <h4 className="font-bold text-md text-gray-900 dark:text-gray-100">{job.jobTitle}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{job.companyName}</p>
                </div>
            </div>
             <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <InlineSelect 
                    value={job.workModel || ''}
                    options={WORK_MODELS}
                    onSave={(newValue) => onUpdate(job.id, { workModel: newValue as WorkModel })}
                    placeholder="Work Model"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1 rounded-md font-semibold"
                />
                 <InlineSelect 
                    value={job.interviewStage || ''}
                    options={['Screening Call', 'Hiring Manager', 'Technical Round', 'Final Round']}
                    onSave={(newValue) => onUpdate(job.id, { interviewStage: newValue })}
                    placeholder="Interview Stage"
                    className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 px-2 py-1 rounded-md font-semibold"
                />
            </div>
        </div>
    );
};

export default JobCard;
