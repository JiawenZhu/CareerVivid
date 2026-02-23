import React, { useState } from 'react';
import BioLinkPricing from '../features/pricing/components/BioLinkPricing';
import TemplateCard from '../features/portfolio/components/bio-links/TemplateCard';
import { LINKTREE_THEMES } from '../features/portfolio/styles/themes';
import { STOCK_PHOTOS } from '../constants/stockPhotos';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import Logo from '../components/Logo';
import { navigate } from '../utils/navigation';
import GuestPromptModal from '../components/GuestPromptModal';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolios } from '../hooks/usePortfolios';
import ConfirmationModal from '../components/ConfirmationModal';

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
        avatarUrl: avatarUrl, // Explicit property
        userName: userName,   // Explicit property
        sampleLinks: SOCIAL_LINKS
    };
}).filter(Boolean) as any[];

const BioLinksPage: React.FC = () => {
    const { isPremium, currentUser } = useAuth();
    const { portfolios, createPortfolio } = usePortfolios();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    // Filter for Bio-Link sites only
    const bioLinksCount = portfolios.filter(p => p.mode === 'linkinbio').length;
    const totalPortfolioCount = portfolios.length;
    const [limitMessage, setLimitMessage] = useState('You have reached your site limit. Please upgrade your plan to create more.');

    const checkLimit = () => {
        // Check total site limit first (2 sites for free users)
        if (currentUser && !isPremium && totalPortfolioCount >= 2) {
            setLimitMessage('Free users can only create up to 2 sites. Please upgrade your plan to create more.');
            setIsUpgradeModalOpen(true);
            return false;
        }
        // Enforce limit for logged-in free users: max 1 bio-link site
        if (currentUser && !isPremium && bioLinksCount >= 1) {
            setLimitMessage('You have reached your Bio-Link limit. Please upgrade your plan to create more.');
            setIsUpgradeModalOpen(true);
            return false;
        }
        return true;
    };

    const handleTemplateClick = (templateId: string) => {
        if (!checkLimit()) return;
        setSelectedTemplateId(templateId);
        setIsModalOpen(true);
    };

    const handleScratchClick = () => {
        if (!checkLimit()) return;
        // Use 'clean_air' as the base for scratch (Clean Slate)
        setSelectedTemplateId('clean_air');
        setIsModalOpen(true);
    };

    const handleStartDesigning = async (headline: string) => {
        setIsModalOpen(false);
        if (!selectedTemplateId) return;

        const slug = headline.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

        if (currentUser) {
            const isBioLink = ['linktree_minimal', 'linktree_visual', 'linktree_corporate', 'linktree_bento'].includes(selectedTemplateId) || (LINKTREE_THEMES && selectedTemplateId in LINKTREE_THEMES);
            const mode = isBioLink ? 'linkinbio' : 'portfolio';
            const effectiveThemeId = (LINKTREE_THEMES && selectedTemplateId in LINKTREE_THEMES) ? selectedTemplateId : 'sunset_surf';

            const newPortfolioData: any = {
                id: '',
                userId: currentUser.uid,
                title: `${headline}'s Bio Link`,
                templateId: selectedTemplateId,
                section: 'portfolios',
                mode: mode,
                linkInBio: isBioLink ? {
                    links: [
                        { id: '1', label: 'Instagram', url: 'https://instagram.com', icon: 'Instagram', enabled: true, variant: 'primary' },
                        { id: '2', label: 'TikTok', url: 'https://tiktok.com', icon: 'Video', enabled: true, variant: 'primary' },
                        { id: '3', label: 'X (Twitter)', url: 'https://twitter.com', icon: 'Twitter', enabled: true, variant: 'primary' },
                        { id: '4', label: 'LinkedIn', url: 'https://linkedin.com', icon: 'Linkedin', enabled: true, variant: 'primary' },
                    ],
                    showSocial: true,
                    showEmail: true,
                    displayName: headline,
                    bio: 'Welcome to my page! Check out my links below.',
                    profileImage: currentUser.photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
                    themeId: effectiveThemeId,
                    buttonLayout: 'stack',
                    customStyle: {
                        buttonAlignment: 'center'
                    }
                } : undefined,
                hero: {
                    headline: headline,
                    subheadline: 'Creator',
                    ctaPrimaryLabel: 'View Work', ctaPrimaryUrl: '#projects', ctaSecondaryLabel: 'Contact', ctaSecondaryUrl: '#contact'
                },
                about: '',
                timeline: [],
                education: [],
                techStack: [],
                projects: [],
                socialLinks: [],
                contactEmail: currentUser.email || '',
                phone: '',
                theme: { primaryColor: '#2563eb', darkMode: false },
                sectionLabels: {
                    about: 'About Me',
                    timeline: 'My Journey',
                    techStack: 'Tech Stack',
                    projects: 'Featured Projects',
                    contact: 'Contact'
                },
                businessCard: {
                    orientation: 'horizontal',
                    usePhotoBackground: false
                },
                updatedAt: Date.now(),
                createdAt: Date.now()
            };

            try {
                const newId = await createPortfolio(newPortfolioData);
                if (newId) {
                    navigate(`/portfolio/${slug}/edit/${newId}?template=${selectedTemplateId}`);
                }
            } catch (err) {
                console.error("Failed to create portfolio", err);
            }
        } else {
            // Guest mode
            const randomId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            navigate(`/portfolio/${slug}/edit/${randomId}?template=${selectedTemplateId}`);
        }
    };

    // ... existing filters ...

    const filteredTemplates = selectedCategory === 'All'
        ? templates
        : templates.filter(t => t.category.toLowerCase().includes(selectedCategory.toLowerCase()) || (selectedCategory === 'Creative' && ['brutal', 'neon'].some(k => t.category.toLowerCase().includes(k))));

    const displayedTemplates = selectedCategory === 'All'
        ? templates
        : templates.filter(t => {
            if (selectedCategory === 'Seasonal') return t.category === 'Seasonal';
            if (selectedCategory === 'Sports') return t.category === 'Sports';
            if (selectedCategory === 'Gaming') return t.category === 'Gaming';
            if (selectedCategory === 'Creative') return ['Creative', 'Abstract', 'Neo-Brutalism'].includes(t.category);
            if (selectedCategory === 'Minimal') return ['Minimal', 'Professional', 'Modern'].includes(t.category);
            return t.category === selectedCategory;
        });

    return (
        <div className="bg-[#f0f0f0] min-h-screen flex flex-col font-sans" style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px'
        }}>
            {/* Conditional Header: Authenticated vs Public */}
            {currentUser ? (
                <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b-4 border-black shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <a href="/dashboard" className="flex items-center gap-2">
                                <Logo className="h-8 w-8" />
                                <span className="text-xl font-black text-black">CareerVivid</span>
                            </a>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-600 hidden sm:block">{currentUser.email}</span>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-4 py-2 bg-black text-white font-bold text-sm rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
            ) : (
                <PublicHeader variant="brutalist" context="bio-link" />
            )}

            <GuestPromptModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleStartDesigning}
            />

            <ConfirmationModal
                isOpen={isUpgradeModalOpen}
                onCancel={() => setIsUpgradeModalOpen(false)}
                onConfirm={() => navigate('/subscription')}
                title="Limit Reached"
                message={limitMessage}
                confirmText="Upgrade Now"
                cancelText="Maybe Later"
                variant="default"
            />

            <main className="flex-grow pt-32 pb-20">
                {/* Neo-Brutalist Hero */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-black mb-8 tracking-tighter uppercase relative inline-block">
                        Choose a <br className="md:hidden" />
                        <span className="relative inline-block px-4">
                            <span className="absolute inset-0 bg-[#A7F3D0] -skew-y-2 transform border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"></span>
                            <span className="relative z-10">Starting Point</span>
                        </span>
                    </h1>
                    <p className="text-xl font-bold text-gray-700 max-w-2xl mx-auto mb-12 font-mono bg-white inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        Launch your professional portfolio in seconds. <br />
                        Fully customizable. Zero fluff.
                    </p>

                    {/* Rectangular Tags Filter */}
                    <div className="flex flex-wrap justify-center gap-3 mb-16">
                        {(['All', 'Seasonal', 'Sports', 'Gaming', 'Creative', 'Minimal'] as const).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-6 py-3 font-black text-sm uppercase tracking-wide border-3 border-black transition-all duration-200 ${selectedCategory === cat
                                    ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(167,243,208,1)] transform -translate-y-1'
                                    : 'bg-white text-black hover:bg-[#FDE047] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        {displayedTemplates.map((template, index) => (
                            <div key={template.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 50}ms` }}>
                                <TemplateCard
                                    {...template}
                                    category={template.category}
                                    onSelect={() => handleTemplateClick(template.id)}
                                    variant="brutalist"
                                />
                            </div>
                        ))}
                        {displayedTemplates.length === 0 && (
                            <div className="col-span-full text-center py-20 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <p className="text-black font-bold text-xl uppercase">No templates found for this category.</p>
                                <button
                                    onClick={() => setSelectedCategory('All')}
                                    className="mt-6 text-white bg-black px-6 py-3 font-bold uppercase hover:bg-gray-800"
                                >
                                    View all templates
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pricing Section (Already Brutalist) */}
                <div id="pricing" className="scroll-mt-32">
                    <BioLinkPricing />
                </div>

                {/* Construction Zone Bottom CTA */}
                <div className="mt-24 px-4">
                    <div className="max-w-5xl mx-auto bg-[#FDE047] border-4 border-black p-12 text-center relative overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                        {/* Caution Stripes Pattern */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, transparent 10px, transparent 20px)'
                        }}></div>

                        <div className="relative z-10 bg-white border-4 border-black p-8 md:p-12 inline-block max-w-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h2 className="text-4xl md:text-5xl font-black mb-6 text-black uppercase tracking-tight">
                                Start with a <br />
                                <span className="text-[#3b82f6]">Blank Canvas?</span>
                            </h2>
                            <p className="text-lg font-bold text-gray-800 mb-10 max-w-lg mx-auto font-mono">
                                Prefer to build from scratch? Take full control of every pixel.
                            </p>
                            <button
                                onClick={handleScratchClick}
                                className="px-10 py-5 bg-black text-white border-4 border-black font-black text-xl uppercase tracking-widest hover:bg-white hover:text-black transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
                            >
                                Build from Scratch
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer variant="brutalist" policyPath="/policy#bio-link" />
        </div>
    );
};

export default BioLinksPage;
