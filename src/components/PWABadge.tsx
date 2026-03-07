/// <reference types="vite-plugin-pwa/client" />
import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PWABadge() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered:', r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setNeedRefresh(false);
    };

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-w-sm flex items-start gap-4" role="alert">
                <div className="text-gray-900 dark:text-gray-100 mt-1">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Update Available</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        A new version of CareerVivid is ready.
                    </p>
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={() => updateServiceWorker(true)}
                            className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-md text-xs px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        >
                            Update Details
                        </button>
                        <button
                            onClick={() => close()}
                            className="text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 font-medium rounded-md text-xs px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
