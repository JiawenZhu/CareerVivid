export const getAppUrl = (path: string = ''): string => {
    let baseUrl = 'https://careervivid.app';
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        try {
            const manifest = chrome.runtime.getManifest();
            // In unpacked development mode, manifest.update_url is undefined
            const isDevelopment = !manifest.update_url;
            if (isDevelopment) {
                baseUrl = 'http://localhost:3001';
            }
        } catch (_) {}
    }
    // Clean path formatting (make sure it starts with /)
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${formattedPath}`;
};
