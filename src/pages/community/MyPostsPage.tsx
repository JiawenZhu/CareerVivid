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
            <div className="cv-design-page cv-design-grid relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
                <div className="max-w-screen-2xl mx-auto relative z-10">
                    <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="cv-design-title text-3xl">My Posts</h1>
                            <p className="cv-design-body mt-2 text-lg">Manage your published community articles.</p>
                        </div>
                        <button
                            onClick={() => navigate('/community/new')}
                            className="cv-design-button-primary rounded-xl px-6 py-2.5 text-sm"
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
                        <div className="cv-design-card flex flex-col items-center rounded-[24px] p-12 text-center">
                            <div className="cv-design-icon-well mb-6 flex h-20 w-20 items-center justify-center rounded-full">
                                <PenTool className="w-10 h-10" />
                            </div>
                            <h3 className="cv-design-title mb-2 text-xl">No Posts Yet</h3>
                            <p className="cv-design-body mb-8 max-w-sm">
                                You haven't written any community posts yet. Share your experience and knowledge with others!
                            </p>
                            <button
                                onClick={() => navigate('/community/new')}
                                className="cv-design-button-primary rounded-xl px-6 py-2.5 text-sm"
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
