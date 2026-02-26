import React, { useState } from 'react';
import {
    FileText,
    Mic,
    LayoutDashboard,
    Globe,
    Briefcase,
    PenTool,
    PanelLeftClose,
    Github,
    LogOut,
    LogIn,
    Sun,
    Moon,
    Monitor,
    ChevronDown,
    ChevronUp,
    Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from '../Logo';
import { useNavigation } from '../../contexts/NavigationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { navigate } from '../../utils/navigation';

const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
];

const Sidebar: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { toggleNavPosition } = useNavigation();
    const { currentUser, logOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const [langOpen, setLangOpen] = useState(false);
    const currentPath = window.location.pathname;

    const navItems = [
        { name: t('dashboard.dashboard', 'Dashboard'), icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: t('nav.resumes', 'Resumes'), icon: <FileText size={20} />, path: '/newresume' },
        { name: t('nav.portfolios', 'Portfolios'), icon: <Globe size={20} />, path: '/portfolio' },
        { name: t('nav.whiteboards', 'Whiteboards'), icon: <PenTool size={20} />, path: '/whiteboard' },
        { name: t('nav.interview_studio', 'Interview Studio'), icon: <Mic size={20} />, path: '/interview-studio' },
        { name: t('dashboard.job_tracker', 'Job Tracker'), icon: <Briefcase size={20} />, path: '/job-tracker' },
        { name: t('nav.my_posts', 'My Posts'), icon: <FileText size={20} />, path: '/my-posts' },
    ];

    const themeOptions: { value: 'light' | 'dark' | 'system'; icon: React.ReactNode; label: string }[] = [
        { value: 'light', icon: <Sun size={14} />, label: 'Light' },
        { value: 'dark', icon: <Moon size={14} />, label: 'Dark' },
        { value: 'system', icon: <Monitor size={14} />, label: 'System' },
    ];

    const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) ?? SUPPORTED_LANGUAGES[0];

    if (!currentUser) return null;

    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col z-30 transition-transform duration-300">

            {/* ── Header / Logo ── */}
            <div className="flex items-center justify-between h-16 sm:h-20 px-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <a href="/dashboard" className="flex items-center">
                    <Logo className="h-8 w-auto" />
                </a>
                <button
                    onClick={toggleNavPosition}
                    className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Toggle Sidebar"
                >
                    <PanelLeftClose size={20} />
                </button>
            </div>

            {/* ── Main Navigation ── */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
                {navItems.map((item) => {
                    const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </button>
                    );
                })}
            </nav>

            {/* ── Utility Section ── */}
            <div className="mt-auto flex flex-col gap-1 px-4 pt-3 pb-2 border-t border-gray-200 dark:border-gray-800">

                {/* Community Link */}
                <button
                    onClick={() => navigate('/community')}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm w-full text-left"
                >
                    <Users size={18} />
                    <span>Community</span>
                </button>

                {/* GitHub Link */}
                <a
                    href="https://github.com/Jastalk/CareerVivid"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm"
                >
                    <Github size={18} />
                    <span>GitHub</span>
                </a>

                {/* Auth: Sign Out / Sign In */}
                {currentUser ? (
                    <button
                        onClick={logOut}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm"
                    >
                        <LogOut size={18} />
                        <span>Sign out</span>
                    </button>
                ) : (
                    <button
                        onClick={() => navigate('/signin')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm"
                    >
                        <LogIn size={18} />
                        <span>Sign in / Sign up</span>
                    </button>
                )}

                {/* Theme Toggle */}
                <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Theme</span>
                    <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        {themeOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setTheme(opt.value)}
                                title={opt.label}
                                className={`p-1.5 rounded-md transition-all ${theme === opt.value
                                    ? 'bg-indigo-500 text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100'
                                    }`}
                            >
                                {opt.icon}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Language Selector */}
                <div className="relative px-1">
                    <button
                        onClick={() => setLangOpen(o => !o)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Globe size={15} className="text-gray-400" />
                            <span>{currentLang.label}</span>
                        </div>
                        {langOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </button>

                    {langOpen && (
                        <div className="absolute bottom-full left-1 right-1 mb-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                            {SUPPORTED_LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${i18n.language === lang.code
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── User Profile Card ── */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 shrink-0">
                <div onClick={() => navigate('/profile')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center overflow-hidden shrink-0">
                        {currentUser.photoURL ? (
                            <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                                {currentUser.email?.[0].toUpperCase() || 'U'}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {currentUser.displayName || 'My Profile'}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
