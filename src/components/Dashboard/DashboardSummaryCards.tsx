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
            title: 'Interview Studio Sessions',
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
            title: 'Job Application Tracker',
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card, index) => (
                <div
                    key={index}
                    onClick={() => navigate(card.link)}
                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 font-sans">
                            {card.title}
                        </h3>
                        <div className={`p-2 rounded-lg transition-transform duration-300 ease-out group-hover:scale-110 ${card.bg}`}>
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                    </div>

                    {card.isAction ? (
                        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold mt-2">
                            {card.actionText}
                        </div>
                    ) : (
                        <div className="text-3xl font-bold text-gray-900 dark:text-white font-sans">
                            {card.count}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default DashboardSummaryCards;
