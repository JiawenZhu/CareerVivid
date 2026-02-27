import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import HeroVideo from '../components/HeroVideo';
import { navigate } from '../utils/navigation';
import { ArrowRight, CheckCircle2, Wand2, LayoutTemplate, Mic, Globe, Star, Loader2, Github, Users, Building, ChevronDown, Check, Terminal } from 'lucide-react';
import { PricingComparison } from '../components/Landing/PricingComparison';
import CommunityShowcaseHero from '../components/Landing/CommunityShowcaseHero';
import { subscribeToLandingPageSettings, DEFAULT_LANDING_PAGE_SETTINGS } from '../services/systemSettingsService';

const LandingPage: React.FC = () => {
    const { t, ready } = useTranslation();
    const [resumeSuffix, setResumeSuffix] = React.useState(DEFAULT_LANDING_PAGE_SETTINGS.featuredResumeSuffix);

    React.useEffect(() => {
        const unsubscribe = subscribeToLandingPageSettings((settings) => {
            if (settings?.featuredResumeSuffix) {
                setResumeSuffix(settings.featuredResumeSuffix);
            }
        });
        return () => unsubscribe();
    }, []);

    // Show loading state while i18n is initializing
    if (!ready) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-gray-950">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            </div>
        );
    }

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "CareerVivid",
        "url": "https://careervivid.app/",
        "description": t('landing.hero_subtitle'),
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://careervivid.app/job-market?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col font-sans selection:bg-primary-100 dark:selection:bg-primary-900">
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(websiteSchema)}
                </script>
            </Helmet>
            <PublicHeader />
            <main className="flex-grow">
                {/* --- Master Showcase Hero (Community First) --- */}
                <CommunityShowcaseHero />

                {/* --- Legacy Hero Section --- */}
                <section className="relative pt-8 pb-20 lg:pt-12 lg:pb-32 overflow-hidden bg-white dark:bg-gray-950">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 text-xs font-medium text-primary-700 dark:text-primary-300 mb-6">
                                    <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-pulse"></span>
                                    {t('landing.badge_new')}
                                </div>
                                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-8">
                                    Supercharge your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400">career</span>.
                                </h1>
                                <p className="text-2xl lg:text-3xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed max-w-2xl font-medium">
                                    Open-source for developers, seamlessly hosted for professionals. Build an ATS-optimized resume, stunning portfolio, and practice interviews with AI.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-6 mb-12">
                                    <button onClick={() => navigate('/signup')} className="px-10 py-5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-extrabold text-xl transition-all transform hover:scale-105 shadow-xl hover:shadow-primary-500/30 flex items-center justify-center gap-3">
                                        Start for Free (Hosted) <ArrowRight size={24} />
                                    </button>
                                    <a href="https://github.com/Jastalk/CareerVivid" target="_blank" rel="noopener noreferrer" className="px-10 py-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-white rounded-2xl font-extrabold text-xl transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md">
                                        <Github size={24} /> Star on GitHub
                                    </a>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-950 flex items-center justify-center text-xs font-bold">
                                                {String.fromCharCode(64 + i)}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="flex text-yellow-400">
                                            {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} fill="currentColor" />)}
                                        </div>
                                        <span className="font-medium">{t('landing.social_proof')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Hero Visual - Dynamic Video */}
                            <div className="relative lg:h-[600px] w-full flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary-200/30 to-purple-200/30 dark:from-primary-900/20 dark:to-purple-900/20 rounded-full blur-3xl transform rotate-12 scale-75"></div>
                                <div className="relative z-10 w-full max-w-lg lg:max-w-none transform hover:scale-[1.02] transition-transform duration-500">
                                    <HeroVideo />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Feature Showcase Sections --- */}

                {/* Section A: Resume Builder */}
                <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="order-2 md:order-1 relative">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                                    <img
                                        src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop"
                                        alt="Drag and Drop Editor"
                                        className="rounded-xl w-full lg:hidden"
                                    />
                                    <iframe
                                        src={`https://careervivid.app/${resumeSuffix}?viewMode=edit&activeTab=template`}
                                        className="w-full h-[500px] rounded-xl hidden lg:block border-0 bg-gray-50"
                                        title="Resume Builder Feature"
                                    />
                                </div>
                                {/* ATS Score Badge - Moved from Hero */}
                                <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3 animate-bounce-slow z-10">
                                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900 dark:text-white">{t('landing.ats_score')}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('landing.ats_optimized')}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 md:order-2">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                    <LayoutTemplate size={24} />
                                </div>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 text-gray-900 dark:text-white tracking-tight">{t('landing.feature_editor_title')}</h2>
                                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 font-medium leading-relaxed">
                                    {t('landing.feature_editor_desc')}
                                </p>
                                <ul className="space-y-5">
                                    {[t('landing.feature_editor_1'), t('landing.feature_editor_2'), t('landing.feature_editor_3')].map((item, i) => (
                                        <li key={i} className="flex items-center gap-4 text-lg text-gray-700 dark:text-gray-200 font-medium">
                                            <CheckCircle2 size={24} className="text-green-500 flex-shrink-0" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section A-Community: Community Feed */}
                <section className="py-24 bg-white dark:bg-gray-950">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="order-1">
                                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                                    <Users size={24} />
                                </div>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 text-gray-900 dark:text-white tracking-tight">Showcase your work to the world.</h2>
                                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 font-medium leading-relaxed">
                                    Publish your AI-generated resumes, system design whiteboards, and portfolios directly to the CareerVivid Community. Get feedback, build your personal brand, and get discovered by top tech companies.
                                </p>
                                <ul className="space-y-5">
                                    {[
                                        "Share Excalidraw whiteboards",
                                        "1-Click publish to feed",
                                        "Engage with other developers"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-4 text-lg text-gray-700 dark:text-gray-200 font-medium">
                                            <CheckCircle2 size={24} className="text-orange-500 flex-shrink-0" /> {item}
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => navigate('/community')} className="mt-10 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-extrabold text-lg transition-all shadow-lg hover:shadow-orange-500/25 flex items-center gap-3">
                                    Explore the Community <ArrowRight size={20} />
                                </button>
                            </div>
                            <div className="order-2 relative">
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                                    {/* Abstract representation of a community feed */}
                                    <div className="space-y-6">
                                        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500"></div>
                                                <div>
                                                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                                                    <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="h-24 w-full bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4 border border-blue-100 dark:border-blue-800/30 flex items-center justify-center">
                                                <Terminal className="text-blue-400" size={32} />
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="h-6 w-12 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                                                <div className="h-6 w-12 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 opacity-70">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500"></div>
                                                <div>
                                                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                                                    <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="h-16 w-full bg-gray-100 dark:bg-gray-800 rounded-lg mb-4"></div>
                                        </div>
                                    </div>
                                </div>
                                {/* Floating Badge */}
                                <div className="absolute -top-6 -right-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3 animate-bounce-slow delay-700 z-10">
                                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600">
                                        <Star size={24} className="fill-current" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900 dark:text-white">Get Discovered</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Build your brand</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section A2: Portfolio Builder */}
                <section className="py-24 bg-white dark:bg-gray-950">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="order-1">
                                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-xl flex items-center justify-center mb-6">
                                    <Globe size={24} />
                                </div>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 text-gray-900 dark:text-white tracking-tight">{t('landing.feature_portfolio_title') || "Your Personal Portfolio Website"}</h2>
                                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 font-medium leading-relaxed">
                                    {t('landing.feature_portfolio_desc') || "Instantly generate a stunning, mobile-responsive personal website from your resume. Showcase your projects, skills, and experience with a unique URL."}
                                </p>
                                <ul className="space-y-5">
                                    {[
                                        t('landing.feature_portfolio_1') || "One-Click Publish from Resume",
                                        t('landing.feature_portfolio_2') || "Beautiful, Professional Themes",
                                        t('landing.feature_portfolio_3') || "Custom Username URL (careervivid.app/portfolio/you)"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-4 text-lg text-gray-700 dark:text-gray-200 font-medium">
                                            <CheckCircle2 size={24} className="text-pink-500 flex-shrink-0" /> {item}
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => navigate('/auth')} className="mt-10 px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-extrabold text-lg transition-all shadow-lg hover:shadow-pink-500/25 flex items-center gap-3">
                                    {t('landing.cta_build_portfolio') || "Build Your Website"} <ArrowRight size={20} />
                                </button>
                            </div>
                            <div className="order-2 relative">
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                                    <img
                                        src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=2055&auto=format&fit=crop"
                                        alt="Portfolio Website Builder"
                                        className="rounded-xl w-full shadow-inner"
                                    />
                                </div>
                                {/* Floating Badge */}
                                <div className="absolute -top-6 -right-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3 animate-bounce-slow delay-700 z-10">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600">
                                        <LayoutTemplate size={24} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900 dark:text-white">Mobile Ready</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Responsive Design</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section B: AI Features */}
                <section className="py-24 bg-white dark:bg-gray-950">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                                    <Wand2 size={24} />
                                </div>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 text-gray-900 dark:text-white tracking-tight">{t('landing.feature_ai_title')}</h2>
                                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 font-medium leading-relaxed">
                                    {t('landing.feature_ai_desc')}
                                </p>
                                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg text-primary-600">
                                            <Wand2 size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{t('landing.feature_ai_instant')}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('landing.feature_ai_example')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full blur-3xl opacity-50"></div>
                                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="space-y-4">
                                        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full"></div>
                                        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-5/6"></div>
                                        <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800/50">
                                            <div className="flex items-center gap-2 text-primary-600 text-sm font-medium mb-2">
                                                <Wand2 size={14} /> {t('landing.feature_ai_suggestion')}
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                                                {t('landing.feature_ai_tip')}
                                            </p>
                                            <button className="mt-3 text-xs font-semibold text-primary-600 hover:text-primary-700">{t('landing.feature_ai_apply')}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section C: Interview Prep */}
                <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="order-2 md:order-1">
                                <div className="bg-gray-900 text-white rounded-2xl shadow-xl border border-gray-800 p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-20">
                                        <Mic size={120} />
                                    </div>
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0"></div>
                                            <div className="bg-gray-800 p-4 rounded-2xl rounded-tl-none max-w-[80%]">
                                                <p className="text-sm text-gray-300">{t('landing.feature_interview_question')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 justify-end">
                                            <div className="bg-primary-600 p-4 rounded-2xl rounded-tr-none max-w-[80%]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                                    <span className="text-xs font-medium text-white/80">{t('landing.feature_interview_recording')}</span>
                                                </div>
                                                <p className="text-sm text-white">{t('landing.feature_interview_answer')}</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-primary-200 flex-shrink-0"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 md:order-2">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                    <Mic size={24} />
                                </div>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 text-gray-900 dark:text-white tracking-tight">{t('landing.feature_interview_title')}</h2>
                                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 font-medium leading-relaxed">
                                    {t('landing.feature_interview_desc')}
                                </p>
                                <button onClick={() => navigate('/interview-studio')} className="text-primary-600 font-extrabold text-xl hover:text-primary-700 flex items-center gap-3 group">
                                    {t('landing.feature_interview_cta')} <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section D: Global */}
                <section className="py-24 bg-white dark:bg-gray-950">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-2xl mb-8">
                            <Globe size={32} />
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 text-gray-900 dark:text-white tracking-tight">{t('landing.feature_translate_title')}</h2>
                        <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-14 font-medium leading-relaxed">
                            {t('landing.feature_translate_desc')}
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                            {['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Hindi', 'Arabic', '+ 28 more'].map((lang) => (
                                <span key={lang} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                                    {lang}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- Pricing Section --- */}
                <PricingComparison />

                {/* --- Teams & Education Section --- */}
                <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="order-2 md:order-1 relative">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">Career Center Admin</h4>
                                            <p className="text-sm text-gray-500">Managing 150+ Students</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Class of 2026 Cohort</span>
                                            <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full">100% Active</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Engineering Bootcamp</span>
                                            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-full">50 Seats Allocated</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 md:order-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 mb-6 tracking-wider uppercase">
                                    <Building size={14} /> For Teams & Education
                                </div>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 text-gray-900 dark:text-white tracking-tight">Empower your entire cohort.</h2>
                                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 font-medium leading-relaxed">
                                    CareerVivid is built for bootcamps, universities, and career centers. Assign the <code className="bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded text-lg text-primary-600 dark:text-primary-400">academic_partner</code> role to instructors and seamlessly allocate AI credits to students.
                                </p>
                                <ul className="space-y-5 mb-10">
                                    <li className="flex items-center gap-4 text-lg text-gray-700 dark:text-gray-200 font-medium">
                                        <CheckCircle2 size={24} className="text-blue-500 flex-shrink-0" /> Centralized Admin Dashboard
                                    </li>
                                    <li className="flex items-center gap-4 text-lg text-gray-700 dark:text-gray-200 font-medium">
                                        <CheckCircle2 size={24} className="text-blue-500 flex-shrink-0" /> Custom AI Token Limits per Student
                                    </li>
                                    <li className="flex items-center gap-4 text-lg text-gray-700 dark:text-gray-200 font-medium">
                                        <CheckCircle2 size={24} className="text-blue-500 flex-shrink-0" /> View cohort-level job placement statistics
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- FAQ Section --- */}
                <section className="py-24 bg-white dark:bg-gray-950">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">Frequently Asked Questions</h2>
                            <div className="flex items-center justify-center gap-3 text-gray-500 font-bold text-xl">
                                <Check size={24} className="text-green-500" /> Trusted by developers and professionals worldwide.
                            </div>
                        </div>

                        <div className="space-y-6">
                            <details className="group bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors [&_summary::-webkit-details-marker]:hidden">
                                <summary className="flex justify-between items-center font-extrabold text-2xl text-gray-900 dark:text-white">
                                    Can I host this myself for free?
                                    <ChevronDown className="transition-transform group-open:rotate-180" size={28} />
                                </summary>
                                <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                    Yes! CareerVivid is strictly open-source core. You can clone the repository from GitHub and run it locally. Note that you will need to set up your own Firebase instance and provide your own Gemini API key for AI features.
                                </p>
                            </details>
                            <details className="group bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors [&_summary::-webkit-details-marker]:hidden">
                                <summary className="flex justify-between items-center font-extrabold text-2xl text-gray-900 dark:text-white">
                                    Do I need my own AI API key for the Cloud version?
                                    <ChevronDown className="transition-transform group-open:rotate-180" size={28} />
                                </summary>
                                <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                    No. The managed SaaS version of CareerVivid (Cloud) includes a generous monthly token allocation handled through our secure, scalable proxy. Zero API key configuration required.
                                </p>
                            </details>
                            <details className="group bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors [&_summary::-webkit-details-marker]:hidden">
                                <summary className="flex justify-between items-center font-extrabold text-2xl text-gray-900 dark:text-white">
                                    How does team pricing work for bootcamps?
                                    <ChevronDown className="transition-transform group-open:rotate-180" size={28} />
                                </summary>
                                <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                    We offer custom bulk pricing for educational institutions and bootcamps. Instructors receive a dedicated dashboard to invite students via email links and allocate AI credits automatically.
                                </p>
                            </details>
                        </div>
                    </div>
                </section>

                {/* --- CTA Section --- */}
                <section className="py-24 relative overflow-hidden bg-gray-900 dark:bg-black">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 to-purple-900/20"></div>
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-10 tracking-tight leading-tight">
                            {t('landing.cta_title')}
                        </h2>
                        <p className="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
                            {t('landing.cta_desc')}
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-6">
                            <button onClick={() => navigate('/auth')} className="px-10 py-5 bg-white text-gray-900 rounded-2xl font-extrabold text-xl hover:bg-gray-100 transition-colors shadow-2xl">
                                {t('landing.cta_button')}
                            </button>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;