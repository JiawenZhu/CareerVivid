import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Loader2, LogIn, Rocket, ExternalLink, LogOut, XCircle } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';

// FIX: Added a global declaration for the `chrome` object to resolve type errors
// when the build environment doesn't correctly load the chrome types.
declare const chrome: any;

const Popup: React.FC = () => {
    const { currentUser, loading, logOut } = useAuth();
    const isExtension = 'chrome' in window && chrome.runtime?.id;
    const [isJobPage, setIsJobPage] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (isExtension) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
                if (tabs[0]?.url) {
                    const url = tabs[0].url;
                    const isSupported = /linkedin\.com\/jobs\/view|indeed\.com\/viewjob|glassdoor\.com\/Job|ziprecruiter\.com\/c\//.test(url);
                    setIsJobPage(isSupported);
                }
            });
        }
    }, [isExtension]);

    const handleLogin = () => {
        const authPageUrl = isExtension ? chrome.runtime.getURL('index.html') + '#/auth' : 'index.html#/auth';
        chrome.tabs.create({ url: authPageUrl });
    };

    const handleAnalyze = async () => {
        if (!isExtension) return;
        setIsAnalyzing(true);
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.id) {
            try {
                // Execute script and wait for it to complete
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
                // Then send a message to trigger the analysis in the content script
                await chrome.tabs.sendMessage(tab.id, { action: 'analyzePage' });
            } catch (err) {
                console.error(`Failed to execute or message content script: ${err}`);
            }
        }
        setTimeout(() => setIsAnalyzing(false), 1000); // Give feedback for a moment
    };

    const openDashboard = () => {
        const dashboardUrl = isExtension ? chrome.runtime.getURL('index.html') : 'index.html';
        chrome.tabs.create({ url: dashboardUrl });
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-center p-4 bg-white dark:bg-gray-900">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans">
            <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src="https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/logo.png?alt=media&token=3d2f7db5-96db-4dce-ba00-43d8976da3a1" alt="Logo" className="h-8 w-8" />
                    <span className="font-bold text-lg">CareerVivid Co-Pilot</span>
                </div>
                {currentUser && (
                    <button onClick={logOut} title="Sign Out" className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <LogOut size={18} />
                    </button>
                )}
            </header>

            <main className="flex-grow flex flex-col justify-center p-6">
                {currentUser ? (
                    <div className="w-full text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Welcome back,
                        </p>
                        <p className="font-semibold truncate mt-1">{currentUser.email}</p>
                        
                        <div className="mt-6 w-full relative">
                            <button
                                onClick={handleAnalyze}
                                disabled={!isJobPage || isAnalyzing}
                                title={!isJobPage ? "Navigate to a supported job site to use this feature." : "Analyze Job on This Page"}
                                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg shadow-soft hover:bg-primary-700 transition-all transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:scale-100 disabled:cursor-not-allowed"
                            >
                                {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Rocket size={20} />}
                                {isAnalyzing ? 'Analyzing...' : 'Analyze Job on This Page'}
                            </button>
                            {!isJobPage && (
                                <p className="text-xs text-red-500 dark:text-red-400 mt-2 flex items-center justify-center gap-1">
                                    <XCircle size={14} /> Not on a supported job page
                                </p>
                            )}
                        </div>

                    </div>
                ) : (
                    <div className="w-full text-center">
                        <Rocket size={48} className="text-primary-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold">Unlock Your Career Potential</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                            Sign in to get AI-powered resume matching and interview prep right here on the job page.
                        </p>
                        <button
                            onClick={handleLogin}
                            className="mt-6 w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg shadow-soft hover:bg-primary-700 transition-colors"
                        >
                            <LogIn size={18} />
                            Sign In or Sign Up
                        </button>
                    </div>
                )}
            </main>

            {currentUser && (
                <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={openDashboard}
                        className="w-full text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center justify-center gap-2"
                    >
                        Open Full Dashboard <ExternalLink size={16} />
                    </button>
                </footer>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <ThemeProvider>
                <AuthProvider>
                    <Popup />
                </AuthProvider>
            </ThemeProvider>
        </ErrorBoundary>
    </React.StrictMode>
);