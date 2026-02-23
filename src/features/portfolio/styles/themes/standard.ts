import { LinkTreeTheme } from './types';

export const STANDARD_THEMES: Record<string, LinkTreeTheme> = {
    // --- STANDARD / MINIMAL ---
    'air': {
        id: 'air',
        name: 'Air',
        category: 'minimal',
        colors: {
            background: '#ffffff',
            text: '#1a1a1a',
            subtext: '#666666',
            accent: '#000000',
            buttonText: '#ffffff',
        },
        buttons: {
            style: 'soft',
            radius: 'lg',
            shadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1px solid #f0f0f0',
        },
        fonts: {
            heading: 'Inter, sans-serif',
            body: 'Inter, sans-serif',
        },
        layout: {
            profileAlign: 'center',
            buttonSpacing: 'normal',
        }
    },
    'mineral': {
        id: 'mineral',
        name: 'Mineral',
        category: 'minimal',
        colors: {
            background: '#F3F4F6',
            text: '#374151',
            subtext: '#6B7280',
            accent: '#059669',
            cardBg: '#ffffff',
            buttonText: '#374151',
        },
        buttons: {
            style: 'solid',
            radius: 'full',
            shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
        fonts: {
            heading: 'Georgia, serif',
            body: 'Inter, sans-serif',
        },
        layout: {
            profileAlign: 'center',
            buttonSpacing: 'loose',
        }
    },
    'twilight': {
        id: 'twilight',
        name: 'Twilight',
        category: 'gradient',
        colors: {
            background: 'linear-gradient(to bottom, #2e1065, #1e1b4b)',
            text: '#ffffff',
            subtext: '#c4b5fd',
            accent: '#a78bfa',
            cardBg: 'rgba(255, 255, 255, 0.1)',
            buttonText: '#ffffff',
        },
        backgroundConfig: {
            type: 'gradient',
            value: 'linear-gradient(to bottom, #2e1065, #1e1b4b)'
        },
        buttons: {
            style: 'glass',
            radius: 'md',
            border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        fonts: {
            heading: 'Outfit, sans-serif',
            body: 'Outfit, sans-serif',
        },
        effects: {
            blobs: true,
        }
    },
    'abstract_fluid': {
        id: 'abstract_fluid',
        name: 'Abstract Fluid',
        category: 'gradient',
        colors: {
            background: 'linear-gradient(45deg, #4f46e5, #ec4899)',
            text: '#ffffff',
            subtext: '#fbcfe8',
            accent: '#f472b6',
            cardBg: '#f97316',
            buttonText: '#ffffff',
        },
        buttons: {
            style: 'solid',
            radius: 'full',
            shadow: '0 10px 25px -5px rgba(249, 115, 22, 0.5)',
            hoverTransform: 'scale(1.05)',
        },
        fonts: {
            heading: 'Space Grotesk, sans-serif',
            body: 'Space Grotesk, sans-serif',
        },
        effects: {
            blobs: true,
        }
    },
    'wavy_bakery': {
        id: 'wavy_bakery',
        name: 'Wavy Bakery',
        category: 'image',
        colors: {
            background: '#92400e',
            text: '#fff7ed',
            subtext: '#ffedd5',
            accent: '#b45309',
            cardBg: '#fff7ed',
            buttonText: '#78350f',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=1000")',
        },
        buttons: {
            style: 'solid',
            radius: 'none',
            customShape: 'wavy',
            shadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
        fonts: {
            heading: 'Abril Fatface, cursive',
            body: 'Open Sans, sans-serif',
        }
    },
    'jagged_run': {
        id: 'jagged_run',
        name: 'Jagged Run',
        category: 'image',
        colors: {
            background: '#0369a1',
            text: '#ffffff',
            subtext: '#e0f2fe',
            accent: '#0284c7',
            cardBg: '#ffffff',
            buttonText: '#0c4a6e',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1533560906234-a4af207eb338?auto=format&fit=crop&q=80&w=1000")',
        },
        buttons: {
            style: 'solid',
            radius: 'none',
            customShape: 'jagged',
            shadow: '0 4px 0 rgba(0,0,0,0.2)',
        },
        fonts: {
            heading: 'Teko, sans-serif',
            body: 'Roboto Condensed, sans-serif',
        }
    },
    'beach_sunset': {
        id: 'beach_sunset',
        name: 'Beach Sunset',
        category: 'image',
        colors: {
            background: '#f97316',
            text: '#ffffff',
            subtext: '#fed7aa',
            accent: '#ea580c',
            cardBg: 'rgba(255, 255, 255, 0.85)',
            buttonText: '#c2410c',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000")',
        },
        buttons: {
            style: 'solid',
            radius: 'full',
            shadow: '0 4px 6px rgba(0,0,0,0.1)',
        },
        fonts: {
            heading: 'Outfit, sans-serif',
            body: 'Inter, sans-serif',
        }
    },
    'mountain_peak': {
        id: 'mountain_peak',
        name: 'Mountain Peak',
        category: 'image',
        colors: {
            background: '#1f2937',
            text: '#ffffff',
            subtext: '#d1d5db',
            accent: '#3b82f6',
            cardBg: 'rgba(31, 41, 55, 0.6)',
            buttonText: '#ffffff',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000")',
        },
        buttons: {
            style: 'glass',
            radius: 'lg',
            border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        fonts: {
            heading: 'Playfair Display, serif',
            body: 'Lato, sans-serif',
        }
    },
    'forest_mist': {
        id: 'forest_mist',
        name: 'Forest Mist',
        category: 'image',
        colors: {
            background: '#14532d',
            text: '#f0fdf4',
            subtext: '#86efac',
            accent: '#22c55e',
            cardBg: 'transparent',
            buttonText: '#ffffff',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1448375240586-dfd8d395ea6c?auto=format&fit=crop&q=80&w=1000")',
        },
        buttons: {
            style: 'outline',
            radius: 'sm',
            border: '2px solid rgba(255, 255, 255, 0.8)',
            hoverTransform: 'translateY(-2px)',
        },
        fonts: {
            heading: 'DM Sans, sans-serif',
            body: 'DM Sans, sans-serif',
        }
    },
    'ocean_depth': {
        id: 'ocean_depth',
        name: 'Ocean Depth',
        category: 'image',
        colors: {
            background: '#0c4a6e',
            text: '#ffffff',
            subtext: '#bae6fd',
            accent: '#0ea5e9',
            cardBg: '#ffffff',
            buttonText: '#0284c7',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1494253109108-2e30c049369b?auto=format&fit=crop&q=80&w=1000")',
        },
        buttons: {
            style: 'solid',
            radius: 'xl',
            shadow: '0 8px 16px rgba(0,0,0,0.2)',
        },
        fonts: {
            heading: 'Montserrat, sans-serif',
            body: 'Montserrat, sans-serif',
        }
    },
    'designer_desk': {
        id: 'designer_desk',
        name: 'Designer Studio',
        category: 'image',
        colors: {
            background: '#e5e7eb',
            text: '#111827',
            subtext: '#4b5563',
            accent: '#000000',
            cardBg: '#000000',
            buttonText: '#ffffff',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1000")',
            blur: 2
        },
        buttons: {
            style: 'solid',
            radius: 'md',
            shadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
        fonts: {
            heading: 'Inter, sans-serif',
            body: 'Inter, sans-serif',
        }
    },
    'urban_arch': {
        id: 'urban_arch',
        name: 'Urban Arch',
        category: 'image',
        colors: {
            background: '#404040',
            text: '#ffffff',
            subtext: '#a3a3a3',
            accent: '#ffffff',
            cardBg: '#ffffff',
            buttonText: '#000000',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000")',
        },
        buttons: {
            style: 'solid',
            radius: 'none',
            shadow: '5px 5px 0px rgba(0,0,0,1)',
        },
        fonts: {
            heading: 'Oswald, sans-serif',
            body: 'Roboto, sans-serif',
        }
    },
    'botanic_green': {
        id: 'botanic_green',
        name: 'Botanic Garden',
        category: 'image',
        colors: {
            background: '#f0fdf4',
            text: '#166534',
            subtext: '#15803d',
            accent: '#22c55e',
            cardBg: 'rgba(255, 255, 255, 0.9)',
            buttonText: '#14532d',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1470058869958-2a77ade41c02?auto=format&fit=crop&q=80&w=1000")',
        },
        buttons: {
            style: 'soft',
            radius: 'full',
            border: '1px solid #bbf7d0',
        },
        fonts: {
            heading: 'Lora, serif',
            body: 'Lora, serif',
        }
    },
    'aurora_mesh': {
        id: 'aurora_mesh',
        name: 'Aurora',
        category: 'abstract',
        colors: {
            background: '#000000',
            text: '#ffffff',
            subtext: '#e2e8f0',
            accent: '#818cf8',
            cardBg: 'rgba(255, 255, 255, 0.15)',
            buttonText: '#ffffff',
        },
        backgroundConfig: {
            type: 'image',
            value: 'url("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1000")',
        },
        buttons: {
            style: 'glass',
            radius: 'xl',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        },
        fonts: {
            heading: 'Quicksand, sans-serif',
            body: 'Quicksand, sans-serif',
        },
        effects: {
            particles: true
        }
    }
};
