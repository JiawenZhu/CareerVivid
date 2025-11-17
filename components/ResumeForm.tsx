import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ResumeData, PersonalDetails, WebsiteLink, Skill, EmploymentHistory, Education, Language } from '../types';
import { parseResume, improveSection, parseResumeFromFile, editProfilePhoto } from '../services/geminiService';
import { LANGUAGE_PROFICIENCY_LEVELS } from '../constants';
import { PlusCircle, Trash2, Wand2, UploadCloud, User, Briefcase, GraduationCap, Link as LinkIcon, Star, CheckCircle, Loader2, Brush, Languages, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AlertModal from './AlertModal';
import EditableTextarea from './EditableTextarea';

interface ResumeFormProps {
  resume: ResumeData;
  onChange: (updatedData: Partial<ResumeData>) => void;
  tempPhoto: string | null;
  setTempPhoto: (photo: string | null) => void;
  isReadOnly?: boolean;
}

// Reusable Section Component
const FormSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="mb-8 p-6 bg-white dark:bg-gray-800/50 dark:border dark:border-gray-700 rounded-lg shadow-md">
    <div className="flex items-center mb-4">
      {icon}
      <h2 className="text-2xl font-bold ml-3 text-gray-800 dark:text-gray-100">{title}</h2>
    </div>
    {children}
  </div>
);

// Reusable Input Component
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <input {...props} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" />
  </div>
);

const AIImprovementModal: React.FC<{ userId: string; sectionName: string; currentText: string; language: string; onImprove: (newText: string) => void; onClose: () => void; onError: (title: string, message: string) => void }> = ({ userId, sectionName, currentText, language, onImprove, onClose, onError }) => {
    const [instruction, setInstruction] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [improvedText, setImprovedText] = useState('');

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleGenerate = async () => {
        setIsLoading(true);
        setImprovedText('');
        try {
            const result = await improveSection(userId, sectionName, currentText, instruction, language);
            setImprovedText(result);
        } catch (error) {
            onError('AI Improvement Failed', error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAccept = () => {
        onImprove(improvedText);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-xl">
                <h3 className="text-lg font-bold mb-4">Improve {sectionName}</h3>
                <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder={`e.g., "Make this sound more professional" or "Shorten this to 3 sentences"`}
                    className="w-full p-2 border rounded-md mb-4 bg-white dark:bg-gray-700 dark:border-gray-600"
                    rows={3}
                />
                <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:bg-primary-300">
                    {isLoading ? 'Generating...' : 'Generate Improvement'}
                </button>

                {improvedText && (
                    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <h4 className="font-semibold mb-2">Suggested Text:</h4>
                        <p className="text-sm">{improvedText}</p>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Cancel</button>
                            <button onClick={handleAccept} className="px-4 py-2 bg-green-500 text-white rounded-md">Accept</button>
                        </div>
                    </div>
                )}
                 <button onClick={onClose} className="w-full mt-4 text-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Close</button>
            </div>
        </div>
    );
};

const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

const AIImageEditModal: React.FC<{
    userId: string;
    currentPhoto: string;
    onSave: (newPhotoUrl: string) => void;
    onUseTemp: (newPhotoDataUrl: string) => void;
    onClose: () => void;
    onError: (title: string, message: string) => void;
}> = ({ userId, currentPhoto, onSave, onUseTemp, onClose, onError }) => {
    const { currentUser } = useAuth();
    const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
    const [customPrompt, setCustomPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [newPhoto, setNewPhoto] = useState<string | null>(null);

     useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const promptTemplates = [
        'Make this photo look more professional',
        'Change the background to a blurred office setting',
        'Convert this to a black and white headshot',
        'Change my shirt to a professional collared shirt',
        'Improve the lighting to be brighter and more even',
        'Create a clean, professional avatar from this photo',
        'Replace background with a solid light gray color',
        'Slightly enhance sharpness and color',
    ];

    const handlePromptToggle = (p: string) => {
        setSelectedPrompts(prev =>
            prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
        );
    };

    const handleGenerate = async () => {
        const finalPrompt = [...selectedPrompts, customPrompt].filter(Boolean).join(', ');
        if (!finalPrompt) {
            onError("Prompt Required", "Please select or enter a prompt to edit the image.");
            return;
        }
        setIsLoading(true);
        setNewPhoto(null);
        try {
            let base64data: string;
            let mimeType: string;

            if (currentPhoto.startsWith('data:')) {
                const parts = currentPhoto.split(',');
                const mimeMatch = parts[0].match(/:(.*?);/);
                if (!mimeMatch) throw new Error('Invalid data URL.');
                mimeType = mimeMatch[1];
                base64data = parts[1];
            } else {
                const response = await fetch(currentPhoto);
                if (!response.ok) throw new Error('Failed to fetch current photo for editing.');
                const blob = await response.blob();
                mimeType = blob.type;
                base64data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }
            
            const result = await editProfilePhoto(userId, base64data, mimeType, finalPrompt);
            setNewPhoto(result);

        } catch (error) {
            onError('AI Edit Failed', error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAndUse = async () => {
        if (newPhoto && currentUser) {
            setIsLoading(true);
            const blob = dataURLtoBlob(newPhoto);
            if (!blob) {
                onError("Save Failed", "Could not process the edited photo.");
                setIsLoading(false);
                return;
            }
            try {
                const storageRef = ref(storage, `users/${currentUser.uid}/photos/${Date.now()}_edited.png`);
                const snapshot = await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(snapshot.ref);
                onSave(downloadURL);
                onClose();
            } catch (error) {
                console.error("Error uploading edited photo:", error);
                onError("Save Failed", "Failed to save edited photo.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleUseTemp = () => {
        if (newPhoto) {
            onUseTemp(newPhoto);
            onClose();
        }
    };
    
    const handleDownload = () => {
        if (newPhoto) {
            const link = document.createElement('a');
            link.href = newPhoto;
            link.download = `resume_photo_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const finalPrompt = [...selectedPrompts, customPrompt].filter(Boolean).join(', ');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl shadow-xl">
                <h3 className="text-lg font-bold mb-4">Edit Photo with AI</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-sm font-semibold mb-2 text-center">Current</p>
                        <img src={currentPhoto} alt="Current profile" className="w-full h-auto rounded-md object-cover"/>
                    </div>
                    <div>
                        <p className="text-sm font-semibold mb-2 text-center">New</p>
                        <div className="w-full h-full rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center min-h-[150px]">
                            {isLoading && !newPhoto ? (
                                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                            ) : newPhoto ? (
                                <img src={newPhoto} alt="Generated profile" className="w-full h-auto rounded-md object-cover"/>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-sm p-4 text-center">AI generated preview will appear here</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                    {promptTemplates.map((p) => {
                        const isSelected = selectedPrompts.includes(p);
                        return (
                            <button
                                key={p}
                                onClick={() => handlePromptToggle(p)}
                                className={`text-xs px-2 py-1 rounded-md transition-colors disabled:opacity-50 ${
                                    isSelected 
                                    ? 'bg-primary-600 text-white' 
                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500'
                                }`}
                                disabled={isLoading}
                            >
                                {p}
                            </button>
                        )
                    })}
                </div>
                
                <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={`Or add your own instructions...`}
                    className="w-full p-2 border dark:border-gray-600 rounded-md mb-4 bg-white dark:bg-gray-700"
                    rows={2}
                    disabled={isLoading}
                />
                
                <div className="flex justify-between items-center">
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Close</button>
                    <div className="flex flex-wrap justify-end gap-2">
                         <button onClick={handleGenerate} disabled={isLoading || !finalPrompt} className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:bg-primary-300">
                            {isLoading ? 'Generating...' : (newPhoto ? 'Regenerate' : 'Generate')}
                        </button>
                        {newPhoto && (
                            <>
                                <button onClick={handleDownload} disabled={isLoading} className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 disabled:bg-gray-300">
                                    Download
                                </button>
                                <button onClick={handleUseTemp} disabled={isLoading} className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300">
                                    Use for this Resume
                                </button>
                                <button onClick={handleSaveAndUse} disabled={isLoading} className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:bg-green-300">
                                    Save to Profile
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResumeForm: React.FC<ResumeFormProps> = ({ resume, onChange, tempPhoto, setTempPhoto, isReadOnly = false }) => {
    const { currentUser, isPremium } = useAuth();
    const [isParsing, setIsParsing] = useState(false);
    const [modalInfo, setModalInfo] = useState<{ sectionName: string, currentText: string, fieldKey: keyof ResumeData | [keyof ResumeData, number, string] } | null>(null);
    const [isImageEditModalOpen, setIsImageEditModalOpen] = useState(false);
    const [isPhotoUploading, setIsPhotoUploading] = useState(false);
    const [photoFileName, setPhotoFileName] = useState('No file chosen');
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '' });


    const handleChange = <T,>(field: keyof T, value: any, parentField?: keyof ResumeData) => {
        if (parentField) {
            const parentData = resume[parentField] as T;
            onChange({ [parentField]: { ...parentData, [field]: value } } as Partial<ResumeData>);
        } else {
            onChange({ [field]: value } as Partial<ResumeData>);
        }
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        setIsParsing(true);
        
        try {
            if (file.type === 'text/plain' || file.type === 'text/markdown') {
                const text = await file.text();
                const parsedData = await parseResume(currentUser.uid, text, resume.language);
                onChange(parsedData);
            } else if (file.type === 'application/pdf') {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const fileData = event.target?.result as string;
                    try {
                        const parsedData = await parseResumeFromFile(currentUser.uid, fileData, file.type, resume.language);
                        onChange(parsedData);
                    } catch (error) {
                         setAlertState({ isOpen: true, title: 'Parsing Failed', message: error instanceof Error ? error.message : "Failed to parse resume from file." });
                    } finally {
                        setIsParsing(false);
                    }
                };
                reader.readAsDataURL(file);
            } else {
                throw new Error(`Unsupported file type: ${file.type}. Please upload a .txt, .md, or .pdf file.`);
            }
        } catch (error) {
            setAlertState({ isOpen: true, title: 'Parsing Failed', message: error instanceof Error ? error.message : "An unknown error occurred during parsing." });
        } finally {
            // FileReader is async, so we might need to handle this differently
            if (file.type !== 'application/pdf') {
                 setIsParsing(false);
            }
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
    
            const storageRef = ref(storage, `users/${currentUser.uid}/photos/${Date.now()}_saved.png`);
            const snapshot = await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // This updates the resume in Firestore and triggers the Editor to clear the temp photo.
            handleChange('photo', downloadURL, 'personalDetails');
    
        } catch (error) {
            console.error("Error saving photo:", error);
            setAlertState({ isOpen: true, title: 'Save Failed', message: "Failed to save photo to profile." });
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

    const handleImprovementRequest = (sectionName: string, currentText: string, fieldKey: keyof ResumeData | [keyof ResumeData, number, string]) => {
        setModalInfo({ sectionName, currentText, fieldKey });
    };

    const handleImprovementAccept = (newText: string) => {
        if (!modalInfo) return;
        const { fieldKey } = modalInfo;
        if (Array.isArray(fieldKey)) {
            const [parentKey, index, childKey] = fieldKey;
            const newArray = [...(resume[parentKey] as any[])];
            newArray[index] = { ...newArray[index], [childKey]: newText };
            onChange({ [parentKey]: newArray } as any);
        } else {
            onChange({ [fieldKey]: newText } as any);
        }
    };

    const handleArrayChange = <T,>(arrayName: keyof ResumeData, index: number, field: keyof T, value: any) => {
        const array = resume[arrayName] as T[];
        const newArray = [...array];
        newArray[index] = { ...newArray[index], [field]: value };
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

    const displayPhoto = tempPhoto || resume.personalDetails.photo;

    return (
        <div className="space-y-8">
            <AlertModal 
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                onClose={() => setAlertState({ isOpen: false, title: '', message: '' })}
            />
            <div className="p-4 border-2 border-dashed dark:border-gray-600 rounded-lg text-center min-h-[160px] flex items-center justify-center">
                <label htmlFor="resume-upload" className={`cursor-pointer text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-800 dark:hover:text-primary-300 ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}`}>
                    {isParsing ? (
                         <div className="flex flex-col items-center justify-center">
                            <Loader2 className="mx-auto h-12 w-12 text-primary-500 animate-spin" />
                            <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                            Analyzing Resume...
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Please wait a moment.</p>
                        </div>
                    ) : (
                        <>
                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                            <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                                Upload or Paste Resume to Autofill
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">.pdf, .txt, .md</p>
                        </>
                    )}
                </label>
                <input id="resume-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" disabled={isParsing || isReadOnly} />
                <textarea 
                    className="w-full mt-4 p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    placeholder="Or paste your resume here..."
                    disabled={isParsing || isReadOnly}
                    onPaste={async (e) => {
                        if (!currentUser) return;
                        setIsParsing(true);
                        try {
                            const pastedText = e.clipboardData.getData('text');
                            const parsedData = await parseResume(currentUser.uid, pastedText, resume.language);
                            onChange(parsedData);
                        } catch (error) {
                            setAlertState({isOpen: true, title: 'Parsing Failed', message: error instanceof Error ? error.message : "Failed to parse pasted resume."});
                        } finally {
                            setIsParsing(false);
                        }
                    }}
                ></textarea>
            </div>
            
            {modalInfo && currentUser && (
                <AIImprovementModal
                    userId={currentUser.uid}
                    sectionName={modalInfo.sectionName}
                    currentText={modalInfo.currentText}
                    language={resume.language}
                    onImprove={handleImprovementAccept}
                    onClose={() => setModalInfo(null)}
                    onError={(title, message) => setAlertState({ isOpen: true, title, message })}
                />
            )}
            
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
                />
            )}

            <FormSection title="Personal Details" icon={<User className="text-primary-500" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Job Title" value={resume.personalDetails.jobTitle} onChange={e => handleChange('jobTitle', e.target.value, 'personalDetails')} disabled={isReadOnly} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photo</label>
                    <input id="photo-upload" type="file" onChange={handlePhotoChange} accept="image/*" className="hidden" ref={photoInputRef} disabled={isReadOnly}/>
                    
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
                                {displayPhoto ? 'Change' : 'Choose File'}
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
                                    <Brush size={16}/> Edit with AI
                                </button>
                             ) : (
                                <div className="group relative">
                                    <button disabled className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed">
                                        <Brush size={16}/> Edit with AI
                                    </button>
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 text-center bg-gray-800 text-white text-xs rounded-md p-2">
                                        <Zap size={16} className="mx-auto mb-1 text-yellow-400"/>
                                        This is a premium feature. <a href="#/pricing" className="underline font-bold">Upgrade now</a> to unlock.
                                    </div>
                                </div>
                             )}
                            {tempPhoto && (
                                <button onClick={handleSaveTempPhoto} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <CheckCircle size={16}/> Save to Profile
                                </button>
                            )}
                            <button onClick={handleRemovePhoto} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Trash2 size={16}/> Remove
                            </button>
                        </div>
                    )}
                  </div>
                  <Input label="First Name" value={resume.personalDetails.firstName} onChange={e => handleChange('firstName', e.target.value, 'personalDetails')} disabled={isReadOnly} />
                  <Input label="Last Name" value={resume.personalDetails.lastName} onChange={e => handleChange('lastName', e.target.value, 'personalDetails')} disabled={isReadOnly} />
                  <Input label="Email" type="email" value={resume.personalDetails.email} onChange={e => handleChange('email', e.target.value, 'personalDetails')} disabled={isReadOnly} />
                  <Input label="Phone" value={resume.personalDetails.phone} onChange={e => handleChange('phone', e.target.value, 'personalDetails')} disabled={isReadOnly} />
              </div>
              <Input label="Address" value={resume.personalDetails.address} onChange={e => handleChange('address', e.target.value, 'personalDetails')} disabled={isReadOnly} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Input label="City" value={resume.personalDetails.city} onChange={e => handleChange('city', e.target.value, 'personalDetails')} disabled={isReadOnly} />
                 <Input label="Postal Code" value={resume.personalDetails.postalCode} onChange={e => handleChange('postalCode', e.target.value, 'personalDetails')} disabled={isReadOnly} />
                 <Input label="Country" value={resume.personalDetails.country} onChange={e => handleChange('country', e.target.value, 'personalDetails')} disabled={isReadOnly} />
              </div>
            </FormSection>
            
            <FormSection title="Professional Summary" icon={<Briefcase className="text-primary-500" />}>
                <EditableTextarea 
                    label="Summary" 
                    value={resume.professionalSummary} 
                    onChange={value => handleChange('professionalSummary', value)} 
                    disabled={isReadOnly}
                    placeholder="e.g., A creative and analytical Prompt Engineer with over 4 years of experience..."
                />
                <button onClick={() => handleImprovementRequest('Professional Summary', resume.professionalSummary, 'professionalSummary')} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"><Wand2 size={16}/> Improve with AI</button>
            </FormSection>

            <FormSection title="Websites & Social Links" icon={<LinkIcon className="text-primary-500" />}>
                {resume.websites.map((link, index) => (
                    <div key={link.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 items-end">
                        <Input label="Label" value={link.label} onChange={e => handleArrayChange<WebsiteLink>('websites', index, 'label', e.target.value)} disabled={isReadOnly} />
                        <Input label="URL" value={link.url} onChange={e => handleArrayChange<WebsiteLink>('websites', index, 'url', e.target.value)} disabled={isReadOnly} />
                        <button onClick={() => removeArrayItem('websites', index)} disabled={isReadOnly} className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 size={20} /></button>
                    </div>
                ))}
                 <button onClick={() => addArrayItem('websites', { id: crypto.randomUUID(), label: 'Website', url: '' })} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"><PlusCircle size={16}/> Add Link</button>
            </FormSection>

            <FormSection title="Skills" icon={<Star className="text-primary-500" />}>
                 {resume.skills.map((skill, index) => (
                    <div key={skill.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 items-end">
                        <Input label="Skill" value={skill.name} onChange={e => handleArrayChange<Skill>('skills', index, 'name', e.target.value)} disabled={isReadOnly} />
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
                           <select value={skill.level} onChange={e => handleArrayChange<Skill>('skills', index, 'level', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-800">
                               <option>Novice</option>
                               <option>Intermediate</option>
                               <option>Advanced</option>
                               <option>Expert</option>
                           </select>
                        </div>
                        <button onClick={() => removeArrayItem('skills', index)} disabled={isReadOnly} className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 size={20} /></button>
                    </div>
                ))}
                <button onClick={() => addArrayItem('skills', { id: crypto.randomUUID(), name: '', level: 'Intermediate' })} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"><PlusCircle size={16}/> Add Skill</button>
            </FormSection>
            
            <FormSection title="Languages" icon={<Languages className="text-primary-500" />}>
                 {resume.languages.map((lang, index) => (
                    <div key={lang.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 items-end">
                        <Input label="Language" value={lang.name} onChange={e => handleArrayChange<Language>('languages', index, 'name', e.target.value)} disabled={isReadOnly} />
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proficiency</label>
                           <select value={lang.level} onChange={e => handleArrayChange<Language>('languages', index, 'level', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-800">
                               {LANGUAGE_PROFICIENCY_LEVELS.map(level => <option key={level}>{level}</option>)}
                           </select>
                        </div>
                        <button onClick={() => removeArrayItem('languages', index)} disabled={isReadOnly} className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 size={20} /></button>
                    </div>
                ))}
                <button onClick={() => addArrayItem('languages', { id: crypto.randomUUID(), name: '', level: 'Intermediate' })} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"><PlusCircle size={16}/> Add Language</button>
            </FormSection>

            <FormSection title="Employment History" icon={<Briefcase className="text-primary-500" />}>
                 {resume.employmentHistory.map((job, index) => (
                    <div key={job.id} className="p-4 border dark:border-gray-700 rounded-md mb-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <Input label="Job Title" value={job.jobTitle} onChange={e => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'jobTitle', e.target.value)} disabled={isReadOnly} />
                             <Input label="Employer" value={job.employer} onChange={e => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'employer', e.target.value)} disabled={isReadOnly} />
                             <Input label="City" value={job.city} onChange={e => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'city', e.target.value)} disabled={isReadOnly} />
                             <div className="flex gap-4">
                               <Input label="Start Date" value={job.startDate} onChange={e => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'startDate', e.target.value)} disabled={isReadOnly} />
                               <Input label="End Date" value={job.endDate} onChange={e => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'endDate', e.target.value)} disabled={isReadOnly} />
                             </div>
                         </div>
                         <EditableTextarea 
                            label="Description" 
                            value={job.description} 
                            onChange={value => handleArrayChange<EmploymentHistory>('employmentHistory', index, 'description', value)} 
                            disabled={isReadOnly}
                            placeholder="e.g., - Designed and refined a comprehensive library of over 500 prompts for a customer service chatbot..."
                        />
                         <div className="flex justify-between">
                            <button onClick={() => handleImprovementRequest('Job Description', job.description, ['employmentHistory', index, 'description'])} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"><Wand2 size={16}/> Improve Description</button>
                            <button onClick={() => removeArrayItem('employmentHistory', index)} disabled={isReadOnly} className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 size={20} /></button>
                         </div>
                    </div>
                ))}
                <button onClick={() => addArrayItem('employmentHistory', { id: crypto.randomUUID(), jobTitle: '', employer: '', city: '', startDate: '', endDate: '', description: '' })} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"><PlusCircle size={16}/> Add Employment</button>
            </FormSection>
            
            <FormSection title="Education" icon={<GraduationCap className="text-primary-500" />}>
                 {resume.education.map((edu, index) => (
                    <div key={edu.id} className="p-4 border dark:border-gray-700 rounded-md mb-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <Input label="School" value={edu.school} onChange={e => handleArrayChange<Education>('education', index, 'school', e.target.value)} disabled={isReadOnly} />
                             <Input label="Degree" value={edu.degree} onChange={e => handleArrayChange<Education>('education', index, 'degree', e.target.value)} disabled={isReadOnly} />
                              <Input label="City" value={edu.city} onChange={e => handleArrayChange<Education>('education', index, 'city', e.target.value)} disabled={isReadOnly} />
                             <div className="flex gap-4">
                               <Input label="Start Date" value={edu.startDate} onChange={e => handleArrayChange<Education>('education', index, 'startDate', e.target.value)} disabled={isReadOnly} />
                               <Input label="End Date" value={edu.endDate} onChange={e => handleArrayChange<Education>('education', index, 'endDate', e.target.value)} disabled={isReadOnly} />
                             </div>
                         </div>
                        <EditableTextarea 
                            label="Description" 
                            value={edu.description} 
                            onChange={value => handleArrayChange<Education>('education', index, 'description', value)} 
                            disabled={isReadOnly}
                            placeholder="e.g., Graduated with honors. Relevant coursework included Natural Language Processing..."
                        />
                         <div className="flex justify-end">
                           <button onClick={() => removeArrayItem('education', index)} disabled={isReadOnly} className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 size={20} /></button>
                         </div>
                    </div>
                ))}
                <button onClick={() => addArrayItem('education', { id: crypto.randomUUID(), school: '', degree: '', city: '', startDate: '', endDate: '', description: '' })} disabled={isReadOnly} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"><PlusCircle size={16}/> Add Education</button>
            </FormSection>
        </div>
    );
};

export default ResumeForm;
