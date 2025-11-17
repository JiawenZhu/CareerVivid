import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Loader2, LogIn, Rocket } from 'lucide-react';

// FIX: Added a global declaration for the `chrome` object to resolve type errors
// when the build environment doesn't correctly load the chrome types.
declare const chrome: any;

const Popup: React.FC = () => {
    const { currentUser, loading } = useAuth();
    const isExtension = 'chrome' in window && chrome.runtime?.id;

    const handleLogin = () => {
        if (isExtension) {
            const authPageUrl = chrome.runtime.getURL('index.html') + '#/auth';
            chrome.tabs.create({ url: authPageUrl });
        } else {
            // If opened directly, just navigate
            window.open('index.html#/auth', '_blank');
        }
    };

    const handleAnalyze = async () => {
      if (!isExtension) return;
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        try {
          // Ensure the content script is injected before sending a message.
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
        } catch (err) {
          console.error(`failed to execute script: ${err}`);
        }
      }
    };
    
    const openDashboard = () => {
       if (isExtension) {
            chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
       } else {
            window.open('index.html', '_blank');
       }
    }

    if (loading) {
      return (
        <div className="flex flex-col h-full items-center justify-center text-center p-4">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="dark:text-white mt-4 text-sm">Loading...</p>
        </div>
      );
    }

    return (
        <div className="flex flex-col h-full items-center justify-center text-center p-6 bg-gray-50 dark:bg-gray-900">
            <img src="https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/logo.png?alt=media&token=3d2f7db5-96db-4dce-ba00-43d8976da3a1" alt="Career Co-Pilot Logo" className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Career Co-Pilot</h1>
            
            {currentUser ? (
                <div className="mt-6 w-full">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Welcome back, <span className="font-semibold">{currentUser.email}</span>!
                    </p>
                    <button 
                        onClick={handleAnalyze}
                        disabled={!isExtension}
                        title={!isExtension ? "This feature is only available within the Chrome extension." : "Analyze Job on This Page"}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg shadow-soft hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <Rocket size={18} />
                        Analyze Job on This Page
                    </button>
                    <button 
                        onClick={openDashboard}
                        className="mt-2 w-full text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                        Open Full Dashboard
                    </button>
                </div>
            ) : (
                <div className="mt-6 w-full">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Log in to get AI-powered resume matching and interview prep.
                    </p>
                    <button 
                        onClick={handleLogin}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg shadow-soft hover:bg-primary-700 transition-colors"
                    >
                        <LogIn size={18} />
                        Sign In or Sign Up
                    </button>
                </div>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    <React.StrictMode>
      <ThemeProvider>
        <AuthProvider>
            <Popup />
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
);