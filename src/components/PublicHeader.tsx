
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Menu, X, ChevronDown, Briefcase, Users, FileText, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { navigate } from '../App';
import Logo from './Logo';
import LanguageSelect from './LanguageSelect';

const PublicHeader: React.FC = () => {
    const { t } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const NavItem: React.FC<{ name: string; hasDropdown?: boolean; href?: string }> = ({ name, hasDropdown, href }) => {
        // Removed 'hover:text-gray-900 dark:hover:text-white' to prevent flashing conflict with group-hover
        const baseClasses = "flex items-center gap-1 text-sm font-medium transition-colors py-2 text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400";

        return (
            <div className="relative group h-full flex items-center">
                {href ? (
                    <a href={href} className={baseClasses}>
                        {name}
                        {hasDropdown && <ChevronDown size={14} className="transition-transform duration-200 group-hover:rotate-180" />}
                    </a>
                ) : (
                    <button className={baseClasses}>
                        {name}
                        {hasDropdown && <ChevronDown size={14} className="transition-transform duration-200 group-hover:rotate-180" />}
                    </button>
                )}

                {hasDropdown && (
                    // Added pt-4 to create an invisible bridge, preventing mouseleave when moving to dropdown
                    <div className="absolute top-full left-0 w-64 pt-4 hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-2">
                            {name === 'Use Cases' && (
                                <>
                                    <a href="/demo" className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group/item">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-md group-hover/item:bg-blue-100 dark:group-hover/item:bg-blue-900/50">
                                            <Briefcase size={18} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white text-sm">{t('nav.professional')}</div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.professional_desc')}</p>
                                        </div>
                                    </a>
                                    <a href="/demo" className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group/item">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-md group-hover/item:bg-purple-100 dark:group-hover/item:bg-purple-900/50">
                                            <Zap size={18} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white text-sm">{t('nav.students')}</div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.students_desc')}</p>
                                        </div>
                                    </a>
                                </>
                            )}
                            {name === 'Resources' && (
                                <>
                                    <a href="/blog" className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group/item">
                                        <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-md group-hover/item:bg-green-100 dark:group-hover/item:bg-green-900/50">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white text-sm">{t('nav.career_blog')}</div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.career_blog_desc')}</p>
                                        </div>
                                    </a>
                                    <a href="/interview-studio" className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group/item">
                                        <div className="p-2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-md group-hover/item:bg-orange-100 dark:group-hover/item:bg-orange-900/50">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white text-sm">{t('nav.community')}</div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.community_desc')}</p>
                                        </div>
                                    </a>
                                    <a href="/contact" className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group/item">
                                        <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 rounded-md group-hover/item:bg-cyan-100 dark:group-hover/item:bg-cyan-900/50">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white text-sm">{t('nav.help_support')}</div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.help_support_desc')}</p>
                                        </div>
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <a href="/" className="flex items-center gap-2 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Logo className="h-8 w-8 relative z-10" />
                        </div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">CareerVivid</span>
                    </a>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8 h-full">
                        <NavItem name={t('nav.product')} href="/" />
                        <NavItem name={t('nav.use_cases')} hasDropdown />
                        <NavItem name={t('nav.pricing')} href="/pricing" />
                        <NavItem name={t('nav.blog')} href="/blog" />
                        <NavItem name={t('nav.resources')} hasDropdown />
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button onClick={toggleTheme} className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Toggle Theme">
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        {/* Language Selector */}
                        <div className="hidden sm:block">
                            <LanguageSelect />
                        </div>

                        <div className="hidden md:flex items-center gap-3">
                            <a href="/auth" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2">
                                {t('nav.login')}
                            </a>
                            <a href="/auth" className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                                {t('nav.signup')}
                            </a>
                        </div>

                        {/* Mobile Menu Button */}
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
                <div className="md:hidden absolute top-20 left-0 right-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-2xl animate-fade-in z-40">
                    <div className="px-4 py-6 space-y-4">
                        <a href="/" onClick={() => setIsMenuOpen(false)} className="block text-base font-semibold text-gray-900 dark:text-white">{t('nav.product')}</a>
                        <div className="pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-3">
                            <a href="/demo" onClick={() => setIsMenuOpen(false)} className="block text-sm text-gray-600 dark:text-gray-400">{t('nav.professional')}</a>
                            <a href="/demo" onClick={() => setIsMenuOpen(false)} className="block text-sm text-gray-600 dark:text-gray-400">{t('nav.students')}</a>
                        </div>
                        <a href="/pricing" onClick={() => setIsMenuOpen(false)} className="block text-base font-semibold text-gray-900 dark:text-white">{t('nav.pricing')}</a>
                        <a href="/blog" onClick={() => setIsMenuOpen(false)} className="block text-base font-semibold text-gray-900 dark:text-white">{t('nav.blog')}</a>
                        <a href="/contact" onClick={() => setIsMenuOpen(false)} className="block text-base font-semibold text-gray-900 dark:text-white">{t('nav.contact')}</a>
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
                            {/* Mobile Language Selector */}
                            <div className="mb-2">
                                <LanguageSelect />
                            </div>
                            <a href="/auth" onClick={() => setIsMenuOpen(false)} className="w-full text-center py-3 text-gray-900 dark:text-white font-semibold border border-gray-200 dark:border-gray-700 rounded-lg">
                                {t('nav.login')}
                            </a>
                            <a href="/auth" onClick={() => setIsMenuOpen(false)} className="w-full text-center py-3 bg-primary-600 text-white rounded-lg font-semibold">
                                {t('nav.signup')}
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};
export default PublicHeader;
