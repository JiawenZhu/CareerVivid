import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, Check } from 'lucide-react';
import { Folder } from '../pages/Dashboard'; // Importing Folder type from Dashboard

interface FolderReorderModalProps {
    isOpen: boolean;
    onClose: () => void;
    folders: Folder[];
    onSave: (newFolders: Folder[]) => void;
}

// Sortable Item Component
const SortableItem = ({ id, title }: { id: string, title: string }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mb-2 touch-none cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-lg ring-2 ring-primary-500' : ''}`}
        >
            <GripVertical className="text-gray-400" size={20} />
            <span className="text-gray-900 dark:text-gray-100 font-medium">{title}</span>
        </div>
    );
};

const FolderReorderModal: React.FC<FolderReorderModalProps> = ({ isOpen, onClose, folders, onSave }) => {
    const [items, setItems] = useState(folders);

    // Sync items with folders prop when it changes or modal opens
    React.useEffect(() => {
        setItems(folders);
    }, [folders, isOpen]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSave = () => {
        onSave(items);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl animate-fade-in-up">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reorder Folders</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Drag and drop items to reorder your folders.
                    </p>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items.map(f => f.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {items.map((folder) => (
                                <SortableItem key={folder.id} id={folder.id} title={folder.title} />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex justify-end gap-3 transition-colors">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-lg shadow-primary-500/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Check size={18} />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FolderReorderModal;
