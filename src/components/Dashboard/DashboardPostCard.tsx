import React from 'react';
import { Edit3, Trash2, Eye, MessageSquare, Heart } from 'lucide-react';
import { CommunityPost } from '../../hooks/useCommunity';
import { navigate } from '../../utils/navigation';
import { useState } from 'react';
import { useWorkspaceItemActions } from '../../hooks/useWorkspaceItemActions';
import { SidebarContextMenu } from '../Navigation/SidebarContextMenu';
import { createPortal } from 'react-dom';
import ConfirmationModal from '../ConfirmationModal';
import MoveToModal from '../Navigation/MoveToModal';

interface DashboardPostCardProps {
    post: CommunityPost;
    onDelete: (id: string, coverImage?: string) => void;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
}

const DashboardPostCard: React.FC<DashboardPostCardProps> = ({ post, onDelete, onDragStart }) => {
    const {
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        isMoveModalOpen,
        setIsMoveModalOpen,
        isEditing,
        setIsEditing,
        handleRename,
        handleDelete,
        confirmDelete,
        onMove,
        confirmMove,
        nodes
    } = useWorkspaceItemActions(`post-${post.id}`, post.title);

    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    return (
        <div
            draggable={!!onDragStart}
            onDragStart={onDragStart}
            onContextMenu={handleContextMenu}
            className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] border border-white/50 dark:border-gray-800/50 transition-all duration-300 hover:border-primary-500/30 dark:hover:border-primary-400/30 hover:shadow-lg flex flex-col cursor-grab active:cursor-grabbing overflow-hidden group h-full relative"
        >
            <div
                onClick={() => navigate(`/community/post/${post.id}`, { from: window.location.pathname })}
                className="block border-b border-gray-100 dark:border-gray-800/60 group-hover:bg-gray-50/50 dark:group-hover:bg-[#1a2029] transition-colors flex-grow cursor-pointer"
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

            <div className="p-2.5 flex justify-end gap-1.5 items-center bg-gray-50/50 dark:bg-[#10141a]">
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/community/edit/${post.id}`, { from: window.location.pathname }); }}
                    title="Edit Post"
                    className="p-2 block rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                    <Edit3 size={16} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                    title="Delete Post"
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Context Menu */}
            {contextMenu && createPortal(
                <SidebarContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    nodeTitle={post.title}
                    onClose={() => setContextMenu(null)}
                    onRename={() => {
                        navigate(`/community/edit/${post.id}`, { from: window.location.pathname });
                        setContextMenu(null);
                    }}
                    onDelete={() => {
                        handleDelete();
                        setContextMenu(null);
                    }}
                    onMove={() => {
                        onMove();
                        setContextMenu(null);
                    }}
                />,
                document.body
            )}

            {/* Modals */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Delete Post"
                message={`Are you sure you want to delete "${post.title}"? This will remove it from the community feed.`}
                confirmText="Delete"
                variant="danger"
                onConfirm={() => {
                    confirmDelete();
                    onDelete(post.id, post.coverImage);
                }}
                onCancel={() => setIsDeleteModalOpen(false)}
            />

            <MoveToModal
                isOpen={isMoveModalOpen}
                currentNodeId={`post-${post.id}`}
                currentNodeText={post.title}
                nodes={nodes}
                onClose={() => setIsMoveModalOpen(false)}
                onSelect={(targetId) => {
                    confirmMove(targetId);
                }}
            />
        </div>
    );
};

export default DashboardPostCard;
