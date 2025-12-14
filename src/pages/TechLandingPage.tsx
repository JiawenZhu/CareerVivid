import React, { useState, useEffect } from 'react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { Wand2, LayoutTemplate, UploadCloud, Mic, Briefcase, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { navigate } from '../App';

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
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col font-sans selection:bg-primary-100 dark:selection:bg-primary-900">
            <PublicHeader />
            <main className="flex-grow">

                {/* --- Hero Section --- */}
                <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-32 overflow-hidden">
                    {/* Abstract Background Elements */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-gentle-pulse"></div>
                        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-gentle-pulse delay-75"></div>
                    </div>

                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 mb-8">
                            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                            v2.0 is now live
                        </div>
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.1] min-h-[1.2em]">
                            {typedTitle}
                            <span className="animate-blink text-primary-500">|</span>
                        </h1>
                        <p className="mt-8 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                            Go from rough draft to job-ready resume in minutes with our intelligent platform. Tailor, optimize, and export professional resumes that stand out.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button onClick={() => navigate('/auth')} className="w-full sm:w-auto px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold text-lg transition-all transform hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-2">
                                Start Building Free <ArrowRight size={18} />
                            </button>
                            <button onClick={() => navigate('/demo')} className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-full font-bold text-lg transition-all transform hover:scale-105 hover:bg-gray-50 dark:hover:bg-gray-700">
                                Try Live Demo
                            </button>
                        </div>

                        {/* Trust Signals */}
                        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">Trusted by professionals at</p>
                            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
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
                <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mb-16 text-center max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">Everything you need to get hired.</h2>
                            <p className="text-xl text-gray-600 dark:text-gray-400">Powerful tools wrapped in a simple, beautiful interface.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(280px,auto)]">
                            {/* Large Card: AI Generation */}
                            <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden group transition-all hover:shadow-xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100 to-transparent opacity-50 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                                <div className="relative z-10 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 text-primary-600 rounded-xl flex items-center justify-center mb-6">
                                            <Wand2 size={24} />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">AI-Powered Generation</h3>
                                        <p className="text-gray-600 dark:text-gray-300 max-w-md">
                                            Writer's block is over. Generate professional summaries, bullet points, and cover letters tailored to your specific role in seconds.
                                        </p>
                                    </div>
                                    <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-700 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                            <Sparkles size={12} className="text-primary-500" /> AI Suggestion
                                        </div>
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">"Spearheaded a cross-functional team to reduce deployment time by 40%..."</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tall Card: Templates */}
                            <div className="md:row-span-2 bg-gray-900 text-white rounded-3xl p-8 shadow-sm border border-gray-800 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                                <div className="relative z-10 h-full flex flex-col">
                                    <div className="w-12 h-12 bg-gray-800 text-white rounded-xl flex items-center justify-center mb-6">
                                        <LayoutTemplate size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">ATS-Friendly Templates</h3>
                                    <p className="text-gray-400 mb-8">
                                        Stand out visually while passing the bots. Our templates are rigorously tested against Applicant Tracking Systems.
                                    </p>
                                    <div className="flex-grow relative">
                                        <div className="absolute top-0 left-0 w-full space-y-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className={`bg-gray-800 rounded-lg p-3 border border-gray-700 transform transition-all duration-500 ${i === 1 ? 'translate-x-0' : i === 2 ? 'translate-x-4 opacity-60' : 'translate-x-8 opacity-30'}`}>
                                                    <div className="h-2 w-1/3 bg-gray-600 rounded mb-2"></div>
                                                    <div className="h-2 w-full bg-gray-700 rounded"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card: Smart Import */}
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 group hover:border-primary-500/50 transition-colors">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl flex items-center justify-center mb-6">
                                    <UploadCloud size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Smart Import</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Upload your old PDF. We'll extract the data, fix the formatting, and give it a modern makeover instantly.
                                </p>
                            </div>

                            {/* Card: Interview Studio */}
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 group hover:border-indigo-500/50 transition-colors">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                    <Mic size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Interview Studio</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Practice with an AI interviewer that adapts to your role and gives you real-time feedback on your answers.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Use Cases / Career Paths --- */}
                <section className="py-24 bg-white dark:bg-gray-950">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Tailored for every path.</h2>
                                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
                                    Whether you're coding the future or caring for patients, CareerVivid understands your industry's specific needs.
                                </p>
                            </div>
                            <a href="/demo" className="text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-2">
                                See all templates <ArrowRight size={16} />
                            </a>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {USE_CASES.map((useCase) => (
                                <div key={useCase.role} className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 transition-all hover:-translate-y-1">
                                    <div className="text-4xl mb-4">{useCase.icon}</div>
                                    <h3 className="text-lg font-bold mb-2">{useCase.role}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{useCase.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- CTA Section --- */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gray-900 dark:bg-black"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 to-purple-900/20"></div>
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-8 tracking-tight">
                            Ready to land your next interview?
                        </h2>
                        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                            Stop wrestling with formatting and start building a resume that gets you hired. Join thousands of professionals today.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button onClick={() => navigate('/auth')} className="px-8 py-4 bg-white text-gray-900 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors">
                                Create My Resume
                            </button>
                            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mt-4 sm:mt-0 sm:ml-6">
                                <CheckCircle2 size={16} className="text-green-500" /> No credit card required
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