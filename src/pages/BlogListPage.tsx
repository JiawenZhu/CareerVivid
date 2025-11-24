
import React, { useState, useEffect } from 'react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { BlogPost } from '../types';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Calendar, ArrowRight, AlertCircle } from 'lucide-react';
import { navigate } from '../App';

const BlogListPage: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        const postsCol = collection(db, 'blog_posts');
        const q = query(postsCol);
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as BlogPost));
            
            // Robust Client-side sort
            postsData.sort((a, b) => {
                // Handle Firestore Timestamp, JS Date, string, or null/undefined
                const getTime = (date: any) => {
                    if (!date) return 0;
                    if (typeof date.toMillis === 'function') return date.toMillis();
                    if (date instanceof Date) return date.getTime();
                    return new Date(date).getTime() || 0;
                };

                const dateA = getTime(a.publishedAt);
                const dateB = getTime(b.publishedAt);
                return dateB - dateA;
            });

            setPosts(postsData);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error("Error fetching posts:", err);
            if (err.code === 'permission-denied') {
                setError("Access denied. Please check Firestore Security Rules to allow public reads on 'blog_posts'.");
            } else {
                setError("Unable to load blog posts. Please check your connection.");
            }
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, []);

    // Ensure 'All' category is always present even if posts are empty, and use Set for unique values
    const categories = ['All', ...Array.from(new Set(posts.map(p => p.category || 'General')))];
    const filteredPosts = activeCategory === 'All' ? posts : posts.filter(p => (p.category || 'General') === activeCategory);

    return (
        <div className="bg-white dark:bg-gray-950 min-h-screen flex flex-col font-sans">
            <PublicHeader />
            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Career Insights & Advice</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Expert tips on resume building, interview prep, and landing your dream job in tech and beyond.
                        </p>
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap justify-center gap-2 mb-12">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    activeCategory === cat 
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' 
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">Content Unavailable</p>
                            <p className="text-sm mt-2 max-w-md text-red-500">{error}</p>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                            No posts found. Check back soon!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredPosts.map(post => (
                                <article 
                                    key={post.id} 
                                    onClick={() => navigate(`/blog/${post.id}`)}
                                    className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1"
                                >
                                    <div className="relative aspect-video overflow-hidden bg-gray-200 dark:bg-gray-800">
                                        {post.coverImage ? (
                                            <img 
                                                src={post.coverImage} 
                                                alt={post.title} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                        )}
                                        <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-900 dark:text-white">
                                            {post.category || 'General'}
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                                            <Calendar size={14} />
                                            {post.publishedAt?.toDate 
                                                ? post.publishedAt.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                                                : 'Recently'}
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                            {post.title || 'Untitled Post'}
                                        </h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-6 flex-grow">
                                            {post.excerpt || (post as any).summary || 'No summary available.'}
                                        </p>
                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <div className="text-xs font-medium text-gray-900 dark:text-white">
                                                By {post.author || 'Team'}
                                            </div>
                                            <div className="text-primary-600 dark:text-primary-400 text-sm font-semibold flex items-center gap-1">
                                                Read More <ArrowRight size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default BlogListPage;
