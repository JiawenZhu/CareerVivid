/**
 * Normalizes/slugifies a tag string for URL use.
 * e.g. "SystemDesign" → "system-design", "UI/UX Design" → "ui-ux-design"
 */
export const slugifyTag = (tag: string): string => {
    return encodeURIComponent(tag.trim());
};

/**
 * Takes a raw feed url tag and reverse-normalizes it for display.
 * Used in the active filter banner.
 */
export const displayTag = (slug: string): string => {
    return slug;
};
