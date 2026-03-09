/**
 * Utility to map composite workspace IDs (e.g., 'resume-123', 'post-456')
 * to their actual application routes.
 */
export const getPathForNodeId = (id: string | number, type?: string): string => {
    const idStr = id.toString();

    // If it's already a full path, return it
    if (idStr.startsWith('/')) return idStr;

    // Handle composite IDs
    if (idStr.startsWith('resume-')) {
        return `/edit/${idStr.replace('resume-', '')}`;
    }
    if (idStr.startsWith('portfolio-')) {
        return `/portfolio/${idStr.replace('portfolio-', '')}`;
    }
    if (idStr.startsWith('whiteboard-')) {
        return `/whiteboard/${idStr.replace('whiteboard-', '')}`;
    }
    if (idStr.startsWith('post-')) {
        return `/community/post/${idStr.replace('post-', '')}`;
    }
    if (idStr.startsWith('interview-')) {
        // Assuming interview history leads to a report or studio
        return `/dashboard`; // Or a specific report page if one exists
    }

    // Default for custom folders
    if (type === 'custom-folder') {
        return `/folder/${idStr}`;
    }

    return idStr;
};
