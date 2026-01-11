import {
    Skill,
    EmploymentHistory,
    Education,
    WebsiteLink,
    PersonalDetails
} from '../../../types';

// Link-in-Bio Button (Linktree-style)
export interface LinkInBioButton {
    id: string;
    label: string;
    url: string;
    icon?: string; // lucide icon name or emoji
    variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'custom';
    style?: {
        backgroundColor?: string;
        textColor?: string;
        borderColor?: string;
        borderRadius?: string;
    };
    thumbnail?: string; // Optional thumbnail for visual buttons
    enabled: boolean; // Allow hiding buttons without deleting
    clicks?: number; // Analytics
    order?: number; // Explicit ordering
}

export interface IntroAsset {
    id: string; // Unique ID
    label: string; // "My Video", "Summer Game", etc.
    type: 'image' | 'video' | 'game';
    contentUrl?: string;
    mobileContentUrl?: string;
    objectFit?: 'cover' | 'contain';
    mobileObjectFit?: 'cover' | 'contain';
    gameType?: 'bubble_pop' | 'quiz' | 'custom' | 'piano_flow';
    embedCode?: string;
    // Specific configs can go here too if needed
    pianoConfig?: {
        soundPack?: 'classic' | 'synth';
        bubbleStyle?: 'water' | 'pixel';
    };
}

export interface IntroPageConfig {
    enabled: boolean;
    // Multi-asset support
    assets?: IntroAsset[];
    activeAssetId?: string;

    // Legacy / Shared Config (Button stays global)
    buttonText: string;
    buttonStyle: 'outline' | 'solid' | 'glass';
    autoDismissTimer?: number;

    // Legacy Fields (Deprecated but kept for type safety until migration)
    type?: 'image' | 'video' | 'game';
    contentUrl?: string;
    mobileContentUrl?: string;
    objectFit?: 'cover' | 'contain';
    mobileObjectFit?: 'cover' | 'contain';
    gameType?: 'bubble_pop' | 'quiz' | 'custom' | 'piano_flow';
    embedCode?: string;
    pianoConfig?: {
        soundPack?: 'classic' | 'synth';
        bubbleStyle?: 'water' | 'pixel';
    };
}

export interface PianoRecording {
    id: string;
    portfolioId: string;
    visitorId?: string;
    visitorName?: string; // "Guest" or custom
    timestamp: number;
    duration: number; // in seconds
    notes: {
        note: string; // e.g., "C4"
        time: number; // Offset in ms
    }[];
}

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
    | 'bento_personal' | 'executive_brief'
    | 'bento_personal' | 'executive_brief'
    | 'linktree_minimal' | 'linktree_visual' | 'linktree_corporate' | 'linktree_bento'
    // Card Templates
    | 'card_minimal' | 'card_photo' | 'card_modern'
    | 'brutalist_yellow' | 'brutalist_pink' | 'brutalist_blue' | 'brutalist_bw' | 'brutalist_orange'
    | 'pro_executive' | 'pro_clean' | 'creative_gradient' | 'card_creative_dark' | 'nature_calm' | 'tech_future' | 'abstract_art';
    section?: string; // For folder organization in dashboard

    // Mode: portfolio (default), linkinbio, or business_card (NEW)
    mode?: 'portfolio' | 'linkinbio' | 'business_card';

    // Business Card Configuration (when mode = 'business_card')
    businessCard?: {
        orientation: 'horizontal' | 'vertical'; // Default horizontal
        themeId?: string;
        companyLogoUrl?: string;
        usePhotoBackground?: boolean; // Toggle to use avatar as backgroundUrl
        blurLevel?: number; // 0-20
        customTextColor?: string; // Override theme color
        customFont?: string; // Override theme font
        customFontSize?: 'sm' | 'md' | 'lg'; // Scale text
    };

    // Link-in-Bio Configuration (when mode = 'linkinbio')
    linkInBio?: {
        links: LinkInBioButton[];
        introPage?: IntroPageConfig;


        showSocial: boolean;
        showEmail: boolean;
        profileImage?: string;
        displayName: string;
        bio: string;
        backgroundColor?: string;
        themeId?: string; // New: ID of the selected theme (e.g., 'air', 'twilight')
        customTheme?: any; // New: Allow for fully custom theme overrides in the future
        buttonLayout?: 'stack' | 'grid'; // Stack for classic Linktree, grid for bento
        customStyle?: {
            backgroundOverride?: string;
            buttonColor?: string;
            buttonTextColor?: string;
            fontFamily?: string;
            buttonShape?: 'pill' | 'rounded' | 'sharp' | 'soft-shadow' | 'hard-shadow';
            buttonAlignment?: 'center' | 'left'; // Text alignment
            // Profile Specific
            profileFontFamily?: string;
            profileTitleColor?: string;
            profileTextColor?: string;
            effects?: {
                confetti?: boolean;
                matrix?: boolean;
                typewriter?: boolean;
                tilt?: boolean;
                spinAvatar?: boolean;
            };
            enableSnow?: boolean;
        };
        enableStore?: boolean; // Toggle for Commerce Storefront
        settings?: {
            removeBranding?: boolean;
        };
    };

    // Web-specific sections (portfolio mode)
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
    phone?: string; // New field for Business Cards
    location?: string; // New field for Business Cards

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
    isEmbed?: boolean;
}
