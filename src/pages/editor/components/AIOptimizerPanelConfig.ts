import type { AIOptimizerRuleId } from './AIOptimizerPanelTypes';

export const getCoachingDetails = (ruleId: AIOptimizerRuleId) => {
    switch (ruleId) {
        case 'actionVerbs':
            return {
                title: 'Action Verb Repetition',
                themeClass: 'from-purple-500/10 to-pink-500/10 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200/50 dark:border-purple-800/30',
                iconClass: 'bg-purple-500 text-white shadow-md shadow-purple-500/20',
                whyTitle: 'Why start sentences with active verbs?',
                explanation: 'Repetitive verbs make your resume seem monotonous. Using a rich variety of active verbs keeps the hiring manager engaged and demonstrates a wider degree of communication skills and leadership abilities.'
            };
        case 'quantifiableMetrics':
            return {
                title: 'Metrics and Numbers',
                themeClass: 'from-indigo-500/10 to-blue-500/10 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200/50 dark:border-indigo-800/30',
                iconClass: 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20',
                whyTitle: 'Why include quantifiable numbers?',
                explanation: 'A great achievement bullet point should include specific, measurable outcomes such as percentages, time savings, team sizes, or revenue targets. Numbers show the direct scope, impact, and scale of your professional contributions.'
            };
        case 'similarBullets':
            return {
                title: 'Distinct Achievements',
                themeClass: 'from-blue-500/10 to-sky-500/10 dark:from-blue-900/20 dark:to-sky-900/20 border-blue-200/50 dark:border-blue-800/30',
                iconClass: 'bg-blue-500 text-white shadow-md shadow-blue-500/20',
                whyTitle: 'Why vary achievement focus areas?',
                explanation: 'Every achievement in your resume should highlight a different skill or accomplishment. Having identical or highly similar bullet points across different jobs limits the breadth of your represented abilities.'
            };
        case 'bulletDensity':
            return {
                title: 'Ideal Bullet Densities',
                themeClass: 'from-amber-500/10 to-orange-500/10 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/50 dark:border-amber-800/30',
                iconClass: 'bg-amber-500 text-white shadow-md shadow-amber-500/20',
                whyTitle: 'Why aim for 3-6 bullet achievements?',
                explanation: 'A good experience description should strike the perfect balance of detail and readability. Bullet points that are too short (1-2 lines) look incomplete, long lists (7+ lines) lead to reader fatigue, and plain paragraphs are extremely hard for recruiters to scan in 6 seconds.'
            };
    }
};

export const buildRewriteInstruction = (
    ruleId: AIOptimizerRuleId,
    selectedVerb: string,
    issueType?: 'too_few' | 'too_many' | 'paragraph'
) => {
    if (ruleId === 'actionVerbs') {
        return `Vary the action verbs in this resume achievement to replace the word "${selectedVerb || 'repeated verb'}" with a fresh, strong alternative action verb. Keep the content and accomplishments identical but improve word choice.`;
    }
    if (ruleId === 'quantifiableMetrics') {
        return 'Rewrite this resume achievement to integrate quantifiable metrics, percentages, dollar amounts, or business outcome numbers. If actual numbers are unknown, simulate a highly realistic, professional estimation to show how it would look.';
    }
    if (ruleId === 'similarBullets') {
        return 'Rewrite this resume achievement to focus on a completely different skill or professional outcome. Make it professional, highly impactful, and distinct.';
    }
    if (issueType === 'paragraph') {
        return 'Convert this plain-paragraph experience description into a beautifully written, bulleted list of 3-4 professional achievements. Output the list cleanly formatted where each point starts with a new line and a dash (e.g. \\n- Suggestion).';
    }
    if (issueType === 'too_few') {
        return 'This work experience is too short. Suggest 1-2 additional high-impact professional achievements tailored to the role, and combine them with the existing achievement. Output the complete set as a cleanly formatted list of 3-5 markdown bullets (each starting with a newline and a dash, e.g. \\n- Suggestion).';
    }
    if (issueType === 'too_many') {
        return 'This work experience is too long and cluttered. Consolidate these bullet achievements into a highly professional, concise, and scannable list of 4-5 key bullet points (each starting with a newline and a dash, e.g. \\n- Suggestion).';
    }
    return '';
};
