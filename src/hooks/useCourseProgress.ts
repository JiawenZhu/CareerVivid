import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { CourseProgress } from '../types';
import { awardXp } from '../services/progressService';

export interface UseCourseProgressResult {
  progress: CourseProgress | null;
  isLoading: boolean;
  /** Mark an item (module or exercise) complete; awards lesson_completed XP once. */
  complete: (itemId: string, xp?: number) => Promise<void>;
}

/** Firestore doc ids can't contain '/'; keep course ids conservative. */
const sanitize = (id: string) => id.replace(/[^\w.-]/g, '_').slice(0, 200);

const courseProgressRef = (uid: string, courseId: string) =>
  doc(db, 'users', uid, 'courseProgress', sanitize(courseId));

/**
 * Live subscription to the signed-in user's progress through one course
 * (AI-agent curriculum, an interactive coding course, etc.). Each course keeps
 * its own progress doc, so completion counts and XP don't bleed across courses.
 *
 * @param courseId  Stable id for this course (doc key under courseProgress).
 * @param totalCount Number of items in the course, to detect full completion.
 */
export const useCourseProgress = (courseId: string, totalCount: number): UseCourseProgressResult => {
  const { currentUser } = useAuth();
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setProgress(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = onSnapshot(
      courseProgressRef(currentUser.uid, courseId),
      (snap) => {
        setProgress(snap.exists() ? (snap.data() as CourseProgress) : null);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to subscribe to course progress:', error);
        setIsLoading(false);
      },
    );
    return unsubscribe;
  }, [currentUser, courseId]);

  const complete = useCallback(async (itemId: string, xp?: number) => {
    if (!currentUser) throw new Error('Not signed in');

    const now = Date.now();
    const prevCompleted = progress?.completedModuleIds ?? [];
    if (prevCompleted.includes(itemId)) return;

    const completedModuleIds = [...prevCompleted, itemId];
    const courseCompleted = totalCount > 0 && completedModuleIds.length >= totalCount;

    const next: CourseProgress = {
      completedModuleIds,
      startedAt: progress?.startedAt ?? now,
      completedAt: progress?.completedAt ?? (courseCompleted ? now : null),
      updatedAt: now,
    };

    await setDoc(courseProgressRef(currentUser.uid, courseId), next, { merge: true });

    // XP awards are idempotent per course+item via dedupe ids, and must not
    // break progress persistence if they fail.
    void awardXp(currentUser.uid, {
      type: 'lesson_completed',
      dedupeId: `course_${sanitize(courseId)}_${sanitize(itemId)}`,
      ...(xp !== undefined ? { xp } : {}),
      meta: { courseId, itemId },
    }).catch((error) => console.error('Failed to award course XP:', error));
  }, [currentUser, progress, courseId, totalCount]);

  return { progress, isLoading, complete };
};
