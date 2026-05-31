import React, { ComponentType, LazyExoticComponent } from 'react';
import { PortfolioData } from '../types/portfolio';
import { normalizeEditablePortfolioTemplateId } from './editablePortfolioTemplates';

type PortfolioTemplateComponent = ComponentType<any>;
type TemplateLoader = () => Promise<{ default: PortfolioTemplateComponent }>;

const cardPhotoLoader = () => import('../templates/nfc/CardPhoto');

const templateLoaders: Record<string, TemplateLoader> = {
    minimalist: () => import('../templates/MinimalTemplate'),
    corporate: () => import('../templates/CorporateTemplate'),
    dev_terminal: () => import('../templates/general/Gen_Dev_Terminal'),
    writer_editorial: () => import('../templates/WriterEditorial'),
    linktree_minimal: () => import('../templates/linkinbio/LinkTreeMinimal'),
    linktree_visual: () => import('../templates/linkinbio/LinkTreeVisual'),
    linktree_corporate: () => import('../templates/linkinbio/LinkTreeCorporate'),
    linktree_bento: () => import('../templates/linkinbio/LinkTreeBento'),
    card_minimal: () => import('../templates/nfc/CardMinimal'),
    card_photo: cardPhotoLoader,
    card_modern: () => import('../templates/nfc/CardModern'),
    brutalist_yellow: cardPhotoLoader,
    brutalist_pink: cardPhotoLoader,
    brutalist_blue: cardPhotoLoader,
    brutalist_bw: cardPhotoLoader,
    brutalist_orange: cardPhotoLoader,
    pro_executive: cardPhotoLoader,
    pro_clean: cardPhotoLoader,
    creative_gradient: cardPhotoLoader,
    card_creative_dark: cardPhotoLoader,
    nature_calm: cardPhotoLoader,
    tech_future: cardPhotoLoader,
    abstract_art: cardPhotoLoader,
};

const lazyTemplateCache = new Map<string, LazyExoticComponent<PortfolioTemplateComponent>>();

export const resolvePortfolioTemplateKey = (portfolioData: PortfolioData) => {
    if (portfolioData.mode === 'linkinbio') {
        const id = portfolioData.templateId as string;
        return ['linktree_minimal', 'linktree_visual', 'linktree_corporate', 'linktree_bento'].includes(id)
            ? id
            : 'linktree_visual';
    }

    if (portfolioData.mode === 'business_card') {
        const id = portfolioData.templateId as string;
        return templateLoaders[id] ? id : 'card_minimal';
    }

    const templateId = normalizeEditablePortfolioTemplateId(portfolioData.templateId as string);
    return templateLoaders[templateId] ? templateId : 'minimalist';
};

export const getLazyPortfolioTemplate = (templateId: string) => {
    const safeTemplateId = templateLoaders[templateId] ? templateId : 'minimalist';
    const cachedTemplate = lazyTemplateCache.get(safeTemplateId);
    if (cachedTemplate) return cachedTemplate;

    const LazyTemplate = React.lazy(templateLoaders[safeTemplateId]);
    lazyTemplateCache.set(safeTemplateId, LazyTemplate);
    return LazyTemplate;
};
