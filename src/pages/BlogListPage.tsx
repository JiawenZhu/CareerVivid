import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { BlogPost } from '../types';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Calendar, ArrowRight, AlertCircle, Clock, BookOpen, PenLine } from 'lucide-react';
import { navigate } from '../utils/navigation';

const BlogListPage: React.FC = () => {
    const { t } = useTranslation();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        const postsCol = collection(db, 'blog_posts');
        const q = query(postsCol, orderBy('publishedAt', 'desc'), limit(50));

        getDocs(q)
            .then((snapshot) => {
                const postsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as BlogPost));
                setPosts(postsData);
                setLoading(false);
                setError(null);
            })
            .catch((err) => {
                console.error('Error fetching posts:', err);
                if (err.code === 'permission-denied') {
                    setError("Access denied. Please check Firestore Security Rules to allow public reads on 'blog_posts'.");
                } else {
                    setError('Unable to load blog posts. Please check your connection.');
                }
                setLoading(false);
            });
    }, []);

    const categories = ['All', ...Array.from(new Set(posts.map(p => p.category || 'General')))];
    const filteredPosts = activeCategory === 'All' ? posts : posts.filter(p => (p.category || 'General') === activeCategory);

    return (
        <div className="min-h-screen bg-[#f7f1e7] text-[#211b16]">
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

                <section className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#bcdcc9] bg-[#f7fff8] px-4 py-2 text-sm font-black text-[#137245]">
                            <BookOpen size={16} /> CareerVivid Field Notes
                        </div>
                        <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[0.98] tracking-tight text-[#211b16] sm:text-6xl">
                            Practical notes for a clearer job search.
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-[#665a4a]">
                            The blog should feel like a trusted operating manual: direct, useful, and grounded in
                            the actual work of resumes, interviews, applications, and career systems.
                        </p>
                    </div>

                    <aside className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/90 p-6 shadow-xl shadow-[#8b5a16]/8">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a97935]">Editorial Snapshot</p>
                        <p className="mt-5 text-[15px] font-medium leading-8 text-[#665a4a]">
                            Each article is part research note, part product guide. The goal is not to sound bigger
                            than the product is; the goal is to help job seekers make one better decision at a time.
                        </p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            {['Resume proof', 'Interview prep', 'Application workflow', 'Career systems'].map((item) => (
                                <div key={item} className="rounded-lg border border-[#eadbc5] bg-white/60 px-4 py-3 text-sm font-black text-[#211b16]">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </aside>
                </section>

                <section className="relative border-y border-[#e4d3bc] bg-[#fffaf1]/70 py-5">
                    <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-4 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-black transition-all ${activeCategory === cat
                                    ? 'border-[#211b16] bg-[#211b16] text-white shadow-md shadow-[#8b5a16]/10'
                                    : 'border-[#e4d3bc] bg-[#fffaf1] text-[#665a4a] hover:-translate-y-0.5 hover:border-[#bfa782] hover:text-[#211b16]'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-[#a97935]" />
                        </div>
                    ) : error ? (
                        <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 py-14 text-center">
                            <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
                            <p className="text-lg font-black text-[#211b16]">Content Unavailable</p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-red-600">{error}</p>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1] py-20 text-center font-semibold text-[#665a4a]">
                            {t('blog.no_posts_found')}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                            {filteredPosts.map(post => (
                                <article
                                    key={post.id}
                                    onClick={() => navigate(`/blog/${post.id}`)}
                                    className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-[#e4d3bc] bg-[#fffaf1] shadow-sm shadow-[#8b5a16]/5 transition-all duration-300 hover:-translate-y-1 hover:border-[#bfa782] hover:shadow-xl hover:shadow-[#8b5a16]/10"
                                >
                                    <div className="relative aspect-[16/10] overflow-hidden bg-[#eadbc5]">
                                        {post.coverImage ? (
                                            <img
                                                src={post.coverImage}
                                                alt={post.title}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-[#a97935]">
                                                <PenLine size={34} />
                                            </div>
                                        )}
                                        <div className="absolute left-4 top-4 rounded-full border border-[#e4d3bc] bg-[#fffaf1]/95 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#9a651f] backdrop-blur">
                                            {post.category || 'General'}
                                        </div>
                                    </div>
                                    <div className="flex flex-grow flex-col p-6">
                                        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-[#7d6e5e]">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar size={14} />
                                                {post.publishedAt?.toDate
                                                    ? post.publishedAt.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                                    : t('blog.recently')}
                                            </span>
                                            {post.readTime && (
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={14} />
                                                    {post.readTime} {t('blog.min_read')}
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="mb-3 line-clamp-2 text-2xl font-black leading-tight tracking-tight text-[#211b16] transition-colors group-hover:text-[#9a651f]">
                                            {post.title || t('blog.untitled_post')}
                                        </h2>
                                        <p className="mb-5 line-clamp-3 flex-grow text-[15px] font-medium leading-7 text-[#665a4a]">
                                            {post.excerpt || (post as any).summary || t('blog.no_summary_available')}
                                        </p>
                                        <div className="mt-auto flex items-center justify-between border-t border-[#eadbc5] pt-4">
                                            <div className="text-xs font-black uppercase tracking-[0.12em] text-[#a97935]">
                                                {post.author || t('blog.team')}
                                            </div>
                                            <div className="flex items-center gap-1 text-sm font-black text-[#211b16]">
                                                {t('blog.read_more')} <ArrowRight size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default BlogListPage;
