import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, Folder, ChevronRight, LayoutDashboard, CornerDownRight } from 'lucide-react';
import { SidebarNode } from '../../types';

interface MoveToModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (targetId: string | 0) => void;
    nodes: SidebarNode[];
    currentNodeId: string;
    currentNodeText: string;
}

const MoveToModal: React.FC<MoveToModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    nodes,
    currentNodeId,
    currentNodeText
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    // Filter for droppable folders that are not the current node itself
    const availableFolders = nodes.filter(n =>
        n.droppable && n.id !== currentNodeId
    );

    const filteredFolders = availableFolders.filter(f =>
        f.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Move Item</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Select target folder for <span className="font-semibold text-indigo-600 dark:text-indigo-400">"{currentNodeText}"</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search folders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Folder List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {/* Root option */}
                    <button
                        onClick={() => onSelect(0)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-left transition-all group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 transition-colors">
                            <LayoutDashboard size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Dashboard (Root)</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Top level navigation</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                    </button>

                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-2 mx-3" />

                    {filteredFolders.length > 0 ? (
                        filteredFolders.map(folder => (
                            <button
                                key={folder.id}
                                onClick={() => onSelect(folder.id.toString())}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-left transition-all group mt-1"
                            >
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 transition-colors">
                                    <Folder size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{folder.text}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <CornerDownRight size={10} />
                                        ID: {folder.id}
                                    </p>
                                </div>
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                            </button>
                        ))
                    ) : (
                        searchQuery && (
                            <div className="py-10 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">No folders found for "{searchQuery}"</p>
                            </div>
                        )
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MoveToModal;
