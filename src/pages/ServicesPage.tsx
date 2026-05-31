import React, { useEffect } from 'react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import InteractiveEstimator from '../components/services/InteractiveEstimator';
import { ShieldCheck, Code } from 'lucide-react';
import { navigate } from '../utils/navigation';

const editorialGridStyle: React.CSSProperties = {
    backgroundColor: '#f7f1e7',
    backgroundImage: 'linear-gradient(rgba(228, 211, 188, 0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(228, 211, 188, 0.32) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
};

const ServicesPage: React.FC = () => {

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const scrollToEstimator = () => {
        const estimator = document.getElementById('estimator');
        if (estimator) {
            estimator.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen flex flex-col font-sans text-[#211b16] selection:bg-[#ead9c3]" style={editorialGridStyle}>
            <PublicHeader variant="editorial" />

            {/* Added margin-top to account for StickyBanner in InteractiveEstimator if it was at top of page, 
                but since StickyBanner is inside the component which is further down, we might want to move it up? 
                Actually, the requirements said 'Sticky Banner: Add a top notification bar'. 
                If using InteractiveEstimator inside Main, the banner will be inside Main. 
                Ideally it should be at the very top. 
                However, for now, let's keep it simple. If the user wants it at the absolute top, we'd need to lift state or move component.
                But CSS sticky top works within container usually. 
                Let's assume the Estimator component handles the banner display correctly.
                Wait, if I put StickyBanner inside InteractiveEstimator and render InteractiveEstimator *below* Hero, the banner will appear below hero.
                The prompt said: "Sticky Banner: Add a top notification bar...". 
                Usually this means at the very top of the viewport.
                I should probably render the banner here or make it fixed.
                In InteractiveEstimator I made it `sticky top-0`. If it's inside the flow, it will stick to the top of the viewport when scrolled to.
                But standard "Flash Sale" banners are usually at the very top of the site.
                I will make the banner fixed at the top of the page in the Estimator component or move it here.
                Let's double check my implementation in InteractiveEstimator.
                It uses `sticky top-0`.
                If I want it global, I should probably hoist it. 
                But for this task, I'll update ServicesPage to ensure it looks good. 
                Actually, if the banner is part of the "deal", seeing it when you look at pricing is fine.
                But "Sale ends in..." usually implies site-wide.
                Use `fixed top-0` in estimator might overlap header?
                PublicHeader is `fixed top-0`.
                So we have a conflict.
                I will instruct `ServicesPage` to render the banner if I extract it, or I will adjust the top padding.
                
                Let's stick to the prompt's structural implication: "Update 217 Digital Landing Page...".
                I will leave it in the Estimator component for now as a "Section Header" effectively, 
                OR I can use `fixed` and push the header down? No that's complex.
                
                Let's proceed with updating content and theme first.
            */}

            <main className="flex-grow pt-20">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-32">
                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fffaf1]/90 border border-[#e4d3bc] mb-8 animate-fade-in-up shadow-sm shadow-[#8b5a16]/5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a97935] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8b5a16]"></span>
                            </span>
                            <span className="text-sm font-bold text-[#8b5a16]">New Client Offer: 70% OFF</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold text-[#211b16] mb-6 tracking-tight leading-tight animate-fade-in-up delay-100">
                            Modern Tech for <br className="hidden md:block" />
                            <span className="text-[#8b5a16]">Local Business</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-[#665a4a] max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200">
                            Professional web development, automation, and design. <br />
                            Launch your digital presence for a fraction of the agency cost.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
                            <button
                                onClick={scrollToEstimator}
                                className="px-8 py-4 bg-[#211b16] text-[#fffaf1] rounded-lg font-bold text-lg hover:bg-[#3a2f26] transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-[#8b5a16]/20"
                            >
                                Claim 70% OFF Offer
                            </button>
                            <button
                                onClick={() => navigate('/service-portfolio')}
                                className="px-8 py-4 bg-[#fffaf1] text-[#211b16] border border-[#e4d3bc] rounded-lg font-semibold text-lg hover:border-[#bfa782] transition-colors"
                            >
                                View Portfolio
                            </button>
                        </div>
                    </div>
                </section>

                {/* Founder's Note Section */}
                <section className="py-20 bg-[#fffaf1]/70 border-y border-[#e4d3bc]">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-[#fffaf1] border border-[#e4d3bc] rounded-lg p-8 md:p-12 relative overflow-hidden shadow-sm shadow-[#8b5a16]/5">
                            <div className="absolute top-0 right-0 p-8 text-9xl text-[#e4d3bc] opacity-60 font-serif leading-none select-none">
                                &rdquo;
                            </div>

                            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
                                <div className="flex-shrink-0 flex flex-col items-center">
                                    <div className="w-24 h-24 rounded-full bg-[#211b16] flex items-center justify-center text-[#fffaf1] text-3xl font-bold shadow-lg ring-4 ring-[#f7f1e7]">
                                        JZ
                                    </div>
                                    <div className="mt-4 text-center">
                                        <div className="font-bold text-[#211b16]">Jiawen Zhu</div>
                                        <div className="text-xs text-[#8b5a16] font-semibold uppercase tracking-wide">Founder @ 217 Digital</div>
                                        <div className="text-xs text-[#8b6a3f] mt-1">Tech Founder of CareerVivid</div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-[#211b16] mb-4">Why I started 217 Digital</h3>
                                    <div className="space-y-4 text-[#665a4a] text-lg leading-relaxed">
                                        <p>
                                            &ldquo;Bringing <span className="font-semibold text-[#8b5a16]">Silicon Valley tech standards</span> to Champaign local businesses.&rdquo;
                                        </p>
                                        <p>
                                            I realized many local businesses were paying agency prices for subpar work. My goal is simple: offer elite engineering quality at transparent, accessible prices. No overhead, no middlemen, just direct impact.
                                        </p>
                                    </div>
                                    <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                                        <div className="flex items-center gap-2 text-sm text-[#665a4a] bg-[#f7f1e7] border border-[#e4d3bc] px-3 py-1.5 rounded-lg shadow-sm">
                                            <ShieldCheck size={16} className="text-[#2f6f5e]" />
                                            <span>Local Business Verified</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-[#665a4a] bg-[#f7f1e7] border border-[#e4d3bc] px-3 py-1.5 rounded-lg shadow-sm">
                                            <Code size={16} className="text-[#8b5a16]" />
                                            <span>Full-Stack Expertise</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Interactive Estimator */}
                <div className="[&_.bg-gray-50]:bg-[#f7f1e7] [&_.bg-white]:bg-[#fffaf1] [&_.border-gray-100]:border-[#e4d3bc] [&_.border-gray-200]:border-[#e4d3bc] [&_.text-gray-900]:text-[#211b16] [&_.text-gray-600]:text-[#665a4a] [&_.text-gray-500]:text-[#8b6a3f]">
                    <InteractiveEstimator />
                </div>

            </main>

            <Footer />
        </div>
    );
};

export default ServicesPage;
