import React from 'react';
import { JobPosting } from '../../../types';
import {
    Loader2, Building2, MapPin, DollarSign, Clock,
    PlusCircle, CheckCircle2, ExternalLink, Mic, Trash2
} from 'lucide-react';

interface JobCardProps {
    job: JobPosting;
    onSelect: (job: JobPosting) => void;
    onAddToTracker: (job: JobPosting, e?: React.MouseEvent) => void;
    onApply: (job: JobPosting, e?: React.MouseEvent) => void;
    onMockInterview: (job: JobPosting, e?: React.MouseEvent) => void;
    onDelete?: (jobId: string, e: React.MouseEvent) => void;
    isAdding: boolean;
    isAdded: boolean;
    isApplied: boolean;
    formatSalary: (min?: number, max?: number, currency?: string) => string;
    getTimeAgo: (date: any) => string;
}

export const JobCard: React.FC<JobCardProps> = ({
    job, onSelect, onAddToTracker, onApply, onMockInterview, onDelete,
    isAdding, isAdded, isApplied, formatSalary, getTimeAgo
}) => {
    return (
        <div
            onClick={() => onSelect(job)}
            className={`group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer ${job.source !== 'google' ? 'border-indigo-100 dark:border-indigo-900 ring-1 ring-indigo-500/10' : ''}`}
        >
            {/* Delete Button - Positioned top-left to avoid overlap with badges and action buttons */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(job.id || '', e);
                    }}
                    className="absolute top-2 left-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Remove from results"
                >
                    <Trash2 size={14} />
                </button>
            )}

            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                    {job.jobTitle}
                                </h3>
                                {job.source !== 'google' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                                        Partner
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-gray-600 dark:text-gray-300 font-medium">
                                <Building2 className="w-4 h-4" />
                                {job.companyName}
                            </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                            {job.employmentType || 'Full-time'}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location} ({job.locationType})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4" />
                            <span>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>Posted {getTimeAgo(job.publishedAt || job.createdAt)}</span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                            {job.description}
                        </p>
                    </div>
                </div>

                <div className="flex md:flex-col gap-3 justify-center min-w-[160px]">
                    <button
                        onClick={(e) => onAddToTracker(job, e)}
                        disabled={isAdding || isAdded}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-medium transition-all ${isAdded
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 cursor-default'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        {isAdding ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isAdded ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Added
                            </>
                        ) : (
                            <>
                                <PlusCircle className="w-4 h-4" />
                                Add to Tracker
                            </>
                        )}
                    </button>

                    {/* Show "Apply Externally" if job has an external apply URL, otherwise show "Apply Now" for partner jobs */}
                    {job.applyUrl ? (
                        <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
                        >
                            Apply Externally
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    ) : (
                        <button
                            onClick={(e) => onApply(job, e)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
                        >
                            {isApplied ? 'Reapply' : 'Apply Now'}
                        </button>
                    )}

                    <button
                        onClick={(e) => onMockInterview(job, e)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm"
                        title="Start a mock interview for this job"
                    >
                        <Mic className="w-4 h-4" />
                        Mock Interview
                    </button>
                    {isApplied && (
                        <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle2 size={12} /> Applied
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
