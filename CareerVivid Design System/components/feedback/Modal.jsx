import React from 'react';
import { Icon } from '../icons/Icon.jsx';

/**
 * Modal dialog: 20px radius, big 800 heading, deep soft shadow, gray-navy backdrop.
 * Render inline (position:absolute wrapper) or fixed depending on context.
 */
export function Modal({ title, children, onClose, actions, width = 440, fixed = true, style }) {
  return (
    <div
      style={{
        position: fixed ? 'fixed' : 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(17, 24, 39, 0.45)',
        zIndex: 50,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: width,
          background: 'var(--cv-surface)',
          border: '1px solid var(--cv-border-product)',
          borderRadius: 20,
          boxShadow: 'var(--cv-shadow-modal)',
          padding: 24,
          fontFamily: 'var(--cv-font-body)',
          ...style,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--cv-font-heading)', fontSize: 20, fontWeight: 800, color: 'var(--cv-text-heading-product)' }}>{title}</h3>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--cv-neutral-400)', cursor: 'pointer' }}
            >
              <Icon name="x" size={16} />
            </button>
          ) : null}
        </div>
        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 500, lineHeight: 1.6, color: 'var(--cv-text-body-product)' }}>{children}</div>
        {actions ? <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>{actions}</div> : null}
      </div>
    </div>
  );
}
