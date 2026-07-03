import React, { useState } from 'react';
import { Icon } from '../icons/Icon.jsx';
import { Button } from '../forms/Button.jsx';

const guideAvatarTones = [
  { background: '#f3f2ff', color: '#625bd5', ring: '#dfdcff' },
  { background: '#eef0ff', color: '#7069dc', ring: '#dfe2ff' },
  { background: '#f7f1ff', color: '#7c5fd6', ring: '#eadfff' },
  { background: '#f5f7ff', color: '#5c62d6', ring: '#e0e5ff' },
];

const guideScoreTones = {
  high: { background: '#fff1f2', color: '#be123c', ring: '#fecdd3' },
  medium: { background: '#fffbeb', color: '#b45309', ring: '#fde68a' },
  low: { background: '#eef9f2', color: '#15803d', ring: '#cfe8d5' },
};

/**
 * Company interview guide card (Interview Studio).
 */
export function CompanyGuideCard({ company, role, difficulty = 'medium', difficultyLabel, topics = [], toneIndex = 0, actionLabel = 'Practice', onAction, style }) {
  const [hover, setHover] = useState(false);
  const avatar = guideAvatarTones[toneIndex % guideAvatarTones.length];
  const score = guideScoreTones[difficulty] || guideScoreTones.medium;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? 'var(--cv-purple-25)' : '#ffffff',
        border: `1px solid ${hover ? 'var(--cv-purple-200)' : 'var(--cv-border-product)'}`,
        borderRadius: 12,
        padding: 16,
        boxShadow: hover ? 'var(--cv-shadow-card-hover)' : 'var(--cv-shadow-card)',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'all var(--cv-duration-normal) var(--cv-ease-standard)',
        fontFamily: 'var(--cv-font-body)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, flexShrink: 0, borderRadius: 8, background: avatar.background, color: avatar.color, boxShadow: `0 0 0 1px ${avatar.ring}`, fontSize: 15, fontWeight: 800, fontFamily: 'var(--cv-font-heading)' }}>
          {(company || '?').slice(0, 1)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--cv-neutral-950)' }}>{company}</h4>
            <span style={{ borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 700, background: score.background, color: score.color, boxShadow: `0 0 0 1px ${score.ring}`, whiteSpace: 'nowrap' }}>
              {difficultyLabel || `${difficulty[0].toUpperCase()}${difficulty.slice(1)} difficulty`}
            </span>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 600, color: 'var(--cv-neutral-500)' }}>{role}</p>
        </div>
      </div>
      {topics.length > 0 ? (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {topics.map((topic) => (
            <span key={topic} style={{ borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, background: 'var(--cv-neutral-100)', color: 'var(--cv-neutral-600)' }}>
              {topic}
            </span>
          ))}
        </div>
      ) : null}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button variant="soft" size="sm" icon="mic" onClick={onAction} style={{ flex: 1 }}>
          {actionLabel}
        </Button>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid var(--cv-border-product)', background: '#ffffff', color: hover ? 'var(--cv-purple-600)' : 'var(--cv-neutral-400)', transition: 'color var(--cv-duration-fast) var(--cv-ease-standard)' }}>
          <Icon name="external-link" size={14} />
        </span>
      </div>
    </div>
  );
}
