import { LinkTreeTheme } from './types';

export const GAME_THEMES: Record<string, LinkTreeTheme> = {
    'game_invaders': {
        id: 'game_invaders',
        name: 'Cosmic Invaders',
        description: 'Retro arcade shooter. Use arrow keys to save the galaxy.',
        category: 'dark',
        isPremium: true,
        colors: {
            background: '#0f172a', // Slate 900
            text: '#e2e8f0', // Slate 200
            subtext: '#94a3b8',
            accent: '#00f0ff', // Cyan
            cardBg: 'rgba(15, 23, 42, 0.8)',
            buttonText: '#00f0ff'
        },
        buttons: {
            style: 'outline',
            radius: 'none',
            border: '2px solid #00f0ff',
            fontFamily: '"Courier New", monospace',
            hoverTransform: 'scale(1.05)',
            shadow: '0 0 10px #00f0ff'
        },
        fonts: {
            heading: '"Courier New", monospace',
            body: '"Courier New", monospace'
        },
        backgroundConfig: {
            type: 'solid',
            value: '#0f172a'
        },
        effects: {
            typewriter: true
        }
    },
    'game_pong': {
        id: 'game_pong',
        name: 'Cyber Pong',
        description: 'Neo-Brutalist ping pong. Classic visuals, modern vibe.',
        category: 'abstract',
        isPremium: true,
        colors: {
            background: '#fdf5e6', // Old Lace
            text: '#000000',
            subtext: '#4b5563',
            accent: '#ff4d4d', // Red
            cardBg: '#ffffff',
            buttonText: '#000000'
        },
        buttons: {
            style: 'hard-shadow',
            radius: 'none',
            border: '3px solid #000000',
            fontFamily: '"Archivo Black", sans-serif',
            shadow: '5px 5px 0px #000000',
            hoverTransform: 'translate(-2px, -2px) shadow(7px 7px 0px #000000)'
        },
        fonts: {
            heading: '"Archivo Black", sans-serif',
            body: '"Public Sans", sans-serif'
        },
        backgroundConfig: {
            type: 'solid',
            value: '#fdf5e6'
        }
    },
    'game_snake': {
        id: 'game_snake',
        name: 'Brutal Snake',
        description: 'High contrast snake game. Eat blocks, grow long.',
        category: 'abstract',
        isPremium: true,
        colors: {
            background: '#e0e7ff', // Indigo 50
            text: '#312e81', // Indigo 900
            subtext: '#4338ca',
            accent: '#4f46e5', // Indigo 600
            cardBg: '#ffffff',
            buttonText: '#312e81'
        },
        buttons: {
            style: 'hard-shadow',
            radius: 'sm',
            border: '3px solid #312e81',
            fontFamily: '"Public Sans", sans-serif',
            shadow: '4px 4px 0px #312e81',
        },
        fonts: {
            heading: '"Public Sans", sans-serif',
            body: '"Public Sans", sans-serif'
        },
        backgroundConfig: {
            type: 'solid',
            value: '#e0e7ff'
        }
    },
    'game_stacker': {
        id: 'game_stacker',
        name: 'Zen Stacker',
        description: 'Relaxing block stacking. Building heights, finding peace.',
        category: 'gradient',
        isPremium: true,
        colors: {
            background: 'linear-gradient(to bottom, #eef2ff, #c7d2fe)',
            text: '#1e1b4b', // Indigo 950
            subtext: '#4338ca',
            accent: '#6366f1',
            cardBg: 'rgba(255, 255, 255, 0.7)',
            buttonText: '#ffffff'
        },
        buttons: {
            style: 'soft',
            radius: 'xl',
            shadow: '0 4px 14px 0 rgba(0,118,255,0.39)'
        },
        fonts: {
            heading: '"Inter", sans-serif',
            body: '"Inter", sans-serif'
        },
        backgroundConfig: {
            type: 'gradient',
            value: 'linear-gradient(to bottom, #eef2ff, #c7d2fe)'
        }
    }
};
