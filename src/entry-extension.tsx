import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ExtensionLayout from './extension-ui/layout/ExtensionLayout';
import './i18n';
import './index.css'; // CRITICAL: Import Tailwind CSS

const EXTENSION_THEME_STORAGE_KEY = 'careervivid-extension-theme';

const applyExtensionSurfaceClass = () => {
    if (typeof window === 'undefined') return;

    const isEmbeddedPanel = window.self !== window.top;
    const isNativeSidePanel = window.innerWidth >= 390;
    document.documentElement.classList.toggle('cv-side-panel', isEmbeddedPanel || isNativeSidePanel);
};

if (typeof window !== 'undefined') {
    if (localStorage.getItem(EXTENSION_THEME_STORAGE_KEY) === 'light') {
        localStorage.setItem(EXTENSION_THEME_STORAGE_KEY, 'system');
    }

    applyExtensionSurfaceClass();
    window.addEventListener('resize', applyExtensionSurfaceClass);

    const style = document.createElement('style');
    style.textContent = `
        html.cv-side-panel,
        html.cv-side-panel body {
            width: 100% !important;
            height: 100vh !important;
            min-height: 100vh !important;
            max-width: 100% !important;
            border: none !important;
            overflow: hidden !important;
            box-shadow: none !important;
            background: #f7f8fb !important;
        }
        html.cv-side-panel.cv-theme-bright,
        html.cv-side-panel.cv-theme-bright body {
            background: #ffffff !important;
        }
        html.dark.cv-side-panel,
        html.dark.cv-side-panel body {
            background: #11110f !important;
        }
        html.cv-side-panel #root {
            height: 100vh !important;
            width: 100% !important;
        }
        html.cv-side-panel * {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
        }
        html.cv-side-panel ::-webkit-scrollbar {
            width: 8px;
        }
        html.cv-side-panel ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 999px;
            border: 2px solid #f7f8fb;
        }
        .cv-extension-root.cv-theme-bright,
        .cv-extension-root.cv-theme-bright [class*="bg-[#f8f8fb]"],
        .cv-extension-root.cv-theme-bright [class*="bg-[#fbfbfd]"] {
            background-color: #ffffff !important;
        }
        .cv-extension-root.cv-theme-bright [class*="border-[#ececf4]"],
        .cv-extension-root.cv-theme-bright [class*="border-[#e8e9ef]"],
        .cv-extension-root.cv-theme-bright [class*="border-slate-200"] {
            border-color: #e6e8f0 !important;
        }
        .cv-extension-root.cv-theme-dark,
        .cv-extension-root.cv-theme-dark [class*="bg-[#f8f8fb]"],
        .cv-extension-root.cv-theme-dark [class*="bg-gray-50"] {
            background-color: #11110f !important;
            color: #f4f1e9 !important;
        }
        .cv-extension-root.cv-theme-dark [class*="bg-white"],
        .cv-extension-root.cv-theme-dark [class*="bg-[#fbfbfd]"],
        .cv-extension-root.cv-theme-dark [class*="bg-[#f4f5f8]"],
        .cv-extension-root.cv-theme-dark [class*="bg-[#f3f2ff]"],
        .cv-extension-root.cv-theme-dark [class*="bg-[#f5f4ff]"],
        .cv-extension-root.cv-theme-dark [class*="bg-[#eef0ff]"],
        .cv-extension-root.cv-theme-dark [class*="bg-[#e9e8ff]"],
        .cv-extension-root.cv-theme-dark [class*="bg-[#fff0f7]"] {
            background-color: #201f1c !important;
        }
        .cv-extension-root.cv-theme-dark [class*="bg-green-50"],
        .cv-extension-root.cv-theme-dark [class*="bg-emerald-50"] {
            background-color: #14251d !important;
        }
        .cv-extension-root.cv-theme-dark [class*="bg-yellow-50"],
        .cv-extension-root.cv-theme-dark [class*="bg-amber-50"] {
            background-color: #2a2111 !important;
        }
        .cv-extension-root.cv-theme-dark [class*="bg-red-50"],
        .cv-extension-root.cv-theme-dark [class*="bg-rose-50"] {
            background-color: #2c171a !important;
        }
        .cv-extension-root.cv-theme-dark [class*="border-[#ececf4]"],
        .cv-extension-root.cv-theme-dark [class*="border-[#e8e9ef]"],
        .cv-extension-root.cv-theme-dark [class*="border-[#e7e8f0]"],
        .cv-extension-root.cv-theme-dark [class*="border-[#e6e7ef]"],
        .cv-extension-root.cv-theme-dark [class*="border-[#e4e2ff]"],
        .cv-extension-root.cv-theme-dark [class*="border-[#e4e7ff]"],
        .cv-extension-root.cv-theme-dark [class*="border-[#d9d7fb]"],
        .cv-extension-root.cv-theme-dark [class*="border-slate-200"],
        .cv-extension-root.cv-theme-dark [class*="border-gray-100"],
        .cv-extension-root.cv-theme-dark [class*="border-gray-200"] {
            border-color: #383530 !important;
        }
        .cv-extension-root.cv-theme-dark [class*="text-slate-950"],
        .cv-extension-root.cv-theme-dark [class*="text-slate-900"],
        .cv-extension-root.cv-theme-dark [class*="text-gray-950"],
        .cv-extension-root.cv-theme-dark [class*="text-gray-900"],
        .cv-extension-root.cv-theme-dark h1,
        .cv-extension-root.cv-theme-dark h2,
        .cv-extension-root.cv-theme-dark h3 {
            color: #f4f1e9 !important;
        }
        .cv-extension-root.cv-theme-dark [class*="text-slate-800"],
        .cv-extension-root.cv-theme-dark [class*="text-slate-700"],
        .cv-extension-root.cv-theme-dark [class*="text-slate-600"],
        .cv-extension-root.cv-theme-dark [class*="text-gray-800"],
        .cv-extension-root.cv-theme-dark [class*="text-gray-700"],
        .cv-extension-root.cv-theme-dark [class*="text-gray-600"],
        .cv-extension-root.cv-theme-dark [class*="text-gray-500"] {
            color: #b8b1a7 !important;
        }
        .cv-extension-root.cv-theme-dark [class*="text-slate-400"],
        .cv-extension-root.cv-theme-dark [class*="text-gray-400"] {
            color: #8f887e !important;
        }
        .cv-extension-root.cv-theme-dark [class*="text-[#625bd5]"],
        .cv-extension-root.cv-theme-dark [class*="text-[#6b66d8]"],
        .cv-extension-root.cv-theme-dark [class*="text-[#7b75df]"] {
            color: #aaa6ff !important;
        }
        .cv-extension-root.cv-theme-dark input,
        .cv-extension-root.cv-theme-dark select,
        .cv-extension-root.cv-theme-dark textarea {
            background-color: #171612 !important;
            border-color: #383530 !important;
            color: #f4f1e9 !important;
        }
    `;
    document.head.appendChild(style);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <HelmetProvider>
            <AuthProvider>
                <ThemeProvider defaultTheme="system" storageKey={EXTENSION_THEME_STORAGE_KEY}>
                    <ExtensionLayout />
                </ThemeProvider>
            </AuthProvider>
        </HelmetProvider>
    </React.StrictMode>
);
