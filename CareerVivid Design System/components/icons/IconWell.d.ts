export interface IconWellProps {
  /** Lucide icon name */
  icon: string;
  /** Tint tone. Default "purple" */
  tone?: 'purple' | 'softPurple' | 'amber' | 'green' | 'rose' | 'blue' | 'neutral';
  /** Square size in px, 28–40 typical. Default 32 */
  size?: number;
  /** Override icon size (default 50% of well) */
  iconSize?: number;
  style?: React.CSSProperties;
}
