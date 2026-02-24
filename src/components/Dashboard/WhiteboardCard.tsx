import React, { useState } from 'react';
import { Edit3, Copy, Trash2, PenTool } from 'lucide-react';
import { WhiteboardData } from '../../types';
import { navigate } from '../../utils/navigation';

interface WhiteboardCardProps {
    whiteboard: WhiteboardData;
    onUpdate: (id: string, data: Partial<WhiteboardData>) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}

const WhiteboardCard: React.FC<WhiteboardCardProps> = ({ whiteboard, onUpdate, onDuplicate, onDelete, onDragStart }) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(whiteboard.title);

    const hasDrawing = whiteboard.elements && (whiteboard.elements as any[]).length > 0;
    const hasThumbnail = !!whiteboard.thumbnailSvg;

    const navigateToEdit = () => {
        navigate(`/whiteboard/${whiteboard.id}`);
    };

    const handleTitleSave = () => {
        if (title.trim() === '') {
            setTitle(whiteboard.title);
        } else {
            onUpdate(whiteboard.id, { title });
        }
        setIsEditingTitle(false);
    };

    return (
        <div draggable onDragStart={onDragStart} className="bg-white dark:bg-gray-800 rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 flex flex-col cursor-grab active:cursor-grabbing transform hover:-translate-y-1">
            <div onClick={!isEditingTitle ? navigateToEdit : undefined} className="block p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40 flex-grow cursor-pointer rounded-t-xl">
                {/* Thumbnail Preview or Empty Placeholder */}
                <div
                    className="w-full aspect-[16/9] bg-white dark:bg-gray-700/50 rounded-lg mb-4 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-600 overflow-hidden"
                >
                    {hasThumbnail ? (
                        <img
                            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(whiteboard.thumbnailSvg!)}`}
                            alt="Whiteboard thumbnail"
                            className="w-full h-full object-contain"
                        />
                    ) : hasDrawing ? (
                        <div className="text-gray-400 dark:text-gray-500 text-center">
                            <PenTool size={32} className="mb-1 opacity-50 mx-auto" />
                            <span className="text-xs font-medium">Generating preview...</span>
                        </div>
                    ) : (
                        <div className="text-gray-400 dark:text-gray-500 text-center">
                            <PenTool size={32} className="mb-1 opacity-50 mx-auto" />
                            <span className="text-xs font-medium">Empty Whiteboard</span>
                        </div>
                    )}
                </div>

                {isEditingTitle ? (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleTitleSave();
                            if (e.key === 'Escape') {
                                setTitle(whiteboard.title);
                                setIsEditingTitle(false);
                            }
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate w-full border rounded-md px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                ) : (
                    <h3 onDoubleClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }} className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate" title="Double-click to rename">{whiteboard.title}</h3>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">Updated {new Date(whiteboard.updatedAt).toLocaleString()}</p>
            </div>

            <div className="p-2 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                <div className="flex gap-1">
                    <button onClick={navigateToEdit} title="Edit Whiteboard" className="p-2 block rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"><Edit3 size={16} /></button>
                    <button onClick={() => onDuplicate(whiteboard.id)} title="Duplicate Whiteboard" className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"><Copy size={16} /></button>
                    <button onClick={() => onDelete(whiteboard.id)} title="Delete Whiteboard" className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"><Trash2 size={16} /></button>
                </div>
            </div>
        </div>
    );
};

export default WhiteboardCard;
