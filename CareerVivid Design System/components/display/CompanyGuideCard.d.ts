export interface CompanyGuideCardProps {
  company: string;
  /** Role line under the company, e.g. "Software Engineer · Onsite loop" */
  role: string;
  /** Difficulty score chip tone: high=rose, medium=amber, low=green. Default "medium" */
  difficulty?: 'high' | 'medium' | 'low';
  /** Custom chip text; default "<Difficulty> difficulty" */
  difficultyLabel?: string;
  /** Topic chips */
  topics?: string[];
  /** Rotates the 4 purple avatar tints */
  toneIndex?: number;
  /** Default "Practice" */
  actionLabel?: string;
  onAction?: () => void;
  style?: React.CSSProperties;
}
