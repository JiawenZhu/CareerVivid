import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from 'use-debounce';

interface SearchBarProps {
    onSearchChange: (query: string) => void;
    isSearching?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearchChange, isSearching }) => {
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
        <div className="relative flex items-center w-full max-w-sm">
            <div className="absolute left-3 text-gray-400">
                <Search size={18} />
            </div>
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('community.searchPlaceholder', 'Search articles, resumes...')}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-full py-2 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
            />
            <div className="absolute right-3 flex items-center">
                {isSearching ? (
                    <Loader2 size={16} className="text-primary-500 animate-spin" />
                ) : (
                    <kbd className="hidden sm:inline-flex items-center gap-1 font-sans text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded">
                        <span>{isMac ? '⌘' : 'Ctrl'}</span>K
                    </kbd>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
