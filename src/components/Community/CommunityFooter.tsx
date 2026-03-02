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

                {/* Professional GitHub Star Link */}
                <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        Star on GitHub
                    </span>
                    <Github size={18} className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                </a>
            </div>

            {/* Subtle attribution if needed, or just let it be clean */}
            <p className="text-[11px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em]">
                CareerVivid Open Source Ecosystem
            </p>
        </div>
    );
};

export default CommunityFooter;
