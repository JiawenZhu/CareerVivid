import React, { useState } from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const PublicHeader: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <a href="#/" className="flex items-center gap-2">
                        <img src="https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/logo.png?alt=media&token=3d2f7db5-96db-4dce-ba00-43d8976da3a1" alt="CareerVivid Logo" className="h-8 w-8" />
                        <span className="text-xl font-bold text-gray-900 dark:text-white">CareerVivid</span>
                    </a>
                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#/" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors">Features</a>
                        <a href="#/demo" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors">Demo</a>
                        <a href="#/pricing" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors">Pricing</a>
                    </nav>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <div className="hidden md:flex items-center gap-4">
                            <a href="#/auth" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors">
                                Sign In
                            </a>
                            <a href="#/auth" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold text-sm transition-colors">
                                Get Started
                            </a>
                        </div>
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-600 dark:text-gray-300">
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                    <div className="px-4 pt-2 pb-4 space-y-2">
                        <a href="#/" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">Features</a>
                        <a href="#/demo" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">Demo</a>
                        <a href="#/pricing" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">Pricing</a>
                        <a href="#/auth" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">Sign In</a>
                        <a href="#/auth" onClick={() => setIsMenuOpen(false)} className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold text-base transition-colors">
                            Get Started
                        </a>
                    </div>
                </div>
            )}
        </header>
    );
};
export default PublicHeader;