import { describe, expect, it } from 'vitest';
import { getInteractiveCourse } from './interactiveCourses';
import { getCodingInterviewRoadmap } from './codingInterviewRoadmap';

describe('coding interview roadmap', () => {
  it('covers every pattern exactly once across three experience levels', () => {
    const course = getInteractiveCourse('coding-interview-patterns')!;
    const roadmap = getCodingInterviewRoadmap(course);
    const listedIds = roadmap.flatMap((level) => level.chapters.map((chapter) => chapter.id));

    expect(roadmap.map((level) => level.id)).toEqual(['beginner', 'intermediate', 'advanced']);
    expect(new Set(listedIds).size).toBe(course.chapters.length);
    expect(listedIds).toHaveLength(course.chapters.length);
    expect(new Set(listedIds)).toEqual(new Set(course.chapters.map((chapter) => chapter.id)));
  });

  it('counts completed lessons within the selected experience module', () => {
    const course = getInteractiveCourse('coding-interview-patterns')!;
    const firstBeginnerChapter = course.chapters.find((chapter) => chapter.id === 'ch-two-pointers')!;
    const roadmap = getCodingInterviewRoadmap(course, {
      completedModuleIds: firstBeginnerChapter.exercises.map((exercise) => exercise.id),
      startedAt: 0,
      completedAt: null,
      updatedAt: 0,
    });

    const beginner = roadmap.find((level) => level.id === 'beginner')!;
    expect(beginner.completedChapters).toBe(1);
    expect(beginner.completedLessons).toBe(firstBeginnerChapter.exercises.length);
  });
});
