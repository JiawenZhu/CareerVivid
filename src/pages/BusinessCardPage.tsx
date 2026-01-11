import React, { Suspense, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Wifi, ShieldCheck, Zap, Loader2, Rotate3D, ArrowDown, RotateCcw, Moon, Sun, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePortfolios } from '../hooks/usePortfolios';
import { navigate } from '../App';
import { CARD_TEMPLATES } from '../features/portfolio/constants/cardTemplates';
import { generatePortfolioFromPrompt } from '../features/portfolio/services/portfolioGenerator';
import CardTemplate from '../features/portfolio/templates/nfc/CardTemplate';
import QRCodeSVG from 'react-qr-code';
import HowItWorks from '../components/business-card/HowItWorks';

// Neo-Brutalism templates for display
const NEO_BRUTALISM_TEMPLATES = [
    { id: 'brutalist_yellow', label: 'Caution Yellow', color: '#FFB800', textColor: '#000000' },
    { id: 'brutalist_pink', label: 'Plastic Pink', color: '#FF69B4', textColor: '#000000' },
    { id: 'brutalist_blue', label: 'Glitch Cyan', color: '#00FFFF', textColor: '#000040' },
    { id: 'brutalist_orange', label: 'Retro Orange', color: '#FF4500', textColor: '#FFFFFF' },
    { id: 'brutalist_bw', label: 'High Contrast', color: '#FFFFFF', textColor: '#000000' },
];

const BusinessCardPage: React.FC = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { createPortfolio } = usePortfolios();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [previewTemplateId, setPreviewTemplateId] = useState<string>(() => {
        // Load from localStorage on init
        if (typeof window !== 'undefined') {
            return localStorage.getItem('businessCardTheme') || 'brutalist_yellow';
        }
        return 'brutalist_yellow';
    });
    const [hasUserSelectedTheme, setHasUserSelectedTheme] = useState(false);
    const [isVertical, setIsVertical] = useState(true);
    const [isFlipped, setIsFlipped] = useState(false);

    // Persist theme to localStorage
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('businessCardTheme', previewTemplateId);
        }
    }, [previewTemplateId]);

    // GSAP Scroll Trigger for Flip
    React.useEffect(() => {
        // Dynamic import to avoid SSR issues if any, simplifies build
        import('gsap').then((gsap) => {
            import('gsap/ScrollTrigger').then((ScrollTrigger) => {
                gsap.default.registerPlugin(ScrollTrigger.default);

                // Flip animation based on scroll (Scrub)
                // Using immediateRender: false to avoid glitches on reload
                gsap.default.to("#card-flipper", {
                    scrollTrigger: {
                        trigger: "#nfc-hero-section",
                        start: "top top", // Start when hero top hits top viewport
                        end: "bottom top", // End when hero bottom hits top viewport (fully scrolled past)
                        scrub: 1, // Smooth scrub
                        // markers: true,
                    },
                    rotateY: 180,
                    ease: "power1.inOut"
                });
            });
        });
    }, []);

    const handleTemplateClick = async (templateId: string) => {
        if (!currentUser) {
            navigate('/signin?redirect=/business-card');
            return;
        }
        setIsCreating(true);
        setSelectedTemplateId(templateId);
        try {
            const generatedData = await generatePortfolioFromPrompt('Create a professional digital business card', currentUser.uid);
            generatedData.templateId = templateId as any;
            generatedData.mode = 'business_card';
            generatedData.businessCard = { orientation: 'horizontal' };
            const portfolioId = await createPortfolio(generatedData);
            const username = currentUser.email?.split('@')[0] || 'user';
            navigate(`/portfolio/${username}/edit/${portfolioId}`);
        } catch (error) {
            console.error('[BusinessCardPage] Error creating card:', error);
            alert('Failed to create card. Please try again.');
        } finally {
            setIsCreating(false);
            setSelectedTemplateId(null);
        }
    };

    // Mock Data for Display
    const mockData = {
        id: 'demo',
        userId: 'demo',
        title: "Eva's Portfolio",
        hero: {
            headline: "Eva's portfolio card",
            avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800", // Asian professional woman
        },
        about: "SARAH IS A SEASONED UX DESIGNER WITH OVER 8 YEARS OF EXPERIENCE IN DESIGNING ENGAGING AND USER-FRIENDLY DIGITAL PRODUCTS",
        phone: "408-123-4567",
        contactEmail: "sarah.chen.ux@example.com",
        templateId: previewTemplateId,
        businessCard: {
            orientation: isVertical ? 'vertical' : 'horizontal',
            usePhotoBackground: true,
            blurLevel: 10 // Default blur
        }
    } as any;

    return (
        <div ref={containerRef} className={`relative w-full overflow-x-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'}`}>

            {/* Fixed Background Card Container (CSS 3D) */}
            <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
                <div
                    id="card-flipper-container"
                    className={`relative perspective-1000 transform scale-150 transition-all duration-700 pointer-events-auto ${isVertical ? 'w-[300px] aspect-[9/16] md:w-[350px]' : 'w-[400px] aspect-[16/10] md:w-[450px]'}`}
                >
                    {/* The Flipper - Rotates via ScrollTrigger */}
                    <div
                        id="card-flipper"
                        className="relative w-full h-full"
                        style={{
                            transformStyle: 'preserve-3d',
                            transform: 'rotateY(0deg)' // Initial state
                        }}
                    >
                        {/* Front Face: Iframe - Transparent background */}
                        <div
                            className="absolute inset-0 w-full h-full rounded-[24px] overflow-hidden shadow-2xl backface-hidden"
                            style={{
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                transform: 'rotateY(0deg)',
                                border: 'none',
                                background: 'transparent'
                            }}
                        >
                            <iframe
                                key={`${hasUserSelectedTheme ? previewTemplateId : 'default'}-${isVertical ? 'v' : 'h'}`}
                                src={`/portfolio/Evasportfoliocard/ek4cGabmLny58PejBgja?embed=true${hasUserSelectedTheme ? `&theme=${previewTemplateId}` : ''}&orientation=${isVertical ? 'vertical' : 'horizontal'}`}
                                className="w-full h-full border-none"
                                title="Eva's Portfolio"
                                style={{ pointerEvents: 'auto' }}
                            />
                        </div>

                        {/* Back Face: Matches CardTemplate's back face layout */}
                        <div
                            className="absolute inset-0 w-full h-full rounded-[24px] shadow-2xl backface-hidden flex flex-col items-center justify-center p-6"
                            style={{
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                                backgroundColor: CARD_TEMPLATES[previewTemplateId]?.baseColor || '#FFB800',
                                color: CARD_TEMPLATES[previewTemplateId]?.textColor || '#000000',
                                border: CARD_TEMPLATES[previewTemplateId]?.overlayStyle?.border || 'none'
                            }}
                        >
                            {/* Return Button - Same as CardTemplate */}
                            <button
                                onClick={() => {
                                    const newFlipped = false;
                                    setIsFlipped(newFlipped);
                                    import('gsap').then((gsap) => {
                                        gsap.default.to("#card-flipper", {
                                            rotateY: 0,
                                            duration: 0.7,
                                            ease: "power2.inOut"
                                        });
                                    });
                                }}
                                className="absolute top-4 right-4 p-2 bg-white/90 rounded-lg cursor-pointer hover:scale-105 transition-transform pointer-events-auto z-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                title="Back to Front"
                            >
                                <RotateCcw size={20} className="text-black" />
                            </button>

                            <div className="bg-white p-4 rounded-xl shadow-lg">
                                <QRCodeSVG
                                    value="https://careervivid.app/portfolio/Evasportfoliocard/ek4cGabmLny58PejBgja"
                                    size={isVertical ? 180 : 140}
                                    level="H"
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                />
                            </div>

                            <p className="mt-4 text-sm font-bold uppercase tracking-wider opacity-80">
                                Scan to Connect
                            </p>
                            <p className="text-xs opacity-50 mt-1 text-center max-w-[200px] break-all">
                                https://careervivid.app/portfolio/eva'sportfoliocard/ek4cGabmLny58PejBgja
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Template Picker - Top Right */}
            <div className="fixed top-24 right-4 z-30 flex flex-col items-end gap-3 pointer-events-none">
                <div className={`flex items-center gap-3 p-2 backdrop-blur-lg rounded-xl border pointer-events-auto transition-colors duration-300 ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-white/70 border-gray-200 shadow-lg'}`}>
                    {/* Flip Card Button - Same behavior as QR code button in CardTemplate */}
                    <button
                        onClick={() => {
                            const newFlipped = !isFlipped;
                            setIsFlipped(newFlipped);
                            // Same flip animation as CardTemplate QR code trigger
                            import('gsap').then((gsap) => {
                                gsap.default.to("#card-flipper", {
                                    rotateY: newFlipped ? 180 : 0,
                                    duration: 0.7, // Matches CardTemplate transition-transform duration-700
                                    ease: "power2.inOut"
                                });
                            });
                        }}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors border ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20 border-white/20' : 'bg-gray-100 hover:bg-gray-200 border-gray-300'}`}
                        title={isFlipped ? 'Show Front' : 'Show Back (QR)'}
                    >
                        <ArrowDown size={20} className={`transition-transform duration-300 ${isFlipped ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                    </button>

                    {/* Orientation Toggle Button (Horizontal/Vertical) */}
                    <button
                        onClick={() => setIsVertical(!isVertical)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors border ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20 border-white/20' : 'bg-gray-100 hover:bg-gray-200 border-gray-300'}`}
                        title={isVertical ? 'Switch to Horizontal' : 'Switch to Vertical'}
                    >
                        <RotateCcw
                            size={20}
                            className={`transition-transform duration-500 ${isVertical ? '' : 'rotate-90'} ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                        />
                    </button>

                    {/* Dark/Light Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors border ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20 border-white/20' : 'bg-gray-100 hover:bg-gray-200 border-gray-300'}`}
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? <Sun size={20} className="text-white" /> : <Moon size={20} className="text-gray-700" />}
                    </button>

                    <div className={`w-px h-8 ${theme === 'dark' ? 'bg-white/20' : 'bg-gray-300'}`} />

                    {/* Template Swatches */}
                    {NEO_BRUTALISM_TEMPLATES.map((template) => (
                        <button
                            key={template.id}
                            onClick={() => {
                                setHasUserSelectedTheme(true);
                                setPreviewTemplateId(template.id);
                                handleTemplateClick(template.id);
                            }}
                            onMouseEnter={() => {
                                setHasUserSelectedTheme(true);
                                setPreviewTemplateId(template.id);
                            }}
                            disabled={isCreating}
                            className={`
                                w-8 h-12 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                transition-all duration-200 hover:scale-110
                                ${previewTemplateId === template.id ? 'ring-2 ring-white scale-110' : ''}
                                ${isCreating && selectedTemplateId === template.id ? 'animate-pulse' : ''}
                            `}
                            style={{ backgroundColor: template.color }}
                            title={template.label}
                        >
                            {isCreating && selectedTemplateId === template.id && (
                                <Loader2 className="w-3 h-3 text-white animate-spin mx-auto" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable Content */}
            <main className="relative z-10 pointer-events-none">
                {/* Hero Section Overlay - Shifts left when horizontal to avoid card overlap */}
                <section id="nfc-hero-section" className={`min-h-screen flex items-center p-6 md:p-12 transition-all duration-700 ease-in-out ${!isVertical ? 'md:translate-x-[-120px]' : ''}`}>
                    {/* Glassmorphism Text Overlay (Left Side) - Adjusted Position */}
                    <div className={`pointer-events-auto backdrop-blur-xl p-8 rounded-3xl max-w-lg transform hover:-translate-y-1 transition-all duration-700 ml-0 md:ml-12 mt-24 md:mt-0 ${!isVertical ? 'scale-90 md:scale-95' : ''} ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10 shadow-xl'}`}>
                        <h1 className={`text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-tight bg-clip-text text-transparent ${theme === 'dark' ? 'bg-gradient-to-br from-white via-gray-200 to-gray-500' : 'bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500'}`}>
                            One Tap.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                                Share Everything.
                            </span>
                        </h1>
                        <p className={`text-xl font-medium mb-8 leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            The last business card you will ever need.
                        </p>

                        {/* Navigation Buttons */}
                        <div className="flex flex-wrap gap-4 mb-8">
                            <button
                                onClick={() => navigate('/order-nfc-card')}
                                className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                            >
                                Order Now
                            </button>
                            <button
                                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                className={`px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ${theme === 'dark' ? 'bg-white text-gray-800' : 'bg-white text-gray-800 border border-gray-200'}`}
                            >
                                How It Works
                                <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                                    <Play className="w-4 h-4 text-white fill-white" />
                                </span>
                            </button>
                        </div>

                        <div className={`flex items-center gap-2 text-sm font-mono uppercase tracking-widest animate-pulse ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            <ArrowRight className="w-4 h-4 rotate-90" />
                            Scroll to Explore
                        </div>
                    </div>
                </section>

                {/* Features Section - Cards animate when main card is flipped */}
                <section id="nfc-features-section" className="min-h-screen flex flex-col md:flex-row items-center justify-between p-8 max-w-7xl mx-auto">
                    <div className="w-full md:w-1/3 space-y-12">
                        {/* Built-in NFC Chip - Push left and rotate -45deg when flipped */}
                        <div
                            className={`backdrop-blur-xl border p-6 rounded-2xl pointer-events-auto ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10 shadow-lg'}`}
                            style={{
                                transform: isFlipped
                                    ? 'translateX(-120px) translateY(-30px) rotate(-45deg) scale(0.85)'
                                    : 'translateX(0) translateY(0) rotate(0deg) scale(1)',
                                opacity: isFlipped ? 0.5 : 1,
                                transition: 'transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 1s ease-out'
                            }}
                        >
                            <Wifi className="w-10 h-10 text-cyan-400 mb-4" />
                            <h3 className="text-2xl font-bold mb-2">Built-in NFC Chip</h3>
                            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Instantly transfer your portfolio, contact info, and socials with a single tap.</p>
                        </div>
                        {/* Durable & Waterproof - Push left more and rotate -45deg when flipped */}
                        <div
                            className={`backdrop-blur-xl border p-6 rounded-2xl pointer-events-auto ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10 shadow-lg'}`}
                            style={{
                                transform: isFlipped
                                    ? 'translateX(-150px) translateY(50px) rotate(-45deg) scale(0.8)'
                                    : 'translateX(0) translateY(0) rotate(0deg) scale(1)',
                                opacity: isFlipped ? 0.4 : 1,
                                transition: 'transform 1.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 1s ease-out'
                            }}
                        >
                            <ShieldCheck className="w-10 h-10 text-purple-400 mb-4" />
                            <h3 className="text-2xl font-bold mb-2">Durable & Waterproof</h3>
                            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Crafted from premium matte PVC with UV gloss finish. Built to last.</p>
                        </div>
                    </div>
                    {/* Spacer for Card in center */}
                    <div className="w-full md:w-1/3 h-96"></div>

                    <div className="w-full md:w-1/3 space-y-12 text-right">
                        {/* No Charging Required - Push right and rotate +45deg when flipped */}
                        <div
                            className={`backdrop-blur-xl border p-6 rounded-2xl pointer-events-auto ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10 shadow-lg'}`}
                            style={{
                                transform: isFlipped
                                    ? 'translateX(120px) translateY(20px) rotate(45deg) scale(0.85)'
                                    : 'translateX(0) translateY(0) rotate(0deg) scale(1)',
                                opacity: isFlipped ? 0.5 : 1,
                                transition: 'transform 1.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 1s ease-out'
                            }}
                        >
                            <Zap className="w-10 h-10 text-emerald-400 mb-4 ml-auto" />
                            <h3 className="text-2xl font-bold mb-2">No Charging Required</h3>
                            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Passive NFC technology means it works forever without a battery.</p>
                        </div>
                    </div>
                </section>

                {/* ===== NEW: Choose Your Template Section ===== */}
                <section id="template-selection" className={`min-h-[80vh] flex flex-col justify-center items-center p-6 md:p-12 pointer-events-auto ${theme === 'dark' ? 'bg-gradient-to-b from-transparent via-black/50 to-black' : 'bg-gradient-to-b from-transparent via-white/50 to-gray-100'}`}>
                    <div className="max-w-5xl w-full">
                        <div className="text-center mb-12">
                            {/* Text with strong shadow and backdrop for visibility when card overlaps */}
                            <h2
                                className={`text-4xl md:text-6xl font-black mb-4 tracking-tight relative z-10 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                                style={{
                                    textShadow: theme === 'dark'
                                        ? '0 2px 20px rgba(0,0,0,0.9), 0 4px 40px rgba(0,0,0,0.8), 0 0 80px rgba(0,0,0,0.6)'
                                        : '0 2px 20px rgba(255,255,255,0.9), 0 4px 40px rgba(255,255,255,0.8), 0 0 80px rgba(255,255,255,0.6)'
                                }}
                            >
                                Choose Your Template
                            </h2>
                            <p
                                className={`text-xl relative z-10 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
                                style={{
                                    textShadow: theme === 'dark'
                                        ? '0 2px 15px rgba(0,0,0,0.9), 0 4px 30px rgba(0,0,0,0.7)'
                                        : '0 2px 15px rgba(255,255,255,0.9), 0 4px 30px rgba(255,255,255,0.7)'
                                }}
                            >
                                Start with a bold <span className="text-cyan-400 font-semibold">Neo-Brutalism</span> design
                            </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
                            {NEO_BRUTALISM_TEMPLATES.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => handleTemplateClick(template.id)}
                                    onMouseEnter={() => setPreviewTemplateId(template.id)}
                                    disabled={isCreating}
                                    className={`
                                        relative aspect-[3/4] rounded-xl overflow-hidden
                                        border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                                        transform transition-all duration-200
                                        hover:scale-105 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                                        active:scale-95 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        group
                                        ${previewTemplateId === template.id ? 'ring-4 ring-white ring-offset-2 ring-offset-black' : ''}
                                    `}
                                    style={{ backgroundColor: template.color }}
                                >
                                    {isCreating && selectedTemplateId === template.id && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                                        </div>
                                    )}
                                    <div
                                        className="absolute bottom-0 left-0 right-0 p-3 font-bold text-sm uppercase tracking-wider"
                                        style={{
                                            color: template.textColor,
                                            backgroundColor: template.id === 'brutalist_bw' ? 'transparent' : 'rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        {template.label}
                                    </div>
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight
                                            className="w-6 h-6"
                                            style={{ color: template.textColor }}
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-gray-500 mt-8 text-sm">
                            Click a template to start designing your card instantly
                        </p>
                    </div>
                </section>

                {/* How It Works Section */}
                <HowItWorks
                    theme={theme}
                    selectedColor={NEO_BRUTALISM_TEMPLATES.find(t => t.id === previewTemplateId)?.color || '#FF69B4'}
                />



                {/* Showcase / Notification Demo */}
                <section className="min-h-[80vh] flex flex-col justify-center items-center p-6 bg-gradient-to-t from-gray-900 via-transparent to-transparent pointer-events-auto">
                    <div className="relative w-full max-w-md bg-white text-black p-4 rounded-3xl shadow-2xl transform scale-110">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-black rounded-b-xl"></div>
                        <div className="mt-8 flex items-center justify-between bg-gray-100 p-3 rounded-2xl shadow-sm border border-gray-200 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">NFC</div>
                                <div>
                                    <h4 className="font-semibold text-sm">NFC Tag Detected</h4>
                                    <p className="text-xs text-gray-500">Open in CareerVivid</p>
                                </div>
                            </div>
                            <span className="text-xs text-blue-500 font-bold">OPEN</span>
                        </div>
                    </div>
                    <h2 className="text-4xl font-bold mt-12 text-center">Works on iPhone & Android</h2>
                </section>

                {/* CTA Section */}
                <section className="min-h-[60vh] flex flex-col justify-center items-center p-6 bg-black relative overflow-hidden pointer-events-auto">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900/40"></div>
                    <h2 className="text-5xl md:text-7xl font-bold mb-8 text-center relative z-10">Ready to Upgrade?</h2>
                    <button
                        onClick={() => {
                            const section = document.getElementById('template-selection');
                            section?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="group relative z-10 px-12 py-5 bg-white text-black text-xl font-bold rounded-full overflow-hidden hover:scale-105 transition-transform duration-300"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Get Your Card <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                </section>
            </main>
        </div>
    );
};

export default BusinessCardPage;
