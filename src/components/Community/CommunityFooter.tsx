import React from 'react';
import { Github, Star, Users } from 'lucide-react';
import { useCommunityStats } from '../../hooks/useCommunityMeta';

const REPO_URL = 'https://github.com/Jastalk/CareerVivid';

const CommunityFooter: React.FC = () => {
    const { memberCount, loading } = useCommunityStats();

    return (
        <div className="mt-12 py-8 px-4 border-t border-gray-100 dark:border-gray-800/60 bg-transparent flex flex-col items-center justify-center gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                {/* Membership Count */}
                <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <Users size={18} className="text-primary-500" />
                    </div>
                    <span className="text-sm font-semibold tracking-tight">
                        Join {loading ? '...' : memberCount.toLocaleString()}+ members
                    </span>
                </div>

            </div>

            {/* Subtle attribution if needed, or just let it be clean */}
            <p className="text-[11px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em]">
                CareerVivid AI Network
            </p>
        </div>
    );
};

export default CommunityFooter;
