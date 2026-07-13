import type { CourseProgress } from '../types';
import type { InteractiveChapter, InteractiveCourse } from './interactiveCourses';

export type ExperienceRoadmapId = 'beginner' | 'intermediate' | 'advanced';

export type ExperienceRoadmap = {
  id: ExperienceRoadmapId;
  level: string;
  title: string;
  years: string;
  description: string;
  chapterIds: string[];
};

export const CODING_INTERVIEW_ROADMAPS: ExperienceRoadmap[] = [
  {
    id: 'beginner',
    level: 'Level 1 of 3',
    title: 'Beginner',
    years: '0-1 years',
    description: 'Core array, pointer, recursion, graph traversal, and divide-and-conquer patterns for your first coding interviews.',
    chapterIds: ['ch-two-pointers', 'ch-sliding-window', 'ch-binary-search', 'ch-fast-slow', 'ch-merge-intervals', 'ch-bfs', 'ch-dfs', 'ch-merge-sort', 'ch-quickselect'],
  },
  {
    id: 'intermediate',
    level: 'Level 2 of 3',
    title: 'Intermediate',
    years: '2-4 years',
    description: 'Stateful data structures and search techniques for medium-hard interview problems and practical trade-offs.',
    chapterIds: ['ch-monotonic-stack', 'ch-backtracking', 'ch-dp', 'ch-sweep-line', 'ch-monotonic-queue', 'ch-string-matching', 'ch-union-find'],
  },
  {
    id: 'advanced',
    level: 'Level 3 of 3',
    title: 'Advanced',
    years: '5+ years',
    description: 'Specialized optimization and graph algorithms for senior-level depth, systems thinking, and difficult interviews.',
    chapterIds: ['ch-range-tree', 'ch-mst', 'ch-shortest-paths', 'ch-network-flow'],
  },
];

export type ExperienceRoadmapModule = ExperienceRoadmap & {
  chapters: InteractiveChapter[];
  completedChapters: number;
  totalLessons: number;
  completedLessons: number;
};

export const getCodingInterviewRoadmap = (
  course: InteractiveCourse,
  progress?: CourseProgress,
): ExperienceRoadmapModule[] => {
  const completedIds = new Set(progress?.completedModuleIds ?? []);
  return CODING_INTERVIEW_ROADMAPS.map((roadmap) => {
    const chapters = roadmap.chapterIds
      .map((id) => course.chapters.find((chapter) => chapter.id === id))
      .filter((chapter): chapter is InteractiveChapter => Boolean(chapter));
    const totalLessons = chapters.reduce((total, chapter) => total + chapter.exercises.length, 0);
    const completedLessons = chapters.reduce(
      (total, chapter) => total + chapter.exercises.filter((exercise) => completedIds.has(exercise.id)).length,
      0,
    );
    const completedChapters = chapters.filter((chapter) => chapter.exercises.every((exercise) => completedIds.has(exercise.id))).length;
    return { ...roadmap, chapters, totalLessons, completedLessons, completedChapters };
  });
};
