import React from 'react';
import { Flame, Zap } from 'lucide-react';
import { useUserProgress } from '../../hooks/useUserProgress';

interface XpStatusCardProps {
    variant?: 'expanded' | 'collapsed';
    onClick?: () => void;
}

/**
 * Sidebar gamification status: level, XP progress toward next level,
 * and the daily streak flame.
 */
const XpStatusCard: React.FC<XpStatusCardProps> = ({ variant = 'expanded', onClick }) => {
    const { progress, levelInfo, isLoading, isStreakActiveToday } = useUserProgress();

    if (isLoading) return null;

    const streakCount = progress.streak.current;
    const flameTone = isStreakActiveToday
        ? 'text-[#d97706]'
        : 'text-gray-300 dark:text-gray-600';

    if (variant === 'collapsed') {
        return (
            <button
                type="button"
                onClick={onClick}
                title={`Level ${levelInfo.level} · ${streakCount}-day streak`}
                aria-label={`Level ${levelInfo.level}, ${streakCount} day streak`}
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#dfe2ff] bg-[#fbfbff] text-[11px] font-extrabold text-[#625bd5] shadow-sm transition hover:border-[#c9ccff] hover:bg-[#f3f2ff] dark:border-[#625bd5]/40 dark:bg-[#252244]/70 dark:text-[#c9ccff] dark:hover:border-[#8d88e6]"
            >
                <span className="flex items-center gap-0.5">
                    <Zap size={11} className="shrink-0" />
                    {levelInfo.level}
                </span>
                {streakCount > 0 && (
                    <span className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-gray-200 bg-white px-1 text-[8px] font-bold dark:border-gray-700 dark:bg-gray-900 ${flameTone}`}>
                        {streakCount}
                    </span>
                )}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={`Level ${levelInfo.level}, ${levelInfo.currentLevelXp} of ${levelInfo.nextLevelXp} XP, ${streakCount} day streak`}
            className="mb-2 w-full rounded-xl border border-[#dfe2ff] bg-[#fbfbff] px-3 py-2 text-left shadow-sm transition hover:border-[#c9ccff] hover:bg-[#f3f2ff] hover:shadow-[0_8px_24px_rgba(98,91,213,0.06)] dark:border-[#625bd5]/40 dark:bg-[#252244]/70 dark:hover:border-[#8d88e6]"
        >
            <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-gray-900 dark:text-gray-100">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#eef0ff] text-[#625bd5] ring-1 ring-[#dfe2ff] dark:bg-[#312d6b]/50 dark:text-[#b8b4ff] dark:ring-[#625bd5]/40">
                        <Zap size={11} />
                    </span>
                    Level {levelInfo.level}
                </span>
                <span className={`flex items-center gap-1 text-[11px] font-extrabold ${flameTone}`} title={isStreakActiveToday ? 'Streak active today' : 'Practice today to keep your streak'}>
                    <Flame size={13} className={isStreakActiveToday ? 'fill-amber-400/60' : ''} />
                    {streakCount}
                </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#ececff] dark:bg-gray-800">
                <div
                    className="h-full rounded-full bg-[#a9a5f5] transition-[width] duration-500 dark:bg-[#9b96ef]"
                    style={{ width: `${Math.max(levelInfo.progress * 100, 2)}%` }}
                />
            </div>
            <p className="mt-1 text-[10px] font-semibold tabular-nums text-gray-400 dark:text-gray-500">
                {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP to level {levelInfo.level + 1}
            </p>
        </button>
    );
};

export default XpStatusCard;
