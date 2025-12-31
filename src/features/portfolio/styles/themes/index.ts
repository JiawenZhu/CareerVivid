import { LinkTreeTheme } from './types';
import { CREATIVE_THEMES } from './creative';
import { STANDARD_THEMES } from './standard';
import { SEASONAL_THEMES } from './seasonal';
import { PREMIUM_THEMES } from './premium';
import { GAME_THEMES } from './games';

export * from './types';

export const LINKTREE_THEMES: Record<string, LinkTreeTheme> = {
    ...CREATIVE_THEMES,
    ...STANDARD_THEMES,
    ...SEASONAL_THEMES,
    ...PREMIUM_THEMES,
    ...GAME_THEMES,
};

export const getTheme = (themeId?: string): LinkTreeTheme => {
    return LINKTREE_THEMES[themeId || 'air'] || LINKTREE_THEMES['air'];
};
