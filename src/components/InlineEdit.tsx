
import React from 'react';
import { Edit2 } from 'lucide-react';
import { renderInlineMarkdown } from '../utils/renderInlineMarkdown';
import { getCanvasChunkFieldId, splitResumeTextChunks } from '../utils/resumeTextChunks';
import { useAIReview } from '../contexts/AIReviewContext';
import { safeReviewLower, safeReviewText } from '../utils/aiReviewDataGuards';

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
  isReadOnly?: boolean;
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
  isReadOnly = false,
  ...props
}) => {
  const displayValue = safeReviewText(value);
  const isReadOnlyMode = isReadOnly || !onFocus;
  const isProfessionalSummary = fieldId === 'professionalSummary';
  const shouldChunkValue = !isReadOnlyMode && Boolean(displayValue) && !isLink && (
    multiline ||
    isProfessionalSummary ||
    /^employmentHistory\[\d+\]\.description$/.test(fieldId || '')
  );
  const canFocusEditorField = Boolean(!isReadOnlyMode && onFocus && fieldId);
  const textChunks = shouldChunkValue ? splitResumeTextChunks(displayValue, { splitSentences: isProfessionalSummary }) : [];
  const getChunkTargetFieldId = (chunkIndex: number) => fieldId ? getCanvasChunkFieldId(fieldId, chunkIndex) : undefined;

  const handleClick = (e: React.MouseEvent) => {
    if (isLink) {
      if (onFocus && fieldId) {
        e.preventDefault();
        e.stopPropagation();
        onFocus(fieldId);
      }
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
  const shouldStackChunks = shouldRenderChunks && (displayValue.includes('\n') || textChunks.some((chunk) => chunk.hadBullet));
  const shouldUseParentChunkHover = isProfessionalSummary && shouldRenderChunks && !shouldStackChunks;
  const baseInteractiveClass = canFocusEditorField && !isLink && !shouldRenderChunks
    ? 'cursor-pointer hover:bg-primary-500/10 hover:ring-2 hover:ring-primary-400/50 hover:ring-offset-1 rounded px-0.5 -mx-0.5'
    : '';
  const chunkedSummaryInteractiveClass = canFocusEditorField && shouldUseParentChunkHover
    ? 'cursor-pointer hover:bg-primary-500/10 hover:ring-2 hover:ring-primary-400/50 hover:ring-offset-1 rounded px-1 -mx-1'
    : '';

  // Integrate AI Review Context safely
  let review: any = null;
  try {
    review = useAIReview();
  } catch (e) {}

  const isReviewMode = !isReadOnlyMode && review?.isReviewMode;
  const suggestions = !isReadOnlyMode ? (review?.suggestions || []) : [];
  const selectedIds = !isReadOnlyMode ? (review?.selectedSuggestionIds || new Set()) : new Set();

  const getActiveSuggestion = (targetFieldId: string) => {
    return suggestions.find((s: any) => s.fieldId === targetFieldId && selectedIds.has(s.id));
  };

  // Determine if this is a skills-array specific field and resolve suggestions
  const isSkillField = fieldId?.startsWith('skills[');
  let skillSuggestion: any = null;
  if (isReviewMode && isSkillField && displayValue) {
    const displayValueLower = safeReviewLower(displayValue);
    const deleteSug = suggestions.find((s: any) =>
      s.category === 'skills' &&
      s.type === 'delete' &&
      selectedIds.has(s.id) &&
      safeReviewLower(s.originalText) === displayValueLower
    );
    const addSug = suggestions.find((s: any) =>
      s.category === 'skills' &&
      s.type === 'add' &&
      selectedIds.has(s.id) &&
      safeReviewLower(s.suggestedText) === displayValueLower
    );
    const replaceSug = suggestions.find((s: any) =>
      s.fieldId === fieldId &&
      s.type === 'replace' &&
      selectedIds.has(s.id)
    );

    skillSuggestion = replaceSug || deleteSug || addSug;
  }

  // Highlight suggestion border if hovered in left panel
  const activeFieldSuggestion = fieldId ? suggestions.find((s: any) => s.fieldId === fieldId) : null;
  const isHovered = activeFieldSuggestion && review?.hoveredSuggestionId === activeFieldSuggestion.id;

  const addedTextClassName = "cv-ai-diff-added text-emerald-700 dark:text-emerald-300 no-underline border-b-2 border-emerald-500/90 pb-[1px]";
  const removedTextClassName = "cv-ai-diff-removed text-red-600 dark:text-red-400 line-through decoration-red-500 decoration-2";

  const renderReplacement = (originalText: unknown, suggestedText: unknown) => (
    <>
      <del className={removedTextClassName}>
        {renderInlineMarkdown(safeReviewText(originalText))}
      </del>
      {' '}
      <ins className={addedTextClassName}>
        {renderInlineMarkdown(safeReviewText(suggestedText))}
      </ins>
    </>
  );

  const renderContent = () => {
    // 1. Custom rendering for suggestions active on skills list
    if (isReviewMode && skillSuggestion) {
      if (skillSuggestion.type === 'add') {
        return (
          <ins className={addedTextClassName}>
            {renderInlineMarkdown(displayValue)}
          </ins>
        );
      }
      if (skillSuggestion.type === 'delete') {
        return (
          <del className={removedTextClassName}>
            {renderInlineMarkdown(displayValue)}
          </del>
        );
      }
      if (skillSuggestion.type === 'replace') {
        return renderReplacement(skillSuggestion.originalText, skillSuggestion.suggestedText);
      }
    }

    // 2. Custom rendering for replace suggestions on normal single-line fields
    if (isReviewMode && fieldId) {
      const singleSug = getActiveSuggestion(fieldId);
      if (singleSug && singleSug.type === 'replace') {
        return renderReplacement(singleSug.originalText, singleSug.suggestedText);
      }
    }

    // 3. Normal rendering
    if (shouldRenderChunks) {
      return textChunks.map((chunk, index) => {
        const chunkFieldId = getChunkTargetFieldId(index);
        const chunkSug = isReviewMode && chunkFieldId ? getActiveSuggestion(chunkFieldId) : null;

        const chunkHovered = chunkFieldId && review?.hoveredSuggestionId === suggestions.find((s: any) => s.fieldId === chunkFieldId)?.id;

        return (
          <span
            key={`${fieldId || 'chunk'}-${index}`}
            role={canFocusEditorField ? 'button' : undefined}
            tabIndex={canFocusEditorField ? 0 : undefined}
            data-field-id={chunkFieldId}
            data-parent-field-id={fieldId}
            data-chunk-index={index}
            onClick={(e) => handleChunkClick(e, index)}
            onKeyDown={canFocusEditorField ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  const targetFieldId = getChunkTargetFieldId(index);
                  if (onFocus && targetFieldId) {
                    onFocus(targetFieldId);
                  }
                }
              } : undefined}
            className={`
              ${shouldStackChunks ? 'block' : 'inline'}
              ${canFocusEditorField ? 'rounded px-1 -mx-1 cursor-pointer transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1' : ''}
              ${canFocusEditorField && chunkHovered ? 'bg-primary-500/20 ring-2 ring-primary-500/80 ring-offset-1 scale-[1.01]' : ''}
              ${canFocusEditorField && !chunkHovered && !shouldUseParentChunkHover ? 'hover:bg-primary-500/10 hover:ring-2 hover:ring-primary-400/60 hover:ring-offset-1' : ''}
            `}
            title={canFocusEditorField && !shouldUseParentChunkHover ? 'Click to edit this item' : undefined}
          >
            {chunk.hadBullet && <span className="mr-1">•</span>}
            {isReviewMode && chunkSug && chunkSug.type === 'replace'
              ? renderReplacement(chunkSug.originalText, chunkSug.suggestedText)
              : renderInlineMarkdown(chunk.text)
            }
            {!shouldStackChunks && index < textChunks.length - 1 ? ' ' : null}
          </span>
        );
      });
    }

    if (displayValue) {
      return renderInlineMarkdown(displayValue);
    }

    return <span className="opacity-50 italic print:hidden">{placeholder || 'Click to edit'}</span>;
  };

  return (
    <Tag
      onClick={isReadOnlyMode ? undefined : handleClick}
      data-field-id={isReadOnlyMode ? undefined : fieldId}
      className={`
        relative group/edit transition-all duration-250
        ${canFocusEditorField && isHovered ? 'bg-primary-500/20 ring-2 ring-primary-500/80 ring-offset-1 scale-[1.01] rounded px-0.5 -mx-0.5' : `${baseInteractiveClass} ${chunkedSummaryInteractiveClass}`}
        ${className || ''}
      `}
      style={style}
      title={canFocusEditorField && !isLink && !shouldUseParentChunkHover ? "Click to edit" : undefined}
      {...props}
    >
      {renderContent()}

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
