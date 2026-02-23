// Chrome Extension Storage Wrapper
// Provides async/await API for chrome.storage

export const extensionStorage = {
    /**
     * Get value from extension storage
     */
    async get<T>(key: string): Promise<T | null> {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get([key], (result) => {
                    resolve(result[key] ?? null);
                });
            } else {
                // Fallback to localStorage for development
                const value = localStorage.getItem(`cv_ext_${key}`);
                resolve(value ? JSON.parse(value) : null);
            }
        });
    },

    /**
     * Set value in extension storage
     */
    async set(key: string, value: any): Promise<void> {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.set({ [key]: value }, resolve);
            } else {
                localStorage.setItem(`cv_ext_${key}`, JSON.stringify(value));
                resolve();
            }
        });
    },

    /**
     * Remove value from extension storage
     */
    async remove(key: string): Promise<void> {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.remove(key, resolve);
            } else {
                localStorage.removeItem(`cv_ext_${key}`);
                resolve();
            }
        });
    },

    /**
     * Get all storage data
     */
    async getAll(): Promise<Record<string, any>> {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get(null, resolve);
            } else {
                const data: Record<string, any> = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key?.startsWith('cv_ext_')) {
                        data[key.replace('cv_ext_', '')] = JSON.parse(localStorage.getItem(key) || 'null');
                    }
                }
                resolve(data);
            }
        });
    },

    /**
     * Clear all extension storage
     */
    async clear(): Promise<void> {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.clear(resolve);
            } else {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key?.startsWith('cv_ext_')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
                resolve();
            }
        });
    }
};

/**
 * Detect if running in Chrome Extension context
 */
export function isExtensionContext(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
}

/**
 * Send message to background script
 */
export async function sendToBackground<T>(message: any): Promise<T> {
    return new Promise((resolve, reject) => {
        if (!isExtensionContext()) {
            reject(new Error('Not in extension context'));
            return;
        }
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}
