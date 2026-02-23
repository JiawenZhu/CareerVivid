import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ArrowRight, Wifi, ShieldCheck, Zap, Loader2,
    Box
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePortfolios } from '../hooks/usePortfolios';
import { navigate } from '../utils/navigation';
import Logo from '../components/Logo';
import HowItWorks from '../components/business-card/HowItWorks';
import FAQSection from '../components/FAQSection';
import { CARD_TEMPLATES } from '../features/portfolio/constants/cardTemplates';

// Select specific templates to display as variants
const DISPLAY_TEMPLATE_IDS = [
    'brutalist_orange', // "The Classic" (Eva's match)
    'card_minimal',     // Minimal
    'pro_executive',    // Professional
    'creative_gradient',// Creative
    'card_modern'       // Clean
];

const DISPLAY_TEMPLATES = DISPLAY_TEMPLATE_IDS.map(id => CARD_TEMPLATES[id]).filter(Boolean);

const BusinessCardPage: React.FC = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const { theme } = useTheme();
    const { createPortfolio } = usePortfolios();
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateCard = async (templateId: string) => {
        if (!currentUser) {
            navigate(`/signin?redirect=/business-card&template=${templateId}`);
            return;
        }
        setIsCreating(true);
        try {
            // Create template-based portfolio data WITHOUT AI generation
            const portfolioData = {
                title: `${currentUser.displayName || 'My'} Business Card`,
                templateId: templateId,
                mode: 'business_card' as const,
                hero: {
                    headline: currentUser.displayName || 'Your Name',
                    subheadline: 'Your Title',
                    avatarUrl: currentUser.photoURL || '',
                    ctaText: 'Contact Me',
                    ctaLink: ''
                },
                about: 'A passionate professional building digital experiences.',
                contactEmail: currentUser.email || '',
                phone: '',
                socialLinks: [],
                businessCard: {
                    orientation: 'vertical' as const,
                    themeId: templateId
                }
            };

            const portfolioId = await createPortfolio(portfolioData as any);
            const username = currentUser.email?.split('@')[0] || 'user';
            navigate(`/portfolio/${username}/edit/${portfolioId}`);
        } catch (error) {
            console.error('[BusinessCardPage] Error creating card:', error);
            alert('Failed to create card. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className={`min-h-screen font-sans ${theme === 'dark' ? 'bg-black text-white' : 'bg-[#f0f0f0] text-gray-900'}`} style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px'
        }}>

            {/* Conditional Header: Authenticated vs Public */}
            {currentUser ? (
                <header className={`fixed top-0 left-0 right-0 z-50 ${theme === 'dark' ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-md border-b-4 border-black shadow-sm`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <a href="/dashboard" className="flex items-center gap-2">
                                <Logo className="h-8 w-8" />
                                <span className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-black'}`}>CareerVivid</span>
                            </a>
                            <div className="flex items-center gap-4">
                                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} hidden sm:block`}>{currentUser.email}</span>
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
                <header className={`fixed top-0 left-0 right-0 z-50 ${theme === 'dark' ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-md border-b-4 border-black shadow-sm`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <a href="/" className="flex items-center gap-2">
                                <Logo className="h-8 w-8" />
                                <span className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-black'}`}>CareerVivid</span>
                            </a>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/signin')}
                                    className={`px-4 py-2 font-bold text-sm rounded-none transition-all ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-900 hover:text-black'}`}
                                >
                                    Log In
                                </button>
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="px-4 py-2 bg-primary-600 text-white font-bold text-sm rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                >
                                    Sign Up Free
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
            )}

            <main className="flex-grow pt-32 pb-20">
                {/* Neo-Brutalist Hero */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-black mb-8 tracking-tighter uppercase relative inline-block">
                        CHOOSE YOUR <span className="bg-[#4ade80] px-4 -skew-x-6 inline-block border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">CARD STYLE</span>
                    </h1>

                    <p className="text-xl md:text-2xl font-bold text-gray-800 max-w-3xl mx-auto border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        Launch your digital business card in seconds. Fully customizable. Zero app required.
                    </p>
                </div>

                {/* Templates Grid */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {DISPLAY_TEMPLATES.map((template) => (
                            <div
                                key={template.id}
                                className="group relative bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
                            >
                                {/* Card Header / Title */}
                                <div className="p-4 border-b-4 border-black bg-gray-50 flex justify-between items-center">
                                    <h3 className="text-xl font-black uppercase tracking-tight text-black">{template.label}</h3>
                                    {template.id === 'brutalist_orange' && (
                                        <span className="bg-yellow-400 text-xs font-black px-2 py-1 border-2 border-black uppercase text-black">
                                            Best Seller
                                        </span>
                                    )}
                                </div>

                                {/* Preview Container */}
                                <div className="p-8 bg-gray-100 flex items-center justify-center min-h-[400px]">
                                    <div className="relative w-[240px] aspect-[9/16] transition-transform duration-500 group-hover:scale-105">
                                        <div className="absolute inset-0 rounded-[20px] overflow-hidden shadow-xl bg-white ring-1 ring-black/5">
                                            <iframe
                                                src={`/portfolio/Evasportfoliocard/ek4cGabmLny58PejBgja?embed=true&theme=${template.id}&orientation=vertical&flipped=false`}
                                                className="w-full h-full border-none pointer-events-none"
                                                title={`${template.label} Preview`}
                                                scrolling="no"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Footer */}
                                <div className="p-4 bg-white border-t-4 border-black mt-auto">
                                    <button
                                        onClick={() => handleCreateCard(template.id)}
                                        disabled={isCreating}
                                        className="w-full py-4 bg-black text-white font-black text-lg uppercase tracking-wide hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="animate-spin" /> Creating...
                                            </>
                                        ) : (
                                            <>
                                                Customize <ArrowRight size={20} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Features Section - Neo-Brutalist Style */}
            <div className="bg-[#a78bfa] border-y-4 border-black py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl md:text-5xl font-black text-center mb-16 uppercase tracking-tight text-white drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                        Everything Built In
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Wifi, title: "Next Gen NFC", desc: "Share instantly with a tap." },
                            { icon: Box, title: "Dynamic QR", desc: "Fallback for older devices." },
                            { icon: Zap, title: "Real-time Analytics", desc: "Track taps and engagement." },
                            { icon: ShieldCheck, title: "Durable & Secure", desc: "Waterproof and built to last." }
                        ].map((feature, i) => (
                            <div key={i} className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <div className="w-16 h-16 bg-black text-white flex items-center justify-center mb-4">
                                    <feature.icon size={32} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-xl font-black mb-2 uppercase text-black">{feature.title}</h3>
                                <p className="font-bold text-gray-600">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="py-20 bg-white">
                <FAQSection />
            </div>

            <div className="border-t-4 border-black">
                <HowItWorks theme={theme as 'light' | 'dark'} />
            </div>
        </div>
    );
};

export default BusinessCardPage;
