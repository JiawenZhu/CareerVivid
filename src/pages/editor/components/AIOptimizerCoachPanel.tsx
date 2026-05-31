import React from 'react';
import { BookOpen } from 'lucide-react';

interface AIOptimizerCoachPanelProps {
    coach: {
        title: string;
        themeClass: string;
        iconClass: string;
        whyTitle: string;
        explanation: string;
    };
}

const AIOptimizerCoachPanel: React.FC<AIOptimizerCoachPanelProps> = ({ coach }) => (
    <div className={`p-4 rounded-2xl border bg-gradient-to-br ${coach.themeClass}`}>
        <div className="flex items-start gap-3">
            <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${coach.iconClass}`}>
                <BookOpen size={16} />
            </div>
            <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{coach.title}</h3>
                <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider pt-1">{coach.whyTitle}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed pt-1">{coach.explanation}</p>
            </div>
        </div>
    </div>
);

export default AIOptimizerCoachPanel;
