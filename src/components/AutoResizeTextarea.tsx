import React, { useEffect, useRef } from 'react';

export interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  maxHeight?: number;
  minHeight?: number;
}

const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({ 
  value, 
  onChange, 
  className, 
  maxHeight = 600, 
  minHeight = 100,
  style,
  ...props 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to correctly calculate scrollHeight for shrinking content
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      
      // Ensure we respect the minHeight prop
      const effectiveMinHeight = minHeight || 0;
      const targetHeight = Math.max(scrollHeight, effectiveMinHeight);

      if (targetHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.height = `${targetHeight}px`;
        textarea.style.overflowY = 'hidden';
      }
    }
  };

  // Adjust height whenever value changes
  useEffect(() => {
    adjustHeight();
  }, [value]);

  // Adjust height on window resize
  useEffect(() => {
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e);
      }}
      className={`resize-none transition-[height] duration-100 ease-out ${className}`}
      style={{ minHeight: `${minHeight}px`, ...style }}
      {...props}
    />
  );
};

export default AutoResizeTextarea;