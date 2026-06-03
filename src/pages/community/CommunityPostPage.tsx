import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { navigate } from '../../utils/navigation';
import { formatDistanceToNow } from 'date-fns';
import { enUS, es, fr, de, zhCN } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Heart, MessageSquare, BookOpen, Loader2, Send, Linkedin, Edit, Trash2, MoreVertical, X, Check, PenTool, Globe, FileText, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { CommunityPost, useCommunity, useCommunityFeed } from '../../hooks/useCommunity';
import CommentSection from '../../components/Community/CommentSection';
import { generateGEOStructuredData } from '../../utils/geoUtils';
import UserProfileSnippet from '../../components/Community/UserProfileSnippet';
import mermaid from 'mermaid';
import ResumePreview from '../../components/ResumePreview';
import { TEMPLATES } from '../../features/portfolio/templates';
import LinkTreeVisual from '../../features/portfolio/templates/linkinbio/LinkTreeVisual';
import { getTheme } from '../../features/portfolio/styles/themes';

const localeMap: Record<string, any> = {
    en: enUS,
    es,
    fr,
    de,
    zh: zhCN,
};

// ── Mermaid Diagram Renderer ──────────────────────────────────────────────────
const MermaidDiagram: React.FC<{ chart: string }> = ({ chart }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const renderChart = async () => {
            if (!containerRef.current || !chart) return;

            try {
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'dark',
                    securityLevel: 'loose',
                    fontFamily: 'Inter, sans-serif'
                });

                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
                setError(null);
            } catch (err) {
                console.error('Mermaid render error:', err);
                setError('Could not render diagram');
            }
        };

        renderChart();
    }, [chart]);

        if (error) {
        return (
            <div className="p-8 bg-rose-50/60 dark:bg-rose-950/20 backdrop-blur-md rounded-[24px] border border-rose-200/50 dark:border-rose-800/50 text-center">
                <AlertTriangle className="mx-auto text-rose-500 mb-2" />
                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
                <pre className="mt-4 p-4 bg-black/10 rounded text-xs text-left overflow-auto max-h-40 font-mono text-gray-500">
                    {chart}
                </pre>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef} 
            className="w-full overflow-x-auto flex justify-center py-8 bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] border border-white/50 dark:border-gray-800/50 shadow-sm"
            dangerouslySetInnerHTML={{ __html: svg }} 
        />
    );
};

// ── Asset Preview Components ───────────────────────────────────────────
const ResumePostView: React.FC<{ data: any, scale: number }> = ({ data, scale }) => {
    return (
        <div className="w-full flex justify-center py-10 bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] border border-white/50 dark:border-gray-800/50 shadow-sm overflow-hidden relative">
            <div
                style={{
                    width: '824px',
                    height: '1165px',
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
            >
                <ResumePreview resume={data} template={data.templateId} />
            </div>
        </div>
    );
};

const PortfolioPostView: React.FC<{ data: any, scale: number }> = ({ data, scale }) => {
    const isBioLink = data.mode === 'linkinbio';
    const originalWidth = isBioLink ? 430 : 1200;
    const originalHeight = isBioLink ? 932 : 800;
    
    const CurrentTemplate = TEMPLATES[data.templateId as keyof typeof TEMPLATES] || TEMPLATES.minimalist;
    const bioLinkTheme = isBioLink && data.linkInBio?.themeId ? getTheme(data.linkInBio.themeId) : undefined;

    return (
        <div className="w-full flex justify-center py-10 bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] border border-white/50 dark:border-gray-800/50 shadow-sm overflow-hidden relative">
            <div
                style={{
                    width: `${originalWidth}px`,
                    height: `${originalHeight}px`,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
            >
                {isBioLink && data.linkInBio && bioLinkTheme ? (
                    <LinkTreeVisual data={data} />
                ) : (
                    <CurrentTemplate data={data} />
                )}
            </div>
        </div>
    );
};

// ── Post Content Renderer ────────────────────────────────────────────
const PostContent: React.FC<{ post: any }> = ({ post }) => {
    const [scale, setScale] = useState(0.8);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const calculateScale = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                let baseWidth = 824; 
                if (post.type === 'portfolio' && post.portfolioData) {
                    baseWidth = post.portfolioData.mode === 'linkinbio' ? 430 : 1200;
                }
                const padding = window.innerWidth < 768 ? 32 : 80;
                const availableWidth = containerWidth - padding;
                if (availableWidth < baseWidth) {
                    setScale(availableWidth / baseWidth);
                } else {
                    setScale(post.type === 'portfolio' && post.portfolioData?.mode !== 'linkinbio' ? 0.7 : 0.9);
                }
            }
        };
        calculateScale();
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, [post.type, post.portfolioData]);

    if (post.type === 'whiteboard') {
        if (post.dataFormat === 'mermaid') {
            return <MermaidDiagram chart={post.content} />;
        }
        const whiteboard = post.whiteboardData;
        const svgContent = whiteboard?.thumbnailSvg || post.assetThumbnail;
        if (svgContent?.startsWith('<svg')) {
            return (
                <div className="w-full bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] border border-white/50 dark:border-gray-800/50 p-4 md:p-8 flex items-center justify-center overflow-auto shadow-sm">
                    <div 
                        className="[&_svg]:max-w-full [&_svg]:h-auto flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: svgContent }} 
                    />
                </div>
            );
        }
    }

    if (post.type === 'resume' && post.resumeData) {
        return (
            <div ref={containerRef} className="w-full">
                <ResumePostView data={post.resumeData} scale={scale} />
            </div>
        );
    }
    if (post.type === 'portfolio' && post.portfolioData) {
        return (
            <div ref={containerRef} className="w-full">
                <PortfolioPostView data={post.portfolioData} scale={scale} />
            </div>
        );
    }

    return (
        <div className="prose prose-lg max-w-none prose-headings:font-black prose-headings:text-[#211b16] prose-p:text-[#5f5548] prose-a:text-[#9a651f] prose-strong:text-[#211b16] prose-img:rounded-3xl prose-pre:rounded-2xl prose-pre:border-0 dark:prose-invert dark:prose-headings:text-[#f4f1e9] dark:prose-p:text-[#aaa39a] dark:prose-a:text-[#caa26c] dark:prose-strong:text-[#f4f1e9]">
            <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const content = String(children).replace(/\n$/, '');

                        if (!inline && language === 'mermaid') {
                            return (
                                <div className="my-8">
                                    <MermaidDiagram chart={content} />
                                </div>
                            );
                        }

                        if (!inline && language) {
                            return (
                                <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 my-6 shadow-sm">
                                    <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={language}
                                        PreTag="div"
                                        className="!m-0 !p-6"
                                        {...props}
                                    >
                                        {content}
                                    </SyntaxHighlighter>
                                </div>
                            );
                        }

                        return (
                            <code 
                                className={`${className} bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md text-sm font-mono`} 
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {post.content}
            </ReactMarkdown>
        </div>
    );
};

const COLLECTION = 'community_posts';

const CommunityPostPage: React.FC = () => {
    const pathParts = window.location.pathname.split('/');
    const postId = pathParts[3] ?? '';

    const { currentUser } = useAuth();
    const { toggleLike } = useCommunity();
    const { posts: allPosts } = useCommunityFeed();

    const [post, setPost] = useState<CommunityPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    // Check if user already liked this post
    useEffect(() => {
        if (!currentUser || !postId) return;
        const likeId = `${postId}_${currentUser.uid}`;
        getDoc(doc(db, 'community_post_likes', likeId)).then(snap => {
            if (snap.exists()) setIsLiked(true);
        }).catch(() => { });
    }, [currentUser, postId]);

    useEffect(() => {
        if (window.location.hash === '#comments') {
            setTimeout(() => {
                document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        }
    }, [loading]);

    useEffect(() => {
        if (!postId) {
            setError('Post not found.');
            setLoading(false);
            return;
        }

        const docRef = doc(db, COLLECTION, postId);
        const unsub = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                const data = { id: snap.id, ...snap.data() } as CommunityPost;
                setPost(data);
                setLikesCount(data.metrics?.likes ?? 0);
            } else {
                setError('This post does not exist or has been removed.');
            }
            setLoading(false);
        }, (err) => {
            console.error('[CommunityPostPage] onSnapshot error:', err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsub();
    }, [postId]);

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!currentUser) { navigate('/signin'); return; }
        const next = !isLiked;
        setIsLiked(next);
        setLikesCount(prev => next ? prev + 1 : prev - 1);
        try {
            await toggleLike(postId);
        } catch {
            setIsLiked(!next);
            setLikesCount(post?.metrics?.likes ?? 0);
        }
    };

    if (loading) {
        return (
            <div className="cv-warm-page cv-warm-grid flex items-center justify-center relative overflow-hidden">
                <Loader2 size={32} className="animate-spin text-primary-500 relative z-10" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="cv-warm-page cv-warm-grid flex flex-col items-center justify-center gap-4 relative overflow-hidden text-center px-4">
                <div className="relative z-10 flex flex-col items-center justify-center gap-4">
                    <p className="text-5xl">😕</p>
                <h1 className="cv-warm-heading text-2xl">Post Not Found</h1>
                <p className="cv-warm-body max-w-sm">{error ?? 'This article may have been removed or the link is incorrect.'}</p>
                <button
                    onClick={() => navigate('/community')}
                    className="mt-2 cursor-pointer rounded-xl bg-[#211b16] px-6 py-2.5 font-bold text-white transition-colors hover:bg-[#3a2b20] dark:bg-[#f4f1e9] dark:text-[#1f1f1d]"
                >
                    Back to Community
                </button>
                </div>
            </div>
        );
    }

    const formattedDate = post.createdAt?.toDate
        ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })
        : 'Recently';

    const shareUrl = `https://careervivid.app/community/post/${postId}`;
    const seoDescription = post.content?.replace(/[#_*`[\]]/g, '').replace(/\s+/g, ' ').trim().substring(0, 155)
        || 'Read this article on CareerVivid Community.';
    const robots = post.isPublic === false ? 'noindex, nofollow' : 'index, follow';

    return (
        <div className="cv-warm-page cv-warm-grid relative overflow-hidden">
            <div className="relative z-10">
                <Helmet>
                <title>{post.title} | CareerVivid Community</title>
                <meta name="description" content={seoDescription} />
                <meta name="robots" content={robots} />
                <link rel="canonical" href={shareUrl} />
                <meta property="og:title" content={post.title} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={shareUrl} />
                {post.coverImage && <meta property="og:image" content={post.coverImage} />}
                <meta property="og:description" content={seoDescription} />
                <script type="application/ld+json">
                    {JSON.stringify(generateGEOStructuredData({
                        title: post.title,
                        content: post.content,
                        coverImage: post.coverImage,
                        authorName: post.authorName,
                        authorAvatar: post.authorAvatar,
                        createdAt: post.createdAt,
                        updatedAt: post.updatedAt
                    }, post.faqs))}
                </script>
            </Helmet>
            {/* Top nav */}
            <div className="sticky top-0 z-20 border-b border-[#e4d3bc] bg-[#f7f1e7]/90 backdrop-blur-md dark:border-[#33312d] dark:bg-[#1f1f1d]/92">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={() => navigate(window.history.state?.from || '/community')}
                        className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#665a4a] transition-colors hover:text-[#211b16] dark:text-[#aaa39a] dark:hover:text-[#f4f1e9]"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>
            </div>

            <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
                {/* Cover image */}
                {post.coverImage && (
                    <div className="w-full aspect-video overflow-hidden rounded-xl mb-8 shadow-lg">
                        <img src={post.coverImage} alt={post.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    </div>
                )}

                {/* Title */}
                <h1 className="cv-warm-heading mb-6 text-4xl leading-tight">
                    {post.title}
                </h1>

                {/* Author row */}
                <div className="mb-8 border-b border-[#e4d3bc] pb-8 dark:border-[#37332d]">
                    <UserProfileSnippet
                        userId={post.authorId}
                        fallbackName={post.authorName}
                        fallbackAvatar={post.authorAvatar}
                        fallbackRole={post.authorRole}
                        timestamp={formattedDate}
                    />
                </div>

                {/* Tags */}
                {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        {post.tags.map(tag => (
                            <span key={tag} className="cursor-pointer text-sm font-semibold text-[#9a651f] transition-colors hover:text-[#211b16] dark:text-[#caa26c] dark:hover:text-[#f4f1e9]">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className="mb-12 md:mb-16">
                    <PostContent post={post} />
                </div>

                {/* Like / action buttons */}
                <div className="mb-12 flex flex-wrap items-center gap-3 border-t border-[#e4d3bc] pt-6 dark:border-[#37332d]">
                    <button
                        onClick={handleLike}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition-all ${isLiked ? 'border border-[#f3bfcd] bg-[#fff0f5] text-[#7f1d3b] dark:border-[#6f3246] dark:bg-[#351f28] dark:text-[#f2a6b3]' : 'border border-[#e4d3bc] bg-[#fffaf1]/70 text-[#665a4a] backdrop-blur-xl hover:bg-[#fffaf1] dark:border-[#37332d] dark:bg-[#262522]/80 dark:text-[#aaa39a] dark:hover:bg-[#302e2a]'}`}
                    >
                        <Heart size={18} className={isLiked ? 'fill-current' : ''} />
                        {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
                    </button>
                    <a href="#comments" className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/70 px-4 py-2 text-sm font-bold text-[#665a4a] shadow-sm backdrop-blur-xl transition-all hover:bg-[#fffaf1] dark:border-[#37332d] dark:bg-[#262522]/80 dark:text-[#aaa39a] dark:hover:bg-[#302e2a]">
                        <MessageSquare size={18} />
                        {post.metrics?.comments || 0} Comments
                    </a>

                    <button
                        onClick={() => {
                            const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-[#0a66c2] hover:bg-[#0a66c2]/90 text-white transition-all cursor-pointer ml-auto shadow-sm"
                    >
                        <Linkedin size={18} />
                        Share to LinkedIn
                    </button>
                </div>

                {/* Discussion Section */}
                <div id="comments" className="scroll-mt-24">
                  <CommentSection postId={postId} />
                </div>
            </article>
            </div>
        </div>
    );
};

export default CommunityPostPage;
