import React from 'react';
import { FileText, Mic, Globe, Briefcase, Plus } from 'lucide-react';
import { navigate } from '../../utils/navigation';

interface DashboardSummaryCardsProps {
    resumeCount: number;
    interviewCount: number;
    portfolioCount: number;
    jobCount: number; // Not strictly used for count display in design, but good to have
}

const DashboardSummaryCards: React.FC<DashboardSummaryCardsProps> = ({
    resumeCount,
    interviewCount,
    portfolioCount,
    jobCount
}) => {
    const cards = [
        {
            title: 'My Resumes',
            count: resumeCount,
            icon: FileText,
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            link: '/newresume',
            isAction: false
        },
        {
            title: 'Find Jobs',
            count: null,
            icon: Briefcase,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
            link: '/job-market',
            isAction: true,
            actionText: 'Find Jobs'
        },
        {
            title: 'Technical Interview Simulator Sessions',
            count: interviewCount,
            icon: Mic,
            color: 'text-purple-600',
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            link: '/interview-studio',
            isAction: false
        },
        {
            title: 'Portfolios',
            count: portfolioCount,
            icon: Globe,
            color: 'text-pink-600',
            bg: 'bg-pink-100 dark:bg-pink-900/30',
            link: '/portfolio',
            isAction: false
        },
        {
            title: 'Career Pipeline',
            count: jobCount > 0 ? jobCount : null,
            icon: Briefcase,
            color: 'text-indigo-600',
            bg: 'bg-indigo-100 dark:bg-indigo-900/30',
            link: '/job-tracker',
            isAction: jobCount === 0,
            actionText: '+ Track Job'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
            {cards.map((card, index) => (
                <div
                    key={index}
                    onClick={() => navigate(card.link)}
                    className="relative bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl p-5 h-36 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 hover:border-indigo-500/40 dark:hover:border-indigo-400/40 shadow-sm hover:shadow-md hover:shadow-indigo-500/[0.03] cursor-pointer group overflow-hidden flex flex-col justify-between hidden md:flex"
                >
                    {/* Subtle Top Gradient Line */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="flex gap-3 items-start h-12">
                        <div className={`p-2.5 rounded-xl ${card.bg} border border-slate-200/40 dark:border-slate-800/40 flex-shrink-0 flex items-center justify-center`}>
                            <card.icon className={`w-4 h-4 ${card.color}`} />
                        </div>
                        <h3 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 font-sans tracking-wider uppercase leading-tight line-clamp-3 text-left">
                            {card.title}
                        </h3>
                    </div>

                    <div className="flex items-end justify-between mt-auto">
                        {card.isAction ? (
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                                {card.actionText}
                            </div>
                        ) : (
                            <div className="text-3xl font-extrabold text-gray-900 dark:text-white font-sans tracking-tight leading-none">
                                {card.count !== null ? card.count : 0}
                            </div>
                        )}
                        <div className="w-7 h-7 rounded-full bg-gray-50 dark:bg-slate-800/80 flex items-center justify-center opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                            <Plus className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DashboardSummaryCards;
