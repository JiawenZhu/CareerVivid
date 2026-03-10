import React from 'react';

const ProfileSkeleton: React.FC = () => {
    return (
        <div className="flex items-center gap-3 animate-pulse">
            {/* Avatar skeleton */}
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />

            <div className="min-w-0 space-y-1.5 flex-1">
                {/* Name skeleton */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-24" />

                {/* Meta skeleton */}
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-32" />
            </div>
        </div>
    );
};

export default ProfileSkeleton;
