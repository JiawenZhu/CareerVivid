import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Check, Upload, Wand2, X, Download, Save, Image as ImageIcon, Sparkles } from 'lucide-react';
import { editProfilePhoto } from '../services/geminiService';
import { uploadImage, dataURLtoBlob } from '../services/storageService';

interface AIImageEditModalProps {
    userId: string;
    currentPhoto: string;
    onSave: (newPhotoUrl: string) => void;
    onUseTemp: (newPhotoDataUrl: string) => void;
    onClose: () => void;
    onError: (title: string, message: string) => void;
    promptOptions?: string[]; // Kept for backward compatibility, but we prioritize internal styles
    savePath?: string;
}

// --- New Style Definitions ---
const STYLE_PRESETS = [
    {
        id: 'tech_vector',
        label: 'Tech Vector',
        description: 'Google Fi Style',
        prompt: 'A flat vector illustration in the style of corporate tech art. A professional headshot with realistic proportions, distinct black outlines, and flat cel-shaded coloring. Friendly expression, modern casual business attire, solid muted background.',
        color: 'bg-blue-100 text-blue-700',
        icon: '🎨'
    },
    {
        id: 'modern_maker',
        label: 'Modern Maker',
        description: 'Expressive Avatar',
        prompt: 'Digital avatar in a modern corporate illustration style. Character features natural skin tones, expressive facial features, and thick energetic linework. Minimalist shading, vibrant but flat colors, wearing smart-casual office wear.',
        color: 'bg-purple-100 text-purple-700',
        icon: '🚀'
    },
    {
        id: 'campus',
        label: 'Campus Style',
        description: 'Clean Comic',
        prompt: 'A semi-realistic vector portrait. Clean comic-book style inking with bold outlines. The character is looking directly at the viewer with a confident smile. Palette includes primary colors and soft pastels, avoiding gradients in favor of solid color blocks.',
        color: 'bg-green-100 text-green-700',
        icon: '🎓'
    },
    {
        id: 'minimalist',
        label: 'Fi Minimalist',
        description: 'High-Fidelity Line',
        prompt: 'High-fidelity vector art headshot. Focus on simple geometry and clear readability at small sizes. Black contour lines, cel-shaded skin tones, and a single solid background color. Resembles high-end tech brand illustrations from 2020.',
        color: 'bg-gray-100 text-gray-700',
        icon: '⚡'
    }
];

const QUICK_PROMPTS = [
    'Make this photo look more professional',
    'Change the background to a blurred office setting',
    'Convert this to a black and white headshot',
    'Change my shirt to a professional collared shirt',
    'Improve the lighting to be brighter and more even',
    'Create a clean, professional avatar from this photo',
    'Replace background with a solid light gray color',
    'Slightly enhance sharpness and color',
];

const AIImageEditModal: React.FC<AIImageEditModalProps> = ({
    userId,
    currentPhoto,
    onSave,
    onUseTemp,
    onClose,
    onError,
    savePath
}) => {
    const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
    const [customPrompt, setCustomPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [newPhoto, setNewPhoto] = useState<string | null>(null);
    const [activeSelection, setActiveSelection] = useState<'current' | 'new'>('current');
    const [previewPhoto, setPreviewPhoto] = useState<string>(currentPhoto);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update preview when prop changes
    useEffect(() => {
        setPreviewPhoto(currentPhoto);
    }, [currentPhoto]);

    // Handle Style Selection
    const handleStyleSelect = (styleId: string) => {
        const style = STYLE_PRESETS.find(s => s.id === styleId);
        if (style) {
            setSelectedStyleId(styleId);
            setCustomPrompt(style.prompt);
        }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewPhoto(reader.result as string);
                setNewPhoto(null);
                setActiveSelection('current');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!customPrompt.trim()) {
            onError("Prompt Required", "Please select a style or enter instructions.");
            return;
        }

        setIsLoading(true);
        setNewPhoto(null);
        setActiveSelection('current');

        try {
            let base64data: string;
            let mimeType: string;

            // Image Processing (Keep existing robust logic)
            if (previewPhoto && previewPhoto.startsWith('data:')) {
                const parts = previewPhoto.split(',');
                const mimeMatch = parts[0].match(/:(.*?);/);
                if (!mimeMatch) throw new Error('Invalid data URL.');
                mimeType = mimeMatch[1];
                base64data = parts[1];
            } else if (previewPhoto && previewPhoto.trim().length > 0) {
                try {
                    const response = await fetch(previewPhoto, { mode: 'cors' });
                    if (!response.ok) throw new Error(`Failed to load image (Status: ${response.status})`);
                    const blob = await response.blob();
                    mimeType = blob.type;
                    base64data = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                } catch (err: any) {
                    throw new Error('Could not access origin image. Please upload directly.');
                }
            } else {
                throw new Error('No source image found.');
            }

            const result = await editProfilePhoto(userId, base64data, mimeType, customPrompt);
            setNewPhoto(result);
            setActiveSelection('new');

        } catch (error) {
            console.error(error);
            onError('Generation Failed', error instanceof Error ? error.message : 'Unknown error.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAndUse = async () => {
        const targetPhoto = activeSelection === 'new' ? newPhoto : previewPhoto;
        if (!targetPhoto) return;

        // Remote URL optimization
        if (activeSelection === 'current' && targetPhoto.startsWith('http')) {
            onSave(targetPhoto);
            onClose();
            return;
        }

        setIsLoading(true);
        try {
            const blob = dataURLtoBlob(targetPhoto);
            if (!blob) throw new Error("Failed to process image.");

            const path = savePath || `users/${userId}/resume_photos/${Date.now()}_edited.png`;
            const downloadURL = await uploadImage(blob, path);

            onSave(downloadURL);
            onClose();
        } catch (error: any) {
            onError("Save Failed", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        const targetPhoto = activeSelection === 'new' ? newPhoto : previewPhoto;
        if (targetPhoto) {
            const link = document.createElement('a');
            link.href = targetPhoto;
            link.download = `avatar_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                            Edit Image with AI
                        </h3>
                        <p className="text-sm text-gray-500">Transform your photo into a professional avatar.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">

                    {/* 1. Split View Canvas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Original */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-700">Original</span>
                                {activeSelection === 'current' && <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Active</span>}
                            </div>
                            <div
                                onClick={() => setActiveSelection('current')}
                                className={`
                                    relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border-2 transition-all cursor-pointer group
                                    ${activeSelection === 'current' ? 'border-gray-900 shadow-md' : 'border-transparent hover:border-gray-200'}
                                `}
                            >
                                <img src={previewPhoto} alt="Original" className="w-full h-full object-contain" />

                                {/* Upload Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                        className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                                    >
                                        <Upload size={14} /> Upload New
                                    </button>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                                {activeSelection === 'current' && (
                                    <div className="absolute top-3 right-3 bg-white text-black rounded-full p-1 shadow-sm">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Result */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-700">Result</span>
                                {activeSelection === 'new' && <span className="text-xs font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-full">Active</span>}
                            </div>
                            <div
                                onClick={() => newPhoto && setActiveSelection('new')}
                                className={`
                                    relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border-2 transition-all
                                    ${newPhoto ? 'cursor-pointer' : 'cursor-default'}
                                    ${activeSelection === 'new' ? 'border-indigo-600 shadow-md ring-2 ring-indigo-50' : 'border-transparent'}
                                    ${!newPhoto ? 'border-dashed border-gray-200' : ''}
                                `}
                            >
                                {isLoading ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                                        <p className="text-sm font-medium text-indigo-600 animate-pulse">Generating Avatar...</p>
                                    </div>
                                ) : newPhoto ? (
                                    <img src={newPhoto} alt="Generated" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <Wand2 className="w-8 h-8 mb-2 opacity-50" />
                                        <p className="text-sm">Preview appears here</p>
                                    </div>
                                )}

                                {activeSelection === 'new' && newPhoto && (
                                    <div className="absolute top-3 right-3 bg-indigo-600 text-white rounded-full p-1 shadow-sm">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2. Style Selector */}
                    <div className="mb-6">
                        <label className="text-sm font-bold text-gray-900 mb-3 block">Choose a Style</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {STYLE_PRESETS.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => handleStyleSelect(style.id)}
                                    disabled={isLoading}
                                    className={`
                                        relative p-3 rounded-xl border-2 text-left transition-all group
                                        ${selectedStyleId === style.id
                                            ? 'border-black bg-gray-50'
                                            : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'}
                                    `}
                                >
                                    <div className={`w-10 h-10 rounded-lg ${style.color} flex items-center justify-center text-lg mb-3`}>
                                        {style.icon}
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-sm mb-0.5">{style.label}</h4>
                                    <p className="text-xs text-gray-500">{style.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2.5 Quick Adjustments (Previous Prompts) */}
                    <div className="mb-6">
                        <label className="text-sm font-bold text-gray-900 mb-3 block">Quick Adjustments</label>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => setCustomPrompt(prev => prev ? `${prev}, ${prompt}` : prompt)}
                                    disabled={isLoading}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors border border-transparent hover:border-gray-300 text-left"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Input & Generate */}
                    <div className="relative">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="Select a style above or describe your own..."
                                disabled={isLoading}
                                className="w-full pl-4 pr-32 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                            />
                            <div className="absolute right-2">
                                <button
                                    onClick={handleGenerate}
                                    disabled={isLoading || !customPrompt.trim()}
                                    className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                    Generate
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-900 font-medium text-sm px-2"
                    >
                        Cancel
                    </button>

                    <div className="flex gap-3">
                        {newPhoto && (
                            <button
                                onClick={handleDownload}
                                className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <Download size={16} /> Save Image
                            </button>
                        )}
                        <button
                            onClick={handleSaveAndUse}
                            disabled={isLoading}
                            className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save & Apply Profile
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default AIImageEditModal;