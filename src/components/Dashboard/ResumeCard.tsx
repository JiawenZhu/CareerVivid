import React, { useState, useRef, useLayoutEffect } from 'react';
import { Edit3, Copy, Trash2, Share2 } from 'lucide-react';
import { ResumeData } from '../../types';
import ResumePreview from '../ResumePreview';
import { navigate } from '../../utils/navigation';

interface ResumeCardProps {
    resume: ResumeData;
    onUpdate: (id: string, data: Partial<ResumeData>) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
    onShare: (resume: ResumeData) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}

const ResumeCard: React.FC<ResumeCardProps> = ({ resume, onUpdate, onDuplicate, onDelete, onShare, onDragStart }) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(resume.title);

    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.2);

    useLayoutEffect(() => {
        const calculateScale = () => {
            if (previewContainerRef.current) {
                const parentWidth = previewContainerRef.current.offsetWidth;
                const originalWidth = 824; // Base width of the ResumePreview component for styling
                if (parentWidth > 0) {
                    setScale(parentWidth / originalWidth);
                }
            }
        };

        calculateScale();
        const resizeObserver = new ResizeObserver(calculateScale);
        if (previewContainerRef.current) {
            resizeObserver.observe(previewContainerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    const navigateToEdit = () => {
        navigate(`/edit/${resume.id}`);
    };

    const handleTitleSave = () => {
        if (title.trim() === '') {
            setTitle(resume.title); // reset if empty
        } else {
            onUpdate(resume.id, { title });
        }
        setIsEditingTitle(false);
    };

    return (
        <div draggable onDragStart={onDragStart} className="bg-white dark:bg-gray-800 rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 flex flex-col cursor-grab active:cursor-grabbing transform hover:-translate-y-1">
            <div onClick={!isEditingTitle ? navigateToEdit : undefined} className="block p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40 flex-grow cursor-pointer rounded-t-xl">
                <div ref={previewContainerRef} className="w-full aspect-[210/297] bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden relative">
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '824px',
                            height: '1165px', // 824 * (297/210)
                            transform: `scale(${scale})`,
                            transformOrigin: 'top left',
                        }}
                    >
                        <ResumePreview resume={resume} template={resume.templateId} />
                    </div>
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
                                setTitle(resume.title);
                                setIsEditingTitle(false);
                            }
                        }}
                        autoFocus
                        className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate w-full border rounded-md px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                ) : (
                    <h3 onDoubleClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }} className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate" title="Double-click to rename">{resume.title}</h3>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">Updated {new Date(resume.updatedAt).toLocaleString()}</p>
            </div>
            <div className="p-2 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                <div className="flex gap-1">
                    <button onClick={navigateToEdit} title="Edit Resume" className="p-2 block rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"><Edit3 size={16} /></button>
                    <button onClick={() => onDuplicate(resume.id)} title="Duplicate Resume" className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"><Copy size={16} /></button>
                    <button onClick={() => onDelete(resume.id)} title="Delete Resume" className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"><Trash2 size={16} /></button>
                </div>
                <button onClick={() => onShare(resume)} title="Share Resume" className="p-2 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/30 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"><Share2 size={16} /></button>
            </div>
        </div>
    );
};

export default ResumeCard;
