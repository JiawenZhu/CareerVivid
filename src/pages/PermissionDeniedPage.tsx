import React from 'react';
import { useTranslation } from 'react-i18next';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { Home, ShieldAlert, Mail, ArrowLeft } from 'lucide-react';
import { navigate } from '../App';

interface PermissionDeniedPageProps {
    requiredRole?: string;
    message?: string;
}

const PermissionDeniedPage: React.FC<PermissionDeniedPageProps> = ({
    requiredRole,
    message
}) => {
    const { t } = useTranslation();

    const defaultMessage = requiredRole
        ? `This page requires ${requiredRole} access.`
        : "You don't have permission to access this page.";

    return (
        <div className="bg-white dark:bg-gray-950 min-h-screen flex flex-col font-sans">
            <PublicHeader />
            <main className="flex-grow flex items-center justify-center px-4 py-20">
                <div className="max-w-2xl w-full text-center">
                    <div className="mb-8 flex justify-center">
                        <div className="relative">
                            <ShieldAlert className="w-32 h-32 text-red-300 dark:text-red-900" />
                            <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold">
                                403
                            </div>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
                        {t('errors.403_title') || 'Access Denied'}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                        {message || t('errors.403_message') || defaultMessage}
                    </p>

                    {requiredRole && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 inline-block">
                            <p className="text-sm text-red-800 dark:text-red-200">
                                <strong>{t('errors.required_role') || 'Required Role'}:</strong> {requiredRole}
                            </p>
                        </div>
                    )}

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
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {t('errors.need_access') || 'Need Access?'}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {t('errors.contact_support') || 'If you believe you should have access to this page, please contact our support team.'}
                        </p>
                        <button
                            onClick={() => navigate('/contact')}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-700"
                        >
                            <Mail size={20} />
                            {t('errors.contact_us') || 'Contact Us'}
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PermissionDeniedPage;
