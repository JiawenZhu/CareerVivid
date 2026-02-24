import React from 'react';
import {
    FileText,
    Mic,
    LayoutDashboard,
    Globe,
    Briefcase,
    PenTool,
    PanelLeftClose
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from '../Logo';
import { useNavigation } from '../../contexts/NavigationContext';
import { useAuth } from '../../contexts/AuthContext';
import { navigate } from '../../utils/navigation';

const Sidebar: React.FC = () => {
    const { t } = useTranslation();
    const { toggleNavPosition } = useNavigation();
    const { currentUser } = useAuth();
    const currentPath = window.location.pathname;

    const navItems = [
        { name: t('dashboard.dashboard', 'Dashboard'), icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: t('nav.resumes', 'Resumes'), icon: <FileText size={20} />, path: '/newresume' },
        { name: t('nav.portfolios', 'Portfolios'), icon: <Globe size={20} />, path: '/portfolio' },
        { name: t('nav.whiteboards', 'Whiteboards'), icon: <PenTool size={20} />, path: '/whiteboard' },
        { name: t('nav.interview_studio', 'Interview Studio'), icon: <Mic size={20} />, path: '/interview-studio' },
        { name: t('dashboard.job_tracker', 'Job Tracker'), icon: <Briefcase size={20} />, path: '/job-tracker' },
    ];

    if (!currentUser) return null;

    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col z-30 transition-transform duration-300">
            {/* Header / Logo */}
            <div className="flex items-center justify-between h-16 sm:h-20 px-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <a href="/dashboard" className="flex items-center gap-2">
                    <Logo className="h-8 w-8" />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">CareerVivid</span>
                </a>
                <button
                    onClick={toggleNavPosition}
                    className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Toggle Sidebar"
                >
                    <PanelLeftClose size={20} />
                </button>
            </div>

            {/* Navigation Links */}
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
                    )
                })}
            </nav>

            {/* Footer / User */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 shrink-0 mb-3">
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
