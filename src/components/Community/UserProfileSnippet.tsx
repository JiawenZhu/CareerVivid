import React from 'react';
import { navigate } from '../../utils/navigation';
import { useUserCache } from '../../hooks/useUserCache';
import ProfileSkeleton from './ProfileSkeleton';

interface UserProfileSnippetProps {
    userId: string;
    fallbackName?: string;
    fallbackAvatar?: string;
    fallbackRole?: string;
    timestamp?: string;
    showTypeBadge?: boolean;
    typeBadgeLabel?: string;
    typeBadgeClass?: string;
    size?: 'sm' | 'md';
    className?: string;
}

const UserProfileSnippet: React.FC<UserProfileSnippetProps> = ({
    userId,
    fallbackName,
    fallbackAvatar,
    fallbackRole,
    timestamp,
    showTypeBadge,
    typeBadgeLabel,
    typeBadgeClass,
    size = 'md',
    className = '',
}) => {
    const { user, isLoading } = useUserCache(userId);

    if (isLoading && !user) {
        return <ProfileSkeleton />;
    }

    // Use cached data if available, otherwise use initial props from post snapshot
    const displayName = user?.displayName || fallbackName || 'Community Member';
    const avatar = user?.photoURL || user?.avatarUrl || fallbackAvatar || '';
    const headline = user?.headline || fallbackRole || '';

    const avatarSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
    const nameSize = size === 'sm' ? 'text-sm' : 'text-sm font-semibold';
    const metaSize = 'text-xs';

    const handleProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/portfolio/${userId}`);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <button
                onClick={handleProfileClick}
                className="shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer"
                aria-label={`View ${displayName}'s profile`}
            >
                {avatar ? (
                    <img
                        src={avatar}
                        alt={displayName}
                        loading="lazy"
                        decoding="async"
                        className={`${avatarSize} rounded-full object-cover border border-gray-100 dark:border-gray-700 hover:opacity-80 transition-opacity`}
                    />
                ) : (
                    <div className={`${avatarSize} rounded-full bg-gradient-to-tr from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
                        {getInitials(displayName) || '?'}
                    </div>
                )}
            </button>

            <div className="min-w-0">
                <button
                    onClick={handleProfileClick}
                    className={`${nameSize} text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-left cursor-pointer truncate block`}
                >
                    {displayName}
                </button>
                <p className={`${metaSize} text-gray-500 dark:text-gray-400 truncate`}>
                    {headline && <span>{headline} · </span>}
                    {timestamp}
                </p>
            </div>

            {showTypeBadge && typeBadgeLabel && (
                <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${typeBadgeClass}`}>
                    {typeBadgeLabel}
                </span>
            )}
        </div>
    );
};

export default UserProfileSnippet;
