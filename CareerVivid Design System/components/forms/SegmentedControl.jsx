import React, { useState } from 'react';

/**
 * Segmented control — gray track, white active pill with purple text.
 */
export function SegmentedControl({ options, value, onChange, style }) {
  const [internal, setInternal] = useState(value ?? (options && options[0] && (options[0].value ?? options[0])));
  const current = value !== undefined ? value : internal;
  const items = (options || []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 2,
        padding: 4,
        borderRadius: 8,
        background: 'var(--cv-neutral-100)',
        ...style,
      }}
    >
      {items.map((item) => {
        const active = item.value === current;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setInternal(item.value);
              if (onChange) onChange(item.value);
            }}
            style={{
              height: 34,
              padding: '0 14px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: active ? '#ffffff' : 'transparent',
              color: active ? 'var(--cv-purple-600)' : 'var(--cv-neutral-600)',
              boxShadow: active ? 'var(--cv-shadow-segment-active)' : 'none',
              fontFamily: 'var(--cv-font-body)',
              fontSize: 13,
              fontWeight: 700,
              transition: 'all var(--cv-duration-fast) var(--cv-ease-standard)',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
