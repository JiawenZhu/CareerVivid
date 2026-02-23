import { LinkTreeTheme } from './types';

export const SEASONAL_THEMES: Record<string, LinkTreeTheme> = {
    // --- HOLIDAY / SEASONAL ---
    'neo_xmas': {
        id: 'neo_xmas',
        name: 'Neo Xmas',
        category: 'abstract',
        colors: {
            background: '#6366f1', // Indigo base (for fallback)
            text: '#ffffff',
            subtext: '#e0e7ff',
            accent: '#a855f7',
            cardBg: 'rgba(255, 255, 255, 0.1)',
            buttonText: '#ffffff',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?auto=format&fit=crop&w=1200&q=80")',
        },
        buttons: {
            style: 'glass',
            radius: 'lg',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
        fonts: {
            heading: 'Inter, sans-serif',
            body: 'Inter, sans-serif',
        }
    },
    'xmas_snow': {
        id: 'xmas_snow',
        name: 'Winter Snow',
        category: 'image',
        colors: {
            background: '#f0f9ff',
            text: '#0c4a6e',
            subtext: '#38bdf8',
            accent: '#0284c7',
            cardBg: 'rgba(255, 255, 255, 0.8)',
            buttonText: '#0ea5e9',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1542601098-3adb3baeb1ec?auto=format&fit=crop&q=80&w=1000")',
            overlay: 'rgba(255, 255, 255, 0.2)'
        },
        buttons: {
            style: 'soft',
            radius: 'xl',
            shadow: '0 4px 12px rgba(186, 230, 253, 0.5)',
        },
        fonts: {
            heading: 'Playfair Display, serif',
            body: 'Quicksand, sans-serif',
        },
        effects: {
            particles: true
        }
    },
    'xmas_warm': {
        id: 'xmas_warm',
        name: 'Cozy Holiday',
        category: 'image',
        colors: {
            background: '#2a0a0a',
            text: '#fef3c7',
            subtext: '#d97706',
            accent: '#dc2626',
            cardBg: 'rgba(0, 0, 0, 0.6)',
            buttonText: '#fcd34d',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1576618148400-f54bed99fcf8?auto=format&fit=crop&q=80&w=1000")',
            overlay: 'rgba(0, 0, 0, 0.5)'
        },
        buttons: {
            style: 'glass',
            radius: 'md',
            border: '1px solid #fcd34d',
            shadow: '0 0 15px rgba(252, 211, 77, 0.2)',
        },
        fonts: {
            heading: 'Lobster, cursive',
            body: 'Merriweather, serif',
        }
    }
};
