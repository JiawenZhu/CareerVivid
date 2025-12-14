import {
    Skill,
    EmploymentHistory,
    Education,
    WebsiteLink,
    PersonalDetails
} from '../../../types';

export interface PortfolioProject {
    id: string;
    title: string;
    description: string;
    demoUrl?: string; // "Project URL"
    repoUrl?: string; // "GitHub Link"
    thumbnailUrl?: string; // "Thumbnail Image"
    tags: string[]; // Tech stack for this project
}

export interface PortfolioButton {
    id: string;
    label: string;
    url?: string;
    variant: 'primary' | 'secondary' | 'outline' | 'ghost';
    type?: 'link' | 'action'; // Distinguished type
    action?: 'theme_toggle' | 'scroll_to_contact' | 'download_resume'; // Specific actions
    style?: React.CSSProperties; // Allow inline style overrides
}

export interface PortfolioHero {
    headline: string;
    subheadline: string;
    avatarUrl?: string;
    ctaPrimaryLabel?: string;
    ctaPrimaryUrl?: string;
    ctaSecondaryLabel?: string;
    ctaSecondaryUrl?: string;
    buttons?: PortfolioButton[]; // Replaces fixed ctaPrimary/Secondary
}

export interface PortfolioData {
    id: string;
    userId: string;
    title: string; // Internal title
    templateId: 'minimalist' | 'visual' | 'corporate'
    | 'dev_terminal' | 'saas_modern'
    | 'ux_folio' | 'creative_dark'
    | 'legal_trust' | 'writer_editorial'
    | 'medical_care' | 'academic_research'
    | 'bento_personal' | 'executive_brief';
    section?: string; // For folder organization in dashboard

    // Web-specific sections
    hero: PortfolioHero;
    about: string; // Mapped from Resume Summary

    // Shared Data
    timeline: EmploymentHistory[]; // Work Experience
    education: Education[];
    techStack: Skill[]; // Skills

    // New Section
    projects: PortfolioProject[];

    // Footer / Contact
    socialLinks: WebsiteLink[];
    contactEmail: string;

    theme: {
        primaryColor: string;
        secondaryColor?: string; // Added secondary color
        textColor?: string; // Global text color
        backgroundColor?: string; // Global background color
        darkMode: boolean;
        fontFamily?: string;
        animations?: {
            enabled: boolean;
            type: 'fade' | 'slide' | 'zoom' | 'none';
            duration: 'slow' | 'normal' | 'fast';
        };
        customCss?: string;
    };

    // Custom Section Labels
    sectionLabels?: {
        about?: string;
        timeline?: string;
        techStack?: string;
        projects?: string;
        contact?: string;
    };

    // Attachments
    attachedResumeId?: string;

    createdAt: number;
    updatedAt: number;
}

export interface PortfolioTemplateProps {
    data: PortfolioData;
    onEdit?: (field: string) => void;
    onUpdate?: (updates: Partial<PortfolioData>) => void;
    isMobileView?: boolean;
}
