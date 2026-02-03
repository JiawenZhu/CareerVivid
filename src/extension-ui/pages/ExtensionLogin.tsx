import React from 'react';
import Logo from '../../components/Logo';

const ExtensionLogin: React.FC = () => {
    const openWebAuth = (path: string) => {
        // Open the web app in a new tab for authentication
        // This ensures cookies are shared with the extension host permissions
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.create({ url: `https://careervivid.app${path}` });
        } else {
            window.open(`https://careervivid.app${path}`, '_blank');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center">
            <div className="mb-6 relative">
                <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl animate-pulse"></div>
                <Logo className="w-16 h-16 relative z-10" />
            </div>

            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-2">
                CareerVivid
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-[240px]">
                Your AI-powered career copilot. Sign in to access your resumes and track jobs.
            </p>

            <div className="space-y-3 w-full max-w-[280px]">
                <button
                    onClick={() => openWebAuth('/signin')}
                    className="w-full py-2.5 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all transform active:scale-95"
                >
                    Sign In
                </button>

                <button
                    onClick={() => openWebAuth('/signup')}
                    className="w-full py-2.5 px-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                    Create Account
                </button>
            </div>
        </div>
    );
};

export default ExtensionLogin;
