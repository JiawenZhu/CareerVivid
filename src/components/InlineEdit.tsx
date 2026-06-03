
import React from 'react';
import { Edit2 } from 'lucide-react';
import { renderInlineMarkdown } from '../utils/renderInlineMarkdown';
import { getCanvasChunkFieldId, splitResumeTextChunks } from '../utils/resumeTextChunks';

interface InlineEditProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onFocus'> {
  value: string;
  onFocus?: (fieldId: string) => void;
  fieldId?: string;
  tagName?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'li' | 'a';
  placeholder?: string;
  multiline?: boolean;
  isLink?: boolean;
  href?: string;
  target?: string;
  rel?: string;
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
  const shouldChunkValue = Boolean(value) && !isLink && (
    multiline ||
    fieldId === 'professionalSummary' ||
    /^employmentHistory\[\d+\]\.description$/.test(fieldId || '')
  );
  const textChunks = shouldChunkValue ? splitResumeTextChunks(value, { splitSentences: fieldId === 'professionalSummary' }) : [];
  const getChunkTargetFieldId = (chunkIndex: number) => fieldId ? getCanvasChunkFieldId(fieldId, chunkIndex) : undefined;

  const handleClick = (e: React.MouseEvent) => {
    if (isLink) {
      // Do nothing on click if it's a link, let the parent <a> tag handle it
      return;
    }
    if (textChunks.length > 0) {
      if (onFocus && fieldId) {
        e.stopPropagation();
        onFocus(getCanvasChunkFieldId(fieldId, 0));
      }
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

  const handleChunkClick = (e: React.MouseEvent, chunkIndex: number) => {
    const targetFieldId = getChunkTargetFieldId(chunkIndex);
    if (!onFocus || !targetFieldId) return;
    e.stopPropagation();
    onFocus(targetFieldId);
  };

  const shouldRenderChunks = shouldChunkValue && textChunks.length > 0;
  const shouldStackChunks = shouldRenderChunks && (value.includes('\n') || textChunks.some((chunk) => chunk.hadBullet));
  const baseInteractiveClass = !isLink && !shouldRenderChunks
    ? 'cursor-pointer hover:bg-primary-500/10 hover:ring-2 hover:ring-primary-400/50 hover:ring-offset-1 rounded px-0.5 -mx-0.5'
    : '';

  return (
    <Tag
      onClick={handleClick}
      data-field-id={fieldId}
      className={`relative group/edit transition-all ${baseInteractiveClass} ${className || ''}`}
      style={style}
      title={!isLink ? "Click to edit" : undefined}
      {...props}
    >
      {shouldRenderChunks
        ? textChunks.map((chunk, index) => (
          <span
            key={`${fieldId || 'chunk'}-${index}`}
            role="button"
            tabIndex={0}
            data-field-id={getChunkTargetFieldId(index)}
            data-parent-field-id={fieldId}
            data-chunk-index={index}
            onClick={(e) => handleChunkClick(e, index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const targetFieldId = getChunkTargetFieldId(index);
                if (onFocus && targetFieldId) {
                  onFocus(targetFieldId);
                }
              }
            }}
            className={`${shouldStackChunks ? 'block' : 'inline'} rounded px-1 -mx-1 cursor-pointer transition-colors hover:bg-primary-500/10 hover:ring-2 hover:ring-primary-400/60 hover:ring-offset-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1`}
            title="Click to edit this item"
          >
            {chunk.hadBullet && <span className="mr-1">•</span>}
            {renderInlineMarkdown(chunk.text)}
            {!shouldStackChunks && index < textChunks.length - 1 ? ' ' : null}
          </span>
        ))
        : value
        ? renderInlineMarkdown(value)
        : <span className="opacity-50 italic print:hidden">{placeholder || 'Click to edit'}</span>}

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
