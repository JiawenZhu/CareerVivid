import { PortfolioData } from '../types/portfolio';
import { getTheme } from '../styles/linktreeThemes';

export interface ExtractedTheme {
    primaryColor: string;
    secondaryColor?: string;
    textColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
    // From link-in-bio specific
    buttonColor?: string;
    buttonTextColor?: string;
    profileTitleColor?: string;
    profileTextColor?: string;
    themeSource?: string; // Name of the source theme for reference
}

/**
 * Helper to remove undefined properties from an object recursively
 * Firestore does not accept undefined values
 */
const cleanObject = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(cleanObject);
    }

    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value !== undefined) {
            cleaned[key] = cleanObject(value);
        }
    });
    return cleaned;
};

/**
 * Extract theme settings from a portfolio (typically a link-in-bio portfolio)
 */
export const extractThemeFromPortfolio = (portfolio: PortfolioData): ExtractedTheme => {
    const extracted: ExtractedTheme = cleanObject({
        primaryColor: portfolio.theme.primaryColor,
        secondaryColor: portfolio.theme.secondaryColor,
        textColor: portfolio.theme.textColor,
        backgroundColor: portfolio.theme.backgroundColor,
        fontFamily: portfolio.theme.fontFamily,
    });

    // If it's a link-in-bio portfolio, extract additional theme info
    if (portfolio.mode === 'linkinbio' && portfolio.linkInBio) {
        const linkInBio = portfolio.linkInBio;

        // Get the base theme if there's a themeId
        if (linkInBio.themeId) {
            const baseTheme = getTheme(linkInBio.themeId);
            if (baseTheme) {
                extracted.themeSource = baseTheme.name;

                // Use base theme colors as fallbacks
                if (!extracted.primaryColor) {
                    extracted.primaryColor = baseTheme.colors.accent;
                }
                if (!extracted.backgroundColor) {
                    extracted.backgroundColor = baseTheme.colors.background;
                }
                if (!extracted.textColor) {
                    extracted.textColor = baseTheme.colors.text;
                }
            }
        }

        // Extract custom style overrides
        if (linkInBio.customStyle) {
            const customStyle = linkInBio.customStyle;

            if (customStyle.buttonColor) {
                extracted.buttonColor = customStyle.buttonColor;
            }
            if (customStyle.buttonTextColor) {
                extracted.buttonTextColor = customStyle.buttonTextColor;
            }
            if (customStyle.profileTitleColor) {
                extracted.profileTitleColor = customStyle.profileTitleColor;
            }
            if (customStyle.profileTextColor) {
                extracted.profileTextColor = customStyle.profileTextColor;
            }
            if (customStyle.fontFamily) {
                extracted.fontFamily = customStyle.fontFamily;
            }
            if (customStyle.profileFontFamily) {
                // Prefer profile font if available
                extracted.fontFamily = customStyle.profileFontFamily;
            }
            if (customStyle.backgroundOverride) {
                // For business cards, we'll try to extract a solid color if it's a color
                const bg = customStyle.backgroundOverride;
                if (bg && !bg.includes('gradient') && !bg.includes('url(')) {
                    extracted.backgroundColor = bg;
                }
            }
        }
    }

    return extracted;
};

/**
 * Apply extracted theme to a business card portfolio data
 */
export const applyThemeToBusinessCard = (
    currentData: PortfolioData,
    theme: ExtractedTheme
): Partial<PortfolioData> => {
    // Build theme object update
    const themeUpdates: any = {
        ...currentData.theme,
    };

    if (theme.primaryColor) {
        themeUpdates.primaryColor = theme.primaryColor;
    }
    if (theme.secondaryColor) {
        themeUpdates.secondaryColor = theme.secondaryColor;
    }
    if (theme.textColor) {
        themeUpdates.textColor = theme.textColor;
    }
    if (theme.backgroundColor) {
        themeUpdates.backgroundColor = theme.backgroundColor;
    }
    if (theme.fontFamily) {
        themeUpdates.fontFamily = theme.fontFamily;
    }

    const updates: Partial<PortfolioData> = {
        theme: cleanObject(themeUpdates),
    };

    // If we have a business card configuration, update it with theme info
    if (currentData.businessCard) {
        updates.businessCard = cleanObject({
            ...currentData.businessCard,
            themeId: theme.themeSource, // Store reference to source theme
        });
    }

    return updates;
};

/**
 * Get a user-friendly summary of extracted theme
 */
export const getThemeSummary = (theme: ExtractedTheme): string => {
    const parts: string[] = [];

    if (theme.themeSource) {
        parts.push(`Theme: ${theme.themeSource}`);
    }

    if (theme.primaryColor) {
        parts.push(`Primary: ${theme.primaryColor}`);
    }

    if (theme.fontFamily) {
        parts.push(`Font: ${theme.fontFamily.split(',')[0].replace(/['"]/g, '')}`);
    }

    return parts.join(' • ');
};
