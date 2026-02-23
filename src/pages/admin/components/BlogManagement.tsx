import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../../firebase';
import { Loader2, Plus, Eye, PenTool, Trash2, Clock, Sparkles, Linkedin, Volume2, RefreshCw } from 'lucide-react';
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

    // Phase 1 State additions
    const [automationSchedule, setAutomationSchedule] = useState({
        frequency: 'Weekly',
        day: 'Monday',
        time: '5:00 AM',
        timezone: 'Central Time (US & Canada)',
        isActive: false
    });
    const [manualTopic, setManualTopic] = useState('');
    const [trendingTags, setTrendingTags] = useState<string[]>(['AI', 'Cloud Computing', 'Cybersecurity', 'Tech Careers 2026', 'AI Engineers', 'Cloud Architects', 'Continuous Learning', 'AI Integration']);
    const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '' });

    useEffect(() => {
        const postsCol = collection(db, 'blog_posts');
        const q = query(postsCol, orderBy('publishedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
            setPosts(data);
            setLoading(false);
        });

        // Load automation schedule
        const scheduleUnsubscribe = onSnapshot(doc(db, 'admin_settings', 'blog_automation'), (docSnap) => {
            if (docSnap.exists()) {
                setAutomationSchedule(docSnap.data() as any);
            }
        });

        fetchTrendingTags();

        return () => {
            unsubscribe();
            scheduleUnsubscribe();
        };
    }, []);

    const fetchTrendingTags = async () => {
        try {
            const functions = getFunctions();
            const getTags = httpsCallable(functions, 'getTrendingChips');
            const result = await getTags();
            const data = result.data as any;
            if (data?.trends?.length > 0) {
                setTrendingTags(data.trends);
            }
        } catch (error) {
            console.error("Failed to fetch trending tags:", error);
        }
    };

    const handleSaveSchedule = async () => {
        setIsSavingSchedule(true);
        try {
            const docRef = doc(db, 'admin_settings', 'blog_automation');
            await setDoc(docRef, automationSchedule, { merge: true });
            setAlertState({ isOpen: true, title: 'Success', message: 'Automation schedule saved successfully.' });
        } catch (error: any) {
            console.error('Error saving schedule:', error);
            setAlertState({ isOpen: true, title: 'Error', message: 'Failed to save automation schedule.' });
        } finally {
            setIsSavingSchedule(false);
        }
    };

    const handleGenerateDraft = async () => {
        if (!manualTopic.trim()) {
            setAlertState({ isOpen: true, title: 'Topic Required', message: 'Please enter a specific topic to research.' });
            return;
        }

        setIsGeneratingDraft(true);
        setAlertState({ isOpen: true, title: 'Deep Research Agent Deployed', message: 'Generating draft in the background. This may take up to 2 minutes...' });

        try {
            const functions = getFunctions();
            functions.region = 'us-west1';
            const generateDraft = httpsCallable(functions, 'generateManualBlogDraft');
            const result = await generateDraft({ topic: manualTopic });
            const data = result.data as any;

            if (data.success) {
                setAlertState({ isOpen: true, title: 'Success', message: `Draft generated successfully with ID: ${data.postId}` });
                setManualTopic('');
            }
        } catch (error: any) {
            console.error('Draft generation error:', error);
            setAlertState({ isOpen: true, title: 'Error', message: error.message || 'Failed to generate draft.' });
        } finally {
            setIsGeneratingDraft(false);
        }
    };

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
            {/* Automation Schedule Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="flex items-center gap-2 text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                    <Clock size={20} /> Automation Schedule (Passive Mode)
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose when the Deep Research Agent should autonomously generate new topic suggestions.</p>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Frequency</label>
                        <select
                            value={automationSchedule.frequency}
                            onChange={(e) => setAutomationSchedule({ ...automationSchedule, frequency: e.target.value })}
                            className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200"
                        >
                            <option>Daily</option>
                            <option>Weekly</option>
                            <option>Monthly</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Day</label>
                        <select
                            value={automationSchedule.day}
                            onChange={(e) => setAutomationSchedule({ ...automationSchedule, day: e.target.value })}
                            className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200"
                        >
                            <option>Monday</option>
                            <option>Tuesday</option>
                            <option>Wednesday</option>
                            <option>Thursday</option>
                            <option>Friday</option>
                            <option>Saturday</option>
                            <option>Sunday</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Time</label>
                        <select
                            value={automationSchedule.time}
                            onChange={(e) => setAutomationSchedule({ ...automationSchedule, time: e.target.value })}
                            className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200"
                        >
                            <option>5:00 AM</option>
                            <option>8:00 AM</option>
                            <option>12:00 PM</option>
                            <option>5:00 PM</option>
                        </select>
                    </div>
                    <div className="flex-2 w-full md:w-64">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Timezone</label>
                        <select
                            value={automationSchedule.timezone}
                            onChange={(e) => setAutomationSchedule({ ...automationSchedule, timezone: e.target.value })}
                            className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200"
                        >
                            <option>Central Time (US & Canada)</option>
                            <option>Eastern Time (US & Canada)</option>
                            <option>Pacific Time (US & Canada)</option>
                        </select>
                    </div>
                    <button
                        onClick={handleSaveSchedule}
                        disabled={isSavingSchedule}
                        className={`px-6 py-2 text-white rounded-lg font-bold transition-colors ${isSavingSchedule ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {isSavingSchedule ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>

            {/* Active Mode: Manual Injection Panel */}
            <div className="relative overflow-hidden bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 mb-8 border border-indigo-100 dark:border-indigo-800/50">
                {/* Simulated watermark */}
                <div className="absolute -right-8 -top-8 text-indigo-100 dark:text-indigo-800/20 opacity-50 transform rotate-12 scale-150 pointer-events-none">
                    <Sparkles size={200} strokeWidth={0.5} />
                </div>

                <div className="relative z-10">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-2">
                        <Sparkles className="text-indigo-500" size={20} /> Active Mode: Manual Injection
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">Instantly deploy the Deep Research Agent on a specific topic. The agent will research, outline, and write a full SEO-optimized draft for you.</p>

                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                placeholder="Enter a specific topic (e.g., 'The Rise of AI Agents')..."
                                value={manualTopic}
                                onChange={(e) => setManualTopic(e.target.value)}
                                className="w-full pl-5 pr-4 py-3 border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-800 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-200"
                            />
                        </div>
                        <button
                            onClick={handleGenerateDraft}
                            disabled={isGeneratingDraft}
                            className={`px-6 py-3 text-white rounded-xl font-bold transition-colors shadow-md flex items-center justify-center gap-2 whitespace-nowrap ${isGeneratingDraft ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-400 hover:bg-indigo-500'}`}
                        >
                            {isGeneratingDraft ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            {isGeneratingDraft ? 'Researching...' : 'Generate Draft Now'}
                        </button>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Trending Now</span>
                            <button onClick={fetchTrendingTags} className="text-indigo-400 hover:text-indigo-600"><RefreshCw size={12} /></button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {trendingTags.map((tag, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setManualTopic(tag)}
                                    className="px-3 py-1 bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-700 text-gray-600 dark:text-gray-300 text-sm rounded-full hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-sm"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

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
                            <p className="text-sm text-gray-500">
                                {post.category} • {post.publishedAt?.toDate().toLocaleDateString()} • <span className="font-bold text-green-600 dark:text-green-400">SEO: 85</span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => console.log('Share on LinkedIn')} className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400" title="Share on LinkedIn"><Linkedin size={18} /></button>
                            <button onClick={() => console.log('Play Audio')} className="p-2 text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400" title="Play Audio"><Volume2 size={18} /></button>
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
