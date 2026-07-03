export interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  /** Action buttons row (right-aligned) */
  actions?: React.ReactNode;
  /** Max width. Default 440 */
  width?: number;
  /** position:fixed overlay (true) vs absolute within a relative parent. Default true */
  fixed?: boolean;
  style?: React.CSSProperties;
}
