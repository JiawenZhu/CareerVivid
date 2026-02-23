import { LinkTreeTheme } from './types';

export const CREATIVE_THEMES: Record<string, LinkTreeTheme> = {
    // --- NEO BRUTALISM / CREATIVE ---
    'neo_pop': {
        id: 'neo_pop',
        name: 'Neo Pop',
        category: 'abstract',
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
            border: '2px solid #000000',
            shadow: '4px 4px 0px #000000',
            hoverTransform: 'translate(-2px, -2px) shadow(6px 6px 0px #000000)',
        },
        fonts: {
            heading: 'Lexend Mega, sans-serif',
            body: 'Space Mono, monospace',
        }
    },
    'brutal_blueprint': {
        id: 'brutal_blueprint',
        name: 'Blueprint',
        category: 'minimal',
        colors: {
            background: '#2563eb',
            text: '#ffffff',
            subtext: '#bfdbfe',
            accent: '#ffffff',
            cardBg: '#1d4ed8',
            buttonText: '#ffffff',
        },
        backgroundConfig: {
            type: 'image',
            value: `radial-gradient(circle, #ffffff 1px, transparent 1px) 0 0 / 20px 20px, #2563eb`
        },
        buttons: {
            style: 'outline',
            radius: 'none',
            border: '2px solid #ffffff',
            shadow: 'none',
        },
        fonts: {
            heading: 'JetBrains Mono, monospace',
            body: 'JetBrains Mono, monospace',
        }
    },
    'stark_bw': {
        id: 'stark_bw',
        name: 'Stark B&W',
        category: 'minimal',
        colors: {
            background: '#ffffff',
            text: '#000000',
            subtext: '#525252',
            accent: '#000000',
            cardBg: '#ffffff',
            buttonText: '#000000',
        },
        buttons: {
            style: 'hard-shadow',
            radius: 'none',
            border: '3px solid #000000',
            shadow: '6px 6px 0px #000000',
            customShape: 'jagged'
        },
        fonts: {
            heading: 'Archivo Black, sans-serif',
            body: 'Archivo, sans-serif',
        }
    },
    'retro_term': {
        id: 'retro_term',
        name: 'Terminal',
        category: 'dark',
        colors: {
            background: '#0c0c0c',
            text: '#22c55e',
            subtext: '#15803d',
            accent: '#4ade80',
            cardBg: '#000000',
            buttonText: '#22c55e',
        },
        buttons: {
            style: 'outline',
            radius: 'sm',
            border: '1px solid #22c55e',
            shadow: '0 0 10px rgba(34, 197, 94, 0.2)',
        },
        fonts: {
            heading: 'VT323, monospace',
            body: 'VT323, monospace',
        },
        effects: {
            scanlines: true
        }
    },
    'paper_cut': {
        id: 'paper_cut',
        name: 'Paper Cut',
        category: 'abstract',
        colors: {
            background: '#f3f4f6',
            text: '#1f2937',
            subtext: '#4b5563',
            accent: '#ef4444',
            cardBg: '#ffffff',
            buttonText: '#1f2937',
        },
        buttons: {
            style: 'hard-shadow',
            radius: 'none',
            border: '1px solid #d1d5db',
            shadow: '2px 2px 0px rgba(0,0,0,0.1)',
            customShape: 'torn-paper'
        },
        fonts: {
            heading: 'Permanent Marker, cursive',
            body: 'Patrick Hand, cursive',
        }
    },
    'vibrant_box': {
        id: 'vibrant_box',
        name: 'Vibrant Box',
        category: 'abstract',
        colors: {
            background: '#a855f7',
            text: '#ffffff',
            subtext: '#e9d5ff',
            accent: '#fbbf24',
            cardBg: '#fbbf24',
            buttonText: '#000000',
        },
        buttons: {
            style: 'hard-shadow',
            radius: 'none',
            border: '3px solid #000000',
            shadow: '5px 5px 0px #000000',
        },
        fonts: {
            heading: 'Righteous, cursive',
            body: 'Chakra Petch, sans-serif',
        },
        layout: {
            buttonSpacing: 'tight',
            profileAlign: 'center'
        }
    },
    'concrete_jungle': {
        id: 'concrete_jungle',
        name: 'Concrete',
        category: 'minimal',
        colors: {
            background: '#e5e5e5',
            text: '#262626',
            subtext: '#525252',
            accent: '#171717',
            cardBg: '#d4d4d4',
            buttonText: '#171717',
        },
        backgroundConfig: {
            type: 'image',
            value: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='%23a3a3a3' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E"), #e5e5e5`
        },
        buttons: {
            style: 'hard-shadow',
            radius: 'none',
            border: '4px solid #171717',
            shadow: '8px 8px 0px #171717',
        },
        fonts: {
            heading: 'Anton, sans-serif',
            body: 'Roboto Mono, monospace',
        }
    },
    'system_error': {
        id: 'system_error',
        name: 'System Error',
        category: 'dark',
        colors: {
            background: '#000000',
            text: '#fca5a5',
            subtext: '#f87171',
            accent: '#ffffff',
            cardBg: '#1f1f1f',
            buttonText: '#fca5a5',
        },
        buttons: {
            style: 'outline',
            radius: 'none',
            border: '2px dashed #ef4444',
            shadow: '4px 4px 0px #ef4444',
            hoverTransform: 'translate(-2px, -2px)',
        },
        fonts: {
            heading: 'Rubik Glitch, system-ui',
            body: 'Share Tech Mono, monospace',
        },
        effects: {
            noise: true
        }
    },
    'acid_mode': {
        id: 'acid_mode',
        name: 'Acid Mode',
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
    'int_orange': {
        id: 'int_orange',
        name: 'Flight Deck',
        category: 'image',
        colors: {
            background: '#ff4f00',
            text: '#ffffff',
            subtext: '#fed7aa',
            accent: '#000000',
            cardBg: '#000000',
            buttonText: '#ff4f00',
        },
        buttons: {
            style: 'hard-shadow',
            radius: 'none',
            border: '3px solid #000000',
            shadow: '6px 6px 0px #000000',
        },
        fonts: {
            heading: 'Impact, sans-serif',
            body: 'Arial Black, sans-serif',
        }
    },
    'cyber_grid': {
        id: 'cyber_grid',
        name: 'Cyber Grid',
        category: 'dark',
        colors: {
            background: '#0f172a',
            text: '#22d3ee',
            subtext: '#94a3b8',
            accent: '#f472b6',
            cardBg: 'rgba(15, 23, 42, 0.8)',
            buttonText: '#22d3ee',
        },
        backgroundConfig: {
            type: 'image',
            value: `linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)`,
        },
        buttons: {
            style: 'glass',
            radius: 'sm',
            border: '1px solid #22d3ee',
            shadow: '0 0 15px rgba(34, 211, 238, 0.3)',
        },
        fonts: {
            heading: 'Orbitron, sans-serif',
            body: 'Rajdhani, sans-serif',
        }
    },
    'pixel_pop': {
        id: 'pixel_pop',
        name: 'Pixel Pop',
        category: 'abstract',
        colors: {
            background: '#fae8ff',
            text: '#86198f',
            subtext: '#c026d3',
            accent: '#06b6d4',
            cardBg: '#ffffff',
            buttonText: '#86198f',
        },
        buttons: {
            style: 'hard-shadow',
            radius: 'none',
            border: '3px solid #000000',
            shadow: '6px 6px 0px #06b6d4',
        },
        fonts: {
            heading: 'Press Start 2P, cursive',
            body: 'Silkscreen, cursive',
        }
    }
};
