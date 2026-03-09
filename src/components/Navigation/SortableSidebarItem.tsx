import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { navigate } from '../../utils/navigation';

interface SidebarItemProps {
    id: string; // The path
    name: string;
    icon: React.ReactNode;
    isActive: boolean;
    isEditMode: boolean;
    isHidden: boolean;
    onToggleVisibility: (id: string) => void;
}

export const SortableSidebarItem: React.FC<SidebarItemProps> = ({
    id,
    name,
    icon,
    isActive,
    isEditMode,
    isHidden,
    onToggleVisibility,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.8 : (isHidden && !isEditMode) ? 0 : 1, // Full hide in view mode
        display: (isHidden && !isEditMode) ? 'none' : 'flex',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive && !isEditMode
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                    : isHidden
                        ? 'text-gray-400 dark:text-gray-600'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                } ${isEditMode ? 'cursor-default border border-transparent hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900' : 'cursor-pointer'}`}
            onClick={(e) => {
                if (!isEditMode) {
                    navigate(id);
                }
            }}
        >
            {isEditMode && (
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded -ml-2 text-gray-400"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical size={16} />
                </div>
            )}

            <div className={`flex items-center gap-3 flex-1 ${isHidden && isEditMode ? 'opacity-50' : ''}`}>
                {icon}
                <span>{name}</span>
            </div>

            {isEditMode && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(id);
                    }}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title={isHidden ? "Show item" : "Hide item"}
                >
                    {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            )}
        </div>
    );
};
