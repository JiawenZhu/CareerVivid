/** @startingPoint section="Primitives" subtitle="Primary / soft-purple / neutral / danger actions" viewport="700x260" */
export interface ButtonProps {
  /** Visual variant. Default "primary". Purple only for primary CTAs; "soft" for secondary helpful actions; "danger" sparse destructive only. */
  variant?: 'primary' | 'soft' | 'neutral' | 'danger';
  /** Height: sm 32px, md 36px, lg 44px. Default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Optional leading Lucide icon name */
  icon?: string;
  /** Short verb phrase, sentence case */
  children: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}
