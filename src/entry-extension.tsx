import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './i18n';
import './index.css'; // CRITICAL: Import Tailwind CSS

const applyExtensionSurfaceClass = () => {
    if (typeof window === 'undefined') return;

    const isEmbeddedPanel = window.self !== window.top;
    const isNativeSidePanel = window.innerWidth >= 390;
    document.documentElement.classList.toggle('cv-side-panel', isEmbeddedPanel || isNativeSidePanel);
};

if (typeof window !== 'undefined') {
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
                <App />
            </AuthProvider>
        </HelmetProvider>
    </React.StrictMode>
);
