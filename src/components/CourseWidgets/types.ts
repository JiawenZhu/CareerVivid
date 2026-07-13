import type { InteractiveChapter, InteractiveCourse, InteractiveExercise } from '../../types/course';

/** Props every course widget receives from the lesson page. */
export interface CourseWidgetProps {
  /** True when the learner already completed this lesson. */
  completed: boolean;
  /** Call once when the learner has genuinely finished the interaction. */
  onComplete: () => void;
  /** Optional lesson context for widgets that have a course-owned practice handoff. */
  course?: InteractiveCourse;
  chapter?: InteractiveChapter;
  exercise?: InteractiveExercise;
  /** Completed lesson ids from the current course; widgets must not persist them. */
  completedExerciseIds?: string[];
}
