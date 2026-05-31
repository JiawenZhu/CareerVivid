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
    <div className="mb-5 rounded-xl border border-[#e8dfd3] bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
        <div className="mb-4 flex items-center border-b border-[#f0e8dc] pb-3 dark:border-gray-800">
            {icon}
            <h2 className="ml-3 text-lg font-black text-slate-900 dark:text-gray-100">{title}</h2>
        </div>
        {children}
    </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div className="mb-3" id={id ? `container-${id}` : undefined}>
        <label htmlFor={id} className="mb-1 block text-xs font-bold text-slate-500 dark:text-gray-400">{label}</label>
        <input id={id} {...props} className="w-full rounded-lg border border-[#ded6cb] bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors duration-200 focus:border-primary-400 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" />
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
                    key={skill.id || `skill-${index}`}
                    draggable={!isReadOnly}
                    onDragStart={(e) => handleDragStart(e, index, 'skills')}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index, 'skills')}
                    className="relative mb-3 rounded-xl border border-[#ede4d8] bg-[#fbf8f3]/70 p-4 transition-shadow hover:shadow-sm dark:border-gray-800 dark:bg-gray-950/40 cursor-default"
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
