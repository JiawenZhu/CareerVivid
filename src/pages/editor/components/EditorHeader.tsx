import React, { useRef, useState } from 'react';
import { ArrowLeft, Share2, Download, ChevronDown, FileText, Image as ImageIcon, Loader2, Languages, Eye, MoreVertical, Edit as EditIcon, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ResumeData, UserProfile } from '../../../types';
import ThemeToggle from '../../../components/ThemeToggle';
import { EXPORT_OPTIONS, SUPPORTED_TRANSLATE_LANGUAGES } from '../../../constants';

// Note: Ensure EXPORT_OPTIONS and SUPPORTED_TRANSLATE_LANGUAGES are exported from Editor.tsx or moved to a constants file.
// Ideally, move them to a separate file constants.ts in src/pages/editor/constants.ts

interface EditorHeaderProps {
    resume: ResumeData;
    currentUser: any;
    isShared: boolean;
    isGuestMode: boolean;
    isTranslating: boolean;
    isExporting: boolean;
    hasAnnotations: boolean;
    hasViewedFeedback: boolean;
    commentsCount: number;
    showAnnotationOverlay: boolean;
    theme: string;
    showGuideArrow: boolean;
    onResumeChange: (updates: Partial<ResumeData>) => void;
    onExport: (optionId: string) => void;
    onTranslate: (langCode: string) => void;
    onToggleFeedback: () => void;
    onShare: () => void;
    onToggleTheme: () => void;
    setViewMode: (mode: 'edit' | 'preview') => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
    resume, currentUser, isShared, isGuestMode, isTranslating,
    hasAnnotations, hasViewedFeedback, commentsCount, showAnnotationOverlay,
    theme, showGuideArrow, onResumeChange, onExport, onTranslate,
    onToggleFeedback, onShare, onToggleTheme, setViewMode
}) => {
    const { t } = useTranslation();
    const [isDesktopDownloadMenuOpen, setIsDesktopDownloadMenuOpen] = useState(false);
    const [isTranslateMenuOpen, setIsTranslateMenuOpen] = useState(false);
    const [isMobileMoreMenuOpen, setIsMobileMoreMenuOpen] = useState(false);

    const desktopDownloadMenuRef = useRef<HTMLDivElement>(null);
    const translateMenuRef = useRef<HTMLDivElement>(null);
    const mobileMoreMenuRef = useRef<HTMLDivElement>(null);

    return (
        <header className="relative flex-shrink-0 bg-white dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-40">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6">
                <div className="flex items-center gap-2">
                    {!isShared && (
                        <a href="/" title="Back to Dashboard" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <ArrowLeft size={20} />
                        </a>
                    )}
                    {isShared ? (
                        <div className="flex items-center gap-2">
                            <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                <Share2 size={12} /> {t('editor.shared_editor')}
                            </div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{resume.title}</h1>
                        </div>
                    ) : (
                        <input
                            type="text"
                            value={resume.title}
                            onChange={e => onResumeChange({ title: e.target.value })}
                            className="text-lg font-bold bg-transparent focus:outline-none focus:ring-1 focus:ring-primary-500 rounded-md px-2 py-1 -ml-2 text-gray-900 dark:text-white"
                        />
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Desktop Download Menu */}
                    <div className="hidden md:block relative" ref={desktopDownloadMenuRef}>
                        <button
                            onClick={() => setIsDesktopDownloadMenuOpen(!isDesktopDownloadMenuOpen)}
                            className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-soft hover:bg-primary-700 transition-colors"
                        >
                            <Download size={18} />
                            <span>{t('editor.download')}</span>
                            <ChevronDown size={18} />
                        </button>
                        {isDesktopDownloadMenuOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border dark:border-gray-700">
                                <div className="py-1">
                                    {EXPORT_OPTIONS.map(opt => {
                                        let name = opt.name;
                                        let rec = opt.recommendation;
                                        if (opt.id === 'pdf') { name = t('export.pdf'); rec = t('export.pdf_rec'); }
                                        else if (opt.id === 'png') { name = t('export.png'); rec = t('export.png_rec'); }
                                        else if (opt.id === '1:1') { name = t('export.square'); rec = t('export.square_rec'); }
                                        else if (opt.id === '16:9') { name = t('export.widescreen'); rec = t('export.widescreen_rec'); }
                                        else if (opt.id === '9:16') { name = t('export.story'); rec = t('export.story_rec'); }
                                        else if (opt.id === '4:5') { name = t('export.portrait'); rec = t('export.portrait_rec'); }

                                        return (
                                            <button key={opt.id} onClick={() => { onExport(opt.id); setIsDesktopDownloadMenuOpen(false); }} className="w-full text-left flex items-start gap-3 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                {opt.id === 'pdf' ? <FileText className="mt-1" /> : <ImageIcon className="mt-1" />}
                                                <div>
                                                    <p className="font-semibold">{name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{rec}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Translate Menu */}
                    {!isShared && (
                        <div className="hidden md:block relative" ref={translateMenuRef}>
                            <button
                                onClick={() => setIsTranslateMenuOpen(!isTranslateMenuOpen)}
                                disabled={isTranslating}
                                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                {isTranslating ? <Loader2 size={16} className="animate-spin" /> : <Languages size={16} />}
                                <span>Translate</span>
                                <ChevronDown size={14} className={`transition-transform ${isTranslateMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isTranslateMenuOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border dark:border-gray-700 max-h-80 overflow-y-auto">
                                    <div className="py-1">
                                        <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 font-semibold">Translate Resume To:</div>
                                        {SUPPORTED_TRANSLATE_LANGUAGES.map(lang => (
                                            <button
                                                key={lang.code}
                                                onClick={() => { onTranslate(lang.code); setIsTranslateMenuOpen(false); }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                {lang.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Feedback / Share Buttons */}
                    {!isShared && !isGuestMode && (
                        <div className="hidden md:block">
                            {(hasAnnotations || commentsCount > 0) ? (
                                <button
                                    onClick={onToggleFeedback}
                                    className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${showAnnotationOverlay
                                        ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                    title="Toggle feedback annotations and comments"
                                >
                                    <Eye size={16} />
                                    <span>Review Feedback</span>
                                    {/* Visual indicator badge */}
                                    {(!hasViewedFeedback && (commentsCount > 0 || hasAnnotations)) && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={onShare}
                                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Share this resume"
                                >
                                    <Share2 size={16} />
                                    <span>Share</span>
                                </button>
                            )}
                        </div>
                    )}

                    <div className="hidden md:flex items-center gap-1">
                        <ThemeToggle />
                    </div>

                    {/* Mobile Menu */}
                    <div className="md:hidden relative" ref={mobileMoreMenuRef}>
                        {showGuideArrow && (
                            <div className="absolute -bottom-16 right-0 flex flex-col items-end animate-bounce z-50">
                                <div className="bg-primary-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium mb-1 whitespace-nowrap">
                                    Share or Preview here! →
                                </div>
                                <svg className="w-8 h-8 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2l-8 8h5v12h6V10h5z" />
                                </svg>
                            </div>
                        )}

                        <button
                            onClick={() => setIsMobileMoreMenuOpen(!isMobileMoreMenuOpen)}
                            className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all animate-pulse-slow shadow-lg shadow-primary-500/20"
                        >
                            <MoreVertical size={24} className="stroke-2" />
                        </button>
                        {isMobileMoreMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border dark:border-gray-700">
                                <div className="py-1">
                                    <p className="px-4 py-2 text-xs text-gray-400">View Mode</p>
                                    <button onClick={() => { setViewMode('edit'); setIsMobileMoreMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><EditIcon size={16} /> Edit</button>
                                    <button onClick={() => { setViewMode('preview'); setIsMobileMoreMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><Eye size={16} /> Preview</button>
                                    {/* Review Feedback Section - Mobile */}
                                    {!isShared && !isGuestMode && (hasAnnotations || commentsCount > 0) && (
                                        <>
                                            <div className="border-t my-1 dark:border-gray-600"></div>
                                            <p className="px-4 py-2 text-xs text-gray-400">Feedback</p>
                                            <button
                                                onClick={() => {
                                                    onToggleFeedback();
                                                    setIsMobileMoreMenuOpen(false);
                                                }}
                                                className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm transition-colors ${showAnnotationOverlay
                                                    ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-semibold'
                                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                <Eye size={16} />
                                                <span>Review Feedback</span>
                                                {!hasViewedFeedback && (
                                                    <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                                )}
                                            </button>
                                        </>
                                    )}
                                    <div className="border-t my-1 dark:border-gray-600"></div>
                                    <p className="px-4 py-2 text-xs text-gray-400">Download</p>
                                    {EXPORT_OPTIONS.slice(0, 2).map(opt => (
                                        <button key={opt.id} onClick={() => { onExport(opt.id); setIsMobileMoreMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                            {opt.id === 'pdf' ? <FileText size={16} /> : <ImageIcon size={16} />} {opt.name}
                                        </button>
                                    ))}
                                    <div className="border-t my-1 dark:border-gray-600"></div>
                                    <button onClick={() => { onToggleTheme(); setIsMobileMoreMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} Toggle Theme
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default EditorHeader;
