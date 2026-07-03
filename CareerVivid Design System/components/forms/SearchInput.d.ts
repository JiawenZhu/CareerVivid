export interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  /** 46–52px per spec. Default 48 */
  height?: number;
  style?: React.CSSProperties;
}
