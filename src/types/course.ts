/**
 * Canonical course schema for CareerVivid.
 *
 * Design goals:
 * 1. Data-driven — course content lives in `data/courses/*.json`, one file per
 *    course. Adding a course means dropping in a JSON file; no code changes.
 * 2. Firestore-ready — every shape is plain JSON (no classes, no Dates, no
 *    arrays directly nested inside arrays), so the same documents can later be
 *    pushed to a `courses/{courseId}` collection unchanged.
 * 3. Extensible — new lesson kinds and check types are added by extending the
 *    unions below; existing content stays valid because unknown optional
 *    fields are ignored by the loader.
 *
 * Versioning: bump `COURSE_SCHEMA_VERSION` when making a breaking change to
 * the shape, and handle old versions in the loader.
 */

export const COURSE_SCHEMA_VERSION = 1;

export type LessonLanguage = 'javascript' | 'python';

export type CourseCategory =
  | 'Web Development'
  | 'Computer Science'
  | 'AI'
  | 'Data Science'
  | 'Game Development';

export type CourseDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

/** Lifecycle for a course. Only `published` courses are shown to users. */
export type CourseStatus = 'draft' | 'published' | 'archived';

/**
 * How a lesson is completed/graded. Add new members here for future lesson
 * kinds and handle them in the lesson page / `evaluateCheck`.
 */
export type LessonCheck =
  | { type: 'run' }
  | { type: 'output'; expected: string; match?: 'exact' | 'includes' }
  | { type: 'tests'; functionName: string; tests: { input: unknown[]; expected: unknown }[] }
  | { type: 'diagram'; passThreshold: number }
  /** Reading/video lessons: completed by an explicit "mark as done" action. */
  | { type: 'read' }
  /** Quiz lessons: pass when at least `minCorrect` answers are right (default: all). */
  | { type: 'quiz'; minCorrect?: number }
  /** Interactive-widget lessons: the widget itself signals completion. */
  | { type: 'widget' };

export interface WhiteboardBrief {
  requirements: string[];
}

/** One multiple-choice question inside a quiz lesson. */
export interface QuizQuestion {
  id: string;
  /** Markdown prompt. */
  prompt: string;
  options: string[];
  correctIndex: number;
  /** Shown after the learner answers, right or wrong. */
  explanation?: string;
}

/**
 * What kind of workspace a lesson opens:
 * - `code`        split view with the in-browser code runner (default)
 * - `whiteboard`  Excalidraw drawing graded by element count / AI
 * - `reading`     full-width illustrated markdown page
 * - `video`       embedded video + notes
 * - `quiz`        multiple-choice knowledge check
 * - `interactive` an animated widget from the course-widget registry
 */
export type LessonKind = 'code' | 'whiteboard' | 'reading' | 'video' | 'quiz' | 'interactive';

/**
 * A single lesson (exercise) inside a chapter.
 * `kind` decides which workspace the UI opens; defaults to 'code'.
 */
export interface InteractiveExercise {
  id: string;
  title: string;
  xp: number;
  kind?: LessonKind;
  /** Required for code lessons; ignored by other kinds. */
  language?: LessonLanguage;
  /** Markdown body shown in the lesson pane. */
  content: string;
  starterCode?: string;
  whiteboardBrief?: WhiteboardBrief;
  /** Video lessons: an embeddable URL (YouTube watch/short links are converted). */
  videoUrl?: string;
  /** Quiz lessons: the questions. */
  quiz?: QuizQuestion[];
  /** Interactive lessons: id of a component in the course-widget registry. */
  widgetId?: string;
  /** Attribution line rendered under sourced content (license requirement). */
  attribution?: string;
  check: LessonCheck;
  hint?: string;
  solutionCode?: string;
  walkthroughVideoUrl?: string;
}

export interface InteractiveChapter {
  id: string;
  title: string;
  exercises: InteractiveExercise[];
}

/**
 * One course document. This is the exact shape of each
 * `data/courses/*.json` file, and the intended Firestore document shape.
 */
export interface CourseDefinition {
  /** Schema version this document was written against. */
  schemaVersion: number;
  /** Stable unique id; doubles as the route param and progress doc key. */
  id: string;
  /**
   * Which top-level course (track) this module belongs to.
   * 'ai-agent' (default when omitted) = the AI Agent Builder Curriculum;
   * 'coding-patterns' = the Coding Interview Patterns course.
   */
  track?: string;
  /** Sort position within its track (ascending). */
  order: number;
  title: string;
  language: LessonLanguage;
  category: CourseCategory;
  difficulty: CourseDifficulty;
  tagline: string;
  description: string;
  status: CourseStatus;
  /** Free-form labels for filtering ("agents", "rag", "security", ...). */
  tags?: string[];
  /** Rough time to complete, for catalog display. */
  estimatedMinutes?: number;
  /** Ids into data/learning/sources.json for attribution. */
  sourceIds?: string[];
  chapters: InteractiveChapter[];
}

/**
 * Runtime course shape used by pages/hooks — a published CourseDefinition.
 * Kept as its own name so UI code doesn't depend on authoring-only fields.
 */
export type InteractiveCourse = CourseDefinition;

/** Progress doc stored at users/{uid}/courseProgress/{courseId}. */
export interface CourseProgressDoc {
  completedModuleIds: string[];
  startedAt: number;
  completedAt: number | null;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

/**
 * Structural validation for a course JSON file. Returns a list of problems
 * (empty = valid). Intentionally lightweight — catches authoring mistakes,
 * not every possible type error.
 */
export const validateCourseDefinition = (course: CourseDefinition): string[] => {
  const errors: string[] = [];
  const at = (msg: string) => errors.push(`[${course?.id ?? 'unknown course'}] ${msg}`);

  if (course.schemaVersion !== COURSE_SCHEMA_VERSION) {
    at(`schemaVersion ${course.schemaVersion} != expected ${COURSE_SCHEMA_VERSION}`);
  }
  if (!isNonEmptyString(course.id)) at('missing id');
  if (!/^[\w.-]+$/.test(course.id ?? '')) at('id must be url/Firestore-safe ([\\w.-])');
  if (typeof course.order !== 'number') at('missing numeric order');
  if (!isNonEmptyString(course.title)) at('missing title');
  if (!isNonEmptyString(course.tagline)) at('missing tagline');
  if (!isNonEmptyString(course.description)) at('missing description');
  if (!Array.isArray(course.chapters) || course.chapters.length === 0) {
    at('must have at least one chapter');
    return errors;
  }

  const seenIds = new Set<string>();
  for (const chapter of course.chapters) {
    if (!isNonEmptyString(chapter.id)) at('chapter missing id');
    if (!Array.isArray(chapter.exercises) || chapter.exercises.length === 0) {
      at(`chapter ${chapter.id} has no exercises`);
      continue;
    }
    for (const exercise of chapter.exercises) {
      if (!isNonEmptyString(exercise.id)) at(`exercise in ${chapter.id} missing id`);
      if (seenIds.has(exercise.id)) at(`duplicate exercise id ${exercise.id}`);
      seenIds.add(exercise.id);
      if (!isNonEmptyString(exercise.title)) at(`exercise ${exercise.id} missing title`);
      if (typeof exercise.xp !== 'number') at(`exercise ${exercise.id} missing xp`);
      if (!isNonEmptyString(exercise.content)) at(`exercise ${exercise.id} missing content`);
      if (!exercise.check || !isNonEmptyString((exercise.check as { type?: string }).type)) {
        at(`exercise ${exercise.id} missing check`);
        continue;
      }
      const kind = exercise.kind ?? 'code';
      const expectCheck = (...allowed: string[]) => {
        if (!allowed.includes(exercise.check.type)) {
          at(`${kind} exercise ${exercise.id} has check type ${exercise.check.type}; expected ${allowed.join('/')}`);
        }
      };
      switch (kind) {
        case 'whiteboard':
          expectCheck('diagram');
          if (!exercise.whiteboardBrief?.requirements?.length) {
            at(`whiteboard exercise ${exercise.id} missing whiteboardBrief.requirements`);
          }
          break;
        case 'reading':
          expectCheck('read');
          break;
        case 'video':
          expectCheck('read');
          if (!isNonEmptyString(exercise.videoUrl)) at(`video exercise ${exercise.id} missing videoUrl`);
          break;
        case 'quiz': {
          expectCheck('quiz');
          if (!exercise.quiz?.length) at(`quiz exercise ${exercise.id} has no questions`);
          for (const q of exercise.quiz ?? []) {
            if (!isNonEmptyString(q.id)) at(`quiz exercise ${exercise.id} has a question without id`);
            if (!q.options || q.options.length < 2) at(`quiz question ${q.id} needs at least 2 options`);
            if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex >= (q.options?.length ?? 0)) {
              at(`quiz question ${q.id} has an out-of-range correctIndex`);
            }
          }
          break;
        }
        case 'interactive':
          expectCheck('widget');
          if (!isNonEmptyString(exercise.widgetId)) at(`interactive exercise ${exercise.id} missing widgetId`);
          break;
        default: {
          expectCheck('run', 'output', 'tests');
          if (!isNonEmptyString(exercise.starterCode)) at(`code exercise ${exercise.id} missing starterCode`);
          if (!isNonEmptyString(exercise.language)) at(`code exercise ${exercise.id} missing language`);
          if (exercise.check.type === 'tests') {
            if (!isNonEmptyString(exercise.check.functionName)) at(`exercise ${exercise.id} tests check missing functionName`);
            if (!exercise.check.tests?.length) at(`exercise ${exercise.id} tests check has no tests`);
          }
        }
      }
    }
  }
  return errors;
};
