import React from 'react';
import { Edit3, Trash2, Eye, MessageSquare, Heart } from 'lucide-react';
import { CommunityPost } from '../../hooks/useCommunity';
import { navigate } from '../../utils/navigation';

interface DashboardPostCardProps {
    post: CommunityPost;
    onDelete: (id: string, coverImage?: string) => void;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
}

const DashboardPostCard: React.FC<DashboardPostCardProps> = ({ post, onDelete, onDragStart }) => {
    return (
        <div
            draggable={!!onDragStart}
            onDragStart={onDragStart}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 flex flex-col cursor-grab active:cursor-grabbing transform hover:-translate-y-1 h-full"
        >
            <div
                onClick={() => navigate(`/community/post/${post.id}`)}
                className="block border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40 flex-grow cursor-pointer rounded-t-xl overflow-hidden"
            >
                {post.coverImage ? (
                    <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700">
                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center p-4">
                        <h4 className="font-bold text-center text-indigo-800 dark:text-indigo-200 opacity-60 line-clamp-3 text-lg">{post.title}</h4>
                    </div>
                )}

                <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 line-clamp-2 mb-2" title={post.title}>
                        {post.title}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Heart size={14} /> {post.metrics?.likes || 0}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={14} /> {post.metrics?.comments || 0}</span>
                        <span className="flex items-center gap-1"><Eye size={14} /> {post.metrics?.views || 0}</span>
                    </div>

                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 truncate">
                        {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : new Date(post.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="p-2 flex gap-1 items-center bg-gray-50 dark:bg-gray-800/50 rounded-b-xl border-t border-gray-100 dark:border-gray-700">
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/community/edit/${post.id}`); }}
                    title="Edit Post"
                    className="p-2 block rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                >
                    <Edit3 size={16} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(post.id, post.coverImage); }}
                    title="Delete Post"
                    className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default DashboardPostCard;
