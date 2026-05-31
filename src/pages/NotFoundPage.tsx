import React from 'react';
import { useTranslation } from 'react-i18next';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { Home, Search, ArrowLeft, FileQuestion } from 'lucide-react';
import { navigate } from '../utils/navigation';

const NotFoundPage: React.FC = () => {
    const { t } = useTranslation();

    const quickLinks = [
        { name: 'Home', path: '/' },
        { name: t('nav.pricing'), path: '/pricing' },
        { name: 'Job Tracker', path: '/job-tracker' },
        { name: t('nav.contact'), path: '/contact' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-[#f7f1e7] font-sans text-[#211b16]">
            <PublicHeader variant="editorial" />
            <main className="relative flex-grow overflow-hidden px-4 py-28">
                <div
                    className="pointer-events-none absolute inset-0 opacity-55"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, rgba(139, 90, 22, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(139, 90, 22, 0.06) 1px, transparent 1px)',
                        backgroundSize: '64px 64px',
                    }}
                />
                <div className="relative mx-auto flex min-h-[calc(100vh-14rem)] max-w-2xl w-full flex-col justify-center text-center">
                    <div className="mb-8 flex justify-center">
                        <div className="relative">
                            <FileQuestion className="w-32 h-32 text-[#d9c6ad]" />
                            <div className="absolute -top-2 -right-2 bg-[#2563eb] text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-black shadow-lg shadow-[#2563eb]/20">
                                404
                            </div>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-[#211b16] mb-4">
                        {t('errors.404_title') || 'Page Not Found'}
                    </h1>
                    <p className="text-xl font-medium text-[#665a4a] mb-8">
                        {t('errors.404_message') || "The page you're looking for doesn't exist or has been moved."}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-6 py-3 font-bold text-white shadow-lg shadow-[#2563eb]/15 transition hover:-translate-y-0.5 hover:bg-[#1d4ed8]"
                        >
                            <Home size={20} />
                            {t('errors.go_home') || 'Go to Home'}
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e4d3bc] bg-[#fffaf1] px-6 py-3 font-bold text-[#211b16] transition hover:-translate-y-0.5 hover:border-[#a97935]"
                        >
                            <ArrowLeft size={20} />
                            {t('errors.go_back') || 'Go Back'}
                        </button>
                    </div>

                    <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-8 shadow-sm shadow-[#8b5a16]/5">
                        <h2 className="text-lg font-black text-[#211b16] mb-4 flex items-center justify-center gap-2">
                            <Search size={20} />
                            {t('errors.quick_links') || 'Quick Links'}
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {quickLinks.map((link) => (
                                <button
                                    key={link.path}
                                    onClick={() => navigate(link.path)}
                                    className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1] px-4 py-2 font-bold text-[#211b16] transition hover:border-[#a97935] hover:text-[#a97935]"
                                >
                                    {link.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default NotFoundPage;
