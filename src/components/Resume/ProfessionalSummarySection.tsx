import React from 'react';
import { Briefcase, Wand2, ChevronUp, ChevronDown } from 'lucide-react';
import { ResumeData } from '../../types';
import EditableTextarea from '../EditableTextarea';
import AIImprovementPanel from '../AIImprovementPanel';

interface ProfessionalSummarySectionProps {
    t: any;
    resume: ResumeData;
    isReadOnly?: boolean;
    handleChange: (field: any, value: any, parentField?: any) => void;
    activeImprovementId: string | null;
    toggleImprovement: (id: string) => void;
    currentUser: any;
    setAlertState: (state: any) => void;
}

const FormSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="mb-8 p-6 bg-white dark:bg-gray-800/50 dark:border dark:border-gray-700 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
            {icon}
            <h2 className="text-2xl font-bold ml-3 text-gray-800 dark:text-gray-100">{title}</h2>
        </div>
        {children}
    </div>
);

const ProfessionalSummarySection: React.FC<ProfessionalSummarySectionProps> = ({
    t,
    resume,
    isReadOnly,
    handleChange,
    activeImprovementId,
    toggleImprovement,
    currentUser,
    setAlertState
}) => {
    return (
        <FormSection title={t('resume_form.professional_summary')} icon={<Briefcase className="text-primary-500" />}>
            <EditableTextarea
                id="professionalSummary"
                label={t('resume_form.summary')}
                value={resume.professionalSummary}
                onChange={value => handleChange('professionalSummary', value)}
                disabled={isReadOnly}
                placeholder="e.g., A creative and analytical Prompt Engineer with over 4 years of experience..."
            />
            <button
                onClick={() => toggleImprovement('summary')}
                disabled={isReadOnly}
                className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Wand2 size={16} /> {t('resume_form.improve_ai')}
                {activeImprovementId === 'summary' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {activeImprovementId === 'summary' && currentUser && (
                <AIImprovementPanel
                    userId={currentUser.uid}
                    sectionName="Professional Summary"
                    currentText={resume.professionalSummary}
                    language={resume.language}
                    onAccept={(text) => {
                        handleChange('professionalSummary', text);
                        toggleImprovement('summary');
                    }}
                    onClose={() => toggleImprovement('summary')}
                    onError={(title, message) => setAlertState({ isOpen: true, title, message })}
                />
            )}
        </FormSection>
    );
};

export default ProfessionalSummarySection;
