import React, { useState } from 'react';

/**
 * Standard text field. 42–52px tall, white, #d1d5db border, purple focus ring.
 */
export function Input({ label, placeholder, value, onChange, type = 'text', height = 42, disabled, style }) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: 'block', fontFamily: 'var(--cv-font-body)', ...style }}>
      {label ? (
        <span style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'var(--cv-text-heading-product)' }}>
          {label}
        </span>
      ) : null}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          boxSizing: 'border-box',
          width: '100%',
          height,
          padding: '0 12px',
          borderRadius: 8,
          background: 'var(--cv-surface)',
          border: focus ? '1px solid var(--cv-action-primary)' : '1px solid var(--cv-neutral-300)',
          boxShadow: focus ? '0 0 0 3px var(--cv-focus-ring)' : 'none',
          outline: 'none',
          fontFamily: 'var(--cv-font-body)',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--cv-text-heading-product)',
          opacity: disabled ? 0.5 : 1,
          transition: 'border-color var(--cv-duration-fast) var(--cv-ease-standard), box-shadow var(--cv-duration-fast) var(--cv-ease-standard)',
        }}
      />
    </label>
  );
}
