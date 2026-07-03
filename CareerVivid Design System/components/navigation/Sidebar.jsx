import React, { useState } from 'react';
import { Icon } from '../icons/Icon.jsx';

function SidebarItem({ item, active, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        height: 36,
        padding: '0 10px',
        borderRadius: 8,
        border: active ? '1px solid var(--cv-action-soft-border)' : '1px solid transparent',
        background: active ? 'var(--cv-action-soft-bg)' : 'transparent',
        color: active ? 'var(--cv-action-soft-text)' : hover ? 'var(--cv-neutral-900)' : '#64748b',
        cursor: 'pointer',
        fontFamily: 'var(--cv-font-body)',
        fontSize: 13,
        fontWeight: 600,
        textAlign: 'left',
        transition: 'all var(--cv-duration-fast) var(--cv-ease-standard)',
      }}
    >
      <Icon name={item.icon || 'layout-dashboard'} size={16} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
      {item.badge ? (
        <span style={{ borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 700, background: 'var(--cv-purple-50)', color: 'var(--cv-purple-600)' }}>{item.badge}</span>
      ) : null}
    </button>
  );
}

/**
 * App workspace sidebar: white, subtle border, soft-purple active item, credit meter.
 */
export function Sidebar({ items = [], activeId, onSelect, credits, width = 232, footer, style }) {
  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width,
        flexShrink: 0,
        padding: 12,
        background: 'var(--cv-surface)',
        borderRight: '1px solid var(--cv-border-subtle)',
        fontFamily: 'var(--cv-font-body)',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {items.map((item) =>
        item.section ? (
          <p key={item.section} style={{ margin: '14px 4px 6px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cv-neutral-400)' }}>
            {item.section}
          </p>
        ) : (
          <SidebarItem key={item.id} item={item} active={item.id === activeId} onClick={() => onSelect && onSelect(item.id)} />
        )
      )}
      <div style={{ flex: 1 }}></div>
      {credits ? (
        <div style={{ padding: 10, borderRadius: 10, border: '1px solid var(--cv-border-product)', background: 'var(--cv-surface-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
            <span style={{ color: 'var(--cv-neutral-900)' }}>{credits.label || 'AI credits'}</span>
            <span style={{ color: 'var(--cv-neutral-500)' }}>{credits.used}/{credits.total}</span>
          </div>
          <div style={{ marginTop: 8, height: 6, borderRadius: 999, background: 'var(--cv-neutral-200)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 999, background: 'var(--cv-purple-600)', width: `${Math.min(100, (credits.used / credits.total) * 100)}%` }}></div>
          </div>
        </div>
      ) : null}
      {footer}
    </nav>
  );
}
