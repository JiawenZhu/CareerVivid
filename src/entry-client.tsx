import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import VersionUpdateBoundary, {
  isVersionMismatchError,
  requestVersionRecovery,
} from './components/VersionUpdateBoundary';
import { AuthProvider } from './contexts/AuthContext';
import './i18n'; // Initialize i18next
import './index.css';
import { quietProductionConsole } from './utils/quietConsole';

quietProductionConsole();

const isLocalDevHost = () => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false;

  return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
};

const clearLocalDevRuntimeCaches = async () => {
  if (!isLocalDevHost()) return;

  const registrations = 'serviceWorker' in navigator
    ? await navigator.serviceWorker.getRegistrations()
    : [];
  const cacheNames = 'caches' in window ? await window.caches.keys() : [];

  await Promise.allSettled([
    ...registrations.map((registration) => registration.unregister()),
    ...cacheNames.map((cacheName) => window.caches.delete(cacheName)),
  ]);

  if ((registrations.length > 0 || cacheNames.length > 0) && !window.sessionStorage.getItem('cv-local-runtime-cache-cleared')) {
    window.sessionStorage.setItem('cv-local-runtime-cache-cleared', '1');
    window.location.reload();
  }
};

void clearLocalDevRuntimeCaches();

const isVersionedAssetUrl = (url: string | null | undefined) => {
  if (!url) return false;
  return /\/assets\/.+\.(?:js|css)$/.test(url) || /\/_next\/static\/.+\.(?:js|css)$/.test(url);
};

// Recover old browser sessions that try to load chunks from a previous deploy.
window.addEventListener('unhandledrejection', (event) => {
  if (!isVersionMismatchError(event.reason)) return;

  event.preventDefault();
  void requestVersionRecovery('startup-dynamic-import');
});

window.addEventListener('vite:preloadError', (event) => {
  // Do not preventDefault here. Vite treats a prevented preload error as
  // handled and resolves the lazy import to undefined, which crashes React.lazy
  // with "Cannot read properties of undefined (reading 'default')".
  void requestVersionRecovery('startup-vite-preload');
});

window.addEventListener('error', (event) => {
  const target = event.target as HTMLScriptElement | HTMLLinkElement | null;
  const assetUrl = target && 'src' in target ? target.src : target && 'href' in target ? target.href : null;

  if (isVersionedAssetUrl(assetUrl)) {
    void requestVersionRecovery('startup-asset-load');
    return;
  }

  if (isVersionMismatchError(event.error || event.message)) {
    void requestVersionRecovery('startup-runtime-error');
  }
}, true);

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
        <VersionUpdateBoundary>
          <App />
        </VersionUpdateBoundary>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);
