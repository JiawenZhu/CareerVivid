export type AIOptimizerRuleId = 'actionVerbs' | 'quantifiableMetrics' | 'similarBullets' | 'bulletDensity';

export interface RewriteState {
    bulletIndex: number;
    jobId: string;
    improvedText: string;
    editedText: string;
    explanation: string;
}
