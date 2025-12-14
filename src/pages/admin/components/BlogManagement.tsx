import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Loader2, Plus, Eye, PenTool, Trash2 } from 'lucide-react';
import { BlogPost } from '../../../types';
import PaginationControls from './PaginationControls';
import BlogEditor from './BlogEditor';

const BlogManagement: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState<BlogPost | undefined>(undefined);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        const postsCol = collection(db, 'blog_posts');
        const q = query(postsCol, orderBy('publishedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
            setPosts(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterDate]);

    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            const matchesSearch = (post.title || '').toLowerCase().includes(searchTerm.toLowerCase());
            let matchesDate = true;
            if (filterDate) {
                const postDate = post.publishedAt?.toDate().toISOString().split('T')[0];
                matchesDate = postDate === filterDate;
            }
            return matchesSearch && matchesDate;
        });
    }, [posts, searchTerm, filterDate]);

    const paginatedPosts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredPosts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredPosts, currentPage]);

    const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);

    const handleDelete = async (id: string) => {
        if (window.confirm('Delete this post?')) {
            await deleteDoc(doc(db, 'blog_posts', id));
        }
    };

    if (isEditorOpen) {
        return <BlogEditor post={editingPost} onSave={() => setIsEditorOpen(false)} onCancel={() => setIsEditorOpen(false)} />;
    }

    if (loading) return <Loader2 className="animate-spin mx-auto" />;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex gap-4 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search by title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full md:w-64"
                    />
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {filterDate && (
                        <button onClick={() => setFilterDate('')} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            Clear Date
                        </button>
                    )}
                </div>
                <button onClick={() => { setEditingPost(undefined); setIsEditorOpen(true); }} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-700 whitespace-nowrap">
                    <Plus size={20} /> New Post
                </button>
            </div>

            <div className="space-y-4">
                {paginatedPosts.map(post => (
                    <div key={post.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{post.title}</h3>
                            <p className="text-sm text-gray-500">{post.category} • {post.publishedAt?.toDate().toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                            <a
                                href={`#/blog/${post.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                                title="View Live Post"
                            >
                                <Eye size={18} />
                            </a>
                            <button onClick={() => { setEditingPost(post); setIsEditorOpen(true); }} className="p-2 text-gray-500 hover:text-primary-600" title="Edit"><PenTool size={18} /></button>
                            <button onClick={() => handleDelete(post.id)} className="p-2 text-gray-500 hover:text-red-600" title="Delete"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>

            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    )
}

export default BlogManagement;
