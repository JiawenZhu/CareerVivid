import React from 'react';
import { GraduationCap, GripVertical, Trash2, Wand2, ChevronUp, ChevronDown, PlusCircle } from 'lucide-react';
import { ResumeData, Education } from '../../types';
import MonthYearPicker from '../MonthYearPicker';
import EditableTextarea from '../EditableTextarea';
import AIImprovementPanel from '../AIImprovementPanel';
import { generateSafeUUID } from '../../constants';

interface EducationSectionProps {
    t: any;
    resume: ResumeData;
    isReadOnly?: boolean;
    handleDragStart: (e: React.DragEvent, index: number, type: keyof ResumeData) => void;
    handleDragOver: (e: React.DragEvent, index: number) => void;
    handleDrop: (e: React.DragEvent, dropIndex: number, type: keyof ResumeData) => void;
    handleArrayChange: <T,>(arrayName: keyof ResumeData, index: number, field: keyof T, value: any) => void;
    addArrayItem: (arrayName: keyof ResumeData, newItem: any) => void;
    removeArrayItem: (arrayName: keyof ResumeData, index: number) => void;
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

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div className="mb-4" id={id ? `container-${id}` : undefined}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <input id={id} {...props} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 transition-colors duration-200" />
    </div>
);

const EducationSection: React.FC<EducationSectionProps> = ({
    t,
    resume,
    isReadOnly,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleArrayChange,
    addArrayItem,
    removeArrayItem,
    activeImprovementId,
    toggleImprovement,
    currentUser,
    setAlertState
}) => {
    return (
        <FormSection title={t('resume_form.education')} icon={<GraduationCap className="text-primary-500" />}>
            {resume.education.map((edu, index) => (
                <div
                    key={edu.id}
                    draggable={!isReadOnly}
                    onDragStart={(e) => handleDragStart(e, index, 'education')}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index, 'education')}
                    className="relative p-5 border dark:border-gray-700 rounded-md mb-6 bg-gray-50/50 dark:bg-gray-800/30 hover:shadow-sm transition-shadow cursor-default"
                >
                    <div className="absolute top-1/2 -translate-y-1/2 left-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                        <GripVertical size={20} />
                    </div>
                    <div className="absolute top-4 right-4">
                        <button onClick={() => removeArrayItem('education', index)} disabled={isReadOnly} className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Delete Entry">
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8 pl-6">
                        <Input id={`education[${index}].school`} label={t('resume_form.school')} value={edu.school} onChange={e => handleArrayChange<Education>('education', index, 'school', e.target.value)} disabled={isReadOnly} />
                        <Input id={`education[${index}].degree`} label={t('resume_form.degree')} value={edu.degree} onChange={e => handleArrayChange<Education>('education', index, 'degree', e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 pl-6 pr-8">
                        <Input id={`education[${index}].city`} label={t('resume_form.city')} value={edu.city} onChange={e => handleArrayChange<Education>('education', index, 'city', e.target.value)} disabled={isReadOnly} />
                        <MonthYearPicker id={`education[${index}].startDate`} label={t('resume_form.start_date')} value={edu.startDate} onChange={v => handleArrayChange<Education>('education', index, 'startDate', v)} disabled={isReadOnly} />
                        <MonthYearPicker id={`education[${index}].endDate`} label={t('resume_form.end_date')} value={edu.endDate} onChange={v => handleArrayChange<Education>('education', index, 'endDate', v)} disabled={isReadOnly} />
                    </div>

                    <div className="mt-4 pl-6 pr-8">
                        <EditableTextarea
                            id={`education[${index}].description`}
                            label={t('resume_form.description')}
                            value={edu.description}
                            onChange={value => handleArrayChange<Education>('education', index, 'description', value)}
                            disabled={isReadOnly}
                            placeholder="e.g., Graduated with honors. Relevant coursework included Natural Language Processing..."
                        />
                        <div className="mt-2">
                            <button
                                onClick={() => toggleImprovement(`edu-${edu.id}`)}
                                disabled={isReadOnly}
                                className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Wand2 size={16} /> {t('resume_form.improve_desc')}
                                {activeImprovementId === `edu-${edu.id}` ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {activeImprovementId === `edu-${edu.id}` && currentUser && (
                                <AIImprovementPanel
                                    userId={currentUser.uid}
                                    sectionName="Education Description"
                                    currentText={edu.description}
                                    language={resume.language}
                                    onAccept={(text) => {
                                        handleArrayChange<Education>('education', index, 'description', text);
                                        toggleImprovement(`edu-${edu.id}`);
                                    }}
                                    onClose={() => toggleImprovement(`edu-${edu.id}`)}
                                    onError={(title, message) => setAlertState({ isOpen: true, title, message })}
                                />
                            )}
                        </div>
                    </div>
                </div>
            ))}
            <button onClick={() => addArrayItem('education', { id: generateSafeUUID(), school: '', degree: '', city: '', startDate: '', endDate: '', description: '' })} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"><PlusCircle size={16} /> {t('resume_form.add_education')}</button>
        </FormSection>
    );
};

export default EducationSection;
