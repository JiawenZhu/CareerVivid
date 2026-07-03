import React from 'react';

const badgeTones = {
  accent: { background: 'var(--cv-purple-50)', color: 'var(--cv-purple-600)', border: 'var(--cv-purple-200)' },
  success: { background: 'var(--cv-success-50)', color: 'var(--cv-success-600)', border: 'var(--cv-success-200)' },
  warning: { background: 'var(--cv-warning-50)', color: 'var(--cv-warning-700)', border: 'var(--cv-warning-200)' },
  danger: { background: 'var(--cv-danger-50)', color: 'var(--cv-danger-700)', border: 'var(--cv-danger-200)' },
  info: { background: 'var(--cv-blue-50)', color: 'var(--cv-blue-600)', border: 'var(--cv-blue-100)' },
  neutral: { background: 'var(--cv-neutral-100)', color: 'var(--cv-neutral-600)', border: 'var(--cv-neutral-200)' },
};

/**
 * Status badge / chip. 10–11px/700, pill by default.
 */
export function Badge({ tone = 'accent', children, dot, pill = true, bordered = false, style }) {
  const t = badgeTones[tone] || badgeTones.accent;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        borderRadius: pill ? 999 : 4,
        background: t.background,
        color: t.color,
        border: bordered ? `1px solid ${t.border}` : '1px solid transparent',
        fontFamily: 'var(--cv-font-body)',
        fontSize: 11,
        fontWeight: 700,
        lineHeight: '16px',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot ? (
        <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', flexShrink: 0 }}></span>
      ) : null}
      {children}
    </span>
  );
}

/**
 * 10px pipeline status dot (To Apply / Applied / Interviewing / Offered / Rejected).
 */
export function StatusDot({ status = 'To Apply', size = 10, style }) {
  const colors = {
    'To Apply': 'var(--cv-status-to-apply)',
    'Applied': 'var(--cv-status-applied)',
    'Interviewing': 'var(--cv-status-interviewing)',
    'Offered': 'var(--cv-status-offered)',
    'Rejected': 'var(--cv-status-rejected)',
  };
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: 999,
        background: colors[status] || colors['To Apply'],
        flexShrink: 0,
        ...style,
      }}
    ></span>
  );
}
