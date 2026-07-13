import React, { useState, useEffect, useRef } from 'react';
import { Folder, ChevronRight, Plus, SlidersHorizontal, Check } from 'lucide-react';
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

    // Filtering & Sorting State
    const [filterType, setFilterType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt'>('createdAt');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    const filteredChildren = React.useMemo(() => {
        let items = nodes.filter(n => n.parent === folderId);

        if (filterType === 'folder') {
            items = items.filter(n => n.droppable === true || n.data?.type === 'custom-folder');
        } else if (filterType !== 'all') {
            items = items.filter(n => n.data?.type === filterType);
        }

        return [...items].sort((a, b) => {
            if (sortBy === 'createdAt') {
                const aTime = a.data?.createdAt ?? a.data?.timestamp ?? 0;
                const bTime = b.data?.createdAt ?? b.data?.timestamp ?? 0;
                return aTime - bTime; // Sequence of events (Ascending)
            } else {
                const aTime = a.data?.updatedAt ?? a.data?.timestamp ?? 0;
                const bTime = b.data?.updatedAt ?? b.data?.timestamp ?? 0;
                return bTime - aTime; // Recently modified (Descending)
            }
        });
    }, [nodes, folderId, filterType, sortBy]);

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
                className={`cv-design-page cv-design-grid mx-auto flex h-full min-h-screen max-w-screen-2xl flex-1 flex-col p-8 transition-colors duration-200
                    ${isOver && canDrop ? 'bg-[var(--cv-action-soft-bg)]' : ''}
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
                            <Folder className="text-[var(--cv-action-primary)]" />
                            {currentFolder?.text || (folderId === 'create-hub' ? 'Create & Build Hub' : 'Folder View')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {filterType === 'all' 
                                ? `${children.length} items inside this folder` 
                                : `Showing ${filteredChildren.length} of ${children.length} items`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            {/* Filter & Sort Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium border text-sm cursor-pointer select-none ${isDropdownOpen || filterType !== 'all' ? 'bg-indigo-50/60 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/40 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-350 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    <SlidersHorizontal size={16} />
                                    <span>Filter & Sort</span>
                                    {filterType !== 'all' && (
                                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                    )}
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-800/40 shadow-xl rounded-2xl py-3 z-50 text-xs font-semibold text-gray-700 dark:text-gray-300 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                                        <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 mb-2">
                                            Type
                                        </div>
                                        {[
                                            { value: 'all', label: 'All Items' },
                                            { value: 'folder', label: 'Folders' },
                                            { value: 'resume', label: 'Resumes' },
                                            { value: 'portfolio', label: 'Portfolios' },
                                            { value: 'whiteboard', label: 'Whiteboards' },
                                            { value: 'interview', label: 'Interviews' }
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => {
                                                    setFilterType(opt.value);
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-2 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left ${filterType === opt.value ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/20 dark:bg-indigo-500/5' : ''}`}
                                            >
                                                <span>{opt.label}</span>
                                                {filterType === opt.value && <Check size={14} className="text-indigo-500" />}
                                            </button>
                                        ))}

                                        <div className="h-px bg-gray-100 dark:bg-gray-800 my-2"></div>

                                        <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                                            Sort By
                                        </div>
                                        {[
                                            { value: 'createdAt', label: 'Sequence of Events' },
                                            { value: 'updatedAt', label: 'Recently Modified' }
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => {
                                                    setSortBy(opt.value as any);
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-2 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left ${sortBy === opt.value ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/20 dark:bg-indigo-500/5' : ''}`}
                                            >
                                                <span>{opt.label}</span>
                                                {sortBy === opt.value && <Check size={14} className="text-indigo-500" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleCreateSubfolder}
                                className="cv-design-button-secondary rounded-xl px-4 py-2 text-sm"
                            >
                                <Plus size={16} />
                                <span>New Folder</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Empty State vs Grid */}
                {filteredChildren.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl mt-4 py-12">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-2xl flex items-center justify-center mb-4">
                            <Folder size={32} />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-semibold">
                            {filterType === 'all' ? 'This folder is empty' : 'No matching items'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {filterType === 'all' 
                                ? 'Drag items from the sidebar or other folders to move them here' 
                                : `No items in this folder match the filter type "${filterType}".`}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {filteredChildren.map(child => (
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
