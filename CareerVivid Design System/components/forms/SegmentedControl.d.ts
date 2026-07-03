export interface SegmentedControlProps {
  /** Options as strings or { value, label } */
  options: Array<string | { value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}
