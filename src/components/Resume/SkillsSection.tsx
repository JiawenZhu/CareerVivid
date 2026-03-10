import React from 'react';
import { Star, GripVertical, Trash2, PlusCircle } from 'lucide-react';
import { ResumeData, Skill } from '../../types';
import { generateSafeUUID } from '../../constants';

interface SkillsSectionProps {
    t: any;
    resume: ResumeData;
    isReadOnly?: boolean;
    handleDragStart: (e: React.DragEvent, index: number, type: keyof ResumeData) => void;
    handleDragOver: (e: React.DragEvent, index: number) => void;
    handleDrop: (e: React.DragEvent, dropIndex: number, type: keyof ResumeData) => void;
    handleArrayChange: <T,>(arrayName: keyof ResumeData, index: number, field: keyof T, value: any) => void;
    addArrayItem: (arrayName: keyof ResumeData, newItem: any) => void;
    removeArrayItem: (arrayName: keyof ResumeData, index: number) => void;
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

const SkillsSection: React.FC<SkillsSectionProps> = ({
    t,
    resume,
    isReadOnly,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleArrayChange,
    addArrayItem,
    removeArrayItem
}) => {
    return (
        <FormSection title={t('resume_form.skills')} icon={<Star className="text-primary-500" />}>
            {resume.skills.map((skill, index) => (
                <div
                    key={skill.id}
                    draggable={!isReadOnly}
                    onDragStart={(e) => handleDragStart(e, index, 'skills')}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index, 'skills')}
                    className="relative p-5 border dark:border-gray-700 rounded-md mb-4 bg-gray-50/50 dark:bg-gray-800/30 hover:shadow-sm transition-shadow cursor-default"
                >
                    <div className="absolute top-1/2 -translate-y-1/2 left-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                        <GripVertical size={20} />
                    </div>
                    <div className="absolute top-4 right-4">
                        <button onClick={() => removeArrayItem('skills', index)} disabled={isReadOnly} className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Delete Entry">
                            <Trash2 size={18} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8 pl-6">
                        <Input id={`skills[${index}].name`} label={t('resume_form.skill')} value={skill.name} onChange={e => handleArrayChange<Skill>('skills', index, 'name', e.target.value)} disabled={isReadOnly} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('resume_form.level')}</label>
                            <select id={`skills[${index}].level`} value={skill.level} onChange={e => handleArrayChange<Skill>('skills', index, 'level', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800">
                                <option>Novice</option>
                                <option>Intermediate</option>
                                <option>Advanced</option>
                                <option>Expert</option>
                            </select>
                        </div>
                    </div>
                </div>
            ))}
            <button onClick={() => addArrayItem('skills', { id: generateSafeUUID(), name: '', level: 'Intermediate' })} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"><PlusCircle size={16} /> {t('resume_form.add_skill')}</button>
        </FormSection>
    );
};

export default SkillsSection;
