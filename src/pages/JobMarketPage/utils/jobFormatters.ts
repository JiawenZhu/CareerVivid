import { Timestamp } from 'firebase/firestore';

export const formatSalary = (min?: number, max?: number, currency?: string): string => {
    if (!min && !max) return 'Competitive';
    const curr = currency || '$';
    if (min && max) return `${curr}${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${curr}${min.toLocaleString()}+`;
    return 'Competitive';
};

export const getTimeAgo = (date: any): string => {
    if (!date) return 'Recently';
    const timestamp = date instanceof Timestamp ? date.toDate() : new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return 'Recently';
};
