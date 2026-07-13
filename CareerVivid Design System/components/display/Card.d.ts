/** @startingPoint section="Primitives" subtitle="Product + warm-public cards" viewport="700x260" */
export interface CardProps {
  /** "product" = white workspace card; "warm" = translucent warm-paper card. Default "product" */
  variant?: 'product' | 'warm';
  /** Adds -2px hover lift, purple-tint border + shadow */
  hoverable?: boolean;
  /** 16–24px per spec. Default 16 */
  padding?: number | string;
  /** Default 12px (use 16 for large cards) */
  radius?: number;
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export interface EyebrowProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}
