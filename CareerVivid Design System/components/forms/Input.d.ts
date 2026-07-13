export interface InputProps {
  /** Optional small bold label above the field */
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: string;
  /** 42–52px per spec. Default 42 */
  height?: number;
  disabled?: boolean;
  style?: React.CSSProperties;
}
