import React from 'react';
import { FileText, Mic, Globe, Briefcase, MessageSquare, Plus } from 'lucide-react';
import { navigate } from '../../utils/navigation';

interface DashboardSummaryCardsProps {
    resumeCount: number;
    interviewCount: number;
    portfolioCount: number;
    jobCount: number; // Not strictly used for count display in design, but good to have
    communityPostCount?: number;
}

const DashboardSummaryCards: React.FC<DashboardSummaryCardsProps> = ({
    resumeCount,
    interviewCount,
    portfolioCount,
    jobCount,
    communityPostCount = 0
}) => {
    const cards = [
        {
            title: 'My Resumes',
            count: resumeCount,
            icon: FileText,
            color: 'text-[var(--cv-action-primary)]',
            bg: 'bg-[var(--cv-action-soft-bg)]',
            link: '/newresume',
            isAction: false
        },
        {
            title: 'Find Jobs',
            count: null,
            icon: Briefcase,
            color: 'text-[var(--cv-action-primary)]',
            bg: 'bg-[var(--cv-action-soft-bg)]',
            link: '/jobs/recommend',
            isAction: true,
            actionText: 'Find Jobs'
        },
        {
            title: 'Technical Interview Simulator Sessions',
            mobileTitle: 'Interview Sessions',
            count: interviewCount,
            icon: Mic,
            color: 'text-[var(--cv-action-primary)]',
            bg: 'bg-[var(--cv-action-soft-bg)]',
            link: '/interview-studio',
            isAction: false
        },
        {
            title: 'Portfolios',
            count: portfolioCount,
            icon: Globe,
            color: 'text-[var(--cv-action-primary)]',
            bg: 'bg-[var(--cv-action-soft-bg)]',
            link: '/portfolio',
            isAction: false
        },
        {
            title: 'Career Pipeline',
            count: jobCount > 0 ? jobCount : null,
            icon: Briefcase,
            color: 'text-[var(--cv-action-primary)]',
            bg: 'bg-[var(--cv-action-soft-bg)]',
            link: '/job-tracker',
            isAction: jobCount === 0,
            actionText: '+ Track Job'
        },
        {
            title: 'Community Posts',
            count: communityPostCount,
            icon: MessageSquare,
            color: 'text-[var(--cv-action-primary)]',
            bg: 'bg-[var(--cv-action-soft-bg)]',
            link: '/my-posts',
            isAction: false
        }
    ];

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 md:gap-6 mb-5 md:mb-6">
            {cards.map((card, index) => (
                <div
                    key={index}
                    onClick={() => navigate(card.link)}
                    className="cv-design-card cv-design-card-hover group relative flex min-h-[128px] cursor-pointer flex-col justify-between overflow-hidden p-4 transition-all duration-300 md:h-36 md:p-5"
                >
                    {/* Subtle Top Gradient Line */}
                    <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--cv-action-border)] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="flex gap-3 items-start min-h-12">
                        <div className={`flex shrink-0 items-center justify-center rounded-xl border border-[var(--cv-action-border)] p-2 md:p-2.5 ${card.bg}`}>
                            <card.icon className={`w-4 h-4 ${card.color}`} />
                        </div>
                        <h3 className="text-left font-heading text-[11px] font-extrabold uppercase leading-tight tracking-[0.14em] text-[var(--cv-text-muted)]">
                            <span className="md:hidden">{card.mobileTitle || card.title}</span>
                            <span className="hidden md:inline">{card.title}</span>
                        </h3>
                    </div>

                    <div className="flex items-end justify-between mt-auto">
                        {card.isAction ? (
                            <div className="flex items-center gap-2 rounded-lg border border-[var(--cv-action-border)] bg-[var(--cv-action-soft-bg)] px-3 py-1.5 text-xs font-extrabold text-[var(--cv-action-primary)] transition-colors group-hover:bg-[var(--cv-action-soft-bg-strong)]">
                                {card.actionText}
                            </div>
                        ) : (
                            <div className="font-heading text-2xl font-extrabold leading-none tracking-tight text-[var(--cv-text-heading)] md:text-3xl">
                                {card.count !== null ? card.count : 0}
                            </div>
                        )}
                        <div className="flex h-7 w-7 -translate-x-1 items-center justify-center rounded-full bg-[var(--cv-surface-warm-muted)] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                            <Plus className="h-3.5 w-3.5 text-[var(--cv-text-muted)] transition-colors group-hover:text-[var(--cv-action-primary)]" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DashboardSummaryCards;
