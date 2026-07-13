import React from 'react';
import { LUCIDE_ICONS } from './lucideIconData.js';

/**
 * Lucide icon (v0.344.0 — the app's icon system via lucide-react).
 * Renders stroke-currentColor at the given size (default 16).
 */
export function Icon({ name, size = 16, strokeWidth = 2, className, style }) {
  const inner = LUCIDE_ICONS[name];
  if (!inner) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
