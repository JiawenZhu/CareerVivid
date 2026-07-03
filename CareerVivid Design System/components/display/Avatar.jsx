import React from 'react';

/**
 * Circle avatar with 2px white ring. Falls back to a tinted initial.
 * Brand fallback images: assets/avatars/careervivid-rabbit-glasses.jpg (neutral default),
 * careervivid-rabbit-bow.jpg.
 */
export function Avatar({ src, initial, size = 36, tone = 'purple', ring = true, style }) {
  const tones = {
    purple: { background: 'var(--cv-purple-50)', color: 'var(--cv-purple-600)' },
    green: { background: '#f7fff8', color: '#15803d' },
    amber: { background: 'var(--cv-amber-50)', color: '#a16207' },
  };
  const t = tones[tone] || tones.purple;
  const common = {
    width: size,
    height: size,
    borderRadius: 999,
    flexShrink: 0,
    boxShadow: ring ? '0 0 0 2px #ffffff' : 'none',
  };
  if (src) {
    return <img src={src} alt="" style={{ ...common, objectFit: 'cover', display: 'block', ...style }} />;
  }
  return (
    <div
      style={{
        ...common,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: t.background,
        color: t.color,
        fontFamily: 'var(--cv-font-body)',
        fontSize: Math.round(size * 0.42),
        fontWeight: 700,
        ...style,
      }}
    >
      {initial || '?'}
    </div>
  );
}
