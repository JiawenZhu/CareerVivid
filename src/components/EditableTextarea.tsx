
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

interface EditableTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

const EditableTextarea: React.FC<EditableTextareaProps> = ({ label, value, onChange, placeholder, disabled = false, id }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  // Use useLayoutEffect to prevent flash when autosizing on mount/edit
  useLayoutEffect(() => {
    if (isEditing && textareaRef.current) {
      // Auto-resize logic
      const textarea = textareaRef.current;
      textarea.style.height = 'auto'; // Reset height
      textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
      textarea.focus();
    }
  }, [isEditing, currentValue]);

  const handleSave = () => {
    setIsEditing(false);
    if (currentValue !== value) {
      onChange(currentValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentValue(e.target.value);
    // Auto-resize on input
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  return (
    <div className="mb-4" id={id ? `container-${id}` : undefined}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {isEditing ? (
        <textarea
          id={id}
          ref={textareaRef}
          value={currentValue || ''}
          onChange={handleTextareaInput}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border-2 border-primary-500 rounded-md shadow-sm focus:ring-0 focus:border-primary-500 bg-white dark:bg-gray-700 dark:text-white resize-none overflow-hidden"
          rows={3} // Initial rows
        />
      ) : (
        <div
          id={id}
          tabIndex={0}
          onClick={() => !disabled && setIsEditing(true)}
          onFocus={() => !disabled && setIsEditing(true)} // Trigger edit on focus (e.g. from preview click)
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md min-h-[88px] whitespace-pre-wrap text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            !disabled 
            ? 'cursor-text hover:bg-gray-50 dark:hover:bg-gray-700/50' 
            : 'bg-gray-100 dark:bg-gray-800 opacity-70 cursor-not-allowed'
          }`}
        >
          {value || <span className="text-gray-400 dark:text-gray-500 italic">{placeholder}</span>}
        </div>
      )}
    </div>
  );
};

export default EditableTextarea;
