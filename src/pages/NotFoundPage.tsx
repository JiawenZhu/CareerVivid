import React from 'react';
import { useTranslation } from 'react-i18next';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { Home, Search, ArrowLeft, FileQuestion } from 'lucide-react';
import { navigate } from '../utils/navigation';

const NotFoundPage: React.FC = () => {
    const { t } = useTranslation();

    const quickLinks = [
        { name: t('nav.home'), path: '/' },
        { name: t('nav.pricing'), path: '/pricing' },
        { name: t('nav.demo'), path: '/demo' },
        { name: t('nav.contact'), path: '/contact' },
    ];

    return (
        <div className="bg-white dark:bg-gray-950 min-h-screen flex flex-col font-sans">
            <PublicHeader />
            <main className="flex-grow flex items-center justify-center px-4 py-20">
                <div className="max-w-2xl w-full text-center">
                    <div className="mb-8 flex justify-center">
                        <div className="relative">
                            <FileQuestion className="w-32 h-32 text-gray-300 dark:text-gray-700" />
                            <div className="absolute -top-2 -right-2 bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold">
                                404
                            </div>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
                        {t('errors.404_title') || 'Page Not Found'}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                        {t('errors.404_message') || "The page you're looking for doesn't exist or has been moved."}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                        >
                            <Home size={20} />
                            {t('errors.go_home') || 'Go to Home'}
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                        >
                            <ArrowLeft size={20} />
                            {t('errors.go_back') || 'Go Back'}
                        </button>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-2">
                            <Search size={20} />
                            {t('errors.quick_links') || 'Quick Links'}
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {quickLinks.map((link) => (
                                <button
                                    key={link.path}
                                    onClick={() => navigate(link.path)}
                                    className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-700"
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
