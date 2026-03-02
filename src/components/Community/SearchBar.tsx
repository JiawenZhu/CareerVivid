import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from 'use-debounce';

interface SearchBarProps {
    onSearchChange: (query: string) => void;
    isSearching?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearchChange, isSearching, onFocus, onBlur }) => {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [debouncedValue] = useDebounce(inputValue, 300);

    // Keyboard shortcut handler (Cmd+K or '/')
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Broadcast the debounced value back to the parent
    useEffect(() => {
        onSearchChange(debouncedValue);
    }, [debouncedValue, onSearchChange]);

    const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    return (
        <div className="relative flex items-center flex-1 w-full max-w-xl lg:max-w-3xl group">
            <div className="relative w-full md:w-[80%] group-focus-within:w-full transition-all duration-300 ease-in-out md:ml-auto">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
                    <Search size={18} />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={t('community.searchPlaceholder', 'Search articles, resumes...')}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-full py-2 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 ease-in-out shadow-sm focus:shadow-lg opacity-90 focus:opacity-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center z-10 pointer-events-none">
                    {isSearching ? (
                        <Loader2 size={16} className="text-primary-500 animate-spin" />
                    ) : (
                        <kbd className="hidden sm:inline-flex items-center gap-1 font-sans text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded">
                            <span>{isMac ? '⌘' : 'Ctrl'}</span>K
                        </kbd>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchBar;
