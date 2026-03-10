import React, { useState, useEffect, useRef } from 'react';
import { navigate } from '../../utils/navigation';
import { getPathForNodeId } from '../../utils/workspaceNavigation';
import { NodeModel } from '@minoru/react-dnd-treeview';
import { Eye, EyeOff, Folder, FolderOpen, File, GripVertical, FileText, Mic, LayoutDashboard, Globe, Briefcase, PenTool, ChevronRight, MoreVertical } from 'lucide-react';
import { useSidebarStore } from '../../store/useSidebarStore';
import { SidebarNode } from '../../types';
import { SidebarContextMenu } from './SidebarContextMenu';
import { createPortal } from 'react-dom';
import ConfirmationModal from '../ConfirmationModal';
import MoveToModal from './MoveToModal';

interface Props {
    node: NodeModel<SidebarNode['data']>;
    depth: number;
    isOpen: boolean;
    onToggle: (id: string | number) => void;
    isEditMode?: boolean;
}

// Helper to get system icons based on the ID or icon string
const getIcon = (id: string, isOpen: boolean, type: string) => {
    if (type === 'custom-folder') {
        return isOpen ? <FolderOpen size={18} /> : <Folder size={18} />;
    }

    switch (id) {
        case '/dashboard':
            return <LayoutDashboard size={18} />;
        case '/my-posts':
            return <FileText size={18} />;
        case '/newresume':
            return <FileText size={18} />;
        case '/portfolio':
            return <Globe size={18} />;
        case '/whiteboard':
            return <PenTool size={18} />;
        case '/interview-studio':
            return <Mic size={18} />;
        case '/job-tracker':
            return <Briefcase size={18} />;
        default:
            return <File size={18} />;
    }
};

export const CustomSidebarNode: React.FC<Props> = ({ node, depth, isOpen, onToggle, isEditMode = false }) => {
    const { toggleNodeVisibility, updateNodeTitle, activeNodeId, setActiveNode, deleteNode, addNode, moveNode, nodes } = useSidebarStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(node.text);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { isSystemNode, type, isHidden, isCreationLink } = node.data!;

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isEditing) {
            if (e.key === 'Enter') {
                submitRename();
            } else if (e.key === 'Escape') {
                setIsEditing(false);
                setEditValue(node.text);
            }
        } else if (isEditMode) {
            if (e.key === 'Enter' || e.key === 'F2') {
                e.preventDefault();
                setIsEditing(true);
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                handleDelete();
            }
        }
    };

    const handleDelete = () => {
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        deleteNode(node.id.toString());
        setIsDeleteModalOpen(false);
    };

    const handleNewSubfolder = () => {
        const newId = `folder-${Date.now()}`;
        addNode({
            id: newId,
            parent: node.id as string | 0,
            text: 'New Subfolder',
            droppable: true,
            data: {
                isSystemNode: false,
                type: 'custom-folder',
                isHidden: false
            }
        });
        // Optionally toggle open if it's not
        if (!isOpen) onToggle(node.id);
    };

    const submitRename = () => {
        if (editValue.trim() !== '') {
            updateNodeTitle(node.id.toString(), editValue.trim());
        }
        setIsEditing(false);
    };

    return (
        <div
            className={`relative items-center group py-2 pr-2 rounded-lg transition-colors
        ${isCreationLink ? 'hidden md:flex' : 'flex'}
        ${isHidden && !isEditMode ? 'hidden' : ''}
        ${isHidden && isEditMode ? 'opacity-40' : 'opacity-100'}
        ${isEditMode ? 'bg-white dark:bg-gray-900 border-transparent hover:border-gray-200 dark:hover:border-gray-700 border' : 'hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'}
        ${activeNodeId === node.id.toString() && !isEditMode ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold' : ''}
      `}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            tabIndex={isEditMode ? 0 : -1}
            onKeyDown={handleKeyDown}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({ x: e.clientX, y: e.clientY });
            }}
            onDoubleClick={(e) => {
                if (!isEditMode) return;
                e.stopPropagation();
                setIsEditing(true);
            }}
            onClick={(e) => {
                e.stopPropagation();
                if (!isEditMode) {
                    setActiveNode(node.id.toString());
                    navigate(getPathForNodeId(node.id, type));
                }
            }}
            data-testid={`node-${node.id}`}
        >
            {/* Drag Handle (Only in Edit Mode) */}
            {
                isEditMode && (
                    <div className="cursor-grab text-gray-400 hover:text-gray-600 px-1 -ml-2" onClick={(e) => e.stopPropagation()}>
                        <GripVertical size={16} />
                    </div>
                )
            }

            {/* Expand/Collapse Chevron (for folders) */}
            {
                type === 'custom-folder' ? (
                    <div
                        className="mr-1 flex items-center justify-center w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle(node.id);
                        }}
                        data-testid={`chevron-${node.id}`}
                    >
                        <ChevronRight size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                ) : (
                    <div className="mr-1 w-5" /> // Spacer to align items seamlessly
                )
            }

            {/* Content Icon */}
            <div className={`mr-2 flex items-center justify-center w-5 ${activeNodeId === node.id.toString() && !isEditMode ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'} transition-colors`}>
                {getIcon(node.id.toString(), isOpen, type)}
            </div>

            {/* Inline Renaming Input vs Text */}
            {
                isEditing ? (
                    <input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={submitRename}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-white dark:bg-gray-800 border border-indigo-500 rounded px-2 py-0.5 outline-none text-sm font-medium text-gray-900 dark:text-gray-100"
                        data-testid={`rename-input-${node.id}`}
                    />
                ) : (
                    <span
                        className={`flex-1 text-sm truncate select-none ${!isEditMode && !isHidden ? 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100' : 'text-gray-700 dark:text-gray-300'} ${activeNodeId === node.id.toString() && !isEditMode ? 'text-indigo-700 dark:text-indigo-400 font-semibold' : 'font-medium'}`}
                        data-testid={`label-${node.id}`}
                    >
                        {node.text}
                    </span>
                )
            }

            {/* Actions (Visibility Toggle - Only in Edit Mode) */}
            {
                isEditMode && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center ml-2 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleNodeVisibility(node.id.toString());
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title={isHidden ? "Show item" : "Hide item"}
                        >
                            {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                )
            }
            {/* Context Menu Portal */}
            {contextMenu && createPortal(
                <SidebarContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    nodeTitle={node.text}
                    isFolder={type === 'custom-folder'}
                    onClose={() => setContextMenu(null)}
                    onRename={() => {
                        setIsEditing(true);
                    }}
                    onDelete={handleDelete}
                    onNewSubfolder={type === 'custom-folder' ? handleNewSubfolder : undefined}
                    onMove={() => setIsMoveModalOpen(true)}
                />,
                document.body
            )}

            {/* Modern Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title={type === 'custom-folder' ? 'Delete Folder' : 'Delete Item'}
                message={type === 'custom-folder'
                    ? `Delete folder "${node.text}" and all its contents? This action cannot be undone.`
                    : `Are you sure you want to delete "${node.text}"?`
                }
                confirmText="Delete"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
            />

            {/* Modern Move To Modal */}
            <MoveToModal
                isOpen={isMoveModalOpen}
                currentNodeId={node.id.toString()}
                currentNodeText={node.text}
                nodes={nodes}
                onClose={() => setIsMoveModalOpen(false)}
                onSelect={(targetId) => {
                    moveNode(node.id.toString(), targetId);
                    setIsMoveModalOpen(false);
                }}
            />
        </div >
    );
};
