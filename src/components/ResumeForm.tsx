
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ResumeData, PersonalDetails, WebsiteLink, Skill, EmploymentHistory, Education, Language } from '../types';
import { parseResume } from '../services/geminiService';
import { LANGUAGE_PROFICIENCY_LEVELS } from '../constants';
import { PlusCircle, Trash2, Wand2, UploadCloud, User, Briefcase, GraduationCap, Link as LinkIcon, Star, CheckCircle, Loader2, Brush, Languages, Zap, ChevronDown, ChevronUp, GripVertical, Edit as EditIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage, dataURLtoBlob } from '../services/storageService';
import AlertModal from './AlertModal';
import EditableTextarea from './EditableTextarea';
import AIImprovementPanel from './AIImprovementPanel';
import AIImageEditModal from './AIImageEditModal';
import MonthYearPicker from './MonthYearPicker';
import IconPicker from './IconPicker';
import { detectIconFromUrl, createWebsiteLink, getLabelFromIcon } from '../utils/iconDetection';
import { useTranslation } from 'react-i18next';
import ResumeImport from './ResumeImport';
import { useAICreditCheck } from '../hooks/useAICreditCheck';

interface ResumeFormProps {
    resume: ResumeData;
    onChange: (updatedData: Partial<ResumeData>) => void;
    tempPhoto: string | null;
    setTempPhoto: (photo: string | null) => void;
    isReadOnly?: boolean;
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


const ResumeForm: React.FC<ResumeFormProps> = ({ resume, onChange, tempPhoto, setTempPhoto, isReadOnly = false }) => {
    const { currentUser, isPremium } = useAuth();
    const { t } = useTranslation();
    const [isParsing, setIsParsing] = useState(false);
    const [parsingMessageIndex, setParsingMessageIndex] = useState(0);

    const [activeImprovementId, setActiveImprovementId] = useState<string | null>(null);

    const [isImageEditModalOpen, setIsImageEditModalOpen] = useState(false);
    const [isPhotoUploading, setIsPhotoUploading] = useState(false);
    const [photoFileName, setPhotoFileName] = useState('No file chosen');
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '' });

    // AI Credit Check Hook
    const { checkCredit, CreditLimitModal } = useAICreditCheck();

    const hasInitialContent = !!(resume.personalDetails.firstName || resume.professionalSummary || (resume.employmentHistory && resume.employmentHistory.length > 0));
    const [isImportExpanded, setIsImportExpanded] = useState(false);
    const [importText, setImportText] = useState('');
    const [importSuccess, setImportSuccess] = useState(false);

    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [draggedItemType, setDraggedItemType] = useState<keyof ResumeData | null>(null);

    const parsingMessages = [
        "Analyzing document structure...",
        "Identifying professional details...",
        "Extracting work experience...",
        "Organizing skills and languages...",
        "Refining content..."
    ];

    useEffect(() => {
        let interval: number;
        if (isParsing) {
            setParsingMessageIndex(0);
            interval = window.setInterval(() => {
                setParsingMessageIndex(prevIndex => (prevIndex + 1) % parsingMessages.length);
            }, 1500);
        }
        return () => clearInterval(interval);
    }, [isParsing]);


    const handleChange = <T,>(field: keyof T, value: any, parentField?: keyof ResumeData) => {
        if (parentField) {
            const parentData = resume[parentField] as T;
            onChange({ [parentField]: { ...parentData, [field]: value } } as Partial<ResumeData>);
        } else {
            onChange({ [field]: value } as Partial<ResumeData>);
        }
    };

    const handleImportText = async (text: string) => {
        if (!currentUser) return;
        setIsParsing(true);
        try {
            const parsedData = await parseResume(currentUser.uid, text, resume.language);
            onChange(parsedData);
            setIsImportExpanded(false);

            // Inline success feedback
            setImportSuccess(true);
            setImportText(''); // Clear text after successful import

            // Auto-dismiss success message
            setTimeout(() => {
                setImportSuccess(false);
            }, 3000);

        } catch (error) {
            setAlertState({ isOpen: true, title: 'Parsing Failed', message: error instanceof Error ? error.message : "Failed to parse resume." });
        } finally {
            setIsParsing(false);
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setPhotoFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setTempPhoto(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveTempPhoto = async () => {
        if (!tempPhoto || !currentUser) return;

        setIsPhotoUploading(true);
        try {
            const blob = dataURLtoBlob(tempPhoto);
            if (!blob) throw new Error("Could not convert photo data.");

            const path = `users/${currentUser.uid}/resume_photos/${Date.now()}_saved.png`;
            const downloadURL = await uploadImage(blob, path);

            handleChange('photo', downloadURL, 'personalDetails');
            setTempPhoto(null);

        } catch (error: any) {
            console.error("Error saving photo:", error);
            setAlertState({
                isOpen: true,
                title: 'Save Failed',
                message: `Failed to save photo to profile. ${error.message || ''}`
            });
        } finally {
            setIsPhotoUploading(false);
        }
    };

    const handleRemovePhoto = () => {
        setTempPhoto(null);
        handleChange('photo', '', 'personalDetails');
        setPhotoFileName('No file chosen');
        if (photoInputRef.current) {
            photoInputRef.current.value = "";
        }
    };

    const toggleImprovement = (id: string) => {
        if (activeImprovementId === id) {
            setActiveImprovementId(null);
        } else {
            setActiveImprovementId(id);
        }
    };

    const handleArrayChange = <T,>(arrayName: keyof ResumeData, index: number, field: keyof T, value: any) => {
        const array = resume[arrayName] as T[];
        const newArray = [...array];
        newArray[index] = { ...newArray[index], [field]: value };

        // Auto-detect icon when URL or label changes for website links
        if (arrayName === 'websites') {
            if (field === 'url' || field === 'label') {
                const link = newArray[index] as unknown as WebsiteLink;
                const detectedIcon = detectIconFromUrl(link.url || '', link.label || '');
                newArray[index] = { ...newArray[index], icon: detectedIcon } as T;
            } else if (field === 'icon') {
                // Auto-fill label when icon is selected manually
                const link = newArray[index] as unknown as WebsiteLink;
                // Only update if label is empty or matches a default/generic name to avoid overwriting custom labels
                // For now, we'll just update it if it's empty or if we want to be aggressive as per user request
                // "when user click on a icon, it will show responsive label names" -> implies direct update
                const newLabel = getLabelFromIcon(value);
                if (newLabel) {
                    newArray[index] = { ...newArray[index], label: newLabel } as T;
                }
            }
        }

        onChange({ [arrayName]: newArray } as Partial<ResumeData>);
    };

    const addArrayItem = (arrayName: keyof ResumeData, newItem: any) => {
        const array = resume[arrayName] as any[];
        onChange({ [arrayName]: [...array, newItem] } as Partial<ResumeData>);
    };

    const removeArrayItem = (arrayName: keyof ResumeData, index: number) => {
        const array = resume[arrayName] as any[];
        onChange({ [arrayName]: array.filter((_, i) => i !== index) } as Partial<ResumeData>);
    };

    // DnD Handlers
    const handleDragStart = (e: React.DragEvent, index: number, type: keyof ResumeData) => {
        setDraggedItemIndex(index);
        setDraggedItemType(type);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number, type: keyof ResumeData) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemType !== type) return;

        const list = resume[type] as any[];
        const newList = [...list];
        const [movedItem] = newList.splice(draggedItemIndex, 1);
        newList.splice(dropIndex, 0, movedItem);

        onChange({ [type]: newList } as Partial<ResumeData>);
        setDraggedItemIndex(null);
        setDraggedItemType(null);
    };

    const displayPhoto = tempPhoto || resume.personalDetails.photo;

    return (
        <div className="space-y-6">
            <CreditLimitModal />
            <AlertModal
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                onClose={() => setAlertState({ isOpen: false, title: '', message: '' })}
            />

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
                <button
                    onClick={() => setIsImportExpanded(!isImportExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors"
                    type="button"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md transition-colors ${isImportExpanded ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                            <UploadCloud size={20} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{t('resume_form.import_resume')}</h3>
                            {importSuccess ? (
                                <p className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1 animate-in fade-in duration-300">
                                    <CheckCircle size={12} /> {t('resume_form.import_success', 'Imported successfully!')}
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('resume_form.autofill_desc')}</p>
                            )}
                        </div>
                    </div>
                    {isImportExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>

                {isImportExpanded && (
                    <div className="p-6 animate-fade-in bg-white dark:bg-gray-800">
                        <ResumeImport
                            onFileProcessed={handleImportText} // Auto-import on file drop
                            value={importText}
                            onChange={setImportText}
                            isReadOnly={isReadOnly}
                            variant="classic"
                        >
                            <button
                                onClick={() => handleImportText(importText)}
                                disabled={!importText.trim() || isParsing}
                                className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {isParsing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                {t('resume_form.import_button', 'Import')}
                            </button>
                        </ResumeImport>
                    </div>
                )}
            </div>

            {isImageEditModalOpen && displayPhoto && currentUser && (
                <AIImageEditModal
                    userId={currentUser.uid}
                    currentPhoto={displayPhoto}
                    onClose={() => setIsImageEditModalOpen(false)}
                    onSave={(newPhotoUrl) => {
                        handleChange('photo', newPhotoUrl, 'personalDetails');
                    }}
                    onUseTemp={(newPhotoDataUrl) => {
                        setTempPhoto(newPhotoDataUrl);
                    }}
                    onError={(title, message) => setAlertState({ isOpen: true, title, message })}
                    savePath={`users/${currentUser.uid}/resume_photos/${Date.now()}_edited.png`}
                />
            )}

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
                            setActiveImprovementId(null);
                        }}
                        onClose={() => setActiveImprovementId(null)}
                        onError={(title, message) => setAlertState({ isOpen: true, title, message })}
                    />
                )}
            </FormSection>

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
                <button onClick={() => addArrayItem('skills', { id: crypto.randomUUID(), name: '', level: 'Intermediate' })} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"><PlusCircle size={16} /> {t('resume_form.add_skill')}</button>
            </FormSection>

            <FormSection title={t('resume_form.languages')} icon={<Languages className="text-primary-500" />}>
                {resume.languages.map((lang, index) => (
                    <div key={lang.id} className="relative p-5 border dark:border-gray-700 rounded-md mb-4 bg-gray-50/50 dark:bg-gray-800/30 hover:shadow-sm transition-shadow">
                        <div className="absolute top-4 right-4">
                            <button onClick={() => removeArrayItem('languages', index)} disabled={isReadOnly} className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Delete Entry">
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                            <Input id={`languages[${index}].name`} label={t('resume_form.language')} value={lang.name} onChange={e => handleArrayChange<Language>('languages', index, 'name', e.target.value)} disabled={isReadOnly} />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('resume_form.proficiency')}</label>
                                <select id={`languages[${index}].level`} value={lang.level} onChange={e => handleArrayChange<Language>('languages', index, 'level', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800">
                                    {LANGUAGE_PROFICIENCY_LEVELS.map(level => <option key={level}>{level}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
                <button onClick={() => addArrayItem('languages', { id: crypto.randomUUID(), name: '', level: 'Intermediate' })} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"><PlusCircle size={16} /> {t('resume_form.add_language')}</button>
            </FormSection>

            <FormSection title={t('resume_form.employment_history')} icon={<Briefcase className="text-primary-500" />}>
                {resume.employmentHistory.map((job, index) => (
                    <div
                        key={job.id}
                        draggable={!isReadOnly}
                        onDragStart={(e) => handleDragStart(e, index, 'employmentHistory')}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index, 'employmentHistory')}
                        className="relative p-5 border dark:border-gray-700 rounded-md mb-6 bg-gray-50/50 dark:bg-gray-800/30 hover:shadow-sm transition-shadow cursor-default"
                    >
                        <div className="absolute top-1/2 -translate-y-1/2 left-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                            <GripVertical size={20} />
                        </div>
                        <div className="absolute top-4 right-4">
                            <button onClick={() => removeArrayItem('employmentHistory', index)} disabled={isReadOnly} className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Delete Entry">
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8 pl-6">
                            <Input id={`employmentHistory[${index}].jobTitle`} label={t('resume_form.job_title')} value={job.jobTitle} onChange={e => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'jobTitle', e.target.value)} disabled={isReadOnly} />
                            <Input id={`employmentHistory[${index}].employer`} label={t('resume_form.employer')} value={job.employer} onChange={e => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'employer', e.target.value)} disabled={isReadOnly} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 pl-6 pr-8">
                            <Input id={`employmentHistory[${index}].city`} label={t('resume_form.city')} value={job.city} onChange={e => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'city', e.target.value)} disabled={isReadOnly} />
                            <MonthYearPicker id={`employmentHistory[${index}].startDate`} label={t('resume_form.start_date')} value={job.startDate} onChange={v => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'startDate', v)} disabled={isReadOnly} />
                            <MonthYearPicker id={`employmentHistory[${index}].endDate`} label={t('resume_form.end_date')} value={job.endDate} onChange={v => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'endDate', v)} disabled={isReadOnly} />
                        </div>

                        <div className="mt-4 pl-6 pr-8">
                            <EditableTextarea
                                id={`employmentHistory[${index}].description`}
                                label={t('resume_form.description')}
                                value={job.description}
                                onChange={value => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'description', value)}
                                disabled={isReadOnly}
                                placeholder="e.g., - Designed and refined a comprehensive library of over 500 prompts for a customer service chatbot..."
                            />
                            <div className="mt-2">
                                <button
                                    onClick={() => toggleImprovement(`job-${job.id}`)}
                                    disabled={isReadOnly}
                                    className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Wand2 size={16} /> {t('resume_form.improve_desc')}
                                    {activeImprovementId === `job-${job.id}` ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                {activeImprovementId === `job-${job.id}` && currentUser && (
                                    <AIImprovementPanel
                                        userId={currentUser.uid}
                                        sectionName="Job Description"
                                        currentText={job.description}
                                        language={resume.language}
                                        onAccept={(text) => {
                                            handleArrayChange<EmploymentHistory>('employmentHistory', index, 'description', text);
                                            setActiveImprovementId(null);
                                        }}
                                        onClose={() => setActiveImprovementId(null)}
                                        onError={(title, message) => setAlertState({ isOpen: true, title, message })}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <button onClick={() => addArrayItem('employmentHistory', { id: crypto.randomUUID(), jobTitle: '', employer: '', city: '', startDate: '', endDate: '', description: '' })} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"><PlusCircle size={16} /> {t('resume_form.add_employment')}</button>
            </FormSection>

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
                                            setActiveImprovementId(null);
                                        }}
                                        onClose={() => setActiveImprovementId(null)}
                                        onError={(title, message) => setAlertState({ isOpen: true, title, message })}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <button onClick={() => addArrayItem('education', { id: crypto.randomUUID(), school: '', degree: '', city: '', startDate: '', endDate: '', description: '' })} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"><PlusCircle size={16} /> {t('resume_form.add_education')}</button>
            </FormSection>
        </div >
    );
};

export default ResumeForm;
