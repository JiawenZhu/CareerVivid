import React, { useState, useEffect, useRef } from 'react';
import { collection, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../../firebase';
import {
    Loader2, Check, Trash2, ImageIcon, UploadCloud, Brush, Wand2, Play, Volume2 as VolumeIcon, Sparkles
} from 'lucide-react';
import { BlogPost } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import AlertModal from '../../../components/AlertModal';
import AIImprovementPanel from '../../../components/AIImprovementPanel';
import AIImageEditModal from '../../../components/AIImageEditModal';
import AutoResizeTextarea from '../../../components/AutoResizeTextarea';
import { uploadImage, dataURLtoBlob } from '../../../services/storageService';
import { parseGEOContent, getGEOTemplate } from '../../../utils/geoFormatting';
import BlogLinkManager from './BlogLinkManager';

// --- Helper Components ---

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8 p-6 bg-white dark:bg-gray-800/50 dark:border dark:border-gray-700 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">{title}</h2>
        {children}
    </div>
);

// --- Main BlogEditor Component ---

const BlogEditor: React.FC<{ post?: BlogPost; onSave: () => void; onCancel: () => void }> = ({ post, onSave, onCancel }) => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState<Partial<BlogPost>>({
        title: '',
        category: 'Career Advice',
        excerpt: '',
        content: '',
        coverImage: '',
        author: 'CareerVivid Team'
    });

    const [tempImage, setTempImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '' });
    const [activeAIField, setActiveAIField] = useState<string | null>(null);
    const [isImageEditModalOpen, setIsImageEditModalOpen] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState('Amber');
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const mockVoices = [
        { name: 'Amber', label: 'Female' },
        { name: 'Aria', label: 'Female' },
        { name: 'Ashley', label: 'Female' },
        { name: 'Cora', label: 'Female' },
        { name: 'Daria', label: 'Female' },
        { name: 'Dawn', label: 'Female' },
        { name: 'Ellen', label: 'Female' },
        { name: 'Eric', label: 'Male' },
        { name: 'Guy', label: 'Male' },
        { name: 'Jane', label: 'Female' }
    ];

    useEffect(() => {
        if (post) setFormData(post);
    }, [post]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setTempImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content) {
            setAlertState({ isOpen: true, title: 'Validation Error', message: 'Title and Content are required.' });
            return;
        }

        setLoading(true);
        try {
            let coverImageUrl = formData.coverImage;

            if (tempImage && currentUser) {
                const blob = dataURLtoBlob(tempImage);
                if (!blob) throw new Error("Failed to process image.");
                const path = `public/blog_assets/blog_${Date.now()}_cover.png`;
                coverImageUrl = await uploadImage(blob, path);
            }

            const geo = parseGEOContent(formData.content || '');
            const postData = {
                ...formData,
                content: geo.content,
                faqs: geo.faqs,
                coverImage: coverImageUrl,
                updatedAt: serverTimestamp()
            };

            if (!post) {
                // New Post
                await addDoc(collection(db, 'blog_posts'), {
                    ...postData,
                    publishedAt: serverTimestamp()
                });
            } else {
                // Update Post
                await updateDoc(doc(db, 'blog_posts', post.id), postData);
            }
            onSave();
        } catch (error: any) {
            console.error("Error saving post:", error);
            setAlertState({ isOpen: true, title: 'Save Failed', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAudio = async () => {
        if (!post?.id) {
            setAlertState({ isOpen: true, title: 'Error', message: 'You must save the post first before generating audio.' });
            return;
        }

        if (!formData.content) {
            setAlertState({ isOpen: true, title: 'Error', message: 'There is no content to narrate.' });
            return;
        }

        setAlertState({ isOpen: true, title: 'Generating', message: 'Audio generation started in the background.' });
        try {
            await updateDoc(doc(db, 'blog_posts', post.id), {
                audioGenerationStatus: 'processing',
                audioVoiceUsed: selectedVoice
            });
            // Update local state to reflect UI changes immediately
            setFormData(prev => ({ ...prev, audioGenerationStatus: 'processing', audioVoiceUsed: selectedVoice }));
            // We do not have setPost since post is a prop, we only update formData.
        } catch (error: any) {
            console.error("Audio Generation Error:", error);
            setAlertState({ isOpen: true, title: 'Error', message: 'Failed to start audio generation.' });
        }
    };

    const toggleAI = (field: string) => setActiveAIField(activeAIField === field ? null : field);

    const displayImage = tempImage || formData.coverImage;

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen pb-20">
            <AlertModal
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                onClose={() => setAlertState({ isOpen: false, title: '', message: '' })}
            />

            {/* AI Image Editor Modal */}
            {isImageEditModalOpen && displayImage && currentUser && (
                <AIImageEditModal
                    userId={currentUser.uid}
                    currentPhoto={displayImage}
                    onClose={() => setIsImageEditModalOpen(false)}
                    onSave={(newUrl) => {
                        setFormData({ ...formData, coverImage: newUrl });
                        setTempImage(null);
                    }}
                    onUseTemp={(dataUrl) => setTempImage(dataUrl)}
                    onError={(t, m) => setAlertState({ isOpen: true, title: t, message: m })}
                    savePath={`public/blog_assets/blog_${Date.now()}_edited.png`}
                    promptOptions={[
                        'Modern tech workspace',
                        'Minimalist document layout',
                        'Professional writing desk',
                        'Bright office environment',
                        'Abstract career concept art',
                        'Soft lighting and clean background'
                    ]}
                />
            )}

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{post ? 'Edit Blog Post' : 'New Blog Post'}</h1>
                    <div className="flex gap-3">
                        <button onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                        <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 flex items-center gap-2">
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            Save & Publish
                        </button>
                    </div>
                </div>

                <FormSection title="Post Details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Title</label>
                            <input
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                            <button onClick={() => toggleAI('title')} className="mt-2 flex items-center gap-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"><Wand2 size={14} /> Improve Title with AI</button>
                            {activeAIField === 'title' && currentUser && (
                                <AIImprovementPanel
                                    userId={currentUser.uid}
                                    sectionName="Blog Title"
                                    currentText={formData.title || ''}
                                    language="English"
                                    onAccept={(text) => { setFormData({ ...formData, title: text }); setActiveAIField(null); }}
                                    onClose={() => setActiveAIField(null)}
                                    onError={(t, m) => setAlertState({ isOpen: true, title: t, message: m })}
                                    contextType="blog post"
                                />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Category</label>
                            <select
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option>Career Advice</option>
                                <option>Resume Tips</option>
                                <option>Interview Prep</option>
                                <option>Tech Trends</option>
                                <option>Job Search Strategies</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Excerpt (Short Summary)</label>
                            <textarea
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                rows={3}
                                value={formData.excerpt}
                                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                            />
                            <button onClick={() => toggleAI('excerpt')} className="mt-2 flex items-center gap-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"><Wand2 size={14} /> Improve Excerpt with AI</button>
                            {activeAIField === 'excerpt' && currentUser && (
                                <AIImprovementPanel
                                    userId={currentUser.uid}
                                    sectionName="Blog Excerpt"
                                    currentText={formData.excerpt || ''}
                                    language="English"
                                    onAccept={(text) => { setFormData({ ...formData, excerpt: text }); setActiveAIField(null); }}
                                    onClose={() => setActiveAIField(null)}
                                    onError={(t, m) => setAlertState({ isOpen: true, title: t, message: m })}
                                    contextType="blog post"
                                />
                            )}
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Media">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        <div className="w-full md:w-64 aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center border border-gray-300 dark:border-gray-600">
                            {displayImage ? (
                                <img src={displayImage} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center">
                                    <ImageIcon size={32} />
                                    <span className="text-xs mt-2">No Image</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-grow">
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Cover Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                            />
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2 text-sm font-medium"
                                >
                                    <UploadCloud size={16} /> {displayImage ? 'Change Image' : 'Upload Image'}
                                </button>
                                {displayImage && (
                                    <>
                                        <button
                                            onClick={() => setIsImageEditModalOpen(true)}
                                            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/40 flex items-center gap-2 text-sm font-medium"
                                        >
                                            <Brush size={16} /> Edit with AI
                                        </button>
                                        <button
                                            onClick={() => { setFormData({ ...formData, coverImage: '' }); setTempImage(null); }}
                                            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center gap-2 text-sm font-medium"
                                        >
                                            <Trash2 size={16} /> Remove
                                        </button>
                                    </>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Recommended size: 1200×630px. Supported formats: JPG, PNG.</p>
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Audio">
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select AI Voice</label>
                            <div className="flex gap-2">
                                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600">All</span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">Female</span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">Male</span>
                                <button className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:underline ml-2">
                                    <Sparkles size={12} /> Uncover Custom Voice
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {mockVoices.map(voice => (
                                <div
                                    key={voice.name}
                                    onClick={() => setSelectedVoice(voice.name)}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedVoice === voice.name
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-gray-800'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-semibold text-sm ${selectedVoice === voice.name ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-800 dark:text-gray-200'}`}>{voice.name}</span>
                                        {selectedVoice === voice.name && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{voice.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateAudio}
                        disabled={isGeneratingAudio}
                        className={`w-full py-4 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors mb-6 shadow-md ${isGeneratingAudio ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {isGeneratingAudio ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Generating Audio (This may take a minute)...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} /> Generate Audio with AI ({selectedVoice})
                            </>
                        )}
                    </button>

                    {(formData as any).audioUrl || (formData as any).audioGenerationStatus === 'completed' ? (
                        <div className="bg-gray-50 dark:bg-gray-800/80 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <VolumeIcon size={16} className="text-indigo-500" /> Generated Audio ({(formData as any).audioVoiceUsed || selectedVoice})
                                </span>
                            </div>
                            <audio controls className="w-full" src={(formData as any).audioUrl} />
                        </div>
                    ) : (
                        <div className="bg-gray-50 dark:bg-gray-800/80 p-4 rounded-xl border border-gray-200 dark:border-gray-700 opacity-50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <VolumeIcon size={16} className="text-gray-500" /> Audio Draft
                                </span>
                                {(formData as any).audioGenerationStatus === 'failed' && (
                                    <span className="text-xs text-red-500 font-bold">Generation Failed: {(formData as any).audioError}</span>
                                )}
                                <span className="text-xs text-gray-500">Duration: --:-- / --:--</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <button disabled className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-400 rounded-full cursor-not-allowed">
                                    <Play size={20} className="ml-1" />
                                </button>
                                <div className="flex-grow h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden cursor-not-allowed">
                                </div>
                                <button disabled className="p-1 text-gray-400 cursor-not-allowed">
                                    <VolumeIcon size={18} />
                                </button>
                            </div>
                            <p className="text-xs text-center text-gray-500 mt-4">Generate audio to preview the track here.</p>
                        </div>
                    )}
                </FormSection>

                <FormSection title="Content">
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Post Body (Markdown Supported)</label>
                        <div className="flex flex-col xl:flex-row gap-6 items-start">
                            {/* Main Editor Column */}
                            <div className="flex-grow w-full">
                                <AutoResizeTextarea
                                    required
                                    className="w-full p-4 border rounded-md dark:bg-gray-700 dark:border-gray-600 font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
                                    value={formData.content || ''}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="# Introduction..."
                                    minHeight={500}
                                    maxHeight={800}
                                />

                                <button
                                    type="button"
                                    onClick={() => toggleAI('content')}
                                    className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                                >
                                    <Wand2 size={16} /> Improve Content with AI
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (window.confirm("Replace existing content with the GEO-optimized template?")) {
                                            setFormData({ ...formData, content: getGEOTemplate(formData.title || "Article Title") });
                                        }
                                    }}
                                    className="mt-3 ml-4 flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                >
                                    <Sparkles size={16} /> Apply GEO Template
                                </button>

                                {activeAIField === 'content' && currentUser && (
                                    <AIImprovementPanel
                                        userId={currentUser.uid}
                                        sectionName="Blog Content"
                                        currentText={formData.content || ''}
                                        language="English"
                                        onAccept={(text) => {
                                            setFormData({ ...formData, content: text });
                                            setActiveAIField(null);
                                        }}
                                        onClose={() => setActiveAIField(null)}
                                        onError={(t, m) => setAlertState({ isOpen: true, title: t, message: m })}
                                        contextType="blog post"
                                    />
                                )}
                            </div>

                            {/* Link Manager Sidebar Column */}
                            <div className="w-full xl:w-80 flex-shrink-0 xl:sticky xl:top-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                                <BlogLinkManager content={formData.content || ''} onUpdateContent={(c) => setFormData({ ...formData, content: c })} />
                            </div>
                        </div>
                    </div>
                </FormSection>
            </div>
        </div>
    );
};

export default BlogEditor;
