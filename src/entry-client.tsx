import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './i18n'; // Initialize i18next

// HANDLE DYNAMIC IMPORT ERRORS
// Catches "Failed to fetch dynamically imported module" via unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Failed to fetch dynamically imported module')) {
    const lastReload = sessionStorage.getItem('last_chunk_reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload) > 10000) {
      sessionStorage.setItem('last_chunk_reload', now.toString());
      window.location.reload();
    }
  }
});

// Catches Vite-specific preload errors
window.addEventListener('vite:preloadError', (event) => {
  console.log('Caught vite:preloadError, reloading page to fetch new chunks...');
  const lastReload = sessionStorage.getItem('last_chunk_reload_vite');
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload) > 10000) {
    sessionStorage.setItem('last_chunk_reload_vite', now.toString());
    window.location.reload();
  }
});

// Service workers are now managed cleanly by vite-plugin-pwa.

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