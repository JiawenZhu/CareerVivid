import React, { useState, useEffect, useRef } from 'react';

interface EditableHeaderProps {
    title: string;
    onSave: (newTitle: string) => void;
    isEditable: boolean;
    onClick?: () => void;
}

const EditableHeader: React.FC<EditableHeaderProps> = ({ title: initialTitle, onSave, isEditable, onClick }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(initialTitle);
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setTitle(initialTitle);
    }, [initialTitle]);

    useEffect(() => {
        return () => {
            if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current);
            }
        };
    }, []);

    const handleSave = () => {
        if (title.trim() && title.trim() !== initialTitle) {
            onSave(title.trim());
        } else {
            setTitle(initialTitle);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setTitle(initialTitle);
            setIsEditing(false);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (!isEditable) {
            onClick?.();
            return;
        }

        if (clickTimeoutRef.current) {
            // Double click detected
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
            setIsEditing(true);
        } else {
            clickTimeoutRef.current = setTimeout(() => {
                onClick?.();
                clickTimeoutRef.current = null;
            }, 250);
        }
    };

    if (isEditing && isEditable) {
        return (
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full min-w-0 text-lg sm:text-xl font-bold leading-tight text-gray-800 dark:text-gray-100 bg-transparent border-b-2 border-primary-500 focus:outline-none font-sans"
            />
        );
    }

    const isClickable = !!onClick;

    return (
        <h2
            onClick={handleClick}
            className={`min-w-0 text-lg sm:text-xl font-bold leading-tight text-gray-800 dark:text-gray-100 font-sans select-none
                ${isEditable ? 'cursor-text' : ''}
                ${isClickable ? 'cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors' : ''}
            `}
            title={
                isEditable && isClickable
                    ? "Click to open, Double-click to rename"
                    : isEditable
                    ? "Double-click to rename"
                    : isClickable
                    ? "Click to open"
                    : ""
            }
        >
            {title}
        </h2>
    );
};

export default EditableHeader;
