import { LinkTreeTheme } from './types';

export const PREMIUM_THEMES: Record<string, LinkTreeTheme> = {
    // --- WORLD CUP 2026 (PREMIUM) ---
    'wc26_global': {
        id: 'wc26_global',
        name: 'World Cup 26',
        category: 'abstract',
        isPremium: true,
        colors: {
            background: '#000000',
            text: '#ffffff',
            subtext: '#cccccc',
            accent: '#00ff00',
            cardBg: '#1a1a1a',
            buttonText: '#ffffff',
        },
        buttons: {
            style: 'solid',
            radius: 'full',
            border: '2px solid white',
            shadow: '0 5px 15px rgba(0,0,0,0.5)',
        },
        fonts: {
            heading: 'Anton, sans-serif',
            body: 'Roboto, sans-serif',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1522778183025-a130113f3732?q=80&w=1920&auto=format&fit=crop")',
            overlay: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.5))'
        }
    },
    'wc26_pitch': {
        id: 'wc26_pitch',
        name: 'Pitch Perfect',
        category: 'image',
        isPremium: true,
        colors: {
            background: '#064e3b',
            text: '#ffffff',
            subtext: '#6ee7b7',
            accent: '#ffffff',
            cardBg: 'rgba(6, 78, 59, 0.9)',
            buttonText: '#ffffff',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1589419733151-325b34bc6385?q=80&w=1920&auto=format&fit=crop")',
            overlay: 'linear-gradient(to bottom, rgba(6,78,59,0.8), rgba(6,78,59,0.4))'
        },
        buttons: {
            style: 'outline',
            radius: 'md',
            border: '2px solid white',
        },
        fonts: {
            heading: 'Teko, sans-serif',
            body: 'Open Sans, sans-serif',
        }
    },
    'wc26_trophy': {
        id: 'wc26_trophy',
        name: 'Trophy Gold',
        category: 'gradient',
        isPremium: true,
        colors: {
            background: '#422006',
            text: '#fde047',
            subtext: '#fcd34d',
            accent: '#fbbf24',
            cardBg: 'rgba(0,0,0,0.8)',
            buttonText: '#fde047',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1626017188182-5bf7dfbaee0f?q=80&w=1920&auto=format&fit=crop")',
            overlay: 'rgba(66, 32, 6, 0.6)'
        },
        buttons: {
            style: 'glass',
            radius: 'lg',
            border: '1px solid #fde047',
            shadow: '0 0 20px rgba(250, 204, 21, 0.4)',
        },
        fonts: {
            heading: 'Cinzel, serif',
            body: 'Lato, sans-serif',
        },
        effects: {
            blobs: true
        }
    },
    'wc26_fan': {
        id: 'wc26_fan',
        name: 'Fan Zone',
        category: 'abstract',
        isPremium: true,
        colors: {
            background: '#ffffff',
            text: '#111827',
            subtext: '#6b7280',
            accent: '#ef4444',
            cardBg: '#ffffff',
            buttonText: '#111827',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1920&auto=format&fit=crop")',
            overlay: 'rgba(255, 255, 255, 0.85)'
        },
        buttons: {
            style: 'hard-shadow',
            radius: 'sm',
            shadow: '4px 4px 0 #111827',
        },
        fonts: {
            heading: 'Bebas Neue, sans-serif',
            body: 'Montserrat, sans-serif',
        },
        effects: {
            confetti: true
        }
    },

    // --- OLYMPICS 2028 (PREMIUM) ---
    'oly28_la': {
        id: 'oly28_la',
        name: 'LA Sunset 28',
        category: 'gradient',
        isPremium: true,
        colors: {
            background: '#4c1d95',
            text: '#ffffff',
            subtext: '#fcd34d',
            accent: '#f59e0b',
            cardBg: 'rgba(255, 255, 255, 0.1)',
            buttonText: '#ffffff',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1532960401447-7dd05bef20b0?q=80&w=1920&auto=format&fit=crop")',
            overlay: 'rgba(76, 29, 149, 0.5)'
        },
        buttons: {
            style: 'glass',
            radius: 'full',
            border: '1px solid rgba(255,255,255,0.3)',
        },
        fonts: {
            heading: 'Montserrat, sans-serif',
            body: 'Inter, sans-serif',
        }
    },
    'oly28_gold': {
        id: 'oly28_gold',
        name: 'Olympic Gold',
        category: 'gradient',
        isPremium: true,
        colors: {
            background: '#713f12',
            text: '#fef08a',
            subtext: '#fde047',
            accent: '#fbbf24',
            cardBg: 'rgba(0,0,0,0.5)',
            buttonText: '#fef08a',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop")',
            overlay: 'rgba(113, 63, 18, 0.4)'
        },
        buttons: {
            style: 'solid',
            radius: 'md',
            shadow: '0 10px 30px rgba(234, 179, 8, 0.3)',
        },
        fonts: {
            heading: 'Cinzel Decorative, serif',
            body: 'Nanito, sans-serif',
        }
    },
    'oly28_torch': {
        id: 'oly28_torch',
        name: 'Torch Relay',
        category: 'abstract',
        isPremium: true,
        colors: {
            background: '#450a0a',
            text: '#ffedd5',
            subtext: '#fdba74',
            accent: '#f97316',
            cardBg: '#7f1d1d',
            buttonText: '#fff7ed',
        },
        buttons: {
            style: 'outline',
            radius: 'none',
            border: '2px solid #f97316',
            shadow: '0 0 15px #ea580c',
            hoverTransform: 'scale(1.02)'
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1920&auto=format&fit=crop")',
            overlay: 'rgba(69, 10, 10, 0.7)'
        },
        fonts: {
            heading: 'Russo One, sans-serif',
            body: 'Roboto Condensed, sans-serif',
        },
        effects: {
            particles: true
        }
    },
    'oly28_rings': {
        id: 'oly28_rings',
        name: 'The Rings',
        category: 'minimal',
        isPremium: true,
        colors: {
            background: '#ffffff',
            text: '#000000',
            subtext: '#525252',
            accent: '#2563eb', // Blue ring color
            cardBg: '#f3f4f6',
            buttonText: '#000000',
        },
        buttons: {
            style: 'solid',
            radius: 'full',
            shadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '2px solid #e5e7eb'
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1481026469463-66327c86e544?q=80&w=1920&auto=format&fit=crop")',
            overlay: 'rgba(255, 255, 255, 0.85)'
        },
        fonts: {
            heading: 'Inter, sans-serif',
            body: 'Inter, sans-serif',
        },
        layout: {
            buttonSpacing: 'loose',
            profileAlign: 'center'
        }
    }
};
