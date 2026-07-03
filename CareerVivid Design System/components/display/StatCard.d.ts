export interface StatCardProps {
  /** Small bold muted title, e.g. "Active applications" */
  label: string;
  /** Big number/value */
  value: string | number;
  /** Lucide icon for the tinted well. Default "layout-dashboard" */
  icon?: string;
  /** IconWell tone. Default "purple" */
  tone?: 'purple' | 'softPurple' | 'amber' | 'green' | 'rose' | 'blue' | 'neutral';
  /** Optional small caption under the number */
  delta?: string;
  style?: React.CSSProperties;
}
