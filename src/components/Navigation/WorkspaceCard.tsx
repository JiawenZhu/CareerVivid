import React, { useRef, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { SidebarNode } from '../../types';
import { getIconForNode } from '../../utils/workspaceIcons';
import { SidebarContextMenu } from './SidebarContextMenu';
import { createPortal } from 'react-dom';
import ConfirmationModal from '../ConfirmationModal';
import MoveToModal from './MoveToModal';
import { navigate } from '../../utils/navigation';
import { getPathForNodeId } from '../../utils/workspaceNavigation';
import { useWorkspaceItemActions } from '../../hooks/useWorkspaceItemActions';

interface WorkspaceCardProps {
    node: SidebarNode;
    isSystem?: boolean;
}

const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ node, isSystem = false }) => {
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
    } = useWorkspaceItemActions(node.id.toString(), node.text);

    const [contextMenu, setContextMenu] = React.useState<{ x: number, y: number } | null>(null);
    const [editValue, setEditValue] = React.useState(node.text);
    const inputRef = useRef<HTMLInputElement>(null);

    const [{ isDragging }, drag] = useDrag({
        type: '@@TreeItem@@',
        item: { id: node.id },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleClick = () => {
        if (isEditing) return;
        navigate(getPathForNodeId(node.id, node.data?.type));
    };

    const onRenameLocal = () => {
        handleRename(editValue);
    };

    return (
        <div
            ref={drag}
            onContextMenu={handleContextMenu}
            onClick={handleClick}
            className={`group flex flex-col items-center p-4 rounded-2xl hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none transition-all cursor-pointer text-center relative
                ${isDragging ? 'opacity-40 grayscale blur-[1px]' : 'opacity-100'}
            `}
        >
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                <div className="text-indigo-500">
                    {getIconForNode(node.id, node.data?.type || 'system', 32)}
                </div>
            </div>

            {isEditing ? (
                <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={onRenameLocal}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onRenameLocal();
                        if (e.key === 'Escape') {
                            setEditValue(node.text);
                            setIsEditing(false);
                        }
                    }}
                    className="text-xs font-semibold bg-white dark:bg-gray-700 border border-indigo-500 rounded px-1 py-0.5 w-full text-center outline-none ring-2 ring-indigo-500/20"
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white truncate w-full px-2" title={node.text}>
                    {node.text}
                </span>
            )}

            {/* Context Menu */}
            {contextMenu && createPortal(
                <SidebarContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    nodeTitle={node.text}
                    onClose={() => setContextMenu(null)}
                    onRename={() => {
                        setIsEditing(true);
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
                    onNewSubfolder={node.droppable ? () => {
                        // handle subfolder creation logic if needed
                        setContextMenu(null);
                    } : undefined}
                />,
                document.body
            )}

            {/* Modals */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title={node.droppable ? 'Delete Folder' : 'Delete Item'}
                message={node.droppable
                    ? `Delete folder "${node.text}" and all its contents? This action cannot be undone.`
                    : `Are you sure you want to delete "${node.text}"?`
                }
                confirmText="Delete"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
            />

            <MoveToModal
                isOpen={isMoveModalOpen}
                currentNodeId={node.id.toString()}
                currentNodeText={node.text}
                nodes={nodes}
                onClose={() => setIsMoveModalOpen(false)}
                onSelect={(targetId) => {
                    confirmMove(targetId);
                }}
            />
        </div>
    );
};

export default WorkspaceCard;
