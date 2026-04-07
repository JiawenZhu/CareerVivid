import React, { useState, useRef, useEffect } from 'react';
import { navigate } from '../../utils/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useCreatePost } from '../../hooks/useCreatePost';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { uploadImage } from '../../services/storageService';
import { Image, X, ArrowLeft, Loader2, Wand2, RefreshCcw, Sparkles, Linkedin, Send } from 'lucide-react';
import AICoverImageModal from '../../components/AICoverImageModal';
import { getGEOTemplate } from '../../utils/geoFormatting';
import { generateLinkedInPost } from '../../services/researchBotService';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const MAX_TAGS = 4;

const CommunityEditor: React.FC = () => {
    const { currentUser } = useAuth();
    const { publishPost, isPublishing, error: publishError } = useCreatePost();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [initialContentLoaded, setInitialContentLoaded] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const [showAIModal, setShowAIModal] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // LinkedIn Automation State
    const [linkedInPostText, setLinkedInPostText] = useState('');
    const [linkedInArticleUrl, setLinkedInArticleUrl] = useState('');
    const [isGeneratingLinkedIn, setIsGeneratingLinkedIn] = useState(false);
    const [isPublishingLinkedIn, setIsPublishingLinkedIn] = useState(false);
    const [linkedInStatus, setLinkedInStatus] = useState('');
    const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
    const [isVerifyingLinkedIn, setIsVerifyingLinkedIn] = useState(true);
    const [showLinkedInModal, setShowLinkedInModal] = useState(false);

    // Auto-save draft logic

    React.useEffect(() => {
        const draft = localStorage.getItem('careervivid_post_draft');
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (parsed.title) setTitle(parsed.title);
                if (parsed.content) setContent(parsed.content);
                if (parsed.tags) setTags(parsed.tags);
            } catch (e) {
                console.error('Failed to parse draft', e);
            }
        }
        setInitialContentLoaded(true);
    }, []);

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            if (title || content || tags.length > 0) {
                localStorage.setItem('careervivid_post_draft', JSON.stringify({ title, content, tags }));
            }
        }, 1000);
        return () => clearTimeout(timeout);
    }, [title, content, tags]);

    // LinkedIn connection verification
    useEffect(() => {
        const checkConnection = async () => {
            if (!currentUser) return;
            try {
                const docSnap = await getDoc(doc(db, 'users', currentUser.uid, 'integrations', 'linkedin'));
                if (docSnap.exists() && docSnap.data().connected) {
                    setIsLinkedInConnected(true);
                }
            } catch (err) {
                console.error('LinkedIn check failed:', err);
            } finally {
                setIsVerifyingLinkedIn(false);
            }
        };
        checkConnection();
    }, [currentUser]);

    // Handle LinkedIn OAuth Callback
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (code && state === currentUser?.uid && !isLinkedInConnected) {
            const completeHandshake = async () => {
                setLinkedInStatus('Completing LinkedIn connection...');
                try {
                    const functions = getFunctions(undefined, 'us-west1');
                    const handleLinkedInCallback = httpsCallable(functions, 'handleLinkedInCallback');
                    await handleLinkedInCallback({
                        code,
                        state,
                        redirectUri: window.location.origin + window.location.pathname
                    });
                    setIsLinkedInConnected(true);
                    setLinkedInStatus('LinkedIn connected successfully! 🎉');
                    // Clean URL
                    window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
                    setTimeout(() => setLinkedInStatus(''), 4000);
                } catch (err: any) {
                    console.error('LinkedIn Handshake Failed:', err);
                    setLinkedInStatus(`Connection failed: ${err.message}`);
                }
            };
            completeHandshake();
        }
    }, [currentUser, isLinkedInConnected]);

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

    // Hydrate initial draft content into BlockNote once
    useEffect(() => {
        if (initialContentLoaded && content && editor) {
            // Only hydrate if the editor is virtually empty
            if (editor.document.length === 1 && editor.document[0].content === undefined) {
                try {
                    const blocks = editor.tryParseMarkdownToBlocks(content);
                    editor.replaceBlocks(editor.document, blocks);
                } catch (err) {
                    console.error("Failed to parse draft back into BlockNote", err);
                }
            }
        }
    }, [initialContentLoaded, editor]); // intentionally omitting 'content' to prevent rewriting during typing

    const handleEditorChange = async () => {
        if (!editor) return;

        // Pre-process standard links to protect media blocks during Markdown conversion
        const processedBlocks = prepareBlocksForMarkdown(editor.document);
        const markdown = await editor.blocksToMarkdownLossy(processedBlocks);
        setContent(markdown);
    };

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

    const handleConnectLinkedIn = async () => {
        setLinkedInStatus('Initiating LinkedIn connection...');
        try {
            const functions = getFunctions(undefined, 'us-west1');
            const getLinkedInAuthUrl = httpsCallable(functions, 'getLinkedInAuthUrl');
            const result: any = await getLinkedInAuthUrl({
                redirectUri: window.location.origin + window.location.pathname
            });
            if (result.data?.url) {
                window.location.href = result.data.url;
            }
        } catch (err: any) {
            console.error('Failed to get auth URL:', err);
            setLinkedInStatus(`Error: ${err.message}`);
        }
    };

    const handlePublishLinkedIn = async () => {
        setIsPublishingLinkedIn(true);
        setLinkedInStatus('Publishing to LinkedIn...');

        try {
            const functions = getFunctions(undefined, 'us-west1');
            const publishLinkedInPost = httpsCallable(functions, 'publishLinkedInPost');

            await publishLinkedInPost({
                text: linkedInPostText,
                articleUrl: linkedInArticleUrl
            });

            setLinkedInStatus('Successfully posted to LinkedIn! 🚀');
            setTimeout(() => {
                setShowLinkedInModal(false);
                navigate('/community');
            }, 3000);
        } catch (error: any) {
            console.error('LinkedIn Publishing Error:', error);
            setLinkedInStatus(`Error: ${error.message || 'Failed to post.'}`);
        } finally {
            setIsPublishingLinkedIn(false);
        }
    };

    const handlePublish = async () => {
        setLocalError(null);
        if (!title.trim()) { setLocalError('A title is required.'); return; }
        if (!content.trim()) { setLocalError('Post content cannot be empty.'); return; }

        const id = await publishPost({ title, content, tags, coverImageFile, coverImageUrl });
        if (id) {
            localStorage.removeItem('careervivid_post_draft');
            navigate(`/community/post/${id}`);

            // TODO: Re-enable LinkedIn sharing once the integration is stable
            // setLinkedInArticleUrl(`https://careervivid.app/community/post/${id}`);
            // setShowLinkedInModal(true);
            // setIsGeneratingLinkedIn(true);
            // try {
            //     const socialText = await generateLinkedInPost(title, content);
            //     setLinkedInPostText(socialText);
            // } catch (err) {
            //     console.error("LinkedIn generation failed", err);
            // } finally {
            //     setIsGeneratingLinkedIn(false);
            // }
        }
    };

    const error = localError || publishError;

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/80 flex flex-col relative overflow-hidden">
            {/* Ambient Base Glow */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-400/20 dark:bg-primary-600/10 blur-[120px] pointer-events-none z-[-1]" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[120px] pointer-events-none z-[-1]" />

            {/* Top Bar */}
            <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-white/50 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl sticky top-0 z-30 shadow-sm">
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
                        onClick={handlePublish}
                        disabled={isPublishing || !title.trim() || !content.trim()}
                        className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition-colors shadow-sm cursor-pointer"
                    >
                        {isPublishing ? <Loader2 size={16} className="animate-spin" /> : null}
                        {isPublishing ? 'Publishing…' : 'Publish'}
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm("Replace existing content with the GEO-optimized template?")) {
                                const template = getGEOTemplate(title || "Article Title");
                                try {
                                    const blocks = editor.tryParseMarkdownToBlocks(template);
                                    editor.replaceBlocks(editor.document, blocks);
                                } catch (err) {
                                    console.error("Failed to apply template", err);
                                }
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg font-bold text-sm transition-colors cursor-pointer"
                        title="Apply GEO-optimized content structure"
                    >
                        <Sparkles size={16} /> GEO Template
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 relative z-10">
                {error && (
                    <div className="mb-6 p-4 bg-red-50/60 dark:bg-red-900/20 backdrop-blur-md text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100/50 dark:border-red-800/50">
                        {error}
                    </div>
                )}

                <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] border border-white/50 dark:border-gray-800/50 shadow-sm overflow-hidden flex flex-col min-h-[70vh]">

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
                            {initialContentLoaded && (
                                <BlockNoteView
                                    editor={editor}
                                    onChange={handleEditorChange}
                                    theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                                />
                            )}
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
                        setCoverImageFile(null); // Ensure file is cleared
                    }}
                    onClose={() => setShowAIModal(false)}
                    onError={(title, msg) => setLocalError(`${title}: ${msg}`)}
                />
            )}

            {/* LinkedIn Preview Modal */}
            {showLinkedInModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-[24px] w-full max-w-2xl shadow-xl border border-white/50 dark:border-gray-800/50 overflow-hidden">
                        <div className="p-6 border-b border-white/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Linkedin size={24} className="text-[#0A66C2]" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Review LinkedIn Post</h3>
                            </div>
                            <button
                                onClick={() => navigate('/community')}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {isGeneratingLinkedIn ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <Sparkles size={48} className="text-blue-500 mb-4 animate-bounce" />
                                    <h4 className="text-gray-900 dark:text-white font-medium mb-2">AI is drafting your LinkedIn post...</h4>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Optimizing for maximum engagement.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Refine your AI-generated post before sharing:</p>
                                    <textarea
                                        value={linkedInPostText}
                                        onChange={(e) => setLinkedInPostText(e.target.value)}
                                        className="w-full h-64 p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent outline-none resize-none font-sans text-sm leading-relaxed"
                                        placeholder="LinkedIn post text..."
                                        disabled={!isLinkedInConnected || isPublishingLinkedIn}
                                    />

                                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg text-sm flex gap-2 items-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                        <span>Post will link to: <strong>{linkedInArticleUrl}</strong></span>
                                    </div>

                                    {linkedInStatus && (
                                        <div className={`p-3 rounded-lg text-sm text-center font-medium ${linkedInStatus.includes('Error') || linkedInStatus.includes('failed') ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                                            {linkedInStatus}
                                        </div>
                                    )}

                                    {!isVerifyingLinkedIn && !isLinkedInConnected && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 flex flex-col items-center gap-3">
                                            <p className="text-sm font-medium text-center">Link your LinkedIn account to enable one-click social sharing.</p>
                                            <button
                                                onClick={handleConnectLinkedIn}
                                                className="bg-[#0A66C2] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#004182] transition-colors shadow-sm cursor-pointer"
                                            >
                                                <Linkedin size={18} />
                                                Connect LinkedIn
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-4">
                                        <button
                                            onClick={() => navigate('/community')}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
                                        >
                                            Skip for now
                                        </button>
                                        <button
                                            onClick={handlePublishLinkedIn}
                                            disabled={isPublishingLinkedIn || !linkedInPostText || !isLinkedInConnected}
                                            className="bg-[#0A66C2] hover:bg-[#004182] text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {isPublishingLinkedIn ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                            Post to LinkedIn
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityEditor;
