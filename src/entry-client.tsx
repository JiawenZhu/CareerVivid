import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './i18n'; // Initialize i18next

// HANDLE DYNAMIC IMPORT ERRORS
// This catches "Failed to fetch dynamically imported module" errors that happen
// when a user is on an old version of the site and navigates to a new route
// whose JS chunk hash has changed.
window.addEventListener('error', (event) => {
  if (event.message?.includes('Failed to fetch dynamically imported module')) {
    const lastReload = sessionStorage.getItem('last_chunk_reload');
    const now = Date.now();

    // Prevent infinite reload loops (only reload if last reload was > 10s ago)
    if (!lastReload || now - parseInt(lastReload) > 10000) {
      sessionStorage.setItem('last_chunk_reload', now.toString());
      window.location.reload();
    }
  }
}, true);

// FORCE UNREGISTER SERVICE WORKERS
// This resolves issues where browsers serve old cached versions of the app
// that point to old backend URLs (e.g., us-central1 instead of us-west1).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      console.log('Unregistering Service Worker:', registration);
      registration.unregister();
    }
  }).catch(function (err) {
    console.log('Service Worker unregistration failed: ', err);
  });
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