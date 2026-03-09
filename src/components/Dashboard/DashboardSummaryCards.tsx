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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {cards.map((card, index) => (
                <div
                    key={index}
                    onClick={() => navigate(card.link)}
                    className="relative bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-gray-200/60 dark:border-gray-800 transition-all duration-300 hover:border-primary-500/30 dark:hover:border-primary-400/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] cursor-pointer group overflow-hidden"
                >
                    {/* Subtle Top Gradient Line */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="flex justify-between items-center mb-5">
                        <div className={`p-2.5 rounded-xl ${card.bg} border border-white/50 dark:border-white/5`}>
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                        <h3 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 font-sans tracking-wide uppercase">
                            {card.title}
                        </h3>
                    </div>

                    <div className="flex items-end justify-between">
                        {card.isAction ? (
                            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-sm bg-primary-50 dark:bg-primary-500/10 px-3 py-1.5 rounded-lg border border-primary-100 dark:border-primary-500/20 group-hover:bg-primary-100 dark:group-hover:bg-primary-500/20 transition-colors">
                                {card.actionText}
                            </div>
                        ) : (
                            <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 font-sans tracking-tight">
                                {card.count}
                            </div>
                        )}
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                            <Plus className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DashboardSummaryCards;
