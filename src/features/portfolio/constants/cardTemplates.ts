import { STOCK_PHOTOS } from '../../../constants/stockPhotos';

export interface CardTemplateConfig {
    id: string;
    label: string;
    category: 'minimal' | 'photo' | 'brutalist' | 'professional' | 'creative';
    textureUrl?: string; // If present, use texture
    baseColor?: string; // If no texture, use this color
    textColor: string;
    secondaryColor?: string; // For accents/borders
    fontFamily: string;
    overlayStyle: {
        glass: boolean;
        opacity: number;
        blur: number; // backdrop-blur class intensity
        gradient?: string; // CSS gradient string
        border?: string; // Border style for brutalism
    };
}

export const CARD_TEMPLATES: Record<string, CardTemplateConfig> = {
    // --- Minimal / Basic ---
    'card_minimal': {
        id: 'card_minimal',
        label: 'Matte Black',
        category: 'minimal',
        baseColor: '#1a1a1a',
        textColor: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        overlayStyle: { glass: false, opacity: 0, blur: 0 }
    },
    'card_modern': {
        id: 'card_modern',
        label: 'Clean White',
        category: 'minimal',
        baseColor: '#f3f4f6',
        textColor: '#111827',
        fontFamily: 'Inter, sans-serif',
        overlayStyle: { glass: false, opacity: 0, blur: 0 }
    },
    'card_photo': {
        id: 'card_photo',
        label: 'Custom Photo',
        category: 'photo',
        // textureUrl provided dynamically from user profile
        textColor: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        overlayStyle: { glass: true, opacity: 0.9, blur: 12, gradient: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }
    },

    // --- Neo-Brutalism (5) ---
    'brutalist_yellow': {
        id: 'brutalist_yellow',
        label: 'Caution Yellow',
        category: 'brutalist',
        baseColor: '#FFB800',
        textColor: '#000000',
        secondaryColor: '#000000',
        fontFamily: "'Space Mono', monospace",
        overlayStyle: { glass: false, opacity: 1, blur: 0, border: '4px solid black' }
    },
    'brutalist_pink': {
        id: 'brutalist_pink',
        label: 'Plastic Pink',
        category: 'brutalist',
        baseColor: '#FF69B4',
        textColor: '#000000',
        secondaryColor: '#000000',
        fontFamily: "'Courier New', monospace",
        overlayStyle: { glass: false, opacity: 1, blur: 0, border: '4px solid black' }
    },
    'brutalist_blue': {
        id: 'brutalist_blue',
        label: 'Glitch Cyan',
        category: 'brutalist',
        baseColor: '#00FFFF',
        textColor: '#000040',
        secondaryColor: '#0000FF',
        fontFamily: "'Space Mono', monospace",
        overlayStyle: { glass: false, opacity: 1, blur: 0, border: '4px solid blue' }
    },
    'brutalist_bw': {
        id: 'brutalist_bw',
        label: 'High Contrast',
        category: 'brutalist',
        baseColor: '#FFFFFF',
        textColor: '#000000',
        secondaryColor: '#000000',
        fontFamily: "Inter, sans-serif",
        overlayStyle: { glass: false, opacity: 1, blur: 0, border: '6px solid black' }
    },
    'brutalist_orange': {
        id: 'brutalist_orange',
        label: 'Retro Orange',
        category: 'brutalist',
        baseColor: '#FF4500',
        textColor: '#FFFFFF',
        secondaryColor: '#000000',
        fontFamily: "'Courier New', monospace",
        overlayStyle: { glass: false, opacity: 1, blur: 0, border: '4px solid black' }
    },

    // --- Professional / Creative (7) ---
    // Using Stock Photos where applicable
    'pro_executive': {
        id: 'pro_executive',
        label: 'Executive Navy',
        category: 'professional',
        baseColor: '#0f172a',
        textColor: '#FFD700', // Gold text
        fontFamily: "'Playfair Display', serif",
        overlayStyle: { glass: false, opacity: 0, blur: 0, gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }
    },
    'pro_clean': {
        id: 'pro_clean',
        label: 'Minimalist Serif',
        category: 'professional',
        baseColor: '#ffffff',
        textColor: '#333333',
        fontFamily: "'Playfair Display', serif",
        overlayStyle: { glass: false, opacity: 0, blur: 0 }
    },
    'creative_gradient': {
        id: 'creative_gradient',
        label: 'Aura Gradient',
        category: 'creative',
        textureUrl: STOCK_PHOTOS.backgrounds[1], // Smooth Gradient
        textColor: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        overlayStyle: { glass: true, opacity: 0.3, blur: 10 }
    },
    'card_creative_dark': {
        id: 'card_creative_dark',
        label: 'Midnight Neon',
        category: 'creative',
        textureUrl: STOCK_PHOTOS.backgrounds[0], // Dark Gradient
        textColor: '#00ffcc',
        fontFamily: 'Inter, sans-serif',
        overlayStyle: { glass: true, opacity: 0.5, blur: 5 }
    },
    'nature_calm': {
        id: 'nature_calm',
        label: 'Forest Calm',
        category: 'creative',
        textureUrl: STOCK_PHOTOS.backgrounds[5], // Nature
        textColor: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        overlayStyle: { glass: true, opacity: 0.4, blur: 4, gradient: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }
    },
    'tech_future': {
        id: 'tech_future',
        label: 'Cyber Future',
        category: 'professional',
        textureUrl: STOCK_PHOTOS.backgrounds[7], // Dark 3D Abstract
        textColor: '#ffffff',
        fontFamily: "'Space Mono', monospace",
        overlayStyle: { glass: true, opacity: 0.3, blur: 5 }
    },
    'abstract_art': {
        id: 'abstract_art',
        label: 'Liquid Art',
        category: 'creative',
        textureUrl: STOCK_PHOTOS.backgrounds[8], // Colorful Liquid
        textColor: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        overlayStyle: { glass: true, opacity: 0.2, blur: 8 }
    }
};
