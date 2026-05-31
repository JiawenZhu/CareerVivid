
export interface TemplateMetadata {
    id: string;
    name: string;
    description: string;
    category: 'Core' | 'Technology' | 'Professional';
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
        description: 'Terminal-style theme with editable skills, projects, and work history.',
        category: 'Technology',
        thumbnailUrl: 'https://placehold.co/600x400/000000/00ff00?text=Terminal'
    },
    writer_editorial: {
        id: 'writer_editorial',
        name: 'Editorial Writer',
        description: 'Newspaper-style layout for journalists and copywriters.',
        category: 'Professional',
        thumbnailUrl: 'https://placehold.co/600x400/d97706/ffffff?text=Editorial'
    }
};

export const TEMPLATE_CATEGORIES = ['Core', 'Technology', 'Professional'] as const;
