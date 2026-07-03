import React, { useState } from 'react';
import { Icon } from '../icons/Icon.jsx';

const buttonVariants = {
  primary: {
    base: { background: 'var(--cv-action-primary)', color: '#ffffff', border: '1px solid transparent' },
    hover: { background: 'var(--cv-action-primary-hover)' },
  },
  soft: {
    base: { background: 'var(--cv-action-soft-bg)', color: 'var(--cv-action-soft-text)', border: '1px solid var(--cv-action-soft-border)' },
    hover: { background: 'var(--cv-action-soft-hover)' },
  },
  neutral: {
    base: { background: 'var(--cv-surface)', color: 'var(--cv-neutral-700)', border: '1px solid var(--cv-border-product)' },
    hover: { background: 'var(--cv-neutral-50)' },
  },
  danger: {
    base: { background: 'var(--cv-danger-50)', color: 'var(--cv-danger-700)', border: '1px solid var(--cv-danger-200)' },
    hover: { background: 'var(--cv-danger-100)' },
  },
};

const buttonSizes = {
  sm: { height: 32, padding: '0 12px', fontSize: 12, borderRadius: 8, gap: 6, iconSize: 15 },
  md: { height: 36, padding: '0 14px', fontSize: 13, borderRadius: 8, gap: 6, iconSize: 16 },
  lg: { height: 44, padding: '0 18px', fontSize: 14, borderRadius: 12, gap: 8, iconSize: 18 },
};

/**
 * CareerVivid button. Labels are short verb phrases in sentence case
 * ("Save to tracker", "Tailor resume"). Purple is for primary actions only.
 */
export function Button({ variant = 'primary', size = 'md', icon, children, disabled, fullWidth, onClick, style, type = 'button' }) {
  const [hover, setHover] = useState(false);
  const v = buttonVariants[variant] || buttonVariants.primary;
  const s = buttonSizes[size] || buttonSizes.md;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        height: s.height,
        padding: s.padding,
        borderRadius: s.borderRadius,
        fontFamily: 'var(--cv-font-body)',
        fontSize: s.fontSize,
        fontWeight: 700,
        lineHeight: 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : undefined,
        transition: 'background var(--cv-duration-fast) var(--cv-ease-standard), border-color var(--cv-duration-fast) var(--cv-ease-standard)',
        whiteSpace: 'nowrap',
        ...v.base,
        ...(hover && !disabled ? v.hover : null),
        ...style,
      }}
    >
      {icon ? <Icon name={icon} size={s.iconSize} /> : null}
      {children}
    </button>
  );
}
