import React from 'react';
import { Folder, ChevronRight, Plus } from 'lucide-react';
import { useSidebarStore } from '../store/useSidebarStore';
import { navigate } from '../utils/navigation';
import { useDrop } from 'react-dnd';
import AppLayout from '../components/Layout/AppLayout';
import WorkspaceCard from '../components/Navigation/WorkspaceCard';

const FolderView: React.FC = () => {
    const { nodes, moveNode, addNode } = useSidebarStore();
    const pathParts = window.location.pathname.split('/');

    let folderId: string | 0 = 'create-hub'; // Default for hub
    if (pathParts.includes('folder')) {
        folderId = pathParts[pathParts.indexOf('folder') + 1];
    } else if (window.location.pathname === '/hub') {
        folderId = 'create-hub';
    }

    const currentFolder = nodes.find(n => n.id === folderId);
    const children = nodes.filter(n => n.parent === folderId);

    const [{ isOver, canDrop }, drop] = useDrop({
        accept: '@@TreeItem@@',
        drop: (item: any) => {
            if (item.id !== folderId) {
                moveNode(item.id, folderId);
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    });

    const handleCreateSubfolder = () => {
        const newId = `folder-${Date.now()}`;
        addNode({
            id: newId,
            parent: folderId,
            text: 'New Subfolder',
            droppable: true,
            data: { isSystemNode: false, type: 'custom-folder', isHidden: false }
        });
    };

    return (
        <AppLayout>
            <div
                ref={drop}
                className={`flex-1 flex flex-col h-full min-h-screen p-8 transition-colors duration-200
                    ${isOver && canDrop ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : 'bg-gray-50/30 dark:bg-gray-900/30'}
                `}
            >
                {/* Breadcrumbs / Header */}
                <div className="flex items-center gap-2 mb-8 text-sm text-gray-500 overflow-x-auto whitespace-nowrap pb-2">
                    <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer" onClick={() => navigate('/dashboard')}>Dashboard</span>
                    <ChevronRight size={14} />
                    <span className="font-semibold text-gray-900 dark:text-white">
                        {currentFolder?.text || (folderId === 'create-hub' ? 'Create & Build Hub' : 'Unknown Folder')}
                    </span>
                </div>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Folder className="text-indigo-500" />
                            {currentFolder?.text || (folderId === 'create-hub' ? 'Create & Build Hub' : 'Folder View')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {children.length} items inside this folder
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCreateSubfolder}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 text-gray-700 dark:text-gray-300 rounded-xl transition-all font-medium"
                        >
                            <Plus size={18} />
                            <span>New Folder</span>
                        </button>
                    </div>
                </div>

                {/* Empty State vs Grid */}
                {children.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl mt-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-2xl flex items-center justify-center mb-4">
                            <Folder size={32} />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">This folder is empty</p>
                        <p className="text-xs text-gray-400 mt-1">Drag items from the sidebar or other folders to move them here</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {children.map(child => (
                            <WorkspaceCard key={child.id} node={child} />
                        ))}
                    </div>
                )}

                {/* Drop Indicator Overlay */}
                {isOver && canDrop && (
                    <div className="fixed inset-0 pointer-events-none border-4 border-indigo-500/50 border-dashed rounded-3xl m-8 flex items-center justify-center bg-indigo-500/5 backdrop-blur-[2px] z-50">
                        <div className="bg-white dark:bg-gray-900 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-500/20 animate-bounce">
                            <Plus className="text-indigo-500" />
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">Move to this folder</span>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default FolderView;
