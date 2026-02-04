import React from 'react';
import { FileText, Mic, BarChart3 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOGO ASSETS: Dynamic theming based on user preference
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const LOGO_LIGHT = 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_light_mode.png?alt=media&token=627ec9de-a950-41f7-9138-dd7a33518c55';
const LOGO_DARK = 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_dark_mode.png?alt=media&token=25d3963d-2c64-4bfc-bb96-41bc305cf1e5';

const ExtensionLogin: React.FC = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const logoSrc = isDarkMode ? LOGO_DARK : LOGO_LIGHT;

    const openWebPage = (path: string) => {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.create({ url: `https://careervivid.app${path}` });
        } else {
            window.open(`https://careervivid.app${path}`, '_blank');
        }
    };

    return (
        <div className={`min-h-[520px] w-[380px] flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
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
                    Your AI-powered career copilot. Create resumes, practice interviews, and land your dream job.
                </p>

                {/* Feature Pills - Updated Routes */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    <button
                        onClick={() => openWebPage('/newresume')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm text-xs font-medium transition-all ${isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-primary-500 hover:shadow-md'
                            : 'bg-white border-gray-100 text-gray-600 hover:border-primary-200 hover:shadow-md'
                            }`}
                    >
                        <FileText size={12} className="text-primary-500" />
                        AI Resumes
                    </button>
                    <button
                        onClick={() => openWebPage('/interview-studio')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm text-xs font-medium transition-all ${isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-pink-500 hover:shadow-md'
                            : 'bg-white border-gray-100 text-gray-600 hover:border-pink-200 hover:shadow-md'
                            }`}
                    >
                        <Mic size={12} className="text-pink-500" />
                        Mock Interviews
                    </button>
                    <button
                        onClick={() => openWebPage('/job-tracker')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm text-xs font-medium transition-all ${isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500 hover:shadow-md'
                            : 'bg-white border-gray-100 text-gray-600 hover:border-purple-200 hover:shadow-md'
                            }`}
                    >
                        <BarChart3 size={12} className="text-purple-500" />
                        Job Tracker
                    </button>
                </div>

                {/* Auth Buttons */}
                <div className="w-full max-w-[280px] space-y-3">
                    <button
                        onClick={() => openWebPage('/signin')}
                        className={`w-full py-3.5 px-4 font-semibold rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode
                            ? 'bg-white text-gray-900 hover:bg-gray-100'
                            : 'bg-gray-900 text-white hover:bg-black shadow-gray-200'
                            }`}
                    >
                        Sign In
                    </button>

                    <button
                        onClick={() => openWebPage('/signup')}
                        className={`w-full py-3.5 px-4 font-semibold rounded-xl border transition-all ${isDarkMode
                            ? 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                    >
                        Create Free Account
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
