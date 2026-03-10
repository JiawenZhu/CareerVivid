import React from 'react';
import { Link as LinkIcon, Trash2, PlusCircle } from 'lucide-react';
import { ResumeData, WebsiteLink } from '../../types';
import IconPicker from '../IconPicker';
import { createWebsiteLink } from '../../utils/iconDetection';

interface WebsitesSectionProps {
    t: any;
    resume: ResumeData;
    isReadOnly?: boolean;
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

const WebsitesSection: React.FC<WebsitesSectionProps> = ({
    t,
    resume,
    isReadOnly,
    handleArrayChange,
    addArrayItem,
    removeArrayItem
}) => {
    return (
        <FormSection title={t('resume_form.websites')} icon={<LinkIcon className="text-primary-500" />}>
            {resume.websites.map((link, index) => (
                <div key={link.id} className="relative p-5 border dark:border-gray-700 rounded-md mb-4 bg-gray-50/50 dark:bg-gray-800/30 hover:shadow-sm transition-shadow">
                    <div className="absolute top-4 right-4">
                        <button onClick={() => removeArrayItem('websites', index)} disabled={isReadOnly} className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Delete Entry">
                            <Trash2 size={18} />
                        </button>
                    </div>
                    <div className="space-y-4 pr-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input id={`websites[${index}].label`} label={t('resume_form.label')} value={link.label} onChange={e => handleArrayChange<WebsiteLink>('websites', index, 'label', e.target.value)} disabled={isReadOnly} />
                            <Input id={`websites[${index}].url`} label={t('resume_form.url')} value={link.url} onChange={e => handleArrayChange<WebsiteLink>('websites', index, 'url', e.target.value)} disabled={isReadOnly} />
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={link.showUrl || false}
                                    onChange={(e) => handleArrayChange<WebsiteLink>('websites', index, 'showUrl', e.target.checked)}
                                    disabled={isReadOnly}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('resume_form.show_url')}</span>
                            </label>
                        </div>

                        <IconPicker
                            selectedIcon={link.icon || 'link'}
                            onSelect={(iconId) => handleArrayChange<WebsiteLink>('websites', index, 'icon', iconId)}
                            label="Icon"
                        />
                    </div>
                </div>
            ))}
            <button onClick={() => addArrayItem('websites', createWebsiteLink())} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"><PlusCircle size={16} /> {t('resume_form.add_link')}</button>
        </FormSection>
    );
};

export default WebsitesSection;
