import React from 'react';
import { Icon } from './Icon.jsx';

const iconWellTones = {
  purple: { background: 'var(--cv-purple-50)', color: 'var(--cv-purple-600)' },
  softPurple: { background: 'var(--cv-purple-75)', color: 'var(--cv-purple-500)' },
  amber: { background: 'var(--cv-amber-50)', color: '#9a651f' },
  green: { background: 'var(--cv-success-50)', color: 'var(--cv-success-600)' },
  rose: { background: '#fff6f6', color: '#b64a5a' },
  blue: { background: 'var(--cv-blue-50)', color: 'var(--cv-blue-600)' },
  neutral: { background: 'var(--cv-neutral-100)', color: 'var(--cv-neutral-500)' },
};

/**
 * Tinted icon well — CareerVivid's standard icon treatment.
 * 28–40px square, 8–12px radius, tinted background with matching icon color.
 */
export function IconWell({ icon, tone = 'purple', size = 32, iconSize, style }) {
  const t = iconWellTones[tone] || iconWellTones.purple;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: size >= 36 ? 12 : 8,
        background: t.background,
        color: t.color,
        ...style,
      }}
    >
      <Icon name={icon} size={iconSize || Math.round(size * 0.5)} />
    </div>
  );
}
