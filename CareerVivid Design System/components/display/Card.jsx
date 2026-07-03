import React, { useState } from 'react';

/**
 * CareerVivid card. "product" = white workspace card; "warm" = public warm-paper card.
 * hoverable adds the -2px lift + purple-tint border.
 */
export function Card({ variant = 'product', hoverable = false, padding = 16, radius, children, onClick, style }) {
  const [hover, setHover] = useState(false);
  const warm = variant === 'warm';
  const lifted = hoverable && hover;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: lifted ? 'var(--cv-purple-25)' : warm ? 'var(--cv-surface-warm-card)' : 'var(--cv-surface)',
        border: `1px solid ${lifted ? 'var(--cv-purple-200)' : warm ? 'var(--cv-border-warm)' : 'var(--cv-border-product)'}`,
        borderRadius: radius ?? 12,
        padding,
        boxShadow: lifted ? 'var(--cv-shadow-card-hover)' : warm ? 'var(--cv-shadow-warm-card)' : 'var(--cv-shadow-card)',
        transform: lifted ? 'translateY(-2px)' : 'none',
        transition: 'all var(--cv-duration-normal) var(--cv-ease-standard)',
        cursor: onClick ? 'pointer' : undefined,
        fontFamily: 'var(--cv-font-body)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Amber uppercase eyebrow label for warm public sections.
 */
export function Eyebrow({ children, style }) {
  return (
    <p
      style={{
        margin: 0,
        color: 'var(--cv-text-eyebrow)',
        fontFamily: 'var(--cv-font-body)',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </p>
  );
}
