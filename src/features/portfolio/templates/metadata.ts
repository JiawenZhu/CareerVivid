
export interface TemplateMetadata {
    id: string;
    name: string;
    description: string;
    category: 'Core' | 'Technology' | 'Creative' | 'Professional' | 'Healthcare';
    thumbnailUrl: string;
}

export const TEMPLATE_METADATA: Record<string, TemplateMetadata> = {
    minimalist: {
        id: 'minimalist',
        name: 'The Minimalist',
        description: 'Clean, typography-focused layout for developers.',
        category: 'Core',
        thumbnailUrl: 'https://placehold.co/600x400/10b981/ffffff?text=Minimalist'
    },
    visual: {
        id: 'visual',
        name: 'The Visual',
        description: 'Immersive grid layout for designers and creatives.',
        category: 'Core',
        thumbnailUrl: 'https://placehold.co/600x400/8b5cf6/ffffff?text=Visual'
    },
    corporate: {
        id: 'corporate',
        name: 'The Corporate',
        description: 'Structured and professional for executives.',
        category: 'Core',
        thumbnailUrl: 'https://placehold.co/600x400/3b82f6/ffffff?text=Corporate'
    },
    dev_terminal: {
        id: 'dev_terminal',
        name: 'Dev Terminal',
        description: 'Matrix-style terminal theme for backend engineers.',
        category: 'Technology',
        thumbnailUrl: 'https://placehold.co/600x400/000000/00ff00?text=Terminal'
    },
    saas_modern: {
        id: 'saas_modern',
        name: 'SaaS Modern',
        description: 'Linear-style gradient design for product founders.',
        category: 'Technology',
        thumbnailUrl: 'https://placehold.co/600x400/2563eb/ffffff?text=SaaS+Modern'
    },
    ux_folio: {
        id: 'ux_folio',
        name: 'UX Folio',
        description: 'Case study focused layout for product designers.',
        category: 'Creative',
        thumbnailUrl: 'https://placehold.co/600x400/ec4899/ffffff?text=UX+Folio'
    },
    creative_dark: {
        id: 'creative_dark',
        name: 'Cinematic Dark',
        description: 'Bold, dark mode portfolio with large typography.',
        category: 'Creative',
        thumbnailUrl: 'https://placehold.co/600x400/111827/ffffff?text=Cinematic'
    },
    bento_personal: {
        id: 'bento_personal',
        name: 'Bento One',
        description: 'Bento-grid style personal site for generalists.',
        category: 'Creative',
        thumbnailUrl: 'https://placehold.co/600x400/f59e0b/ffffff?text=Bento'
    },
    legal_trust: {
        id: 'legal_trust',
        name: 'Legal Trust',
        description: 'Serif fonts and classic layout for legal professionals.',
        category: 'Professional',
        thumbnailUrl: 'https://placehold.co/600x400/4b5563/ffffff?text=Legal'
    },
    executive_brief: {
        id: 'executive_brief',
        name: 'Executive Brief',
        description: 'High-impact, concise overview for C-level leaders.',
        category: 'Professional',
        thumbnailUrl: 'https://placehold.co/600x400/1e3a8a/ffffff?text=Executive'
    },
    writer_editorial: {
        id: 'writer_editorial',
        name: 'Editorial Writer',
        description: 'Newspaper-style layout for journalists and copywriters.',
        category: 'Professional',
        thumbnailUrl: 'https://placehold.co/600x400/d97706/ffffff?text=Editorial'
    },
    academic_research: {
        id: 'academic_research',
        name: 'Academic Research',
        description: 'Publication-heavy layout for researchers and scientists.',
        category: 'Professional',
        thumbnailUrl: 'https://placehold.co/600x400/059669/ffffff?text=Academic'
    },
    medical_care: {
        id: 'medical_care',
        name: 'Medical Care',
        description: 'Clean, trustworthy design for healthcare professionals.',
        category: 'Healthcare',
        thumbnailUrl: 'https://placehold.co/600x400/06b6d4/ffffff?text=Medical'
    }
};

export const TEMPLATE_CATEGORIES = ['Core', 'Technology', 'Creative', 'Professional', 'Healthcare'] as const;
