export const getAppUrl = (path: string = ''): string => {
    const baseUrl = 'https://careervivid.app';
    // Clean path formatting (make sure it starts with /)
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${formattedPath}`;
};

export const getResumeBuilderUrl = (): string => {
    return getAppUrl('/newresume?scrollTo=create-section');
};

export const isCareerVividAppUrl = (url?: string | null): boolean => {
    if (!url) return false;

    try {
        const parsed = new URL(url);
        return parsed.hostname === 'careervivid.app' ||
            parsed.hostname.endsWith('.careervivid.app') ||
            (import.meta.env.DEV && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'));
    } catch {
        return false;
    }
};
