
import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../constants';
import { navigate } from '../utils/navigation';
import {
  buildLocalizedPath,
  normalizeLanguageCode,
  setStoredLanguagePreference,
} from '../utils/languagePreference';

const LanguageSelect: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCode = normalizeLanguageCode(i18n.resolvedLanguage || i18n.language) || 'en';
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === currentCode) || SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = (code: string) => {
    setIsOpen(false);
    const normalizedCode = setStoredLanguagePreference(code);

    (i18n as any).changeLanguage?.(normalizedCode);

    const newPath = buildLocalizedPath(
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
      normalizedCode,
    );

    navigate(newPath);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Globe size={16} />
        <span className="hidden md:inline">{currentLang.nativeName}</span>
        <span className="md:hidden">{currentLang.code.toUpperCase()}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[60vh] overflow-y-auto">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between group"
            >
              <span className={`font-medium ${currentCode === lang.code ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-200'}`}>
                {lang.nativeName} <span className="text-gray-400 font-normal text-xs ml-1">({lang.name})</span>
              </span>
              {currentCode === lang.code && <Check size={14} className="text-primary-600 dark:text-primary-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelect;
