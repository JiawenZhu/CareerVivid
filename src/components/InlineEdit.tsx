
import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';

interface InlineEditProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onFocus'> {
  value: string;
  onFocus?: (fieldId: string) => void;
  fieldId?: string;
  tagName?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'li';
  placeholder?: string;
  multiline?: boolean;
  isLink?: boolean;
}

const InlineEdit: React.FC<InlineEditProps> = ({ 
  value, 
  onFocus, 
  fieldId, 
  className, 
  tagName: Tag = 'span', 
  placeholder,
  style,
  multiline,
  isLink,
  ...props 
}) => {
  
  const handleClick = (e: React.MouseEvent) => {
    if (isLink) {
        // Do nothing on click if it's a link, let the parent <a> tag handle it
        return;
    }
    // If we have a fieldId and onFocus handler, use the Deep Link strategy
    if (onFocus && fieldId) {
        e.stopPropagation();
        onFocus(fieldId);
        return;
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent link navigation
      e.stopPropagation();
      if (onFocus && fieldId) {
          onFocus(fieldId);
      }
  }

  return (
    <Tag
      onClick={handleClick}
      className={`relative group/edit transition-all ${!isLink ? 'cursor-pointer hover:bg-primary-500/10 hover:ring-2 hover:ring-primary-400/50 hover:ring-offset-1 rounded px-0.5 -mx-0.5' : ''} ${className || ''}`}
      style={style}
      title={!isLink ? "Click to edit" : undefined}
      {...props}
    >
      {value || <span className="opacity-50 italic">{placeholder || 'Click to edit'}</span>}
      
      {isLink && onFocus && (
          <button
            onClick={handleEditClick}
            className="absolute -top-2 -right-2 bg-primary-600 text-white p-1 rounded-full shadow-md opacity-0 group-hover/edit:opacity-100 transition-opacity z-10 hover:scale-110"
            title="Edit Link"
          >
              <Edit2 size={10} />
          </button>
      )}
    </Tag>
  );
};

export default InlineEdit;