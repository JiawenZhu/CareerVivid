import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, FolderPlus, Trash2, ArrowRightCircle, X } from 'lucide-react';

interface SidebarContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onRename: () => void;
    onDelete: () => void;
    onNewSubfolder?: () => void;
    onMove?: () => void;
    isFolder?: boolean;
    nodeTitle: string;
}

export const SidebarContextMenu: React.FC<SidebarContextMenuProps> = ({
    x,
    y,
    onClose,
    onRename,
    onDelete,
    onNewSubfolder,
    onMove,
    isFolder,
    nodeTitle
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Ensure menu stays within viewport
    const menuWidth = 200;
    const menuHeight = isFolder ? 220 : 180;

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > window.innerWidth) {
        adjustedX = x - menuWidth;
    }
    if (y + menuHeight > window.innerHeight) {
        adjustedY = y - menuHeight;
    }

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
                style={{
                    position: 'fixed',
                    top: adjustedY,
                    left: adjustedX,
                    zIndex: 1000,
                }}
                className="w-[200px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-2xl overflow-hidden p-1.5 ring-1 ring-black/5"
            >
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 truncate">
                        {nodeTitle}
                    </p>
                </div>

                <ContextMenuItem
                    icon={<Edit2 size={14} />}
                    label="Rename"
                    onClick={() => { onRename(); onClose(); }}
                />

                {isFolder && onNewSubfolder && (
                    <ContextMenuItem
                        icon={<FolderPlus size={14} />}
                        label="New Subfolder"
                        onClick={() => { onNewSubfolder(); onClose(); }}
                    />
                )}

                <ContextMenuItem
                    icon={<ArrowRightCircle size={14} />}
                    label="Move to..."
                    onClick={() => { onMove?.(); onClose(); }}
                />

                <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-1" />

                <ContextMenuItem
                    icon={<Trash2 size={14} />}
                    label="Delete"
                    variant="danger"
                    onClick={() => { onDelete(); onClose(); }}
                />
            </motion.div>
        </AnimatePresence>
    );
};

interface ContextMenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

const ContextMenuItem: React.FC<ContextMenuItemProps> = ({ icon, label, onClick, variant = 'default' }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg transition-all duration-200 group
            ${variant === 'danger'
                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10'
                : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
    >
        <span className={`transition-transform duration-200 group-hover:scale-110 ${variant === 'danger' ? 'text-red-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-500'}`}>
            {icon}
        </span>
        <span className="font-medium">{label}</span>
    </button>
);
