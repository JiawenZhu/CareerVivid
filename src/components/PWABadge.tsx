/// <reference types="vite-plugin-pwa/client" />
import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Info } from 'lucide-react';

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

    const [isAnimating, setIsAnimating] = useState(false);

    const close = () => {
        setNeedRefresh(false);
    };

    const handleUpdate = () => {
        setIsAnimating(true);
        // Small delay to show animation before reload
        setTimeout(() => {
            updateServiceWorker(true);
            
            // Safety fallback: if the page hasn't reloaded in 2 seconds, force reload
            // This handles cases where controllerchange doesn't fire as expected
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }, 300);
    };

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] animate-bounce-in">
            <div className="bg-white dark:bg-gray-900 shadow-2xl border border-primary-100 dark:border-primary-900/30 rounded-2xl p-5 max-w-sm flex items-start gap-4 transition-all hover:scale-[1.02] active:scale-95" role="alert">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <RefreshCw className={`w-5 h-5 ${isAnimating ? 'animate-spin' : ''}`} />
                </div>
                
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Update Available</h3>
                        <button 
                            onClick={close}
                            className="p-1 -mr-2 -mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        A new version of CareerVivid is ready with performance improvements and new features.
                    </p>
                    <div className="mt-4 flex gap-3">
                        <button
                            id="pwa-update-button"
                            onClick={handleUpdate}
                            className="flex-1 flex items-center justify-center gap-2 text-white bg-primary-600 hover:bg-primary-700 font-bold rounded-xl text-sm px-4 py-2.5 transition-all shadow-lg shadow-primary-500/25 active:scale-95 disabled:opacity-50"
                            disabled={isAnimating}
                        >
                            <RefreshCw className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} />
                            <span>Update Now</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
