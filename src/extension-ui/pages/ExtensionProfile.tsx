import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ExtensionProfile: React.FC = () => {
    const { logOut } = useAuth();

    const handleSignOut = () => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.remove(
                [
                    'devModeAuth',
                    'isAuthenticated',
                    'autofillProfile',
                    'selectedResumeId',
                    'firebaseIdToken',
                    'firebaseRefreshToken',
                    'tokenExpirationTime',
                    'firebaseApiKey',
                    'uid',
                ],
                () => {
                    if (chrome.runtime && chrome.runtime.sendMessage) {
                        chrome.runtime.sendMessage({ type: 'AUTH_STATE_CHANGED', isAuthenticated: false }, () => {
                            const _ = chrome.runtime.lastError;
                        });
                    }
                    logOut();
                }
            );
        } else {
            logOut();
        }
    };

    return (
        <div className="p-4 flex flex-col items-center justify-center h-[500px] text-center text-gray-500">
            <User size={48} className="mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">Profile</h3>
            <p className="text-sm mt-2">Manage your account settings.</p>
            <button
                onClick={handleSignOut}
                className="mt-6 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
            >
                Sign Out
            </button>
        </div>
    );
};

export default ExtensionProfile;
