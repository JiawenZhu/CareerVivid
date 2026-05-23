export const getAppUrl = (path: string = ''): string => {
    const baseUrl = 'https://careervivid.app';
    // Clean path formatting (make sure it starts with /)
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${formattedPath}`;
};
