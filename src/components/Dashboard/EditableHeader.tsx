import React, { useState, useEffect } from 'react';

interface EditableHeaderProps {
    title: string;
    onSave: (newTitle: string) => void;
    isEditable: boolean;
}

const EditableHeader: React.FC<EditableHeaderProps> = ({ title: initialTitle, onSave, isEditable }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(initialTitle);

    useEffect(() => {
        setTitle(initialTitle);
    }, [initialTitle]);

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

    if (isEditing && isEditable) {
        return (
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                autoFocus
                className="text-xl font-bold text-gray-800 dark:text-gray-100 bg-transparent border-b-2 border-primary-500 focus:outline-none font-sans"
            />
        );
    }

    return (
        <h2
            onDoubleClick={() => isEditable && setIsEditing(true)}
            className={`text-xl font-bold text-gray-800 dark:text-gray-100 font-sans ${isEditable ? 'cursor-text' : ''}`}
            title={isEditable ? "Double-click to rename" : ""}
        >
            {title}
        </h2>
    );
};

export default EditableHeader;
