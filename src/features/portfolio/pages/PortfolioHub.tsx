
import React, { useState } from 'react';
import {
    Code2,
    Palette,
    Briefcase,
    Sparkles,
    LayoutTemplate,
    ExternalLink,
    Search,
    Plus,
    LayoutDashboard,
    ArrowRight,
    Loader2,
    ChevronLeft,
    FileCode,
    UploadCloud
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { navigate } from '../../../utils/navigation';
import { generatePortfolioFromPrompt } from '../services/portfolioGenerator';
import { usePortfolios } from '../../../hooks/usePortfolios';
import { TEMPLATES } from '../templates';
import Logo from '../../../components/Logo';
import PortfolioImport from '../../../components/PortfolioImport';
import { useAICreditCheck } from '../../../hooks/useAICreditCheck';
import ConfirmationModal from '../../../components/ConfirmationModal';
import PortfolioCard from '../../../components/PortfolioCard';
import SharePortfolioModal from '../../../components/SharePortfolioModal';
import { PortfolioData } from '../types/portfolio';

// Define Category Interface
interface PortfolioCategory {
    id: string;
    name: string;
    description: string;
    templates: string[];
    path?: string; // Optional - if present, navigates directly instead of showing templates
}

// Define Categories
const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
    {
        id: 'linkinbio',
        name: '🔗 Link in Bio',
        description: 'Simple, shareable pages perfect for social media bios (Instagram, TikTok, etc.)',
        path: '/bio-links', // Direct path to specialized builder
        templates: [
            // Structural Templates
            'linktree_minimal',
            'linktree_corporate',
            'linktree_bento',

            // Visual Themes (Mapped to linktree_visual)
            'sunset_surf',
            'neon_nights',
            'papercut',
            'foliage',
            'wavy_bakery',
            'jagged_run',
            'abstract_fluid',
            'mineral'
        ]
    },
    {
        id: 'nfc_cards',
        name: 'Digital Business Cards',
        description: 'Horizontal, mobile-first cards optimized for NFC sharing.',
        path: '/business-card', // Direct path to specialized builder
        templates: ['card_minimal', 'card_photo', 'card_modern']
    },
    {
        id: 'tech',
        name: 'Technology',
        description: 'For software engineers, product managers, and data scientists.',
        templates: ['dev_terminal', 'minimalist', 'saas_modern']
    },
    {
        id: 'creative',
        name: 'Creative & Design',
        description: 'For UX/UI designers, artists, and photographers.',
        templates: ['ux_folio', 'visual', 'creative_dark']
    },
    {
        id: 'professional',
        name: 'Business & Professional',
        description: 'For executives, lawyers, and consultants.',
        templates: ['corporate', 'legal_trust', 'executive_brief']
    },
    {
        id: 'specialist',
        name: 'Specialized Careers',
        description: 'For medical professionals, academics, and creators.',
        templates: ['medical_care', 'academic_research', 'writer_editorial', 'bento_personal']
    }
];

const PortfolioHub: React.FC = () => {
    const { t } = useTranslation();
    const { currentUser, isPremium } = useAuth();
    const { createPortfolio, portfolios, isLoading, deletePortfolio, duplicatePortfolio } = usePortfolios();

    // AI Credit Check Hook
    const { checkCredit, CreditLimitModal } = useAICreditCheck();

    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<typeof PORTFOLIO_CATEGORIES[0] | null>(null);
    const [isFileImport, setIsFileImport] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    // Modal States
    const [shareModalPortfolio, setShareModalPortfolio] = useState<PortfolioData | null>(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Delete',
        onConfirm: async () => { },
    });

    // Counts for limit enforcement
    const bioLinksCount = portfolios.filter(p => p.mode === 'linkinbio').length;
    const totalPortfolioCount = portfolios.length;

    // Limit state
    const [limitMessage, setLimitMessage] = useState('You have reached your site limit. Please upgrade your plan to create more.');

    const handleCreate = async (param: string, type: 'prompt' | 'template' = 'prompt') => {
        if (!currentUser) return;

        // CHECK TOTAL SITE LIMIT FOR FREE USERS FIRST
        if (!isPremium && totalPortfolioCount >= 2) {
            setLimitMessage('Free users can only create up to 2 sites. Please upgrade your plan to create more.');
            setIsUpgradeModalOpen(true);
            return;
        }

        // CHECK CREDIT BEFORE GENERATION
        if (!checkCredit()) return;

        setIsGenerating(true);
        try {
            let promptToUse = '';
            let templateIdToUse = '';
            let specificThemeId = ''; // NEW: Handle specific visual themes

            if (type === 'template') {
                templateIdToUse = param;
                promptToUse = `Create a portfolio for a professional using the ${param} style`;

                // Map visual themes to the master template
                const visualThemes = ['sunset_surf', 'neon_nights', 'papercut', 'foliage', 'wavy_bakery', 'jagged_run', 'abstract_fluid', 'mineral'];
                if (visualThemes.includes(param)) {
                    templateIdToUse = 'linktree_visual';
                    specificThemeId = param;
                }
            } else {
                promptToUse = param;
            }

            console.log('[PortfolioHub] Creating portfolio...', { promptToUse, templateIdToUse, specificThemeId });

            const generatedData = await generatePortfolioFromPrompt(promptToUse, currentUser.uid);

            if (templateIdToUse) {
                generatedData.templateId = templateIdToUse as any;

                // If it's a Link in Bio template (including visual themes), force mode
                if (['linktree_minimal', 'linktree_visual', 'linktree_corporate', 'linktree_bento'].includes(templateIdToUse)) {
                    generatedData.mode = 'linkinbio';
                    generatedData.linkInBio = {
                        links: [],
                        showSocial: true,
                        showEmail: true,
                        displayName: generatedData.hero.headline || currentUser.displayName || 'My Links',
                        bio: generatedData.about || 'Welcome to my links page.',
                        profileImage: generatedData.hero.avatarUrl || currentUser.photoURL,
                        buttonLayout: 'stack',
                        themeId: specificThemeId || 'air' // Apply specific theme if selected
                    };

                    // Also ensure hero fields are compatible
                    generatedData.hero.headline = generatedData.linkInBio.displayName;
                }

                // NEW: Business Card Setup
                if (['card_minimal', 'card_photo', 'card_modern'].includes(templateIdToUse)) {
                    generatedData.mode = 'business_card';
                    generatedData.businessCard = {
                        orientation: 'horizontal'
                    };
                }
            }

            // CHECK BIO-LINK SPECIFIC LIMIT (1 for free users)
            if (generatedData.mode === 'linkinbio') {
                if (!isPremium && bioLinksCount >= 1) {
                    setLimitMessage('You have reached your Bio-Link limit. Please upgrade your plan to create more.');
                    setIsUpgradeModalOpen(true);
                    return; // Stop creation
                }
            }

            const portfolioId = await createPortfolio(generatedData);
            const username = currentUser.email?.split('@')[0] || 'user';

            // Navigate to edit page
            navigate(`/portfolio/${username}/edit/${portfolioId}`);
        } catch (error) {
            console.error('[PortfolioHub] Error creating portfolio:', error);
            alert('Failed to generate portfolio. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePromptSubmit = () => {
        if (!prompt.trim()) return;
        handleCreate(prompt, 'prompt');
    };

    const handleFileProcessed = (text: string) => {
        setIsFileImport(true);
        setPrompt(text);
        // Optional: Auto-submit or let user verify text?
        // Let's autosubmit for magic feel
        handleCreate(text, 'prompt');
    };

    const handleDeleteClick = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Portfolio',
            message: 'Are you sure you want to delete this portfolio? This action cannot be undone.',
            confirmText: 'Delete',
            onConfirm: async () => {
                await deletePortfolio(id);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };


    const renderContent = () => {
        if (selectedCategory) {
            return (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 font-semibold transition-colors"
                    >
                        <ChevronLeft size={18} /> Back to Categories
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 font-heading">
                        Select a Template for {selectedCategory.name}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {selectedCategory.templates.map(tplId => {
                            // Find template logic here ideally, but for now we reconstruct basic info or import it.
                            // We can use a helper map if we had detailed metadata. 
                            // For now, let's map ID to readable name crudely or better, move metadata export to index.ts.
                            // Doing a simple mapping for now to match strict types.
                            // Helper to format name: remove 'linktree_' prefix and capitalize
                            const formattedName = tplId
                                .replace('linktree_', '')
                                .split('_')
                                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(' ');

                            return (
                                <button
                                    key={tplId}
                                    onClick={() => handleCreate(tplId as string, 'template')}
                                    className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all text-left group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Sparkles size={64} />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">{formattedName}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Click to generate using this style.</p>
                                        <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-semibold gap-1 group-hover:gap-2 transition-all">
                                            Use Template <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
        }

        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 font-heading">Explore Design Templates</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {PORTFOLIO_CATEGORIES.map(category => (
                        <button
                            key={category.id}
                            onClick={() => {
                                if (category.path) {
                                    navigate(category.path);
                                } else {
                                    setSelectedCategory(category);
                                }
                            }}
                            className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all text-left flex items-center justify-between group"
                        >
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{category.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{category.description}</p>
                            </div>
                            <ArrowRight size={20} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                        </button>
                    ))}

                    {/* Empty Canvas Option */}
                    <button
                        onClick={() => handleCreate('blank', 'template')}
                        className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-500 hover:bg-white dark:hover:bg-gray-800 transition-all text-left flex items-center justify-between group"
                    >
                        <div>
                            <h3 className="font-semibold text-gray-600 dark:text-gray-300 mb-1">Empty Canvas</h3>
                            <p className="text-xs text-gray-500 line-clamp-1">Start from scratch</p>
                        </div>
                        <Plus size={20} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </button>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex flex-col items-center p-0 relative selection:bg-indigo-500/30">
            <CreditLimitModal />
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
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
            {shareModalPortfolio && (
                <SharePortfolioModal
                    isOpen={!!shareModalPortfolio}
                    onClose={() => setShareModalPortfolio(null)}
                    portfolio={shareModalPortfolio}
                />
            )}

            {/* Dashboard Link */}
            {portfolios.length > 0 && (
                <div className="absolute top-6 right-6 z-20">
                    <a
                        href="/"
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <LayoutDashboard size={18} />
                        <span className="hidden sm:inline">Dashboard</span>
                    </a>
                </div>
            )}

            {/* Top Section: My Portfolios */}
            <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pt-8 pb-12 mb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Briefcase className="text-indigo-600" size={32} />
                            My Portfolios
                        </h1>
                        <button
                            onClick={() => document.getElementById('create-portfolio')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
                        >
                            <Plus size={20} /> New Portfolio
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {portfolios.length > 0 ? (
                            portfolios.map(portfolio => (
                                <PortfolioCard
                                    key={portfolio.id}
                                    portfolio={portfolio}
                                    onDelete={handleDeleteClick}
                                    onDuplicate={duplicatePortfolio}
                                    onShare={(p) => setShareModalPortfolio(p)}
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't created any portfolios yet.</p>
                                <button
                                    onClick={() => document.getElementById('create-portfolio')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="text-indigo-600 font-medium hover:underline"
                                >
                                    Create your first portfolio below
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isGenerating ? (
                <div className="text-center animate-in fade-in duration-700 py-20">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Generating your portfolio...</h1>
                    <p className="text-gray-500 dark:text-gray-400"> Analyzing your inputs and designing the perfect layout.</p>
                </div>
            ) : (
                <div id="create-portfolio" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                    {/* Header */}
                    <div className="text-center mb-12 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="inline-flex items-center justify-center p-3 mb-6 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
                            Build your dream portfolio <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">in minutes.</span>
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Describe your vision, upload a resume, or drop in your code files. <br className="hidden sm:block" />
                            Our AI will generate a stunning, deployed portfolio websites for you instantly.
                        </p>
                    </div>

                    {/* Main Input Card */}
                    <div className="bg-white dark:bg-[#1a1d24] p-6 sm:p-2 rounded-2xl shadow-xl shadow-indigo-500/5 border border-gray-200 dark:border-white/5 mb-16 animate-in slide-in-from-bottom-8 duration-700 delay-100 ring-1 ring-gray-900/5 dark:ring-white/10 max-w-5xl mx-auto">
                        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-0">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                <Code2 className="text-indigo-500" size={24} />
                                Generate from Prompt or Code
                            </h2>
                            <div className="flex flex-col gap-4">
                                <PortfolioImport
                                    value={prompt}
                                    onChange={setPrompt}
                                    onFileProcessed={handleFileProcessed}
                                    placeholder="Describe your portfolio (e.g. 'Dark mode portfolio for a React Developer') or drop existing code files..."
                                    className="bg-transparent"
                                >
                                    <button
                                        onClick={handlePromptSubmit}
                                        className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all flex items-center justify-center disabled:bg-indigo-400 disabled:cursor-not-allowed group"
                                        disabled={!prompt.trim()}
                                        title={isFileImport ? "Parse & Build" : "Generate Portfolio"}
                                    >
                                        <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </PortfolioImport>
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400 font-medium">
                                <span className="flex items-center gap-1.5"><Code2 size={12} /> HTML/CSS/JS</span>
                                <span className="flex items-center gap-1.5"><FileCode size={12} /> React/Vue</span>
                                <span className="flex items-center gap-1.5"><UploadCloud size={12} /> Resumes (PDF/DOCX)</span>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-5xl mx-auto">
                        {renderContent()}
                    </div>

                    {/* Footer Note */}
                    <p className="mt-16 text-center text-gray-500 dark:text-gray-600 text-sm">
                        Powered by Gemini Cloud &bull; Generates layout, copy, and themes
                    </p>
                </div>
            )}
        </div>
    );
};

export default PortfolioHub;
