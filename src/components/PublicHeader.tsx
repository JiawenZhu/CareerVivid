
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Menu, X, ChevronDown, Briefcase, Users, FileText, Zap, Link as LinkIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';
import Logo from './Logo';
import LanguageSelect from './LanguageSelect';

interface PublicHeaderProps {
    variant?: 'default' | 'brutalist';
    context?: 'default' | 'bio-link';
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ variant = 'default', context = 'default' }) => {
    const { t } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const { currentUser, logOut } = useAuth(); // Fix: Destructure from useAuth
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isBrutalist = variant === 'brutalist';

    const NavItem: React.FC<{ name: string; hasDropdown?: boolean; href?: string }> = ({ name, hasDropdown, href }) => {
        // Brutalist: Uppercase, bold, hover effect
        const brutalistClasses = "flex items-center gap-1 text-sm font-black uppercase tracking-wide transition-all py-2 px-3 border-2 border-transparent hover:bg-black hover:text-white hover:border-black text-black";

        // Default: Existing styles
        const defaultClasses = "flex items-center gap-1 text-sm font-medium transition-colors py-2 text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400";

        const baseClasses = isBrutalist ? brutalistClasses : defaultClasses;

        return (
            <div className="relative group h-full flex items-center">
                {href ? (
                    <a href={href} className={baseClasses}>
                        {name}
                        {hasDropdown && <ChevronDown size={14} className={`transition-transform duration-200 group-hover:rotate-180 ${isBrutalist ? 'ml-1 stroke-[3px]' : ''}`} />}
                    </a>
                ) : (
                    <button className={baseClasses}>
                        {name}
                        {hasDropdown && <ChevronDown size={14} className={`transition-transform duration-200 group-hover:rotate-180 ${isBrutalist ? 'ml-1 stroke-[3px]' : ''}`} />}
                    </button>
                )}

                {hasDropdown && (
                    // Added pt-4 to create an invisible bridge, preventing mouseleave when moving to dropdown
                    <div className="absolute top-full left-0 w-64 pt-4 hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                        <div className={`bg-white dark:bg-gray-900 p-2 ${isBrutalist ? 'border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none' : 'rounded-xl shadow-xl border border-gray-100 dark:border-gray-800'}`}>

                            {/* Product Dropdown */}
                            {name === t('nav.product') && (
                                <>
                                    <a href="/newresume" className={`flex items-start gap-3 p-3 transition-colors group/item ${isBrutalist ? 'hover:bg-yellow-200 border-2 border-transparent hover:border-black' : 'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        <div className={`p-2 ${isBrutalist ? 'bg-black text-white rounded-none' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-md group-hover/item:bg-blue-100 dark:group-hover/item:bg-blue-900/50'}`}>
                                            <FileText size={18} strokeWidth={isBrutalist ? 3 : 2} />
                                        </div>
                                        <div>
                                            <div className={`text-sm ${isBrutalist ? 'font-black text-black uppercase' : 'font-semibold text-gray-900 dark:text-white'}`}>Resume Builder</div>
                                            <p className={`text-xs ${isBrutalist ? 'text-black font-bold' : 'text-gray-500 dark:text-gray-400'}`}>AI-powered resume creation</p>
                                        </div>
                                    </a>
                                    <a href="/portfolio" className={`flex items-start gap-3 p-3 transition-colors group/item ${isBrutalist ? 'hover:bg-purple-200 border-2 border-transparent hover:border-black' : 'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        <div className={`p-2 ${isBrutalist ? 'bg-black text-white rounded-none' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-md group-hover/item:bg-purple-100 dark:group-hover/item:bg-purple-900/50'}`}>
                                            <Briefcase size={18} strokeWidth={isBrutalist ? 3 : 2} />
                                        </div>
                                        <div>
                                            <div className={`text-sm ${isBrutalist ? 'font-black text-black uppercase' : 'font-semibold text-gray-900 dark:text-white'}`}>Portfolio Builder</div>
                                            <p className={`text-xs ${isBrutalist ? 'text-black font-bold' : 'text-gray-500 dark:text-gray-400'}`}>Showcase your work</p>
                                        </div>
                                    </a>
                                    <a href="/job-tracker" className={`flex items-start gap-3 p-3 transition-colors group/item ${isBrutalist ? 'hover:bg-green-200 border-2 border-transparent hover:border-black' : 'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        <div className={`p-2 ${isBrutalist ? 'bg-black text-white rounded-none' : 'bg-green-50 dark:bg-green-900/30 text-green-600 rounded-md group-hover/item:bg-green-100 dark:group-hover/item:bg-green-900/50'}`}>
                                            <Zap size={18} strokeWidth={isBrutalist ? 3 : 2} />
                                        </div>
                                        <div>
                                            <div className={`text-sm ${isBrutalist ? 'font-black text-black uppercase' : 'font-semibold text-gray-900 dark:text-white'}`}>Job Tracker</div>
                                            <p className={`text-xs ${isBrutalist ? 'text-black font-bold' : 'text-gray-500 dark:text-gray-400'}`}>Organize applications</p>
                                        </div>
                                    </a>
                                    <a href="/bio-links" className={`flex items-start gap-3 p-3 transition-colors group/item ${isBrutalist ? 'hover:bg-pink-200 border-2 border-transparent hover:border-black' : 'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        <div className={`p-2 ${isBrutalist ? 'bg-black text-white rounded-none' : 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 rounded-md group-hover/item:bg-pink-100 dark:group-hover/item:bg-pink-900/50'}`}>
                                            <LinkIcon size={18} strokeWidth={isBrutalist ? 3 : 2} />
                                        </div>
                                        <div>
                                            <div className={`text-sm ${isBrutalist ? 'font-black text-black uppercase' : 'font-semibold text-gray-900 dark:text-white'}`}>Bio Links</div>
                                            <p className={`text-xs ${isBrutalist ? 'text-black font-bold' : 'text-gray-500 dark:text-gray-400'}`}>One link for everything</p>
                                        </div>
                                    </a>
                                </>
                            )}

                            {name === 'Use Cases' && (
                                <>
                                    <a href="/demo" className={`flex items-start gap-3 p-3 transition-colors group/item ${isBrutalist ? 'hover:bg-yellow-200 border-2 border-transparent hover:border-black' : 'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        <div className={`p-2 ${isBrutalist ? 'bg-black text-white rounded-none' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-md group-hover/item:bg-blue-100 dark:group-hover/item:bg-blue-900/50'}`}>
                                            <Briefcase size={18} strokeWidth={isBrutalist ? 3 : 2} />
                                        </div>
                                        <div>
                                            <div className={`text-sm ${isBrutalist ? 'font-black text-black uppercase' : 'font-semibold text-gray-900 dark:text-white'}`}>{t('nav.professional')}</div>
                                            <p className={`text-xs ${isBrutalist ? 'text-black font-bold' : 'text-gray-500 dark:text-gray-400'}`}>{t('nav.professional_desc')}</p>
                                        </div>
                                    </a>
                                    <a href="/demo" className={`flex items-start gap-3 p-3 transition-colors group/item ${isBrutalist ? 'hover:bg-purple-200 border-2 border-transparent hover:border-black' : 'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        <div className={`p-2 ${isBrutalist ? 'bg-black text-white rounded-none' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-md group-hover/item:bg-purple-100 dark:group-hover/item:bg-purple-900/50'}`}>
                                            <Zap size={18} strokeWidth={isBrutalist ? 3 : 2} />
                                        </div>
                                        <div>
                                            <div className={`text-sm ${isBrutalist ? 'font-black text-black uppercase' : 'font-semibold text-gray-900 dark:text-white'}`}>{t('nav.students')}</div>
                                            <p className={`text-xs ${isBrutalist ? 'text-black font-bold' : 'text-gray-500 dark:text-gray-400'}`}>{t('nav.students_desc')}</p>
                                        </div>
                                    </a>
                                    <a href="/services" className={`flex items-start gap-3 p-3 transition-colors group/item ${isBrutalist ? 'hover:bg-emerald-200 border-2 border-transparent hover:border-black' : 'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        <div className={`p-2 ${isBrutalist ? 'bg-black text-white rounded-none' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-md group-hover/item:bg-emerald-100 dark:group-hover/item:bg-emerald-900/50'}`}>
                                            <Users size={18} strokeWidth={isBrutalist ? 3 : 2} />
                                        </div>
                                        <div>
                                            <div className={`text-sm ${isBrutalist ? 'font-black text-black uppercase' : 'font-semibold text-gray-900 dark:text-white'}`}>Local Business</div>
                                            <p className={`text-xs ${isBrutalist ? 'text-black font-bold' : 'text-gray-500 dark:text-gray-400'}`}>Web design & automation</p>
                                        </div>
                                    </a>
                                </>
                            )}

                            {name === t('nav.pricing') && (
                                <>
                                    <a href={isBrutalist ? "#pricing" : "/pricing"} className={`flex items-start gap-3 p-3 transition-colors group/item ${isBrutalist ? 'hover:bg-yellow-200 border-2 border-transparent hover:border-black' : 'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        <div className={`p-2 ${isBrutalist ? 'bg-black text-white rounded-none' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-md group-hover/item:bg-orange-100 dark:group-hover/item:bg-orange-900/50'}`}>
                                            <Zap size={18} strokeWidth={isBrutalist ? 3 : 2} />
                                        </div>
                                        <div>
                                            <div className={`text-sm ${isBrutalist ? 'font-black text-black uppercase' : 'font-semibold text-gray-900 dark:text-white'}`}>App Subscription</div>
                                            <p className={`text-xs ${isBrutalist ? 'text-black font-bold' : 'text-gray-500 dark:text-gray-400'}`}>Pro & Business Plans</p>
                                        </div>
                                    </a>
                                    <a href="/services#estimator" className={`flex items-start gap-3 p-3 transition-colors group/item ${isBrutalist ? 'hover:bg-emerald-200 border-2 border-transparent hover:border-black' : 'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        <div className={`p-2 ${isBrutalist ? 'bg-black text-white rounded-none' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-md group-hover/item:bg-emerald-100 dark:group-hover/item:bg-emerald-900/50'}`}>
                                            <FileText size={18} strokeWidth={isBrutalist ? 3 : 2} />
                                        </div>
                                        <div>
                                            <div className={`text-sm ${isBrutalist ? 'font-black text-black uppercase' : 'font-semibold text-gray-900 dark:text-white'}`}>Service Estimates</div>
                                            <p className={`text-xs ${isBrutalist ? 'text-black font-bold' : 'text-gray-500 dark:text-gray-400'}`}>Custom project pricing</p>
                                        </div>
                                    </a>
                                </>
                            )}

                            {name === 'Resources' && (
                                <>
                                    <a href="/blog" className={`flex items-start gap-3 p-3 transition-colors group/item ${isBrutalist ? 'hover:bg-green-200 border-2 border-transparent hover:border-black' : 'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        <div className={`p-2 ${isBrutalist ? 'bg-black text-white rounded-none' : 'bg-green-50 dark:bg-green-900/30 text-green-600 rounded-md group-hover/item:bg-green-100 dark:group-hover/item:bg-green-900/50'}`}>
                                            <FileText size={18} strokeWidth={isBrutalist ? 3 : 2} />
                                        </div>
                                        <div>
                                            <div className={`text-sm ${isBrutalist ? 'font-black text-black uppercase' : 'font-semibold text-gray-900 dark:text-white'}`}>{t('nav.career_blog')}</div>
                                            <p className={`text-xs ${isBrutalist ? 'text-black font-bold' : 'text-gray-500 dark:text-gray-400'}`}>{t('nav.career_blog_desc')}</p>
                                        </div>
                                    </a>
                                    {/* ... other resource links ... */}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <header className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${isBrutalist
            ? 'bg-white border-b-4 border-black'
            : 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    {/* Logo - Always Original Style */}
                    <a href="/" className="flex items-center gap-2 group">
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Logo className="h-8 w-8 relative z-10 object-contain" />
                        </div>
                        <span className={`text-xl font-bold tracking-tight ${isBrutalist ? 'text-black' : 'text-gray-900 dark:text-white'}`}>CareerVivid</span>
                    </a>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8 h-full">
                        {context !== 'bio-link' && <NavItem name={t('nav.product')} hasDropdown />}
                        <NavItem name="Services" href="/services" />
                        <NavItem name={t('nav.use_cases')} hasDropdown />
                        {/* <NavItem name="Partners" href="/partners" /> */}
                        <NavItem name={t('nav.pricing')} hasDropdown />
                        <NavItem name={t('nav.resources')} hasDropdown />
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {!isBrutalist && (
                            <button onClick={toggleTheme} className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Toggle Theme">
                                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                            </button>
                        )}

                        {/* Language Selector */}
                        <div className="hidden sm:block">
                            <LanguageSelect />
                        </div>

                        {/* Desktop Auth Actions */}
                        <div className="hidden md:flex items-center gap-3">
                            {currentUser ? (
                                <>
                                    <a href="/dashboard" className={`text-sm font-semibold transition-colors px-3 py-2 ${isBrutalist
                                        ? 'text-black hover:underline uppercase'
                                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}>
                                        Dashboard
                                    </a>
                                    <button onClick={logOut} className={`font-bold text-sm transition-all transform hover:scale-105 ${isBrutalist
                                        ? 'px-6 py-2.5 bg-[#8b5cf6] text-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase'
                                        : 'px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 shadow-lg hover:shadow-xl'
                                        }`}>
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <a href={`/signin${context === 'bio-link' ? '?source=bio-link' : ''}`} className={`text-sm font-semibold transition-colors px-3 py-2 ${isBrutalist
                                        ? 'text-black hover:underline uppercase'
                                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}>
                                        {t('nav.login')}
                                    </a>
                                    <a href={`/signup${context === 'bio-link' ? '?source=bio-link' : ''}`} className={`font-bold text-sm transition-all transform hover:scale-105 ${isBrutalist
                                        ? 'px-6 py-2.5 bg-[#8b5cf6] text-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase'
                                        : 'px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 shadow-lg hover:shadow-xl'
                                        }`}>
                                        {t('nav.signup')}
                                    </a>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-2 ${isBrutalist ? 'text-black border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'rounded-md text-gray-600 dark:text-gray-300'}`}>
                                {isMenuOpen ? <X size={24} strokeWidth={isBrutalist ? 3 : 2} /> : <Menu size={24} strokeWidth={isBrutalist ? 3 : 2} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className={`md:hidden absolute top-20 left-0 right-0 z-40 ${isBrutalist
                    ? 'bg-white border-b-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-2xl animate-fade-in'
                    }`}>
                    <div className="px-4 py-6 flex flex-col gap-4">
                        {/* 1. Auth Actions (Top Priority) */}
                        <div className="flex flex-col gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                            {currentUser ? (
                                <>
                                    <a href="/dashboard" onClick={() => setIsMenuOpen(false)} className={`w-full text-center py-3 font-bold transition-all ${isBrutalist
                                        ? 'bg-[#8b5cf6] text-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wide'
                                        : 'bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-lg'
                                        }`}>
                                        Go to Dashboard
                                    </a>
                                    <button onClick={() => { logOut(); setIsMenuOpen(false); }} className={`w-full text-center py-3 font-semibold transition-all ${isBrutalist
                                        ? 'bg-white text-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wide'
                                        : 'text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}>
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <a href="/signup" onClick={() => setIsMenuOpen(false)} className={`w-full text-center py-3 font-bold transition-all ${isBrutalist
                                        ? 'bg-[#8b5cf6] text-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wide'
                                        : 'bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-lg'
                                        }`}>
                                        {t('nav.signup')}
                                    </a>
                                    <a href="/signin" onClick={() => setIsMenuOpen(false)} className={`w-full text-center py-3 font-semibold transition-all ${isBrutalist
                                        ? 'bg-white text-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wide'
                                        : 'text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}>
                                        {t('nav.login')}
                                    </a>
                                </>
                            )}
                        </div>

                        {/* 2. Navigation Links */}
                        <div className="space-y-1">

                            {/* Product Group (Mobile) */}
                            {context !== 'bio-link' && (
                                <div className={`pl-4 ${isBrutalist ? 'border-l-4 border-black ml-1 my-2 space-y-2' : 'border-l-2 border-gray-100 dark:border-gray-800 space-y-3 my-2'}`}>
                                    <p className={`text-xs uppercase tracking-wider mb-2 ${isBrutalist ? 'font-black text-gray-500' : 'text-gray-400 font-semibold'}`}>Products</p>
                                    <a href="/newresume" onClick={() => setIsMenuOpen(false)} className={`block ${isBrutalist ? 'font-bold text-black uppercase hover:underline' : 'text-sm text-gray-600 dark:text-gray-400'}`}>Resume Builder</a>
                                    <a href="/portfolio" onClick={() => setIsMenuOpen(false)} className={`block ${isBrutalist ? 'font-bold text-black uppercase hover:underline' : 'text-sm text-gray-600 dark:text-gray-400'}`}>Portfolio Builder</a>
                                    <a href="/job-tracker" onClick={() => setIsMenuOpen(false)} className={`block ${isBrutalist ? 'font-bold text-black uppercase hover:underline' : 'text-sm text-gray-600 dark:text-gray-400'}`}>Job Tracker</a>
                                    <a href="/bio-links" onClick={() => setIsMenuOpen(false)} className={`block ${isBrutalist ? 'font-bold text-black uppercase hover:underline' : 'text-sm text-gray-600 dark:text-gray-400'}`}>Bio Links</a>
                                </div>
                            )}

                            <a href="/services" onClick={() => setIsMenuOpen(false)} className={`block py-2 ${isBrutalist ? 'text-lg font-black uppercase text-black hover:bg-indigo-200 px-2 -mx-2' : 'text-base font-semibold text-gray-900 dark:text-white'}`}>Services</a>

                            {/* Use Cases Group */}
                            <div className={`pl-4 ${isBrutalist ? 'border-l-4 border-black ml-1 my-2 space-y-2' : 'border-l-2 border-gray-100 dark:border-gray-800 space-y-3 my-2'}`}>
                                <p className={`text-xs uppercase tracking-wider mb-2 ${isBrutalist ? 'font-black text-gray-500' : 'text-gray-400 font-semibold'}`}>Use Cases</p>
                                <a href="/demo" onClick={() => setIsMenuOpen(false)} className={`block ${isBrutalist ? 'font-bold text-black uppercase hover:underline' : 'text-sm text-gray-600 dark:text-gray-400'}`}>{t('nav.professional')}</a>
                                <a href="/demo" onClick={() => setIsMenuOpen(false)} className={`block ${isBrutalist ? 'font-bold text-black uppercase hover:underline' : 'text-sm text-gray-600 dark:text-gray-400'}`}>{t('nav.students')}</a>
                                <a href="/services" onClick={() => setIsMenuOpen(false)} className={`block ${isBrutalist ? 'font-bold text-black uppercase hover:underline' : 'text-sm text-gray-600 dark:text-gray-400'}`}>Local Business</a>
                            </div>

                            {/* Pricing Group */}
                            <div className={`pl-4 ${isBrutalist ? 'border-l-4 border-black ml-1 my-2 space-y-2' : 'border-l-2 border-gray-100 dark:border-gray-800 space-y-3 my-2'}`}>
                                <p className={`text-xs uppercase tracking-wider mb-2 ${isBrutalist ? 'font-black text-gray-500' : 'text-gray-400 font-semibold'}`}>{t('nav.pricing')}</p>
                                <a href={isBrutalist ? "#pricing" : "/pricing"} onClick={() => setIsMenuOpen(false)} className={`block ${isBrutalist ? 'font-bold text-black uppercase hover:underline' : 'text-sm text-gray-600 dark:text-gray-400'}`}>App Subscription</a>
                                <a href="/services#estimator" onClick={() => setIsMenuOpen(false)} className={`block ${isBrutalist ? 'font-bold text-black uppercase hover:underline' : 'text-sm text-gray-600 dark:text-gray-400'}`}>Service Estimates</a>
                            </div>

                            <a href="/blog" onClick={() => setIsMenuOpen(false)} className={`block py-2 ${isBrutalist ? 'text-lg font-black uppercase text-black hover:bg-cyan-200 px-2 -mx-2' : 'text-base font-semibold text-gray-900 dark:text-white'}`}>{t('nav.blog')}</a>
                            <a href="/contact" onClick={() => setIsMenuOpen(false)} className={`block py-2 ${isBrutalist ? 'text-lg font-black uppercase text-black hover:bg-pink-200 px-2 -mx-2' : 'text-base font-semibold text-gray-900 dark:text-white'}`}>{t('nav.contact')}</a>
                        </div>

                        {/* 3. Utilities */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <LanguageSelect />
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};
export default PublicHeader;
