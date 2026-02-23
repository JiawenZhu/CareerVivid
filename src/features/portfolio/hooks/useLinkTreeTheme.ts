
import { useMemo } from 'react';
import { getTheme, LinkTreeTheme } from '../styles/linktreeThemes';

export const useLinkTreeTheme = (themeId?: string): LinkTreeTheme => {
    const theme = useMemo(() => {
        return getTheme(themeId);
    }, [themeId]);

    return theme;
};
