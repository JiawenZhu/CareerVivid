
import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../constants';
import { navigate } from '../App';

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

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = (code: string) => {
    setIsOpen(false);
    // Change language in i18next
    (i18n as any).changeLanguage(code);

    // Update URL to include new language
    const currentPath = window.location.pathname;

    // Remove existing language prefix if present
    const parts = currentPath.split('/').filter(p => p);
    let newPath = currentPath;

    if (parts.length > 0 && SUPPORTED_LANGUAGES.some(l => l.code === parts[0])) {
      // Replace existing code
      parts[0] = code;
      newPath = '/' + parts.join('/');
    } else {
      // Prepend code
      newPath = `/${code}${currentPath.startsWith('/') ? currentPath : '/' + currentPath}`;
    }

    // Normalize: remove double slashes
    newPath = newPath.replace('//', '/');

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
              <span className={`font-medium ${i18n.language === lang.code ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-200'}`}>
                {lang.nativeName} <span className="text-gray-400 font-normal text-xs ml-1">({lang.name})</span>
              </span>
              {i18n.language === lang.code && <Check size={14} className="text-primary-600 dark:text-primary-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelect;
