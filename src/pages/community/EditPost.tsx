import React, { useState, useRef, useEffect } from 'react';
import { navigate, getPathFromUrl } from '../../utils/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { uploadImage } from '../../services/storageService';
import { Image, X, ArrowLeft, Loader2, Wand2 } from 'lucide-react';
import AICoverImageModal from '../../components/AICoverImageModal';

const MAX_TAGS = 4;
const COLLECTION = 'community_posts';

const EditPost: React.FC = () => {
    const { currentUser } = useAuth();
    const pathParts = getPathFromUrl().split('/');
    const postId = pathParts[3] ?? '';

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const [showAIModal, setShowAIModal] = useState(false);

    // Initial load
    useEffect(() => {
        if (!postId) {
            setLocalError('Invalid post ID.');
            setLoading(false);
            return;
        }

        const abortController = new AbortController();

        const fetchPost = async () => {
            setLoading(true);
            setLocalError(null);
            try {
                const docRef = doc(db, COLLECTION, postId);
                const snapshot = await getDoc(docRef);

                if (abortController.signal.aborted) return;

                if (snapshot.exists()) {
                    const data = snapshot.data();
                    if (data.authorId !== currentUser?.uid) {
                        setLocalError('You do not have permission to edit this post.');
                    } else {
                        // Prevent unconditional state updates to break render loops
                        setTitle(prev => prev !== (data.title || '') ? (data.title || '') : prev);
                        setContent(prev => prev !== (data.content || '') ? (data.content || '') : prev);
                        setTags(prev => JSON.stringify(prev) !== JSON.stringify(data.tags || []) ? (data.tags || []) : prev);

                        if (data.coverImage) {
                            setCoverImageUrl(prev => prev !== data.coverImage ? data.coverImage : prev);
                            setCoverImagePreview(prev => prev !== data.coverImage ? data.coverImage : prev);
                        }
                    }
                } else {
                    setLocalError('This post does not exist.');
                }
            } catch (err: any) {
                if (abortController.signal.aborted) return;
                setLocalError(err.message || 'Failed to load post.');
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        if (currentUser?.uid) {
            fetchPost();
        } else if (currentUser === null) {
            // Null specifically implies finished checking and user is a guest.
            // Avoid navigating aggressively if undefined/loading.
            navigate('/signin');
        }

        return () => {
            abortController.abort();
        };
    }, [postId, currentUser?.uid]);

    // Helper to safely serialize media blocks before markdown conversion
    const prepareBlocksForMarkdown = (blocks: any[]): any[] => {
        return blocks.map(block => {
            if (block.type === 'video' || block.type === 'audio' || block.type === 'file') {
                const url = block.props.url || '';
                const isVideo = block.type === 'video' || url.includes('type=video') || /\.(mp4|webm|mov)(\?|$)/i.test(url);
                const isAudio = block.type === 'audio' || url.includes('type=audio') || /\.(mp3|wav|ogg)(\?|$)/i.test(url);

                const linkText = isVideo ? 'video attachment' : isAudio ? 'audio attachment' : 'file attachment';

                return {
                    id: block.id,
                    type: 'paragraph',
                    props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
                    content: [
                        { type: 'link', href: url, content: linkText }
                    ],
                    children: block.children ? prepareBlocksForMarkdown(block.children) : []
                };
            }

            return {
                ...block,
                children: block.children ? prepareBlocksForMarkdown(block.children) : []
            };
        });
    };

    // Initialize BlockNote
    const editor = useCreateBlockNote({
        uploadFile: async (file: File) => {
            if (!currentUser) throw new Error("Must be logged in to upload media.");
            try {
                const path = `public/community_post_images/${currentUser.uid}/${Date.now()}_${file.name || 'media'}`;
                const url = await uploadImage(file, path);

                // Auto-detect MIME type as requested
                if (file.type.startsWith('video/')) {
                    return `${url}?type=video`;
                }
                if (file.type.startsWith('audio/')) {
                    return `${url}?type=audio`;
                }
                return url;
            } catch (err) {
                console.error("Upload failed", err);
                throw new Error("Failed to upload media.");
            }
        },
    });

    const hydratedPostIdRef = useRef<string | null>(null);

    // Hydrate initial draft content into BlockNote once the content is loaded
    useEffect(() => {
        if (!loading && content && editor && !localError) {
            // Only hydrate ONCE per unique post to prevent infinite typing loops
            if (hydratedPostIdRef.current !== postId) {
                try {
                    const blocks = editor.tryParseMarkdownToBlocks(content);
                    editor.replaceBlocks(editor.document, blocks);
                    hydratedPostIdRef.current = postId;
                } catch (err) {
                    console.error("Failed to parse draft back into BlockNote", err);
                }
            }
        }
    }, [loading, content, editor, localError, postId]);

    const handleEditorChange = async () => {
        if (!editor) return;

        // Pre-process standard links to protect media blocks during Markdown conversion
        const processedBlocks = prepareBlocksForMarkdown(editor.document);
        const markdown = await editor.blocksToMarkdownLossy(processedBlocks);
        setContent(markdown);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setLocalError('Cover image must be less than 5MB.');
            return;
        }

        setCoverImageFile(file);
        setCoverImagePreview(URL.createObjectURL(file));
        setCoverImageUrl(null);
        setLocalError(null);
    };

    const removeCoverImage = () => {
        setCoverImageFile(null);
        setCoverImagePreview(null);
        setCoverImageUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const addTag = (tag: string) => {
        const cleanedTag = tag.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase().trim();
        if (cleanedTag && !tags.includes(cleanedTag) && tags.length < MAX_TAGS) {
            setTags(prev => [...prev, cleanedTag]);
        }
        setTagInput('');
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(tagInput);
        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            setLocalError('Please provide a title and some content.');
            return;
        }

        setIsSaving(true);
        setLocalError(null);

        try {
            let finalCoverImageUrl = coverImageUrl;

            // Upload a new physical file if provided
            if (coverImageFile && currentUser) {
                const path = `community/covers/${currentUser.uid}/${Date.now()}_${coverImageFile.name}`;
                finalCoverImageUrl = await uploadImage(coverImageFile, path);
            }

            const docRef = doc(db, COLLECTION, postId);

            const payload: any = {
                title: title.trim(),
                content: content.trim(),
                tags,
                updatedAt: serverTimestamp(),
            };

            // Allow explicit nulling out of cover image (or updating it)
            if (finalCoverImageUrl !== undefined) {
                payload.coverImage = finalCoverImageUrl;
            } else if (!coverImagePreview) {
                payload.coverImage = null;
            }

            await updateDoc(docRef, payload);
            navigate(window.history.state?.from || `/community/post/${postId}`);
        } catch (err: any) {
            console.error('Save failed:', err);
            setLocalError(err.message || 'Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white/50 dark:bg-gray-900/50 flex flex-col items-center justify-center p-6 backdrop-blur-sm z-50">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4 drop-shadow-md" />
                <p className="text-gray-600 dark:text-gray-300 font-medium">Loading editor...</p>
            </div>
        );
    }

    if (localError && !title) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-12 flex flex-col items-center">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl shadow mt-10">
                    {localError}
                </div>
                <button onClick={() => navigate('/community')} className="mt-4 text-primary-600 font-semibold hover:underline">
                    Back to Community
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 relative">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(window.history.state?.from || `/community/post/${postId}`)}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium hidden sm:inline">Back</span>
                    </button>

                    <div className="flex items-center gap-3 md:gap-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !title.trim() || !content.trim()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-md shadow-primary-500/20 active:scale-95 text-sm"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <span>Save Changes</span>}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {localError && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 font-medium text-sm flex items-start gap-3 shadow-sm animate-pulse">
                        <span className="mt-0.5 block shrink-0">⚠️</span>
                        <span>{localError}</span>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col min-h-[600px]">

                    {/* Cover Image Area */}
                    {coverImagePreview ? (
                        <div className="relative w-full h-48 sm:h-64 group bg-gray-100 dark:bg-gray-800">
                            <img src={coverImagePreview} alt="Cover Preview" className="w-full h-full object-cover transition-opacity duration-300" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-white/20 hover:bg-white text-white hover:text-gray-900 rounded-lg font-medium backdrop-blur-md transition-all shadow-lg"
                                >
                                    Change Image
                                </button>
                                <button
                                    onClick={removeCoverImage}
                                    className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-all shadow-lg"
                                    title="Remove cover image"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageSelect}
                            />
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
                        {/* Title */}
                        <textarea
                            placeholder="Article title…"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            rows={2}
                            className="w-full mt-8 text-3xl sm:text-4xl lg:text-5xl font-black bg-transparent border-0 focus:ring-0 placeholder-gray-200 dark:placeholder-gray-700 text-gray-900 dark:text-white resize-none leading-tight outline-none"
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
                                    className="flex-1 min-w-[150px] bg-transparent border-0 focus:ring-0 outline-none text-sm font-medium placeholder-gray-300 dark:placeholder-gray-600 text-gray-900 dark:text-white py-1"
                                />
                            )}
                        </div>

                        {/* Content using BlockNote */}
                        <div className="flex-1 min-h-[500px] mb-8 -ml-12 mt-4 cursor-text">
                            <BlockNoteView
                                editor={editor}
                                onChange={handleEditorChange}
                                theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                            />
                        </div>
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
                        setCoverImageFile(null);
                    }}
                    onClose={() => setShowAIModal(false)}
                    onError={(title, msg) => setLocalError(`${title}: ${msg}`)}
                />
            )}
        </div>
    );
};

export default EditPost;
