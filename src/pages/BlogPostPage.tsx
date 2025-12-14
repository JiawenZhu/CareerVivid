
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { BlogPost } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Calendar, User, ArrowLeft, Facebook, Twitter, Linkedin } from 'lucide-react';
import { navigate } from '../App';

// --- Simple Markdown Renderer for Blog Content ---
const MarkdownRenderer: React.FC<{ text: string }> = ({ text = '' }) => {
    const renderContent = (content: string) => {
        // Split content by links [text](url)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            // Text before link
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
            }
            // The link
            parts.push({ type: 'link', text: match[1], url: match[2] });
            lastIndex = linkRegex.lastIndex;
        }
        // Remaining text
        if (lastIndex < content.length) {
            parts.push({ type: 'text', content: content.slice(lastIndex) });
        }

        // If no links found, return single text part to process bold
        if (parts.length === 0) parts.push({ type: 'text', content });

        return parts.map((part, i) => {
            if (part.type === 'link') {
                return (
                    <a
                        key={i}
                        href={part.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 hover:underline break-words"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part.text}
                    </a>
                );
            } else {
                // Process bold (**text**) inside text parts
                const boldParts = part.content.split(/(\*\*.*?\*\*)/g);
                return boldParts.map((bp, j) => {
                    if (bp.startsWith('**') && bp.endsWith('**')) {
                        return <strong key={`${i}-${j}`} className="font-semibold text-gray-900 dark:text-white">{bp.slice(2, -2)}</strong>;
                    }
                    return <span key={`${i}-${j}`}>{bp}</span>;
                });
            }
        });
    };

    const lines = text.split('\n');
    const elements = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.trim().startsWith('### ')) {
            elements.push(<h3 key={i} className="text-xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">{renderContent(line.substring(4))}</h3>);
        } else if (line.trim().startsWith('## ')) {
            elements.push(<h2 key={i} className="text-2xl font-bold mt-10 mb-5 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">{renderContent(line.substring(3))}</h2>);
        } else if (line.trim().startsWith('# ')) {
            elements.push(<h1 key={i} className="text-3xl font-extrabold mt-12 mb-6 text-gray-900 dark:text-white">{renderContent(line.substring(2))}</h1>);
        } else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            elements.push(
                <li key={i} className="ml-4 list-disc text-gray-700 dark:text-gray-300 pl-2 mb-2">
                    {renderContent(line.substring(line.indexOf(' ') + 1))}
                </li>
            );
        } else if (/^\d+\.\s/.test(line.trim())) {
            elements.push(
                <div key={i} className="flex items-start mb-2 text-gray-700 dark:text-gray-300">
                    <span className="mr-2 font-semibold">{line.match(/^\d+\./)?.[0]}</span>
                    <span>{renderContent(line.substring(line.indexOf('.') + 2))}</span>
                </div>
            );
        } else if (line.trim() === '') {
            elements.push(<div key={i} className="h-4"></div>);
        } else {
            elements.push(<p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 text-lg">{renderContent(line)}</p>);
        }
    }

    return <div className="prose dark:prose-invert max-w-none">{elements}</div>;
};

const BlogPostPage: React.FC<{ postId: string }> = ({ postId }) => {
    const { t } = useTranslation();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) return;
            try {
                const docRef = doc(db, 'blog_posts', postId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setPost({ id: docSnap.id, ...docSnap.data() } as BlogPost);
                }
            } catch (error) {
                console.error("Error fetching post:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [postId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
                <PublicHeader />
                <div className="flex-grow flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('blog.post_not_found')}</h1>
                    <button onClick={() => navigate('/blog')} className="text-primary-600 hover:underline">{t('blog.back_to_blog')}</button>
                </div>
            </div>
        );
    }

    // Handle legacy data where content might be stored as 'body'
    const displayContent = post.content || (post as any).body || t('blog.no_content');

    return (
        <div className="bg-white dark:bg-gray-950 min-h-screen flex flex-col font-sans">
            <PublicHeader />
            <main className="flex-grow pt-24 pb-20">
                <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <button onClick={() => navigate('/blog')} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8 transition-colors">
                        <ArrowLeft size={16} /> {t('blog.back_to_articles')}
                    </button>

                    {/* Header */}
                    <header className="mb-10 text-center">
                        <div className="inline-block px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider mb-6">
                            {post.category || 'General'}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                            {post.title}
                        </h1>
                        <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <User size={16} /> {post.author || t('blog.team')}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                {post.publishedAt?.toDate
                                    ? post.publishedAt.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                                    : t('blog.recently')}
                            </div>
                        </div>
                    </header>

                    {/* Feature Image */}
                    {post.coverImage && (
                        <div className="mb-12 rounded-2xl overflow-hidden shadow-lg aspect-video">
                            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Content */}
                    <div className="max-w-3xl mx-auto">
                        <MarkdownRenderer text={displayContent} />

                        {/* Share */}
                        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('blog.share_article')}</p>
                            <div className="flex gap-4">
                                <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors">
                                    <Twitter size={20} />
                                </button>
                                <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-500 transition-colors">
                                    <Linkedin size={20} />
                                </button>
                                <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-900/30 dark:hover:text-blue-600 transition-colors">
                                    <Facebook size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </article>
            </main>
            <Footer />
        </div>
    );
};

export default BlogPostPage;
