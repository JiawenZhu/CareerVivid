import { useState, useCallback, useRef, useEffect } from 'react';
import { ResumeData, WebsiteLink, Skill, EmploymentHistory, Education, Language } from '../types';
import { parseResume } from '../services/geminiService';
import { generateSafeUUID } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage, dataURLtoBlob } from '../services/storageService';
import { useTranslation } from 'react-i18next';
import { useAICreditCheck } from '../hooks/useAICreditCheck';
import { detectIconFromUrl, getLabelFromIcon, createWebsiteLink } from '../utils/iconDetection';

interface UseResumeFormProps {
    resume: ResumeData;
    onChange: (updatedData: Partial<ResumeData>) => void;
    tempPhoto: string | null;
    setTempPhoto: (photo: string | null) => void;
}

export const useResumeForm = ({ resume, onChange, tempPhoto, setTempPhoto }: UseResumeFormProps) => {
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
    const [isImportExpanded, setIsImportExpanded] = useState(false);
    const [importText, setImportText] = useState('');
    const [importSuccess, setImportSuccess] = useState(false);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [draggedItemType, setDraggedItemType] = useState<keyof ResumeData | null>(null);

    const { checkCredit, CreditLimitModal } = useAICreditCheck();

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

    const handleChange = useCallback(<T,>(field: keyof T, value: any, parentField?: keyof ResumeData) => {
        if (parentField) {
            const parentData = resume[parentField] as T;
            onChange({ [parentField]: { ...parentData, [field]: value } } as Partial<ResumeData>);
        } else {
            onChange({ [field]: value } as Partial<ResumeData>);
        }
    }, [resume, onChange]);

    const handleImportText = async (text: string) => {
        if (!currentUser) return;
        setIsParsing(true);
        try {
            const parsedData = await parseResume(currentUser.uid, text, resume.language);
            onChange(parsedData);
            setIsImportExpanded(false);
            setImportSuccess(true);
            setImportText('');
            setTimeout(() => setImportSuccess(false), 3000);
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
            setAlertState({ isOpen: true, title: 'Save Failed', message: `Failed to save photo to profile. ${error.message || ''}` });
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
        setActiveImprovementId(prev => (prev === id ? null : id));
    };

    const handleArrayChange = useCallback(<T,>(arrayName: keyof ResumeData, index: number, field: keyof T, value: any) => {
        const array = resume[arrayName] as T[];
        const newArray = [...array];
        newArray[index] = { ...newArray[index], [field]: value };

        if (arrayName === 'websites') {
            if (field === 'url' || field === 'label') {
                const link = newArray[index] as unknown as WebsiteLink;
                const detectedIcon = detectIconFromUrl(link.url || '', link.label || '');
                newArray[index] = { ...newArray[index], icon: detectedIcon } as T;
            } else if (field === 'icon') {
                const newLabel = getLabelFromIcon(value);
                if (newLabel) {
                    newArray[index] = { ...newArray[index], label: newLabel } as T;
                }
            }
        }
        onChange({ [arrayName]: newArray } as Partial<ResumeData>);
    }, [resume, onChange]);

    const addArrayItem = (arrayName: keyof ResumeData, newItem: any) => {
        const array = resume[arrayName] as any[];
        onChange({ [arrayName]: [...array, newItem] } as Partial<ResumeData>);
    };

    const removeArrayItem = (arrayName: keyof ResumeData, index: number) => {
        const array = resume[arrayName] as any[];
        onChange({ [arrayName]: array.filter((_, i) => i !== index) } as Partial<ResumeData>);
    };

    const handleDragStart = (e: React.DragEvent, index: number, type: keyof ResumeData) => {
        setDraggedItemIndex(index);
        setDraggedItemType(type);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
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

    return {
        currentUser,
        isPremium,
        t,
        isParsing,
        parsingMessageIndex,
        activeImprovementId,
        setActiveImprovementId,
        isImageEditModalOpen,
        setIsImageEditModalOpen,
        isPhotoUploading,
        photoFileName,
        photoInputRef,
        alertState,
        setAlertState,
        isImportExpanded,
        setIsImportExpanded,
        importText,
        setImportText,
        importSuccess,
        checkCredit,
        CreditLimitModal,
        handleChange,
        handleImportText,
        handlePhotoChange,
        handleSaveTempPhoto,
        handleRemovePhoto,
        toggleImprovement,
        handleArrayChange,
        addArrayItem,
        removeArrayItem,
        handleDragStart,
        handleDragOver,
        handleDrop,
        parsingMessages
    };
};
