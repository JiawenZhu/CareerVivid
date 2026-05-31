import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { BlogPost } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Helmet } from 'react-helmet-async';
import { generateGEOStructuredData } from '../utils/geoUtils';
import { Loader2, Calendar, User, ArrowLeft, Facebook, Twitter, Linkedin, BookOpen } from 'lucide-react';
import { navigate } from '../utils/navigation';
import ArticleAudioPlayer from '../components/blog/ArticleAudioPlayer';

const MarkdownRenderer: React.FC<{ text: string }> = ({ text = '' }) => {
    const renderContent = (content: string) => {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
            }
            parts.push({ type: 'link', text: match[1], url: match[2] });
            lastIndex = linkRegex.lastIndex;
        }
        if (lastIndex < content.length) {
            parts.push({ type: 'text', content: content.slice(lastIndex) });
        }
        if (parts.length === 0) parts.push({ type: 'text', content });

        return parts.map((part, i) => {
            if (part.type === 'link') {
                return (
                    <a
                        key={i}
                        href={part.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-black text-[#9a651f] underline decoration-[#d9c5aa] underline-offset-4 transition hover:text-[#211b16]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part.text}
                    </a>
                );
            }

            const boldParts = part.content.split(/(\*\*.*?\*\*)/g);
            return boldParts.map((bp, j) => {
                if (bp.startsWith('**') && bp.endsWith('**')) {
                    return <strong key={`${i}-${j}`} className="font-black text-[#211b16]">{bp.slice(2, -2)}</strong>;
                }
                return <span key={`${i}-${j}`}>{bp}</span>;
            });
        });
    };

    const lines = text.split('\n');
    const elements = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.trim().startsWith('### ')) {
            elements.push(<h3 key={i} className="mt-9 mb-4 text-2xl font-black tracking-tight text-[#211b16]">{renderContent(line.substring(4))}</h3>);
        } else if (line.trim().startsWith('## ')) {
            elements.push(<h2 key={i} className="mt-12 mb-5 border-b border-[#e4d3bc] pb-3 text-3xl font-black tracking-tight text-[#211b16]">{renderContent(line.substring(3))}</h2>);
        } else if (line.trim().startsWith('# ')) {
            elements.push(<h1 key={i} className="mt-12 mb-6 text-4xl font-black tracking-tight text-[#211b16]">{renderContent(line.substring(2))}</h1>);
        } else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            elements.push(
                <li key={i} className="ml-5 list-disc pl-2 text-[17px] font-medium leading-8 text-[#665a4a] marker:text-[#a97935]">
                    {renderContent(line.substring(line.indexOf(' ') + 1))}
                </li>
            );
        } else if (/^\d+\.\s/.test(line.trim())) {
            elements.push(
                <div key={i} className="mb-3 grid grid-cols-[32px_1fr] text-[17px] font-medium leading-8 text-[#665a4a]">
                    <span className="font-mono font-black text-[#a97935]">{line.match(/^\d+\./)?.[0]}</span>
                    <span>{renderContent(line.substring(line.indexOf('.') + 2))}</span>
                </div>
            );
        } else if (line.trim() === '') {
            elements.push(<div key={i} className="h-4" />);
        } else {
            elements.push(<p key={i} className="mb-5 text-[17px] font-medium leading-8 text-[#665a4a]">{renderContent(line)}</p>);
        }
    }

    return <div className="max-w-none">{elements}</div>;
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
                console.error('Error fetching post:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [postId]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f7f1e7]">
                <Loader2 className="h-10 w-10 animate-spin text-[#a97935]" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex min-h-screen flex-col bg-[#f7f1e7]">
                <PublicHeader variant="editorial" />
                <div className="flex flex-grow flex-col items-center justify-center px-4 text-center">
                    <h1 className="mb-4 text-2xl font-black text-[#211b16]">{t('blog.post_not_found')}</h1>
                    <button onClick={() => navigate('/blog')} className="font-black text-[#9a651f] hover:underline">{t('blog.back_to_blog')}</button>
                </div>
            </div>
        );
    }

    const displayContent = post.content || (post as any).body || t('blog.no_content');

    return (
        <div className="min-h-screen bg-[#f7f1e7] text-[#211b16]">
            <Helmet>
                <title>{post.title} | CareerVivid Blog</title>
                <meta name="description" content={post.excerpt || ''} />
                <meta property="og:title" content={post.title} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={`${window.location.origin}/blog/${post.id}`} />
                {post.coverImage && <meta property="og:image" content={post.coverImage} />}
                <meta property="og:description" content={post.excerpt || ''} />
                <script type="application/ld+json">
                    {JSON.stringify(generateGEOStructuredData({
                        title: post.title,
                        content: post.content,
                        coverImage: post.coverImage,
                        authorName: post.author,
                        createdAt: post.publishedAt,
                    }, post.faqs))}
                </script>
            </Helmet>
            <PublicHeader variant="editorial" />
            <main className="relative overflow-hidden pt-28">
                <div
                    className="pointer-events-none absolute inset-0 opacity-55"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, rgba(139, 90, 22, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(139, 90, 22, 0.06) 1px, transparent 1px)',
                        backgroundSize: '64px 64px',
                    }}
                />

                <article className="relative mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
                    <button
                        onClick={() => navigate('/blog')}
                        className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#e4d3bc] bg-[#fffaf1] px-4 py-2 text-sm font-black text-[#665a4a] transition hover:border-[#bfa782] hover:text-[#211b16]"
                    >
                        <ArrowLeft size={16} /> {t('blog.back_to_articles')}
                    </button>

                    <header className="grid gap-8 lg:grid-cols-[1fr_280px]">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#e4d3bc] bg-[#fffaf1] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#9a651f]">
                                <BookOpen size={14} /> {post.category || 'General'}
                            </div>
                            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-[#211b16] sm:text-5xl lg:text-6xl">
                                {post.title}
                            </h1>
                            <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold text-[#7d6e5e]">
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
                        </div>

                        <aside className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/90 p-5 shadow-sm">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a97935]">Reading Note</p>
                            <p className="mt-4 text-sm font-medium leading-7 text-[#665a4a]">
                                This article is written as a practical field note: direct context first, then concrete
                                steps a job seeker can reuse.
                            </p>
                        </aside>
                    </header>

                    <div className="mt-8">
                        <ArticleAudioPlayer articleId={post.id} />
                    </div>

                    {post.coverImage && (
                        <div className="mt-8 overflow-hidden rounded-xl border border-[#e4d3bc] bg-[#fffaf1] shadow-xl shadow-[#8b5a16]/8">
                            <img src={post.coverImage} alt={post.title} className="aspect-video h-full w-full object-cover" />
                        </div>
                    )}

                    <div className="mx-auto mt-12 max-w-3xl rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/90 p-6 shadow-sm sm:p-10">
                        <MarkdownRenderer text={displayContent} />

                        <div className="mt-14 border-t border-[#e4d3bc] pt-7">
                            <p className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-[#a97935]">{t('blog.share_article')}</p>
                            <div className="flex gap-3">
                                {[
                                    { icon: Twitter, label: 'Twitter' },
                                    { icon: Linkedin, label: 'LinkedIn' },
                                    { icon: Facebook, label: 'Facebook' },
                                ].map(({ icon: Icon, label }) => (
                                    <button
                                        key={label}
                                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4d3bc] bg-[#fffaf1] text-[#665a4a] transition hover:-translate-y-0.5 hover:border-[#bfa782] hover:text-[#211b16]"
                                        aria-label={label}
                                    >
                                        <Icon size={18} />
                                    </button>
                                ))}
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
