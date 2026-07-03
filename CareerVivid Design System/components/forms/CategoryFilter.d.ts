export interface CategoryFilterProps {
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}
