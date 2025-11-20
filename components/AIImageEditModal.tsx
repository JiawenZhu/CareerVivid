import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { editProfilePhoto } from '../services/geminiService';
import { uploadImage, dataURLtoBlob } from '../services/storageService';

interface AIImageEditModalProps {
    userId: string;
    currentPhoto: string;
    onSave: (newPhotoUrl: string) => void;
    onUseTemp: (newPhotoDataUrl: string) => void;
    onClose: () => void;
    onError: (title: string, message: string) => void;
    promptOptions?: string[]; // Optional custom prompts
    savePath?: string; // Optional custom storage path
}

const AIImageEditModal: React.FC<AIImageEditModalProps> = ({ 
    userId, 
    currentPhoto, 
    onSave, 
    onUseTemp, 
    onClose, 
    onError,
    promptOptions,
    savePath
}) => {
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

    const defaultTemplates = [
        'Make this photo look more professional',
        'Change the background to a blurred office setting',
        'Convert this to a black and white headshot',
        'Change my shirt to a professional collared shirt',
        'Improve the lighting to be brighter and more even',
        'Create a clean, professional avatar from this photo',
        'Replace background with a solid light gray color',
        'Slightly enhance sharpness and color',
    ];

    const activeTemplates = promptOptions || defaultTemplates;

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
                // Handle cross-origin issues with proxy or fetch configuration if needed.
                // For Firebase Storage images, ensure CORS is configured.
                const response = await fetch(currentPhoto, { mode: 'cors' });
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
            console.error(error);
            onError('AI Edit Failed', error instanceof Error ? error.message : 'An unknown error occurred. Ensure CORS is configured if using external images.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAndUse = async () => {
        if (newPhoto && userId) {
            setIsLoading(true);
            const blob = dataURLtoBlob(newPhoto);
            if (!blob) {
                onError("Save Failed", "Could not process the edited photo.");
                setIsLoading(false);
                return;
            }
            try {
                // Default path updated to resume_photos to match new architecture
                const path = savePath || `users/${userId}/resume_photos/${Date.now()}_edited.png`;
                const downloadURL = await uploadImage(blob, path);
                
                onSave(downloadURL);
                onClose();
            } catch (error: any) {
                console.error("Error uploading edited photo:", error);
                onError("Save Failed", `Failed to save edited photo. ${error.message || ''}`);
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
            link.download = `ai_edited_image_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const finalPrompt = [...selectedPrompts, customPrompt].filter(Boolean).join(', ');

    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto relative">
                <h3 className="text-lg font-bold mb-4 dark:text-white">Edit Image with AI</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-sm font-semibold mb-2 text-center dark:text-gray-300">Current</p>
                        <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                             <img src={currentPhoto} alt="Current" className="w-full h-full object-contain"/>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-semibold mb-2 text-center dark:text-gray-300">New</p>
                        <div className="relative aspect-square rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {isLoading && !newPhoto ? (
                                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                            ) : newPhoto ? (
                                <img src={newPhoto} alt="Generated" className="w-full h-full object-contain"/>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-sm p-4 text-center">AI generated preview will appear here</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Suggested Prompts:</p>
                    <div className="flex flex-wrap gap-2">
                        {activeTemplates.map((p) => {
                            const isSelected = selectedPrompts.includes(p);
                            return (
                                <button
                                    key={p}
                                    onClick={() => handlePromptToggle(p)}
                                    className={`text-xs px-2 py-1 rounded-md transition-colors disabled:opacity-50 text-left ${
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
                </div>
                
                <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={`Or add your own instructions...`}
                    className="w-full p-2 border dark:border-gray-600 rounded-md mb-4 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    disabled={isLoading}
                />
                
                <div className="flex justify-between items-center">
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Close</button>
                    <div className="flex flex-wrap justify-end gap-2">
                         <button onClick={handleGenerate} disabled={isLoading || !finalPrompt} className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:bg-primary-300 flex items-center gap-2">
                            {isLoading && <Loader2 className="animate-spin" size={16} />}
                            {isLoading ? 'Generating...' : (newPhoto ? 'Regenerate' : 'Generate')}
                        </button>
                        {newPhoto && (
                            <>
                                <button onClick={handleDownload} disabled={isLoading} className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 disabled:bg-gray-300">
                                    Download
                                </button>
                                <button onClick={handleUseTemp} disabled={isLoading} className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300">
                                    Use Preview
                                </button>
                                <button onClick={handleSaveAndUse} disabled={isLoading} className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:bg-green-300">
                                    Save & Apply
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // Use React Portal to render the modal at the document body level
    // This prevents z-index and positioning issues when nested deep in other components
    return createPortal(modalContent, document.body);
};

export default AIImageEditModal;