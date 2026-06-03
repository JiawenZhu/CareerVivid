import React from 'react';
import { User, Loader2, Brush, Zap, CheckCircle, Trash2 } from 'lucide-react';
import { ResumeData } from '../../types';

interface PersonalDetailsSectionProps {
    t: any;
    resume: ResumeData;
    isReadOnly?: boolean;
    isPremium: boolean;
    displayPhoto: string | null;
    isPhotoUploading: boolean;
    photoFileName: string;
    photoInputRef: React.RefObject<HTMLInputElement>;
    handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setIsImageEditModalOpen: (value: boolean) => void;
    handleSaveTempPhoto: () => void;
    handleRemovePhoto: () => void;
    handleChange: (field: any, value: any, parentField?: any) => void;
    tempPhoto: string | null;
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

const PersonalDetailsSection: React.FC<PersonalDetailsSectionProps> = ({
    t,
    resume,
    isReadOnly,
    isPremium,
    displayPhoto,
    isPhotoUploading,
    photoFileName,
    photoInputRef,
    handlePhotoChange,
    setIsImageEditModalOpen,
    handleSaveTempPhoto,
    handleRemovePhoto,
    handleChange,
    tempPhoto
}) => {
    return (
        <FormSection title={t('resume_form.personal_details')} icon={<User className="text-primary-500" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input id="personalDetails.jobTitle" label={t('resume_form.job_title')} value={resume.personalDetails.jobTitle} onChange={e => handleChange('jobTitle', e.target.value, 'personalDetails')} disabled={isReadOnly} />
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('resume_form.photo')}</label>
                    <input id="photo-upload" type="file" onChange={handlePhotoChange} accept="image/*" className="hidden" ref={photoInputRef} disabled={isReadOnly} />

                    <div className="flex items-center gap-4">
                        {displayPhoto && (
                            <img src={displayPhoto} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                        )}

                        {isPhotoUploading ? (
                            <div className="flex items-center">
                                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Saving...</span>
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <label htmlFor="photo-upload" className={`cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}`}>
                                    {displayPhoto ? t('resume_form.change') : t('resume_form.choose_file')}
                                </label>
                                {!displayPhoto && (
                                    <span className="ml-3 text-sm text-gray-500 dark:text-gray-400 max-w-[150px] truncate">{photoFileName}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {displayPhoto && !isPhotoUploading && (
                        <div className="mt-2 flex flex-wrap items-center gap-4">
                            {isPremium ? (
                                <button onClick={() => setIsImageEditModalOpen(true)} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <Brush size={16} /> {t('resume_form.edit_ai')}
                                </button>
                            ) : (
                                <div className="group relative">
                                    <button disabled className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed">
                                        <Brush size={16} /> {t('resume_form.edit_ai')}
                                    </button>
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 text-center bg-gray-800 text-white text-xs rounded-md p-2">
                                        <Zap size={16} className="mx-auto mb-1 text-yellow-400" />
                                        {t('resume_form.premium_feature')} <a href="/pricing" className="underline font-bold">{t('resume_form.upgrade_unlock')}</a>
                                    </div>
                                </div>
                            )}
                            {tempPhoto && (
                                <button onClick={handleSaveTempPhoto} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <CheckCircle size={16} /> {t('resume_form.save_profile')}
                                </button>
                            )}
                            <button onClick={handleRemovePhoto} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Trash2 size={16} /> {t('resume_form.remove')}
                            </button>
                        </div>
                    )}
                </div>
                <Input id="personalDetails.firstName" label={t('resume_form.first_name')} value={resume.personalDetails.firstName} onChange={e => handleChange('firstName', e.target.value, 'personalDetails')} disabled={isReadOnly} />
                <Input id="personalDetails.lastName" label={t('resume_form.last_name')} value={resume.personalDetails.lastName} onChange={e => handleChange('lastName', e.target.value, 'personalDetails')} disabled={isReadOnly} />
                <Input id="personalDetails.email" label={t('resume_form.email')} type="email" value={resume.personalDetails.email} onChange={e => handleChange('email', e.target.value, 'personalDetails')} disabled={isReadOnly} />
                <Input id="personalDetails.phone" label={t('resume_form.phone')} value={resume.personalDetails.phone} onChange={e => handleChange('phone', e.target.value, 'personalDetails')} disabled={isReadOnly} />
            </div>
            <Input id="personalDetails.address" label={t('resume_form.address')} value={resume.personalDetails.address} onChange={e => handleChange('address', e.target.value, 'personalDetails')} disabled={isReadOnly} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input id="personalDetails.city" label={t('resume_form.city')} value={resume.personalDetails.city} onChange={e => handleChange('city', e.target.value, 'personalDetails')} disabled={isReadOnly} />
                <Input id="personalDetails.postalCode" label={t('resume_form.postal_code')} value={resume.personalDetails.postalCode} onChange={e => handleChange('postalCode', e.target.value, 'personalDetails')} disabled={isReadOnly} />
                <Input id="personalDetails.country" label={t('resume_form.country')} value={resume.personalDetails.country} onChange={e => handleChange('country', e.target.value, 'personalDetails')} disabled={isReadOnly} />
            </div>
        </FormSection>
    );
};

export default PersonalDetailsSection;
