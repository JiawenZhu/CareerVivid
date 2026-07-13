import React, { useState } from 'react';
import { Icon } from '../icons/Icon.jsx';

/**
 * Compact job pipeline card (Career Pipeline Kanban row).
 * Faithful to src/components/JobTracker/KanbanBoard.tsx CompactJobRow.
 */
export function JobCard({ title, company, priority = 'Medium', matchScore, prepDone = 0, prepTotal = 5, dueDate, hasUrl = true, noDescription = false, onClick, style }) {
  const [hover, setHover] = useState(false);
  const priorityStyles = {
    High: { background: 'var(--cv-danger-50)', color: 'var(--cv-danger-700)' },
    Medium: { background: 'var(--cv-warning-50)', color: 'var(--cv-warning-700)' },
    Low: { background: 'var(--cv-neutral-100)', color: 'var(--cv-neutral-600)' },
  };
  const p = priorityStyles[priority] || priorityStyles.Medium;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 6,
        border: `1px solid ${hover ? 'var(--cv-purple-300)' : 'var(--cv-border-product)'}`,
        background: hover ? 'rgba(243, 242, 255, 0.4)' : '#ffffff',
        padding: '8px 10px',
        boxShadow: 'var(--cv-shadow-card)',
        transition: 'all var(--cv-duration-fast) var(--cv-ease-standard)',
        cursor: 'pointer',
        fontFamily: 'var(--cv-font-body)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, flexShrink: 0, borderRadius: 6, background: 'var(--cv-neutral-100)', color: 'var(--cv-neutral-500)' }}>
          <Icon name="briefcase" size={15} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, lineHeight: '20px', color: 'var(--cv-neutral-950)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {title || 'Untitled Job'}
              </h4>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--cv-neutral-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {company || 'Unknown company'}
              </p>
            </div>
            {hasUrl ? (
              <span style={{ padding: 4, borderRadius: 4, color: 'var(--cv-neutral-400)', opacity: hover ? 1 : 0.7, display: 'flex' }}>
                <Icon name="arrow-up-right" size={13} />
              </span>
            ) : null}
          </div>
          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 4, fontSize: 10, fontWeight: 700, color: 'var(--cv-neutral-500)' }}>
            <span style={{ borderRadius: 4, padding: '2px 6px', ...p }}>{priority}</span>
            {noDescription ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, borderRadius: 4, padding: '2px 6px', background: 'var(--cv-warning-50)', color: 'var(--cv-warning-700)' }}>
                <Icon name="alert-circle" size={11} />No description
              </span>
            ) : null}
            {matchScore != null ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--cv-blue-600)' }}>
                <Icon name="check-circle-2" size={11} />{matchScore}%
              </span>
            ) : null}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="calendar-clock" size={11} />Prep {prepDone}/{prepTotal}
            </span>
            {dueDate ? <span style={{ marginLeft: 'auto', color: 'var(--cv-neutral-700)' }}>{dueDate}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
