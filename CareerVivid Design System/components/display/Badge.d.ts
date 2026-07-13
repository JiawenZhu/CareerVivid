export interface BadgeProps {
  /** Default "accent" (soft purple) */
  tone?: 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
  /** Leading 6px dot in the tone color */
  dot?: boolean;
  /** Pill (999px) vs 4px corner. Default true */
  pill?: boolean;
  /** Show tinted 1px border */
  bordered?: boolean;
  style?: React.CSSProperties;
}

export interface StatusDotProps {
  /** Pipeline status. Default "To Apply" */
  status?: 'To Apply' | 'Applied' | 'Interviewing' | 'Offered' | 'Rejected';
  /** Default 10 */
  size?: number;
  style?: React.CSSProperties;
}
