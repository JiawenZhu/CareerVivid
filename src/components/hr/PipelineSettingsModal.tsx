import React, { useState } from 'react';
import { Settings, Palette, X, Plus, Edit2, Trash2, Upload, Wand2, Sliders } from 'lucide-react';
import { PipelineStage, PipelineBackgroundTheme } from '../../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
const AIImageEditModal = React.lazy(() => import('../AIImageEditModal'));

const BACKGROUND_OPTIONS: Array<{ id: PipelineBackgroundTheme; name: string; preview: string | null }> = [
    { id: 'none', name: 'None', preview: null },
    { id: 'gradient', name: 'Gradient Waves', preview: '/backgrounds/pipeline_bg_gradient.png' },
    { id: 'geometric', name: 'Geometric', preview: '/backgrounds/pipeline_bg_geometric.png' },
    { id: 'mountains', name: 'Mountains', preview: '/backgrounds/pipeline_bg_mountains.png' },
    { id: 'abstract', name: 'Abstract Waves', preview: '/backgrounds/pipeline_bg_abstract.png' },
    { id: 'particles', name: 'Network', preview: '/backgrounds/pipeline_bg_particles.png' },
];

const COLOR_OPTIONS = [
    { id: 'blue', name: 'Blue', header: 'bg-blue-500' },
    { id: 'purple', name: 'Purple', header: 'bg-purple-500' },
    { id: 'indigo', name: 'Indigo', header: 'bg-indigo-500' },
    { id: 'orange', name: 'Orange', header: 'bg-orange-500' },
    { id: 'pink', name: 'Pink', header: 'bg-pink-500' },
    { id: 'emerald', name: 'Emerald', header: 'bg-emerald-500' },
    { id: 'green', name: 'Green', header: 'bg-green-500' },
    { id: 'red', name: 'Red', header: 'bg-red-500' },
    { id: 'yellow', name: 'Yellow', header: 'bg-yellow-500' },
    { id: 'teal', name: 'Teal', header: 'bg-teal-500' },
    { id: 'cyan', name: 'Cyan', header: 'bg-cyan-500' },
    { id: 'gray', name: 'Gray', header: 'bg-gray-500' },
];

interface PipelineSettingsModalProps {
    currentBackground: PipelineBackgroundTheme;
    currentStages: PipelineStage[];
    currentTransparency: number; // NEW
    customBackgroundUrl?: string; // NEW
    userId: string; // NEW - for uploading
    onBackgroundChange: (bgId: PipelineBackgroundTheme) => void;
    onStagesChange: (stages: PipelineStage[]) => void;
    onTransparencyChange: (transparency: number) => void; // NEW
    onCustomBackgroundChange: (url: string | null) => void; // NEW
    onClose: () => void;
}

const PipelineSettingsModal: React.FC<PipelineSettingsModalProps> = ({
    currentBackground,
    currentStages,
    currentTransparency,
    customBackgroundUrl,
    userId,
    onBackgroundChange,
    onStagesChange,
    onTransparencyChange,
    onCustomBackgroundChange,
    onClose
}) => {
    const [stages, setStages] = useState<PipelineStage[]>(currentStages);
    const [editingStageId, setEditingStageId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [editingColor, setEditingColor] = useState('');
    const [transparency, setTransparency] = useState(currentTransparency);
    const [uploading, setUploading] = useState(false);
    const [showAIEditor, setShowAIEditor] = useState(false);

    const handleAddStage = () => {
        const newStage: PipelineStage = {
            id: `custom_${Date.now()}`,
            name: 'New Stage',
            order: stages.length,
            color: 'gray',
            isCustom: true
        };
        const updatedStages = [...stages, newStage];
        setStages(updatedStages);
        onStagesChange(updatedStages);
    };

    const handleRemoveStage = (stageId: string) => {
        if (confirm('Remove this stage? Applications in this stage will move to "New".')) {
            const updatedStages = stages.filter(s => s.id !== stageId);
            setStages(updatedStages);
            onStagesChange(updatedStages);
        }
    };

    const handleUpdateStage = (stageId: string, updates: Partial<PipelineStage>) => {
        const updatedStages = stages.map(s =>
            s.id === stageId ? { ...s, ...updates } : s
        );
        setStages(updatedStages);
        onStagesChange(updatedStages);
    };

    const handleSaveEdit = () => {
        if (editingStageId) {
            handleUpdateStage(editingStageId, {
                name: editingName,
                color: editingColor
            });
            setEditingStageId(null);
        }
    };

    const handleTransparencyChange = (value: number) => {
        setTransparency(value);
        onTransparencyChange(value);
    };

    const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `pipeline-backgrounds/${userId}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            onCustomBackgroundChange(url);
            onBackgroundChange('custom');
        } catch (error) {
            console.error('Failed to upload background:', error);
            alert('Failed to upload background. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveCustomBg = () => {
        if (confirm('Remove custom background?')) {
            onCustomBackgroundChange(null);
            onBackgroundChange('none');
        }
    };

    const handleAIEditSave = async (editedImageBase64: string) => {
        setUploading(true);
        try {
            const blob = await fetch(editedImageBase64).then(r => r.blob());
            const storageRef = ref(storage, `pipeline-backgrounds/${userId}/ai_edited_${Date.now()}.png`);
            await uploadBytes(storageRef, blob);
            const url = await getDownloadURL(storageRef);
            onCustomBackgroundChange(url);
            onBackgroundChange('custom');
            setShowAIEditor(false);
        } catch (error) {
            console.error('Failed to save AI-edited background:', error);
            alert('Failed to save edited background.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <Settings className="text-purple-600" size={24} />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Background Theme Section */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            <Palette size={20} className="text-purple-600" />
                            Background Theme
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {BACKGROUND_OPTIONS.map(bg => (
                                <button
                                    key={bg.id}
                                    onClick={() => onBackgroundChange(bg.id)}
                                    className={`relative rounded-lg overflow-hidden border-2 transition-all transform hover:scale-105 ${currentBackground === bg.id
                                        ? 'border-purple-600 ring-4 ring-purple-200 dark:ring-purple-900/50'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                                        }`}
                                >
                                    {bg.preview ? (
                                        <img
                                            src={bg.preview}
                                            alt={bg.name}
                                            className="w-full h-28 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-28 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                                            <span className="text-gray-500 dark:text-gray-400 text-sm">No Background</span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-sm py-2 px-3 font-medium">
                                        {bg.name}
                                    </div>
                                    {currentBackground === bg.id && (
                                        <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Stages Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                                <Edit2 size={20} className="text-purple-600" />
                                Pipeline Stages
                            </h3>
                            <button
                                onClick={handleAddStage}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <Plus size={18} />
                                Add Stage
                            </button>
                        </div>

                        <div className="space-y-3">
                            {stages.map((stage, index) => (
                                <div
                                    key={stage.id}
                                    className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 flex items-center gap-4"
                                >
                                    {/* Order */}
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                                        {index + 1}
                                    </div>

                                    {/* Color Preview */}
                                    <div className={`flex-shrink-0 w-12 h-8 rounded ${COLOR_OPTIONS.find(c => c.id === stage.color)?.header || 'bg-gray-500'}`} />

                                    {/* Stage Info */}
                                    <div className="flex-1">
                                        {editingStageId === stage.id ? (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                                                    placeholder="Stage name"
                                                />
                                                <select
                                                    value={editingColor}
                                                    onChange={(e) => setEditingColor(e.target.value)}
                                                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                                                >
                                                    {COLOR_OPTIONS.map(color => (
                                                        <option key={color.id} value={color.id}>{color.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{stage.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {stage.isCustom && <span className="text-purple-600">Custom • </span>}
                                                    {stage.isTerminal && <span>Terminal Stage</span>}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {editingStageId === stage.id ? (
                                            <>
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingStageId(null)}
                                                    className="px-3 py-1.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setEditingStageId(stage.id);
                                                        setEditingName(stage.name);
                                                        setEditingColor(stage.color);
                                                    }}
                                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                                    title="Edit stage"
                                                >
                                                    <Edit2 size={16} className="text-gray-600 dark:text-gray-400" />
                                                </button>
                                                {stage.isCustom && (
                                                    <button
                                                        onClick={() => handleRemoveStage(stage.id)}
                                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                        title="Remove stage"
                                                    >
                                                        <Trash2 size={16} className="text-red-600" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                            <strong>Tip:</strong> Click Edit to rename stages or change colors. Custom stages can be removed.
                        </p>
                    </div>

                    {/* Transparency Slider Section */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            <Sliders size={20} className="text-purple-600" />
                            Column Transparency
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={transparency}
                                onChange={(e) => handleTransparencyChange(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-purple-600"
                            />
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Opaque (0%)</span>
                                <span className="font-medium text-purple-600">{transparency}% Transparent</span>
                                <span className="text-gray-500 dark:text-gray-400">Transparent (100%)</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Adjust transparency to see the background through the columns. Higher values make columns more transparent.
                            </p>
                        </div>
                    </div>

                    {/* Custom Background Upload Section */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            <Upload size={20} className="text-purple-600" />
                            Custom Background
                        </h3>

                        <div className="space-y-3">
                            {/* Current custom background preview */}
                            {customBackgroundUrl && currentBackground === 'custom' && (
                                <div className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                                    <img
                                        src={customBackgroundUrl}
                                        alt="Custom background"
                                        className="w-full h-40 object-cover"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <button
                                            onClick={() => setShowAIEditor(true)}
                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg flex items-center gap-1 text-sm hover:bg-blue-700 shadow-lg"
                                            disabled={uploading}
                                        >
                                            <Wand2 size={14} />
                                            Edit with AI
                                        </button>
                                        <button
                                            onClick={handleRemoveCustomBg}
                                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 shadow-lg"
                                            disabled={uploading}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Upload button */}
                            <label className="cursor-pointer block">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBackgroundUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-gray-50 dark:bg-gray-900/50">
                                    {uploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploading...</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Upload Custom Background
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Recommended: 1920x1080px • PNG, JPG
                                            </p>
                                        </>
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                        Done
                    </button>
                </div>
            </div>

            {/* AI Editor Modal */}
            {showAIEditor && customBackgroundUrl && (
                <React.Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"><div className="text-white">Loading AI Editor...</div></div>}>
                    <AIImageEditModal
                        userId={userId}
                        currentPhoto={customBackgroundUrl}
                        onSave={(newUrl) => {
                            onCustomBackgroundChange(newUrl);
                            setShowAIEditor(false);
                        }}
                        onUseTemp={(dataUrl) => {
                            // For temp preview -  we'll upload it
                            handleAIEditSave(dataUrl);
                        }}
                        onClose={() => setShowAIEditor(false)}
                        onError={(title, message) => {
                            console.error(title, message);
                            alert(`${title}: ${message}`);
                        }}
                        savePath={`pipeline-backgrounds/${userId}/ai_edited_${Date.now()}.png`}
                    />
                </React.Suspense>
            )}
        </div>
    );
};

export default PipelineSettingsModal;
