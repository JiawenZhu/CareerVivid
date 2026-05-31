import React from 'react';
import { FileText, Mic, BarChart3 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getAppUrl } from '../../utils/extensionUtils';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOGO ASSETS: Dynamic theming based on user preference
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const LOGO_LIGHT = 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_light_mode.png?alt=media';
const LOGO_DARK = 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_dark_mode.png?alt=media';

const ExtensionLogin: React.FC = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const logoSrc = isDarkMode ? LOGO_DARK : LOGO_LIGHT;

    const openWebPage = (path: string) => {
        const url = getAppUrl(path);
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.create({ url });
        } else {
            window.open(url, '_blank');
        }
    };

    const openAuthPage = (mode: 'signin' | 'signup') => {
        const extensionId = typeof chrome !== 'undefined' && chrome.runtime?.id
            ? `&extension_id=${encodeURIComponent(chrome.runtime.id)}`
            : '';
        const redirect = encodeURIComponent('/extension-auth-complete');
        openWebPage(`/${mode}?redirect=${redirect}${extensionId}`);
    };

    return (
        <div className={`min-h-[520px] w-[380px] flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-[#f8f8fb]'}`}>
            {/* Hero Section */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-10">
                {/* Dynamic Logo */}
                <div className="mb-6">
                    <img
                        src={logoSrc}
                        alt="CareerVivid"
                        className="h-12 w-auto object-contain"
                        onError={(e) => {
                            // Fallback to text if image fails
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>

                <p className={`text-sm text-center mb-8 max-w-[260px] leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Track job opportunities, tailor resumes, and prepare for interviews from one workspace.
                </p>

                {/* Feature Pills - Updated Routes */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    <button
                        onClick={() => openWebPage('/newresume')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm text-xs font-medium transition-all ${isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-[#7b75df] hover:shadow-md'
                            : 'bg-white border-[#ececf4] text-gray-600 hover:border-[#d9d7fb] hover:shadow-md'
                            }`}
                    >
                        <FileText size={12} className="text-[#625bd5]" />
                        AI resumes
                    </button>
                    <button
                        onClick={() => openWebPage('/interview-studio')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm text-xs font-medium transition-all ${isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-[#d95b92] hover:shadow-md'
                            : 'bg-white border-[#ececf4] text-gray-600 hover:border-[#f4d6e7] hover:shadow-md'
                            }`}
                    >
                        <Mic size={12} className="text-[#d95b92]" />
                        Mock interviews
                    </button>
                    <button
                        onClick={() => openWebPage('/job-tracker')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm text-xs font-medium transition-all ${isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-[#7b75df] hover:shadow-md'
                            : 'bg-white border-[#ececf4] text-gray-600 hover:border-[#d9d7fb] hover:shadow-md'
                            }`}
                    >
                        <BarChart3 size={12} className="text-[#625bd5]" />
                        Career pipeline
                    </button>
                </div>

                {/* Auth Buttons */}
                <div className="w-full max-w-[280px] space-y-3">
                    <button
                        onClick={() => openAuthPage('signin')}
                        className={`w-full py-3 px-4 font-semibold rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] text-sm ${isDarkMode
                            ? 'bg-white text-gray-900 hover:bg-gray-100'
                            : 'bg-[#625bd5] text-white hover:bg-[#5851c8] shadow-[0_12px_24px_rgba(98,91,213,0.18)]'
                            }`}
                    >
                        Sign in
                    </button>

                    <button
                        onClick={() => openAuthPage('signup')}
                        className={`w-full py-3 px-4 font-semibold rounded-xl border transition-all text-sm ${isDarkMode
                            ? 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700'
                            : 'bg-white text-gray-700 border-[#ececf4] hover:bg-[#f8f8fb] hover:border-[#d9d7fb]'
                            }`}
                    >
                        Create free account
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className={`px-8 py-4 text-center border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    By continuing, you agree to our Terms of Service
                </p>
            </div>
        </div>
    );
};

export default ExtensionLogin;
