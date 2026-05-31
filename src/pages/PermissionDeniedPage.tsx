import React from 'react';
import { useTranslation } from 'react-i18next';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { Home, ShieldAlert, Mail, ArrowLeft } from 'lucide-react';
import { navigate } from '../utils/navigation';

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
                            <ShieldAlert className="w-32 h-32 text-[#d9c6ad]" />
                            <div className="absolute -top-2 -right-2 bg-[#a97935] text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-black shadow-lg shadow-[#8b5a16]/20">
                                403
                            </div>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-[#211b16] mb-4">
                        {t('errors.403_title') || 'Access Denied'}
                    </h1>
                    <p className="text-xl font-medium text-[#665a4a] mb-8">
                        {message || t('errors.403_message') || defaultMessage}
                    </p>

                    {requiredRole && (
                        <div className="bg-[#fffaf1] border border-[#e4d3bc] rounded-lg p-4 mb-8 inline-block shadow-sm shadow-[#8b5a16]/5">
                            <p className="text-sm font-medium text-[#665a4a]">
                                <strong>{t('errors.required_role') || 'Required Role'}:</strong> {requiredRole}
                            </p>
                        </div>
                    )}

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
                        <h2 className="text-lg font-black text-[#211b16] mb-4">
                            {t('errors.need_access') || 'Need Access?'}
                        </h2>
                        <p className="text-[#665a4a] mb-6">
                            {t('errors.contact_support') || 'If you believe you should have access to this page, please contact our support team.'}
                        </p>
                        <button
                            onClick={() => navigate('/contact')}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e4d3bc] bg-[#fffaf1] px-6 py-3 font-bold text-[#211b16] transition hover:border-[#a97935] hover:text-[#a97935]"
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
