/** @startingPoint section="Job Tracker" subtitle="Compact Kanban pipeline row" viewport="700x300" */
export interface JobCardProps {
  title: string;
  company: string;
  /** Default "Medium" */
  priority?: 'High' | 'Medium' | 'Low';
  /** Match percentage 0-100; omit to hide */
  matchScore?: number;
  /** Prep fields completed (of prepTotal). Default 0 */
  prepDone?: number;
  /** Default 5 */
  prepTotal?: number;
  /** Short date like "Jul 8" */
  dueDate?: string;
  /** Show the open-URL arrow. Default true */
  hasUrl?: boolean;
  /** Show the "No description" warning chip */
  noDescription?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
