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
        ? 'text-amber-500'
        : 'text-slate-300 dark:text-slate-600';

    if (variant === 'collapsed') {
        return (
            <button
                type="button"
                onClick={onClick}
                title={`Level ${levelInfo.level} · ${streakCount}-day streak`}
                aria-label={`Level ${levelInfo.level}, ${streakCount} day streak`}
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white/75 text-[11px] font-extrabold text-indigo-700 shadow-sm transition hover:border-stone-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:text-indigo-300 dark:hover:border-slate-700"
            >
                <span className="flex items-center gap-0.5">
                    <Zap size={11} className="shrink-0" />
                    {levelInfo.level}
                </span>
                {streakCount > 0 && (
                    <span className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-stone-200 bg-white text-[8px] font-bold dark:border-slate-700 dark:bg-slate-900 ${flameTone}`}>
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
            className="mb-2 w-full rounded-2xl border border-stone-200/80 bg-white/65 px-3 py-2 text-left shadow-sm transition hover:border-stone-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
        >
            <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        <Zap size={11} />
                    </span>
                    Level {levelInfo.level}
                </span>
                <span className={`flex items-center gap-1 text-[11px] font-extrabold ${flameTone}`} title={isStreakActiveToday ? 'Streak active today' : 'Practice today to keep your streak'}>
                    <Flame size={13} className={isStreakActiveToday ? 'fill-amber-400/60' : ''} />
                    {streakCount}
                </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-200/80 dark:bg-slate-800">
                <div
                    className="h-full rounded-full bg-indigo-500 transition-[width] duration-500 dark:bg-indigo-400"
                    style={{ width: `${Math.max(levelInfo.progress * 100, 2)}%` }}
                />
            </div>
            <p className="mt-1 text-[10px] font-semibold tabular-nums text-slate-400 dark:text-slate-500">
                {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP to level {levelInfo.level + 1}
            </p>
        </button>
    );
};

export default XpStatusCard;
