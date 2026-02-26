import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Wand2, X, Download, Image as ImageIcon, Sparkles } from 'lucide-react';
import { generateImage } from '../services/geminiService';
import { uploadImage, dataURLtoBlob } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';

interface AICoverImageModalProps {
    userId: string;
    onSave: (newPhotoUrl: string) => void;
    onClose: () => void;
    onError: (title: string, message: string) => void;
    savePath?: string;
}

const STYLE_PRESETS = [
    {
        id: 'tech_realistic',
        label: 'Tech Realistic',
        description: 'Cinematic corporate environments',
        prompt: 'A highly realistic, cinematic photo of a professional tech workspace. Modern startup aesthetic. Beautiful volumetric lighting, 8k resolution, highly detailed.',
    },
    {
        id: 'vaporwave',
        label: 'Vaporwave Tech',
        description: 'Neon synthwave aesthetic',
        prompt: 'A vaporwave style digital illustration of a computer setup. Neon pink and cyan glowing lights, retro 80s grid background, highly aesthetic.',
    },
    {
        id: 'minimalist',
        label: 'Minimalist Vector',
        description: 'Clean, flat vector art',
        prompt: 'Clean, minimalist flat vector art of a professional workspace or abstract technology concept. Muted pastel color palette, geometric shapes, no clutter.',
    },
    {
        id: '3d_clay',
        label: '3D Clay Model',
        description: 'Playful isometric 3D',
        prompt: 'Isometric 3D clay render of a modern office desk with a laptop and coffee. Playful, soft lighting, pastel colors, high detail, trending on ArtStation.',
    }
];

const AICoverImageModal: React.FC<AICoverImageModalProps> = ({
    userId,
    onSave,
    onClose,
    onError,
    savePath
}) => {
    const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<'standard' | 'pro'>('standard');
    const [customPrompt, setCustomPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [newPhoto, setNewPhoto] = useState<string | null>(null);

    const { aiUsage } = useAuth();

    const handleStyleSelect = (styleId: string) => {
        const style = STYLE_PRESETS.find(s => s.id === styleId);
        if (style) {
            setSelectedStyleId(styleId);
            setCustomPrompt(style.prompt);
        }
    };

    const handleGenerate = async () => {
        if (!customPrompt.trim()) {
            onError("Prompt Required", "Please enter instructions for the image.");
            return;
        }

        const requiredCredits = selectedModel === 'pro' ? 20 : 10;
        if (aiUsage && (aiUsage.limit - aiUsage.count < requiredCredits)) {
            onError("Insufficient AI Credits", "Please upgrade your plan or wait until next month.");
            return;
        }

        setIsLoading(true);
        setNewPhoto(null);

        try {
            const result = await generateImage(userId, customPrompt, selectedModel);
            setNewPhoto(result);
        } catch (error) {
            console.error(error);
            onError('Generation Failed', error instanceof Error ? error.message : 'Unknown error.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAndUse = async () => {
        if (!newPhoto) return;

        setIsLoading(true);
        try {
            const blob = dataURLtoBlob(newPhoto);
            if (!blob) throw new Error("Failed to process image.");

            const path = savePath || `users/${userId}/community_covers/${Date.now()}_cover.png`;
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
        if (newPhoto) {
            const link = document.createElement('a');
            link.href = newPhoto;
            link.download = `cover_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                            Generate Cover Image
                        </h3>
                        <p className="text-sm text-gray-500">Create a unique cover image for your post with AI.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">

                    {/* Image Preview Area */}
                    <div className="mb-8">
                        <div
                            className={`
                                relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-50 border-2 transition-all p-2
                                ${newPhoto ? 'border-indigo-600 shadow-md ring-2 ring-indigo-50' : 'border-dashed border-gray-200'}
                            `}
                        >
                            {isLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                                    <p className="text-sm font-medium text-indigo-600 animate-pulse">Generating Image...</p>
                                </div>
                            ) : newPhoto ? (
                                <img src={newPhoto} alt="Generated Cover" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
                                    <p className="text-sm font-medium">Your generated image will appear here</p>
                                    <p className="text-xs mt-1 max-w-xs text-center">Using dedicated image generation model</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Style Selector */}
                    <div className="mb-6">
                        <label className="text-sm font-bold text-gray-900 mb-3 block">Choose a Starting Recipe</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {STYLE_PRESETS.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => handleStyleSelect(style.id)}
                                    disabled={isLoading}
                                    className={`
                                        p-3 rounded-xl border-2 text-left transition-all
                                        ${selectedStyleId === style.id
                                            ? 'border-indigo-600 bg-indigo-50'
                                            : 'border-gray-100 bg-white hover:border-gray-300'}
                                    `}
                                >
                                    <h4 className="font-bold text-gray-900 text-sm mb-1">{style.label}</h4>
                                    <p className="text-xs text-gray-500 leading-tight">{style.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Model Quality Selector */}
                    <div className="mb-6">
                        <label className="text-sm font-bold text-gray-900 mb-3 block">Generation Quality</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedModel('standard')}
                                disabled={isLoading}
                                className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${selectedModel === 'standard' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 bg-white hover:border-gray-300'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-gray-900 text-sm">Standard Quality</h4>
                                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">10 Credits</span>
                                </div>
                                <p className="text-xs text-gray-500">Fast, reliable cover images.</p>
                            </button>
                            <button
                                onClick={() => setSelectedModel('pro')}
                                disabled={isLoading}
                                className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${selectedModel === 'pro' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 bg-white hover:border-gray-300'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1">
                                        Nano Banana Pro <Sparkles size={12} className="text-yellow-500" />
                                    </h4>
                                    <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">20 Credits</span>
                                </div>
                                <p className="text-xs text-gray-500">High-fidelity, complex scenes.</p>
                            </button>
                        </div>
                    </div>

                    {/* Input & Generate */}
                    <div className="relative">
                        <label className="text-sm font-bold text-gray-900 mb-2 block">Prompt Customization</label>
                        <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="A futuristic server room with neon lights..."
                            disabled={isLoading}
                            rows={3}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all mb-4 resize-y"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !customPrompt.trim()}
                            className="w-full bg-black text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                            {newPhoto ? "Regenerate Image" : "Generate Image"}
                        </button>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
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
                                <Download size={16} /> Save to Device
                            </button>
                        )}
                        <button
                            onClick={handleSaveAndUse}
                            disabled={isLoading || !newPhoto}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                        >
                            Apply to Post
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default AICoverImageModal;
