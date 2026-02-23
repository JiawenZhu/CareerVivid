export interface LinkTreeTheme {
    id: string;
    name: string;
    description?: string;
    category: 'minimal' | 'gradient' | 'image' | 'abstract' | 'dark';
    isPremium?: boolean; // New flag for premium themes
    colors: {
        background: string; // CSS background value (color, gradient, or url)
        text: string;
        subtext: string;
        accent: string;
        cardBg?: string; // For bento/cards or transparent overlays
        buttonText?: string; // Explicit button text color
    };
    buttons: {
        style: 'solid' | 'outline' | 'soft' | 'glass' | 'hard-shadow' | '3d';
        radius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
        shadow?: string;
        border?: string;
        fontFamily?: string; // specific font for buttons if different
        hoverTransform?: string; // CSS transform on hover
        customShape?: 'torn-paper' | 'wavy' | 'jagged' | 'leaf'; // New custom CSS shapes
    };
    fonts: {
        heading: string;
        body: string;
    };
    layout?: {
        profileAlign: 'center' | 'left';
        buttonSpacing: 'normal' | 'tight' | 'loose';
    };
    backgroundConfig?: {
        type: 'image' | 'gradient' | 'solid';
        value: string; // URL or CSS value
        overlay?: string; // e.g., 'rgba(0,0,0,0.5)'
        blur?: number; // px
    };
    effects?: {
        blobs?: boolean; // Animated background blobs
        noise?: boolean; // Grain overlay
        scanlines?: boolean; // Retro effect
        particles?: boolean; // Floating particles
        confetti?: boolean; // Celebration on click
        matrix?: boolean; // Matrix rain effect
        typewriter?: boolean; // Typewriter effect for name
        tilt?: boolean; // 3D tilt effect on buttons
        spinAvatar?: boolean; // Spin avatar on hover
        grid?: boolean; // Retro cyber grid
        fireflies?: boolean; // Floating glowing lights
        stars?: boolean; // Twinkling starfield
        waves?: boolean; // Liquid waves at bottom
    };
    avatarDecoration?: 'christmas-hat' | 'crown' | 'premium-badge'; // New decoration field
}
