import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './i18n'; // Initialize i18next

// HANDLE DYNAMIC IMPORT ERRORS
// Catches "Failed to fetch dynamically imported module" via unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const isChunkLoadError = event.reason?.message?.includes('Failed to fetch dynamically imported module') ||
    event.reason?.message?.includes('Strict MIME type checking');

  if (isChunkLoadError) {
    console.warn('Caught chunk load error/MIME mismatch. Reloading to fetch new version...');
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

// GLOBAL STORAGE QUOTA RECOVERY
// Specifically handles QuotaExceededError which prevents login/SW registration
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'QuotaExceededError' || (event.reason?.message && event.reason.message.includes('Quota exceeded'))) {
    console.error('CRITICAL: Storage quota exceeded. Initiating emergency cleanup...');
    
    // 1. Clear large, non-essential localStorage items
    localStorage.removeItem('guestResume');
    
    // 2. Clear all caches to free up Service Worker space
    if ('caches' in window) {
      caches.keys().then(names => {
        for (const name of names) caches.delete(name);
      });
    }

    // 3. Briefly notify user if possible (console is already logged)
    // We don't want to alert() here as it blocks, but we reload to try again
    const lastCleanup = sessionStorage.getItem('last_quota_cleanup');
    const now = Date.now();
    if (!lastCleanup || now - parseInt(lastCleanup) > 60000) {
      sessionStorage.setItem('last_quota_cleanup', now.toString());
      setTimeout(() => window.location.reload(), 1000);
    }
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