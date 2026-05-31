import React, { useState, useEffect } from 'react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { Wand2, LayoutTemplate, UploadCloud, Mic, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { navigate } from '../utils/navigation';

const editorialGridStyle: React.CSSProperties = {
    backgroundColor: '#f7f1e7',
    backgroundImage: 'linear-gradient(rgba(228, 211, 188, 0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(228, 211, 188, 0.32) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
};

// Use Cases for the Bento Grid
const USE_CASES = [
    { role: 'Software Engineer', icon: '💻', desc: 'Highlight technical stacks & projects.' },
    { role: 'Product Manager', icon: '🚀', desc: 'Showcase leadership & metrics.' },
    { role: 'Marketing', icon: '📈', desc: 'Emphasize campaigns & ROI.' },
    { role: 'Healthcare', icon: '🩺', desc: 'Focus on certifications & care.' },
];

const TechLandingPage: React.FC = () => {
    const [typedTitle, setTypedTitle] = useState('');
    const fullTitle = 'Craft Your Future, Faster.';

    useEffect(() => {
        setTypedTitle('');
        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < fullTitle.length) {
                setTypedTitle(fullTitle.substring(0, i + 1));
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, 120);

        return () => clearInterval(typingInterval);
    }, []);

    return (
        <div className="text-[#211b16] min-h-screen flex flex-col font-sans selection:bg-[#ead9c3]" style={editorialGridStyle}>
            <PublicHeader variant="editorial" />
            <main className="flex-grow">

                {/* --- Hero Section --- */}
                <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-32 overflow-hidden">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fffaf1]/90 border border-[#e4d3bc] text-xs font-bold text-[#8b5a16] mb-8 shadow-sm shadow-[#8b5a16]/5">
                            <span className="flex h-2 w-2 rounded-full bg-[#2f6f5e]"></span>
                            v2.0 is now live
                        </div>
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[#211b16] tracking-tight leading-[1.1] min-h-[1.2em]">
                            {typedTitle}
                            <span className="animate-blink text-[#8b5a16]">|</span>
                        </h1>
                        <p className="mt-8 text-xl text-[#665a4a] max-w-2xl mx-auto leading-relaxed">
                            Go from rough draft to job-ready resume in minutes with our intelligent platform. Tailor, optimize, and export professional resumes that stand out.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button onClick={() => navigate('/signup')} className="w-full sm:w-auto px-8 py-4 bg-[#211b16] text-[#fffaf1] rounded-lg font-bold text-lg transition-all transform hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#8b5a16]/15 flex items-center justify-center gap-2">
                                Start Building Free <ArrowRight size={18} />
                            </button>
                            <button onClick={() => navigate('/signup')} className="w-full sm:w-auto px-8 py-4 bg-[#fffaf1] text-[#211b16] border border-[#e4d3bc] rounded-lg font-bold text-lg transition-all transform hover:-translate-y-0.5 hover:border-[#bfa782]">
                                Start Building Free
                            </button>
                        </div>

                        {/* Trust Signals */}
                        <div className="mt-16 pt-8 border-t border-[#e4d3bc]">
                            <p className="text-sm font-semibold text-[#8b6a3f] uppercase tracking-wider mb-6">Trusted by professionals at</p>
                            <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-[#665a4a] opacity-70 transition-all duration-500">
                                {/* Using text placeholders for logos to maintain cleaner code, typically SVGs would go here */}
                                <span className="text-xl font-bold font-serif">Acme Corp</span>
                                <span className="text-xl font-extrabold tracking-tighter">GlobalTech</span>
                                <span className="text-xl font-black italic">Nebula</span>
                                <span className="text-xl font-bold font-mono">/System/</span>
                                <span className="text-xl font-semibold">UniVar</span>
                            </div>
                        </div>
                    </div>
                </section>


                {/* --- Bento Grid Features Section --- */}
                <section className="py-24 bg-[#fffaf1]/70 border-y border-[#e4d3bc]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mb-16 text-center max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[#211b16]">Everything you need to get hired.</h2>
                            <p className="text-xl text-[#665a4a]">Powerful tools wrapped in a simple, beautiful interface.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(280px,auto)]">
                            {/* Large Card: AI Generation */}
                            <div className="md:col-span-2 bg-[#fffaf1] rounded-lg p-8 shadow-sm border border-[#e4d3bc] relative overflow-hidden group transition-all hover:shadow-xl hover:shadow-[#8b5a16]/10">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ead9c3]/50 rounded-bl-[120px] -mr-16 -mt-16 group-hover:scale-105 transition-transform duration-500"></div>
                                <div className="relative z-10 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="w-12 h-12 bg-[#ead9c3] text-[#8b5a16] rounded-lg flex items-center justify-center mb-6">
                                            <Wand2 size={24} />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2 text-[#211b16]">AI-Powered Generation</h3>
                                        <p className="text-[#665a4a] max-w-md">
                                            Writer's block is over. Generate professional summaries, bullet points, and cover letters tailored to your specific role in seconds.
                                        </p>
                                    </div>
                                    <div className="mt-8 bg-[#f7f1e7] rounded-lg p-4 border border-[#e4d3bc] opacity-90 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-2 text-sm text-[#8b6a3f] mb-2">
                                            <Sparkles size={12} className="text-[#8b5a16]" /> AI Suggestion
                                        </div>
                                        <p className="text-sm font-medium text-[#211b16]">"Spearheaded a cross-functional team to reduce deployment time by 40%..."</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tall Card: Templates */}
                            <div className="md:row-span-2 bg-[#211b16] text-[#fffaf1] rounded-lg p-8 shadow-sm border border-[#3a2f26] relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                                <div className="relative z-10 h-full flex flex-col">
                                    <div className="w-12 h-12 bg-[#3a2f26] text-[#fffaf1] rounded-lg flex items-center justify-center mb-6">
                                        <LayoutTemplate size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">ATS-Friendly Templates</h3>
                                    <p className="text-[#d8c6ad] mb-8">
                                        Stand out visually while passing the bots. Our templates are rigorously tested against Applicant Tracking Systems.
                                    </p>
                                    <div className="flex-grow relative">
                                        <div className="absolute top-0 left-0 w-full space-y-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className={`bg-[#3a2f26] rounded-lg p-3 border border-[#5f4c3b] transform transition-all duration-500 ${i === 1 ? 'translate-x-0' : i === 2 ? 'translate-x-4 opacity-60' : 'translate-x-8 opacity-30'}`}>
                                                    <div className="h-2 w-1/3 bg-[#bfa782] rounded mb-2"></div>
                                                    <div className="h-2 w-full bg-[#5f4c3b] rounded"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card: Smart Import */}
                            <div className="bg-[#fffaf1] rounded-lg p-8 shadow-sm border border-[#e4d3bc] group hover:border-[#bfa782] transition-colors">
                                <div className="w-12 h-12 bg-[#e8f0e6] text-[#2f6f5e] rounded-lg flex items-center justify-center mb-6">
                                    <UploadCloud size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-[#211b16]">Smart Import</h3>
                                <p className="text-[#665a4a] text-sm">
                                    Upload your old PDF. We'll extract the data, fix the formatting, and give it a modern makeover instantly.
                                </p>
                            </div>

                            {/* Card: Interview Studio */}
                            <div className="bg-[#fffaf1] rounded-lg p-8 shadow-sm border border-[#e4d3bc] group hover:border-[#bfa782] transition-colors">
                                <div className="w-12 h-12 bg-[#ead9c3] text-[#8b5a16] rounded-lg flex items-center justify-center mb-6">
                                    <Mic size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-[#211b16]">Interview Studio</h3>
                                <p className="text-[#665a4a] text-sm">
                                    Practice with an AI interviewer that adapts to your role and gives you real-time feedback on your answers.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Use Cases / Career Paths --- */}
                <section className="py-24 bg-[#f7f1e7]/80">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                            <div>
                                <h2 className="text-3xl font-bold text-[#211b16] mb-4">Tailored for every path.</h2>
                                <p className="text-lg text-[#665a4a] max-w-xl">
                                    Whether you're coding the future or caring for patients, CareerVivid understands your industry's specific needs.
                                </p>
                            </div>
                            <a href="/newresume" className="text-[#8b5a16] font-semibold hover:text-[#211b16] flex items-center gap-2">
                                See all templates <ArrowRight size={16} />
                            </a>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {USE_CASES.map((useCase) => (
                                <div key={useCase.role} className="p-6 rounded-lg bg-[#fffaf1] border border-[#e4d3bc] hover:border-[#bfa782] transition-all hover:-translate-y-1">
                                    <div className="text-4xl mb-4">{useCase.icon}</div>
                                    <h3 className="text-lg font-bold mb-2 text-[#211b16]">{useCase.role}</h3>
                                    <p className="text-sm text-[#665a4a]">{useCase.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- CTA Section --- */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#211b16]"></div>
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <h2 className="text-4xl sm:text-5xl font-extrabold text-[#fffaf1] mb-8 tracking-tight">
                            Ready to land your next interview?
                        </h2>
                        <p className="text-xl text-[#d8c6ad] mb-10 max-w-2xl mx-auto">
                            Stop wrestling with formatting and start building a resume that gets you hired. Join thousands of professionals today.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button onClick={() => navigate('/signup')} className="px-8 py-4 bg-[#fffaf1] text-[#211b16] rounded-lg font-bold text-lg hover:bg-[#f7f1e7] transition-colors">
                                Create My Resume
                            </button>
                            <div className="flex items-center justify-center gap-2 text-[#d8c6ad] text-sm mt-4 sm:mt-0 sm:ml-6">
                                <CheckCircle2 size={16} className="text-[#9fb29b]" /> No credit card required
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default TechLandingPage;
