import React, { useState } from 'react';
import { Icon } from '../icons/Icon.jsx';

/**
 * Large rounded search bar (Interview Studio company-guide search).
 * 46–52px tall, 16px radius, translucent gray resting → white focused.
 */
export function SearchInput({ placeholder = 'Search', value, onChange, height = 48, style }) {
  const [focus, setFocus] = useState(false);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height,
        padding: '0 16px',
        borderRadius: 16,
        background: focus ? '#ffffff' : 'rgba(249, 250, 251, 0.8)',
        border: focus ? '1px solid var(--cv-neutral-400)' : '1px solid var(--cv-border-product)',
        boxShadow: focus ? 'var(--cv-shadow-input-focus)' : 'none',
        transition: 'all var(--cv-duration-normal) var(--cv-ease-standard)',
        ...style,
      }}
    >
      <span style={{ display: 'flex', color: focus ? 'var(--cv-neutral-700)' : 'var(--cv-neutral-400)' }}>
        <Icon name="search" size={17} />
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'var(--cv-font-body)',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--cv-neutral-900)',
        }}
      />
    </div>
  );
}
