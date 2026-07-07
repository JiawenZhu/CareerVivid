/** Props every course widget receives from the lesson page. */
export interface CourseWidgetProps {
  /** True when the learner already completed this lesson. */
  completed: boolean;
  /** Call once when the learner has genuinely finished the interaction. */
  onComplete: () => void;
}
