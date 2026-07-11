import { describe, expect, it } from 'vitest';
import {
  evaluateCheck,
  getCourseExerciseCount,
  getCourseExercises,
  getCoursesByTrack,
  getCurriculumCourses,
  getInteractiveCourse,
  getInteractiveCourses,
} from './interactiveCourses';
import { validateCourseDefinition } from '../types/course';

describe('interactiveCourses', () => {
  it('provides one AI lab for each module in the 10-step curriculum', () => {
    const courses = getCurriculumCourses();

    expect(courses).toHaveLength(10);
    expect(courses.map((course) => course.title.slice(0, 3))).toEqual([
      '01.',
      '02.',
      '03.',
      '04.',
      '05.',
      '06.',
      '07.',
      '08.',
      '09.',
      '10.',
    ]);
    expect(courses.every((course) => course.category === 'AI')).toBe(true);
    expect(courses.every((course) => getCourseExerciseCount(course) >= 1)).toBe(true);
  });

  it('ships the Coding Interview Patterns course on its own track, animated end to end', () => {
    const patterns = getInteractiveCourse('coding-interview-patterns')!;

    expect(patterns).toBeTruthy();
    expect(patterns.track).toBe('coding-patterns');
    expect(getCoursesByTrack('coding-patterns')).toContain(patterns);
    // Track filtering keeps it OUT of the curriculum's order-based module map.
    expect(getCurriculumCourses()).not.toContain(patterns);

    // Every pattern chapter carries its own animation (interactive lesson).
    for (const chapter of patterns.chapters) {
      const kinds = chapter.exercises.map((e) => e.kind ?? 'code');
      expect(kinds).toContain('interactive');
      expect(kinds).toContain('reading');
    }
    expect(patterns.chapters.length).toBeGreaterThanOrEqual(9);
  });

  it('does not expose the old placeholder coding and system-design demos', () => {
    const ids = getInteractiveCourses().map((course) => course.id);

    expect(ids).not.toContain('javascript-console');
    expect(ids).not.toContain('system-design-fundamentals');
  });

  it('every course definition passes schema validation', () => {
    for (const course of getInteractiveCourses()) {
      expect(validateCourseDefinition(course)).toEqual([]);
    }
  });

  it('pairs each lesson kind with the right check type', () => {
    const exercises = getInteractiveCourses().flatMap(getCourseExercises);

    expect(exercises.filter((exercise) => exercise.kind === 'whiteboard')).toHaveLength(1);

    for (const exercise of exercises) {
      const kind = exercise.kind ?? 'code';
      switch (kind) {
        case 'code':
          expect(['run', 'output', 'tests']).toContain(exercise.check.type);
          expect(exercise.starterCode).toBeTruthy();
          if (exercise.check.type === 'tests') {
            expect(exercise.check.functionName).toBeTruthy();
            expect(exercise.check.tests.length).toBeGreaterThan(0);
          }
          break;
        case 'whiteboard':
          expect(exercise.check.type).toBe('diagram');
          expect(exercise.whiteboardBrief?.requirements.length).toBeGreaterThanOrEqual(4);
          break;
        case 'reading':
          expect(exercise.check.type).toBe('read');
          break;
        case 'video':
          expect(exercise.check.type).toBe('read');
          expect(exercise.videoUrl).toBeTruthy();
          break;
        case 'quiz':
          expect(exercise.check.type).toBe('quiz');
          expect(exercise.quiz?.length).toBeGreaterThan(0);
          break;
        case 'interactive':
          expect(exercise.check.type).toBe('widget');
          expect(exercise.widgetId).toBeTruthy();
          break;
        default:
          throw new Error(`Unhandled lesson kind: ${kind}`);
      }
    }
  });

  it('flagship foundations course mixes lesson kinds', () => {
    const flagship = getInteractiveCourses().find((c) => c.id === 'ai-foundations-map')!;
    const kinds = new Set(getCourseExercises(flagship).map((e) => e.kind ?? 'code'));

    expect(kinds).toContain('reading');
    expect(kinds).toContain('video');
    expect(kinds).toContain('quiz');
    expect(kinds).toContain('interactive');
    expect(kinds).toContain('code');
    // Progress compatibility: the original lab id must survive the redesign.
    expect(getCourseExercises(flagship).map((e) => e.id)).toContain('classify-ai-building-blocks');
  });

  it('shows the failing visible test case when a submitted answer is wrong', () => {
    const result = evaluateCheck(
      {
        type: 'tests',
        functionName: 'classifyConcept',
        tests: [{ input: ['large language model'], expected: 'foundation-model' }],
      },
      {
        id: 1,
        ok: true,
        results: [{
          hidden: false,
          pass: false,
          input: '["large language model"]',
          expected: '"foundation-model"',
          received: '"application-pattern"',
        }],
        logs: [],
        durationMs: 2,
      },
    );

    expect(result.pass).toBe(false);
    expect(result.detail).toContain('0/1 tests passed.');
    expect(result.detail).toContain('large language model');
    expect(result.detail).toContain('foundation-model');
  });
});
