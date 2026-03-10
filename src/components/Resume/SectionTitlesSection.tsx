import React from 'react';
import { Edit as EditIcon } from 'lucide-react';
import { ResumeData } from '../../types';

interface SectionTitlesSectionProps {
    t: any;
    resume: ResumeData;
    isReadOnly?: boolean;
    handleChange: (field: any, value: any, parentField?: any) => void;
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

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div className="mb-4" id={id ? `container-${id}` : undefined}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <input id={id} {...props} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 transition-colors duration-200" />
    </div>
);

const SectionTitlesSection: React.FC<SectionTitlesSectionProps> = ({
    t,
    resume,
    isReadOnly,
    handleChange
}) => {
    return (
        <FormSection title={t('resume_form.section_titles')} icon={<EditIcon className="text-primary-500" />}>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('resume_form.customize_sections')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    id="sectionTitles.profile"
                    label="Profile Section"
                    value={resume.sectionTitles?.profile || ''}
                    onChange={e => handleChange('profile', e.target.value || undefined, 'sectionTitles')}
                    disabled={isReadOnly}
                    placeholder="Profile (default)"
                />
                <Input
                    id="sectionTitles.skills"
                    label="Skills Section"
                    value={resume.sectionTitles?.skills || ''}
                    onChange={e => handleChange('skills', e.target.value || undefined, 'sectionTitles')}
                    disabled={isReadOnly}
                    placeholder="Skills (default)"
                />
                <Input
                    id="sectionTitles.experience"
                    label="Experience Section"
                    value={resume.sectionTitles?.experience || ''}
                    onChange={e => handleChange('experience', e.target.value || undefined, 'sectionTitles')}
                    disabled={isReadOnly}
                    placeholder="Experience (default)"
                />
                <Input
                    id="sectionTitles.education"
                    label="Education Section"
                    value={resume.sectionTitles?.education || ''}
                    onChange={e => handleChange('education', e.target.value || undefined, 'sectionTitles')}
                    disabled={isReadOnly}
                    placeholder="Education (default)"
                />
                <Input
                    id="sectionTitles.languages"
                    label="Languages Section"
                    value={resume.sectionTitles?.languages || ''}
                    onChange={e => handleChange('languages', e.target.value || undefined, 'sectionTitles')}
                    disabled={isReadOnly}
                    placeholder="Languages (default)"
                />
                <Input
                    id="sectionTitles.websites"
                    label="Websites Section"
                    value={resume.sectionTitles?.websites || ''}
                    onChange={e => handleChange('websites', e.target.value || undefined, 'sectionTitles')}
                    disabled={isReadOnly}
                    placeholder="Websites & Social Links (default)"
                />
                <Input
                    id="sectionTitles.contact"
                    label="Contact Section"
                    value={resume.sectionTitles?.contact || ''}
                    onChange={e => handleChange('contact', e.target.value || undefined, 'sectionTitles')}
                    disabled={isReadOnly}
                    placeholder="Contact (default)"
                />
            </div>
        </FormSection>
    );
};

export default SectionTitlesSection;
