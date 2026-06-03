import React, { createContext, useState, useEffect, useContext } from 'react';

export type Theme = 'light' | 'dark' | 'system' | 'bright';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** The resolved theme after applying system preference */
  resolvedTheme: 'light' | 'dark';
  toggleTheme: () => void; // kept for backward compat
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  storageKey = 'careervivid-theme',
}) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => getSystemTheme());

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    setThemeState(stored || defaultTheme);
  }, [defaultTheme, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setSystemTheme(media.matches ? 'dark' : 'light');
    };

    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme: 'light' | 'dark' = theme === 'system'
    ? systemTheme
    : theme === 'dark'
      ? 'dark'
      : 'light';

  useEffect(() => {
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    document.documentElement.dataset.themeMode = theme;
    document.documentElement.classList.toggle('cv-theme-bright', theme === 'bright');
    document.documentElement.classList.toggle('cv-theme-system', theme === 'system');
  }, [resolvedTheme, theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };

  // Kept for backward compatibility
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
