import { getSystemDesignPatternById, type SystemDesignBrief } from './companyQuests';
import { locateExercise } from './interactiveCourses';

export const getCourseSystemDesignResultId = (courseId: string, exerciseId: string) => `${courseId}__${exerciseId}`;

/**
 * Reuses the canonical system-design challenge catalog while keeping the
 * course prompt, route, and result lifecycle independent from Company Quest.
 */
export const getCourseSystemDesignPractice = (courseId: string, exerciseId: string): {
  brief: SystemDesignBrief;
  stageTitle: string;
} | undefined => {
  const location = locateExercise(courseId, exerciseId);
  const metadata = location?.chapter.systemDesign;
  const pattern = getSystemDesignPatternById(metadata?.primaryChallengeId);
  if (!location || !metadata || !pattern) return undefined;

  return {
    stageTitle: `${location.chapter.title.replace(/^\d+\.\s*/, '')} course mock`,
    brief: {
      challengeId: pattern.id,
      challenge: pattern.title,
      category: pattern.category,
      focus: pattern.focus,
      requirements: metadata.expectedRequirements,
      prompt: [
        `Challenge: ${pattern.title}`,
        `Focus: ${pattern.focus}`,
        '',
        'Clarify and satisfy these course requirements:',
        ...metadata.expectedRequirements.map((item) => `- ${item}`),
        '',
        `Failure follow-up: ${metadata.failureModeFollowUp}`,
      ].join('\n'),
    },
  };
};
