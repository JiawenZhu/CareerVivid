import React, { useState, useEffect } from 'react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { Wand2, LayoutTemplate, UploadCloud, Mic, CheckCircle } from 'lucide-react';

const FeatureCard: React.FC<{ 
    icon: React.ReactNode; 
    title: string; 
    description: string;
    onMouseEnter: () => void;
    onMouseLeave: () => void; 
}> = ({ icon, title, description, onMouseEnter, onMouseLeave }) => (
    <div 
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700/50 transition-transform duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer"
    >
        <div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-lg mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
);

const LandingPage: React.FC = () => {
    const [typedTitle, setTypedTitle] = useState('');
    const fullTitle = 'Craft Your Future, Faster.';
    const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

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

    const features = [
        {
            icon: <Wand2 size={24} />,
            title: 'AI-Powered Content',
            description: 'Generate, rewrite, and improve your resume content with cutting-edge AI. From professional summaries to impactful bullet points.',
            previewUrl: 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Fai_content_preview.mp4?alt=media',
        },
        {
            icon: <LayoutTemplate size={24} />,
            title: 'Professional Templates',
            description: 'Choose from a library of stunning, recruiter-approved templates. Customize fonts, colors, and layouts with a single click.',
            previewUrl: 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Ftemplates_preview.mp4?alt=media',
        },
        {
            icon: <UploadCloud size={24} />,
            title: 'Smart Autofill',
            description: 'Import your existing resume from a PDF or text and watch our AI instantly populate your new, structured resume.',
            previewUrl: 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Fautofill_preview.mp4?alt=media',
        },
        {
            icon: <Mic size={24} />,
            title: 'Interview Studio',
            description: 'Hone your interview skills with an AI agent. Get instant, actionable feedback and track your progress.',
            previewUrl: 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Finterview_preview.mp4?alt=media',
        },
    ];
    
    const currentPreviewUrl = features.find(f => f.title === hoveredFeature)?.previewUrl;

    return (
        <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen flex flex-col font-sans">
            <PublicHeader />
            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 text-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-100/30 via-white to-white dark:from-primary-900/20 dark:via-gray-900 dark:to-gray-900 -z-10"></div>
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight min-h-[48px] sm:min-h-[60px] lg:min-h-[72px]">
                            {typedTitle}
                            <span className="animate-blink text-primary-500">|</span>
                        </h1>
                        <p className="mt-6 text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Go from rough draft to job-ready resume in minutes with our intelligent platform. Tailor, optimize, and export professional resumes that stand out.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a href="#/auth" className="w-full sm:w-auto px-8 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold text-lg transition-transform transform hover:scale-105">
                                Get Started for Free
                            </a>
                            <a href="#/demo" className="w-full sm:w-auto px-8 py-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold text-lg transition-transform transform hover:scale-105">
                                Try a Demo
                            </a>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">The Ultimate Resume Toolkit</h2>
                            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Everything you need to build a resume that opens doors.</p>
                        </div>
                        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {features.map(feature => (
                                <FeatureCard 
                                    key={feature.title} 
                                    {...feature} 
                                    onMouseEnter={() => setHoveredFeature(feature.title)}
                                    onMouseLeave={() => setHoveredFeature(null)}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                 <section className="py-20 lg:py-32">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                         <div className="text-center">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">Get Hired in 3 Simple Steps</h2>
                             <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Our streamlined process makes resume creation effortless.</p>
                        </div>
                        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div className="p-6">
                                <div className="text-4xl font-bold text-primary-200 dark:text-primary-800/50">01</div>
                                <h3 className="text-xl font-bold mt-4 mb-2">Generate or Import</h3>
                                <p className="text-gray-600 dark:text-gray-400">Start with a simple prompt and let our AI build your resume, or upload an existing one to get started instantly.</p>
                            </div>
                            <div className="p-6">
                                <div className="text-4xl font-bold text-primary-200 dark:text-primary-800/50">02</div>
                                <h3 className="text-xl font-bold mt-4 mb-2">Refine and Customize</h3>
                                <p className="text-gray-600 dark:text-gray-400">Use AI-powered suggestions and our intuitive editor to perfect your content, layout, and design.</p>
                            </div>
                             <div className="p-6">
                                <div className="text-4xl font-bold text-primary-200 dark:text-primary-800/50">03</div>
                                <h3 className="text-xl font-bold mt-4 mb-2">Export and Apply</h3>
                                <p className="text-gray-600 dark:text-gray-400">Download your new resume as a pixel-perfect PDF and confidently apply for your dream job.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="bg-primary-600">
                    <div className="max-w-4xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                            <span className="block">Ready to land your next interview?</span>
                        </h2>
                        <p className="mt-4 text-lg leading-6 text-primary-100">
                           Stop wrestling with templates and start building a resume that truly represents you.
                        </p>
                        <a href="#/auth" className="mt-8 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-primary-600 bg-white hover:bg-primary-50 sm:w-auto">
                            Create My Resume Now
                        </a>
                    </div>
                </section>
            </main>
            <Footer />
            {/* Preview Overlay */}
            {hoveredFeature && currentPreviewUrl && (
                <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-8 pointer-events-none animate-fade-in backdrop-blur-sm">
                    <video
                        key={currentPreviewUrl}
                        src={currentPreviewUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="rounded-xl shadow-2xl max-w-4xl w-full border-4 border-white/20"
                    />
                </div>
            )}
        </div>
    );
};

export default LandingPage;