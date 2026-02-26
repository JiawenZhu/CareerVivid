import React, { useState, useRef } from 'react';
import { navigate } from '../../utils/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useCreatePost } from '../../hooks/useCreatePost';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Image, X, ArrowLeft, Loader2, Eye, Edit3, Wand2 } from 'lucide-react';
import AICoverImageModal from '../../components/AICoverImageModal';

const MAX_TAGS = 4;

const CommunityEditor: React.FC = () => {
    const { currentUser } = useAuth();
    const { publishPost, isPublishing, error: publishError } = useCreatePost();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const [isPreview, setIsPreview] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!currentUser) {
        navigate('/signin');
        return null;
    }

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setLocalError('Please select an image file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setLocalError('Image must be smaller than 5MB.');
            return;
        }

        setCoverImageFile(file);
        setCoverImagePreview(URL.createObjectURL(file));
        setLocalError(null);
    };

    const removeCoverImage = () => {
        setCoverImageFile(null);
        setCoverImageUrl(null);
        if (coverImagePreview && !coverImageUrl) URL.revokeObjectURL(coverImagePreview);
        setCoverImagePreview(null);
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const slug = tagInput.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            if (slug && tags.length < MAX_TAGS && !tags.includes(slug)) {
                setTags(prev => [...prev, slug]);
            }
            setTagInput('');
        }
        if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setTags(prev => prev.slice(0, -1));
        }
    };

    const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

    const handlePublish = async () => {
        setLocalError(null);
        if (!title.trim()) { setLocalError('A title is required.'); return; }
        if (!content.trim()) { setLocalError('Post content cannot be empty.'); return; }

        const id = await publishPost({ title, content, tags, coverImageFile, coverImageUrl });
        if (id) {
            navigate('/community');
        }
    };

    const error = localError || publishError;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
            {/* Top Bar */}
            <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/community')}
                        className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        aria-label="Back to community"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Create Article</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsPreview(p => !p)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                    >
                        {isPreview ? <Edit3 size={16} /> : <Eye size={16} />}
                        {isPreview ? 'Edit' : 'Preview'}
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={isPublishing || !title.trim() || !content.trim()}
                        className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition-colors shadow-sm cursor-pointer"
                    >
                        {isPublishing ? <Loader2 size={16} className="animate-spin" /> : null}
                        {isPublishing ? 'Publishing…' : 'Publish'}
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-800">
                        {error}
                    </div>
                )}

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col min-h-[70vh]">

                    {/* Cover image area */}
                    {coverImagePreview ? (
                        <div className="relative w-full aspect-video group">
                            <img src={coverImagePreview} alt="Cover" className="w-full h-full object-cover" />
                            <button
                                onClick={removeCoverImage}
                                className="absolute top-4 right-4 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                aria-label="Remove cover image"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="px-8 sm:px-12 pt-8 pb-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageSelect}
                            />
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
                                >
                                    <Image size={18} /> Add a cover image
                                </button>
                                <button
                                    onClick={() => setShowAIModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                                >
                                    <Wand2 size={16} /> AI Generate Cover
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="px-8 sm:px-12 flex-1 flex flex-col pb-12">
                        {isPreview ? (
                            /* ── Preview mode ── */
                            <div className="pt-8 prose prose-lg dark:prose-invert max-w-none">
                                <h1 className="font-black text-4xl sm:text-5xl !mb-4">{title || 'Untitled'}</h1>
                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-8 not-prose">
                                        {tags.map(t => (
                                            <span key={t} className="text-sm text-gray-500 font-medium">#{t}</span>
                                        ))}
                                    </div>
                                )}
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {content || '*Nothing written yet…*'}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            /* ── Edit mode ── */
                            <>
                                {/* Title */}
                                <textarea
                                    placeholder="Article title…"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    rows={2}
                                    className="w-full mt-8 text-3xl sm:text-4xl lg:text-5xl font-black bg-transparent border-0 focus:ring-0 placeholder-gray-200 dark:placeholder-gray-700 text-gray-900 dark:text-white resize-none leading-tight"
                                />

                                {/* Tags */}
                                <div className="flex flex-wrap items-center gap-2 py-4 border-b border-gray-100 dark:border-gray-800 mb-6">
                                    {tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            #{tag}
                                            <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors ml-0.5 cursor-pointer" aria-label={`Remove tag ${tag}`}>
                                                <X size={13} />
                                            </button>
                                        </span>
                                    ))}
                                    {tags.length < MAX_TAGS && (
                                        <input
                                            type="text"
                                            placeholder={tags.length === 0 ? 'Add up to 4 tags (press Enter)…' : 'Add tag…'}
                                            value={tagInput}
                                            onChange={e => setTagInput(e.target.value)}
                                            onKeyDown={handleTagKeyDown}
                                            className="flex-1 min-w-[150px] bg-transparent border-0 focus:ring-0 text-sm font-medium placeholder-gray-300 dark:placeholder-gray-600 text-gray-900 dark:text-white py-1"
                                        />
                                    )}
                                </div>

                                {/* Content */}
                                <textarea
                                    placeholder="Write your article here… Markdown is supported."
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    className="w-full flex-1 min-h-[400px] text-base lg:text-lg leading-[1.8] font-normal bg-transparent border-0 focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600 text-gray-800 dark:text-gray-200 resize-y"
                                />
                            </>
                        )}
                    </div>
                </div>
            </main>

            {showAIModal && (
                <AICoverImageModal
                    userId={currentUser.uid}
                    onSave={(url) => {
                        setCoverImageUrl(url);
                        setCoverImagePreview(url);
                        setShowAIModal(false);
                        setCoverImageFile(null); // Ensure file is cleared
                    }}
                    onClose={() => setShowAIModal(false)}
                    onError={(title, msg) => setLocalError(`${title}: ${msg}`)}
                />
            )}
        </div>
    );
};

export default CommunityEditor;
