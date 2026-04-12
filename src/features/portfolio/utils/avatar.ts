import { PortfolioHero } from '../types/portfolio';

export const getAvatarSizeClasses = (size?: string) => {
    switch (size) {
        case 'sm': return 'w-12 h-12';
        case 'md': return 'w-16 h-16';
        case 'lg': return 'w-24 h-24';
        case 'xl': return 'w-32 h-32';
        default: return 'w-20 h-20'; // Base fallback
    }
};

export const getAvatarShapeClasses = (shape?: string) => {
    switch (shape) {
        case 'square': return 'rounded-none';
        case 'rounded': return 'rounded-2xl';
        case 'circle':
        default: return 'rounded-full'; // Default
    }
};

export const getAvatarPositionClasses = (position?: string) => {
    switch (position) {
        case 'center': return 'mx-auto';
        case 'right': return 'ml-auto';
        case 'left':
        default: return 'mr-auto'; // Default
    }
};

export const getAvatarWrapperAlignment = (position?: string) => {
    switch (position) {
        case 'center': return 'justify-center';
        case 'right': return 'justify-end';
        case 'left':
        default: return 'justify-start'; // Default
    }
}

export const getAvatarFlexOrder = (position?: string) => {
    switch (position) {
        case 'right': return 'order-last mr-0 ml-3';
        case 'left':
        case 'center':
        default: return 'order-first mr-3 ml-0'; // Default
    }
}
