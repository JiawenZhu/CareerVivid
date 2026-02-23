export interface Project {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string; // Changed from imageUrl to match code
    demoUrl?: string;
    repoUrl?: string;
    tags: string[];
    technologies?: string[]; // Added this as optional since it appears in Editor
}

export interface PortfolioData {
    theme: 'minimal' | 'visual' | 'corporate';
    hero: {
        headline: string;
        subheadline: string;
        ctaText: string;
    };
    about: {
        bio: string;
        skills: string[];
    };
    projects: Project[];
    socials: {
        github?: string;
        linkedin?: string;
        twitter?: string;
        email?: string;
    };
}
