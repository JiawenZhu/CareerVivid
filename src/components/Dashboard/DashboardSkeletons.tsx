import React from 'react';

export const ResumeCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="w-full aspect-[210/297] bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 animate-pulse"></div>
            <div className="h-5 w-3/4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="p-2 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <div className="flex gap-1">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse"></div>
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse"></div>
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse"></div>
            </div>
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse"></div>
        </div>
    </div>
);

export const InterviewHistoryCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-4 animate-pulse">
        <div className="flex justify-between items-start mb-2">
            <div>
                <div className="h-5 w-40 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-5 w-20 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        </div>
        <div className="h-3 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
        <div className="mt-auto flex justify-between items-center">
            <div className="w-9 h-9 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            <div className="flex gap-2">
                <div className="h-9 w-32 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
                <div className="h-9 w-24 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
            </div>
        </div>
    </div>
);
