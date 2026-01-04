import React from 'react';
import TemplateCard from '../features/portfolio/components/bio-links/TemplateCard';
import { LINKTREE_THEMES } from '../features/portfolio/styles/themes';
import { STOCK_PHOTOS } from '../constants/stockPhotos';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { navigate } from '../App';
import GuestPromptModal from '../components/GuestPromptModal';
import { useState } from 'react';

// Since translation keys are not yet available for everything, we use hardcoded fallbacks or new keys if added.
// For now, hardcoding english text with placeholders for t() to be replaced when keys exist.

// Define the list of themes to feature - using new landing themes with exact styles
const FEATURED_THEMES = [
    'grainy_lavender', // #1 Lavender Dreams (grainy texture)
    'brutal_pink', // #2 Bold Pink (neo-brutalism)
    'brutal_yellow', // #3 Sunny Bold (neo-brutalism)
    'brutal_orange', // #4 Tangerine Pop (neo-brutalism)
    'brutal_lime', // #5 Electric Lime (neo-brutalism)
    'fluid_sunset', // #6 Sunset Flow
    'cosmic_purple', // #7 Cosmic Night
    'fresh_emerald', // #8 Fresh Mint
    'neon_acid', // #9 Neon Acid
    'pastel_rose', // #10 Rose Petal
    'clean_air', // #11 Clean Slate
    'abstract_paint', // #12 Abstract Art
];

const SAMPLE_NAMES = ['Sarah J.', 'Alex Chen', 'Tech Start', 'Studio M', 'Davide R.', 'Create Inc.', 'Jordan Lee', 'Morgan F.', 'Pixel Art', 'Acid Burn', 'Cloud Sys', 'Rock Solid'];
const SOCIAL_LINKS = ['Instagram', 'TikTok', 'Twitter', 'LinkedIn'];

// No more background overrides needed - new themes have correct backgrounds built-in!
const BACKGROUND_OVERRIDES: Record<string, string> = {};

// No more text color overrides needed - new themes have correct colors built-in!
const TEXT_COLOR_OVERRIDES: Record<string, string> = {};

const templates = FEATURED_THEMES.map((id, index) => {
    const theme = LINKTREE_THEMES[id];
    if (!theme) return null;

    // Construct preview style - use override color or theme default
    let previewStyle: React.CSSProperties = {
        color: TEXT_COLOR_OVERRIDES[id] || theme.colors.text
    };

    if (BACKGROUND_OVERRIDES[id]) {
        if (BACKGROUND_OVERRIDES[id].startsWith('#')) {
            previewStyle.background = BACKGROUND_OVERRIDES[id];
        } else {
            previewStyle.background = `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${BACKGROUND_OVERRIDES[id]})`;
            previewStyle.backgroundSize = 'cover';
            previewStyle.backgroundPosition = 'center';
        }
    } else if (theme.backgroundConfig?.type === 'image' || theme.backgroundConfig?.type === 'gradient') {
        previewStyle.background = theme.backgroundConfig.value;
        previewStyle.backgroundSize = 'cover';
        previewStyle.backgroundPosition = 'center';
    } else {
        previewStyle.background = theme.colors.background;
    }

    // Apply Brutalism Style for brutal_* themes (preview only - actual themes have this built-in)
    if (['brutal_pink', 'brutal_yellow', 'brutal_orange', 'brutal_lime'].includes(id)) {
        previewStyle.border = '3px solid #000000';
        previewStyle.boxShadow = '6px 6px 0px #000000';
        previewStyle.borderRadius = '0px';
    }

    // Pick a stock photo based on category or index to ensure variety
    // We flatten the stock photos to pick easily
    const allStock = [
        ...STOCK_PHOTOS.professional,
        ...STOCK_PHOTOS.creative,
        ...STOCK_PHOTOS.technology,
        ...STOCK_PHOTOS.abstract
    ];

    // Cycle through stock photos
    const avatarUrl = allStock[index % allStock.length];

    // Cycle names
    const userName = SAMPLE_NAMES[index % SAMPLE_NAMES.length];

    return {
        id: theme.id,
        name: theme.name,
        category: theme.category || 'Standard',
        previewStyle: previewStyle,
        thumbnailSrc: undefined,
        avatarUrl,
        userName,
        sampleLinks: SOCIAL_LINKS
    };
}).filter(Boolean) as any[];

const BioLinksPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    const handleTemplateClick = (templateId: string) => {
        setSelectedTemplateId(templateId);
        setIsModalOpen(true);
    };

    const handleStartDesigning = (headline: string) => {
        setIsModalOpen(false);
        if (!selectedTemplateId) return;

        // Generate a random ID (simple unique string)
        const randomId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

        // Clean headline for URL (slugify)
        // e.g. "Steven Liu" -> "Steven-Liu"
        const slug = headline.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

        // Navigate to Editor: /portfolio/SLUG/edit/ID
        navigate(`/portfolio/${slug}/edit/${randomId}?template=${selectedTemplateId}`);
    };
    return (
        <div className="bg-white dark:bg-gray-950 min-h-screen flex flex-col font-sans">
            <PublicHeader />

            <GuestPromptModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleStartDesigning}
            />

            <main className="flex-grow pt-24 pb-20">
                {/* Header */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
                        Choose a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Starting Point</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Select a template to launch your professional portfolio in seconds.
                        Fully customizable to match your personal brand.
                    </p>

                    {/* Categories - Linktree Style */}
                    <div className="flex flex-wrap justify-center gap-2 mb-12">
                        {(['All', 'Seasonal', 'Sports', 'Gaming', 'Creative', 'Minimal'] as const).map((cat) => (
                            <button key={cat} className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${cat === 'All' ? 'bg-gray-900 border-gray-900 dark:bg-white dark:border-white text-white dark:text-gray-900 shadow-md' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {templates.map((template, index) => (
                            <div key={template.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 100}ms` }}>
                                <TemplateCard
                                    {...template}
                                    category={template.category}
                                    onSelect={() => handleTemplateClick(template.id)}
                                // Props are now spread from template, but explicitly showing intent for clarity if needed, 
                                // but {...template} covers avatarUrl, userName, sampleLinks
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="mt-24 px-4">
                    <div className="max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800">
                        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Start with a blank canvas?</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto">
                            Prefer to build from scratch? Our builder gives you complete control over every element to design exactly what you need.
                        </p>
                        <button onClick={() => navigate('/portfolio-builder')} className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 dark:border-gray-700 rounded-full font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors bg-white dark:bg-black shadow-sm">
                            Build from Scratch
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default BioLinksPage;
