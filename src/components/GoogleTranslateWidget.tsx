import React, { useState, useEffect, useRef } from 'react';
import { SUPPORTED_TRANSLATE_LANGUAGES } from '../constants';
import { Languages, ChevronDown } from 'lucide-react';

let isGoogleTranslateInitialized = false;

const initializeGoogleTranslate = () => {
    new (window as any).google.translate.TranslateElement(
        {
            pageLanguage: 'en',
            autoDisplay: false,
        },
        'google_translate_persistent_container'
    );
    isGoogleTranslateInitialized = true;
};

const GoogleTranslateWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(SUPPORTED_TRANSLATE_LANGUAGES[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // --- Script loading logic (only runs once per app lifecycle) ---
    if (!isGoogleTranslateInitialized && !(window as any).google?.translate) {
        if (!(window as any).googleTranslateElementInit) {
            (window as any).googleTranslateElementInit = initializeGoogleTranslate;
            
            if (!document.getElementById('google-translate-script')) {
                const addScript = document.createElement('script');
                addScript.id = 'google-translate-script';
                addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
                addScript.async = true;
                document.body.appendChild(addScript);
            }
        }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: { code: string; name: string }) => {
    setSelectedLanguage(lang);
    setIsOpen(false);

    const persistentContainer = document.getElementById('google_translate_persistent_container');
    if (persistentContainer) {
        const googleTranslateSelect = persistentContainer.querySelector('select.goog-te-combo') as HTMLSelectElement | null;
        if (googleTranslateSelect) {
            googleTranslateSelect.value = lang.code;
            googleTranslateSelect.dispatchEvent(new Event('change'));
        }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-2 border border-gray-300 bg-white px-3 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Languages size={16} />
        <span>{selectedLanguage.name}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 max-h-60 overflow-y-auto border">
            <div className="py-1">
                {SUPPORTED_TRANSLATE_LANGUAGES.map(lang => (
                    <button 
                        key={lang.code} 
                        onClick={() => handleLanguageChange(lang)} 
                        className="text-left w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        {lang.name}
                    </button>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default GoogleTranslateWidget;