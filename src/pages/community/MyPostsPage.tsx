import React, { useState } from 'react';
import AppLayout from '../../components/Layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useMyCommunityPosts } from '../../hooks/useMyCommunityPosts';
import DashboardPostCard from '../../components/Dashboard/DashboardPostCard';
import { navigate } from '../../utils/navigation';
import { Loader2, Plus, PenTool } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useTranslation } from 'react-i18next';

const MyPostsPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { posts, isLoading, error, deletePost } = useMyCommunityPosts();
    const { t } = useTranslation();

    const [deleteModal, setDeleteModal] = useState({ isOpen: false, postId: '', coverImage: '' });

    if (!currentUser) return null;

    const handleDeleteClick = (postId: string, coverImage?: string) => {
        setDeleteModal({ isOpen: true, postId, coverImage: coverImage || '' });
    };

    const confirmDelete = async () => {
        try {
            await deletePost(deleteModal.postId, deleteModal.coverImage);
        } catch (err) {
            console.error('Failed to delete post:', err);
        } finally {
            setDeleteModal({ isOpen: false, postId: '', coverImage: '' });
        }
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">My Posts</h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-400 text-lg">Manage your published community articles.</p>
                        </div>
                        <button
                            onClick={() => navigate('/community/new')}
                            className="bg-primary-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-primary-700 hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Create New Post
                        </button>
                    </header>

                    {error && (
                        <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-800">
                            {error}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-6">
                                <PenTool className="w-10 h-10 text-primary-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Posts Yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
                                You haven't written any community posts yet. Share your experience and knowledge with others!
                            </p>
                            <button
                                onClick={() => navigate('/community/new')}
                                className="bg-primary-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-primary-700 transition flex items-center gap-2"
                            >
                                <Plus size={20} /> Start Writing
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {posts.map(post => (
                                <DashboardPostCard
                                    key={post.id}
                                    post={post}
                                    onDelete={handleDeleteClick}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                title="Delete Post"
                message="Are you sure you want to delete this post? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, postId: '', coverImage: '' })}
                confirmText={t('dashboard.delete', 'Delete')}
            />
        </AppLayout>
    );
};

export default MyPostsPage;
