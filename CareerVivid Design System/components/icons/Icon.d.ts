/** @startingPoint section="Primitives" subtitle="Lucide icon, stroke currentColor" viewport="700x220" */
export interface IconProps {
  /** Lucide icon name in kebab-case, e.g. "briefcase", "wand-2" */
  name: string;
  /** Pixel size (width = height). UI uses 11–18px. Default 16 */
  size?: number;
  /** Stroke width. Default 2 */
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}
