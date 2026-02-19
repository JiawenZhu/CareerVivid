/// <reference types="chrome" />
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ExtensionLogin from '../pages/ExtensionLogin';
import ExtensionHome from '../pages/ExtensionHome';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURATION: Update these if your web app uses different cookie names
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AUTH_COOKIE_NAMES = ['__session', 'session', 'token'] as const;
const AUTH_DOMAIN = 'https://careervivid.app';

const ExtensionLayout: React.FC = () => {
    const { currentUser, loading: authLoading } = useAuth();
    const { theme } = useTheme();
    const [cookieAuth, setCookieAuth] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // COOKIE-FIRST CHECK: Runs immediately to avoid "Sign In" flash
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    useEffect(() => {
        const checkCookieAuth = () => {
            if (typeof chrome === 'undefined' || !chrome.cookies) {
                // Not in extension context, rely on Firebase Auth only
                setIsLoading(false);
                return;
            }

            // Check each cookie name in priority order
            let checkedCount = 0;
            const totalCookies = AUTH_COOKIE_NAMES.length;

            AUTH_COOKIE_NAMES.forEach((cookieName) => {
                chrome.cookies.get({ url: AUTH_DOMAIN, name: cookieName }, (cookie) => {
                    checkedCount++;

                    if (cookie && cookieAuth !== true) {
                        // Found a valid auth cookie - user is logged in!
                        setCookieAuth(true);
                        setIsLoading(false);
                        return;
                    }

                    // All cookies checked, none found
                    if (checkedCount === totalCookies && cookieAuth === null) {
                        setCookieAuth(false);
                        setIsLoading(false);
                    }
                });
            });
        };

        checkCookieAuth();

        // Listen for auth state changes from background script
        const handleMessage = (message: any) => {
            if (message.type === 'AUTH_STATE_CHANGED') {
                setCookieAuth(message.isAuthenticated);
            }
        };

        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener(handleMessage);
            return () => chrome.runtime.onMessage.removeListener(handleMessage);
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
