import { PortfolioData } from '../types/portfolio';

export const EDITABLE_PORTFOLIO_TEMPLATE_IDS = [
    'minimalist',
    'corporate',
    'dev_terminal',
    'writer_editorial'
] as const;

export type EditablePortfolioTemplateId = typeof EDITABLE_PORTFOLIO_TEMPLATE_IDS[number];

export const isEditablePortfolioTemplate = (templateId?: string | null): templateId is EditablePortfolioTemplateId => {
    return !!templateId && EDITABLE_PORTFOLIO_TEMPLATE_IDS.includes(templateId as EditablePortfolioTemplateId);
};

export const normalizeEditablePortfolioTemplateId = (
    templateId?: string | null,
    fallback: EditablePortfolioTemplateId = 'minimalist'
): PortfolioData['templateId'] => {
    return (isEditablePortfolioTemplate(templateId) ? templateId : fallback) as PortfolioData['templateId'];
};
