import React from 'react';
import { Card } from './Card.jsx';
import { IconWell } from '../icons/IconWell.jsx';

/**
 * Dashboard stat card: tiny bold muted title, 24–32px/800 number, tinted icon well.
 */
export function StatCard({ label, value, icon = 'layout-dashboard', tone = 'purple', delta, style }) {
  return (
    <Card radius={16} padding={16} style={style}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b' }}>{label}</p>
          <p style={{ margin: '6px 0 0', fontFamily: 'var(--cv-font-heading)', fontSize: 28, fontWeight: 800, lineHeight: 1.1, color: 'var(--cv-text-heading-product)' }}>
            {value}
          </p>
          {delta ? (
            <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 600, color: 'var(--cv-text-muted)' }}>{delta}</p>
          ) : null}
        </div>
        <IconWell icon={icon} tone={tone} size={36} />
      </div>
    </Card>
  );
}
