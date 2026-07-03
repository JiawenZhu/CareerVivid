export interface SidebarItemDef {
  id?: string;
  label?: string;
  /** Lucide icon name */
  icon?: string;
  /** Small purple count/label chip */
  badge?: string;
  /** If set, renders an uppercase section label instead of an item */
  section?: string;
}

export interface SidebarProps {
  items: SidebarItemDef[];
  activeId?: string;
  onSelect?: (id: string) => void;
  /** AI credit meter: { label?, used, total } */
  credits?: { label?: string; used: number; total: number };
  /** Default 232 */
  width?: number;
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}
