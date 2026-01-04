import { LinkTreeTheme } from './types';

// Custom landing page themes that match exactly what's shown in the preview
export const LANDING_THEMES: Record<string, LinkTreeTheme> = {
    // --- FEATURED LANDING PAGE THEMES ---

    'grainy_lavender': {
        id: 'grainy_lavender',
        name: 'Lavender Dreams',
        category: 'abstract',
        colors: {
            background: '#6366f1',
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

    'brutal_pink': {
        id: 'brutal_pink',
        name: 'Bold Pink',
        category: 'abstract',
        colors: {
            background: '#f472b6',
            text: '#000000',
            subtext: '#1f2937',
            accent: '#000000',
            cardBg: '#ffffff',
            buttonText: '#000000',
        },
        buttons: {
            style: 'hard-shadow',
            radius: 'none',
            border: '3px solid #000000',
            shadow: '6px 6px 0px #000000',
        },
        fonts: {
            heading: 'Lexend Mega, sans-serif',
            body: 'Space Mono, monospace',
        }
    },

    'brutal_yellow': {
        id: 'brutal_yellow',
        name: 'Sunny Bold',
        category: 'minimal',
        colors: {
            background: '#fef08a',
            text: '#000000',
            subtext: '#1f2937',
            accent: '#000000',
            cardBg: '#ffffff',
            buttonText: '#000000',
        },
        buttons: {
            style: 'hard-shadow',
            radius: 'none',
            border: '3px solid #000000',
            shadow: '6px 6px 0px #000000',
        },
        fonts: {
            heading: 'Lexend Mega, sans-serif',
            body: 'Space Mono, monospace',
        }
    },

    'brutal_orange': {
        id: 'brutal_orange',
        name: 'Tangerine Pop',
        category: 'abstract',
        colors: {
            background: '#fb923c',
            text: '#000000',
            subtext: '#1f2937',
            accent: '#000000',
            cardBg: '#ffffff',
            buttonText: '#000000',
        },
        buttons: {
            style: 'hard-shadow',
            radius: 'none',
            border: '3px solid #000000',
            shadow: '6px 6px 0px #000000',
        },
        fonts: {
            heading: 'Archivo Black, sans-serif',
            body: 'Archivo, sans-serif',
        }
    },

    'brutal_lime': {
        id: 'brutal_lime',
        name: 'Electric Lime',
        category: 'abstract',
        colors: {
            background: '#a3e635',
            text: '#000000',
            subtext: '#1f2937',
            accent: '#000000',
            cardBg: '#ffffff',
            buttonText: '#000000',
        },
        buttons: {
            style: 'hard-shadow',
            radius: 'none',
            border: '3px solid #000000',
            shadow: '6px 6px 0px #000000',
        },
        fonts: {
            heading: 'Righteous, cursive',
            body: 'Chakra Petch, sans-serif',
        }
    },

    'fluid_sunset': {
        id: 'fluid_sunset',
        name: 'Sunset Flow',
        category: 'image',
        colors: {
            background: '#f97316',
            text: '#ffffff',
            subtext: '#fed7aa',
            accent: '#ffffff',
            cardBg: 'rgba(255, 255, 255, 0.1)',
            buttonText: '#ffffff',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=1200&q=80")',
        },
        buttons: {
            style: 'glass',
            radius: 'xl',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
        fonts: {
            heading: 'Space Grotesk, sans-serif',
            body: 'Space Grotesk, sans-serif',
        }
    },

    'cosmic_purple': {
        id: 'cosmic_purple',
        name: 'Cosmic Night',
        category: 'dark',
        colors: {
            background: '#1e1b4b',
            text: '#ffffff',
            subtext: '#c4b5fd',
            accent: '#a78bfa',
            cardBg: 'rgba(255, 255, 255, 0.1)',
            buttonText: '#ffffff',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&w=1200&q=80")',
        },
        buttons: {
            style: 'glass',
            radius: 'lg',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            shadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
        },
        fonts: {
            heading: 'Orbitron, sans-serif',
            body: 'Rajdhani, sans-serif',
        }
    },

    'fresh_emerald': {
        id: 'fresh_emerald',
        name: 'Fresh Mint',
        category: 'minimal',
        colors: {
            background: '#10b981',
            text: '#ffffff',
            subtext: '#d1fae5',
            accent: '#ffffff',
            cardBg: 'rgba(255, 255, 255, 0.1)',
            buttonText: '#ffffff',
        },
        buttons: {
            style: 'soft',
            radius: 'full',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            shadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
        fonts: {
            heading: 'DM Sans, sans-serif',
            body: 'DM Sans, sans-serif',
        }
    },

    'pastel_rose': {
        id: 'pastel_rose',
        name: 'Rose Petal',
        category: 'minimal',
        colors: {
            background: '#f0abfc',
            text: '#1f2937',
            subtext: '#4b5563',
            accent: '#1f2937',
            cardBg: 'rgba(255, 255, 255, 0.5)',
            buttonText: '#1f2937',
        },
        buttons: {
            style: 'soft',
            radius: 'xl',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            shadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        },
        fonts: {
            heading: 'Quicksand, sans-serif',
            body: 'Quicksand, sans-serif',
        }
    },

    'abstract_paint': {
        id: 'abstract_paint',
        name: 'Abstract Art',
        category: 'image',
        colors: {
            background: '#1f2937',
            text: '#ffffff',
            subtext: '#d1d5db',
            accent: '#ffffff',
            cardBg: 'rgba(255, 255, 255, 0.1)',
            buttonText: '#ffffff',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=1200&q=80")',
        },
        buttons: {
            style: 'glass',
            radius: 'lg',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            shadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        },
        fonts: {
            heading: 'Outfit, sans-serif',
            body: 'Outfit, sans-serif',
        }
    },

    'neon_acid': {
        id: 'neon_acid',
        name: 'Neon Acid',
        category: 'abstract',
        colors: {
            background: '#1a1a1a',
            text: '#ccff00',
            subtext: '#d4d4d8',
            accent: '#ccff00',
            cardBg: '#262626',
            buttonText: '#ccff00',
        },
        buttons: {
            style: 'hard-shadow',
            radius: 'xl',
            border: '2px solid #ccff00',
            shadow: '4px 4px 0px #ccff00',
        },
        fonts: {
            heading: 'Bungee, cursive',
            body: 'Epilogue, sans-serif',
        }
    },

    'clean_air': {
        id: 'clean_air',
        name: 'Clean Slate',
        category: 'minimal',
        colors: {
            background: '#ffffff',
            text: '#1a1a1a',
            subtext: '#666666',
            accent: '#000000',
            cardBg: '#f9fafb',
            buttonText: '#1a1a1a',
        },
        buttons: {
            style: 'soft',
            radius: 'lg',
            shadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb',
        },
        fonts: {
            heading: 'Inter, sans-serif',
            body: 'Inter, sans-serif',
        }
    },
};
