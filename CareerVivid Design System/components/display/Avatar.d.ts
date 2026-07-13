export interface AvatarProps {
  /** Image URL. Brand fallbacks live in assets/avatars/ */
  src?: string;
  /** Single-letter fallback when no image */
  initial?: string;
  /** Default 36 (extension header size) */
  size?: number;
  /** Fallback tint. Default "purple" */
  tone?: 'purple' | 'green' | 'amber';
  /** 2px white ring. Default true */
  ring?: boolean;
  style?: React.CSSProperties;
}
