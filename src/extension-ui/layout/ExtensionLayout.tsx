/// <reference types="chrome" />
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ExtensionLogin from '../pages/ExtensionLogin';
import ExtensionHome from '../pages/ExtensionHome';

const ExtensionLayout: React.FC = () => {
    const { currentUser, loading: authLoading } = useAuth();
    const { theme } = useTheme();
    const [cookieAuth, setCookieAuth] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Ask the background service worker to hydrate auth. The popup is
    // transient, so cookies/IndexedDB/tabs must be checked outside React.
    useEffect(() => {
        const hydrateAuth = () => {
            if (typeof chrome === 'undefined' || !chrome.runtime) {
                setCookieAuth(false);
                setIsLoading(false);
                return;
            }

            chrome.runtime.sendMessage({ type: 'HYDRATE_AUTH' }, (response) => {
                const err = chrome.runtime.lastError;
                if (err) {
                    setCookieAuth(false);
                    setIsLoading(false);
                    return;
                }

                setCookieAuth(response?.isAuthenticated === true);
                setIsLoading(false);
            });
        };

        hydrateAuth();

        // Listen for auth state changes from background script
        const handleMessage = (message: any) => {
            if (message.type === 'AUTH_STATE_CHANGED') {
                setCookieAuth(message.isAuthenticated);
            }
        };

        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener(handleMessage);
            const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
                if (areaName !== 'local') return;
                if (
                    changes.isAuthenticated ||
                    changes.firebaseIdToken ||
                    changes.authToken ||
                    changes.uid
                ) {
                    chrome.storage.local.get(['isAuthenticated', 'firebaseIdToken', 'authToken', 'uid'], (stored) => {
                        setCookieAuth(stored.isAuthenticated === true && !!stored.uid && !!(stored.firebaseIdToken || stored.authToken));
                        setIsLoading(false);
                    });
                }
            };
            chrome.storage.onChanged.addListener(handleStorageChange);
            return () => {
                chrome.runtime.onMessage.removeListener(handleMessage);
                chrome.storage.onChanged.removeListener(handleStorageChange);
            };
        }
    }, []);

    // Determine if user is authenticated (Firebase Auth OR cookie-based)
    const isAuthenticated = currentUser || cookieAuth === true;
    const stillLoading = (authLoading && cookieAuth === null) || isLoading;

    // Loading state
    if (stillLoading) {
        return (
            <div className="min-h-[520px] w-[380px] bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // If not authenticated, show Login screen
    if (!isAuthenticated) {
        return (
            <div className={`min-h-[520px] w-[380px] ${theme === 'dark' ? 'dark' : ''}`}>
                <div className="bg-white min-h-[520px] text-gray-900">
                    <ExtensionLogin />
                </div>
            </div>
        );
    }

    // Authenticated View: Show Home Dashboard
    return (
        <div className={`min-h-[520px] w-[380px] ${theme === 'dark' ? 'dark' : ''}`}>
            <div className="bg-gray-50 min-h-[520px] text-gray-900">
                <ExtensionHome />
            </div>
        </div>
    );
};

export default ExtensionLayout;
