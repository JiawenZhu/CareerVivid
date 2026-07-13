import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { CourseProgress } from '../types';

/**
 * Live map of the signed-in user's progress across ALL courses
 * (users/{uid}/courseProgress/*), keyed by course id. Lets list pages show
 * per-course lesson completion without one subscription per course.
 */
export const useAllCourseProgress = (): { progressByCourse: Record<string, CourseProgress>; isLoading: boolean } => {
  const { currentUser } = useAuth();
  const [progressByCourse, setProgressByCourse] = useState<Record<string, CourseProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setProgressByCourse({});
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, 'users', currentUser.uid, 'courseProgress'),
      (snap) => {
        const next: Record<string, CourseProgress> = {};
        snap.forEach((doc) => { next[doc.id] = doc.data() as CourseProgress; });
        setProgressByCourse(next);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to subscribe to course progress map:', error);
        setIsLoading(false);
      },
    );
    return unsubscribe;
  }, [currentUser]);

  return { progressByCourse, isLoading };
};
