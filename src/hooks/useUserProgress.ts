import { useEffect, useMemo, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { UserProgress } from '../types';
import { initialProgress, levelInfoFromXp, LevelInfo, localDayString } from '../lib/gamification';
import { progressSummaryRef } from '../services/progressService';

export interface UseUserProgressResult {
  progress: UserProgress;
  levelInfo: LevelInfo;
  /** True while the first snapshot is loading. */
  isLoading: boolean;
  /** True when the user has qualifying activity today (streak flame is "lit"). */
  isStreakActiveToday: boolean;
}

/**
 * Live subscription to the signed-in user's gamification progress.
 * Returns zeroed progress for signed-out users.
 */
export const useUserProgress = (): UseUserProgressResult => {
  const { currentUser } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setProgress(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = onSnapshot(
      progressSummaryRef(currentUser.uid),
      (snap) => {
        setProgress(snap.exists() ? (snap.data() as UserProgress) : null);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to subscribe to user progress:', error);
        setIsLoading(false);
      },
    );
    return unsubscribe;
  }, [currentUser]);

  const resolved = progress ?? initialProgress();

  const levelInfo = useMemo(() => levelInfoFromXp(resolved.xp), [resolved.xp]);

  const isStreakActiveToday = resolved.streak.lastActiveDay === localDayString();

  return { progress: resolved, levelInfo, isLoading, isStreakActiveToday };
};
