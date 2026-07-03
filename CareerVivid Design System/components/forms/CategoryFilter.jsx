import React, { useState } from 'react';

/**
 * Category filter pills (Interview Studio guide categories).
 * Active = near-black; inactive = white with purple-tint hover.
 */
export function CategoryFilter({ options, value, onChange, style }) {
  const [internal, setInternal] = useState(value ?? (options && options[0]));
  const current = value !== undefined ? value : internal;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, ...style }}>
      {(options || []).map((opt) => {
        const active = opt === current;
        return (
          <FilterPill
            key={opt}
            label={opt}
            active={active}
            onClick={() => {
              setInternal(opt);
              if (onChange) onChange(opt);
            }}
          />
        );
      })}
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: 32,
        padding: '0 14px',
        borderRadius: 999,
        cursor: 'pointer',
        fontFamily: 'var(--cv-font-body)',
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        transition: 'all var(--cv-duration-fast) var(--cv-ease-standard)',
        background: active ? 'var(--cv-neutral-950)' : hover ? 'var(--cv-purple-25)' : '#ffffff',
        color: active ? '#ffffff' : hover ? 'var(--cv-purple-600)' : 'var(--cv-neutral-600)',
        border: active ? '1px solid var(--cv-neutral-950)' : hover ? '1px solid var(--cv-purple-200)' : '1px solid var(--cv-border-product)',
        boxShadow: active ? '0 1px 2px rgba(16, 24, 40, 0.08)' : 'none',
      }}
    >
      {label}
    </button>
  );
}
