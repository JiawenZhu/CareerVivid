import { EmploymentHistory, ResumeData, Skill } from '../types';

export type AIReviewSuggestionLike = {
  id?: unknown;
  category?: unknown;
  type?: unknown;
  fieldId?: unknown;
  originalText?: unknown;
  suggestedText?: unknown;
};

export const safeReviewText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

export const safeReviewLower = (value: unknown): string => safeReviewText(value).trim().toLowerCase();

export const safeReviewArray = <T>(value: T[] | null | undefined): T[] => {
  return Array.isArray(value) ? value.filter(Boolean) : [];
};

export const normalizeReviewSkills = (skills: ResumeData['skills'] | null | undefined): Skill[] => {
  return safeReviewArray(skills).map((skill, index) => ({
    ...skill,
    id: safeReviewText(skill?.id) || `skill-${index}`,
    name: safeReviewText(skill?.name),
    level: skill?.level || 'Intermediate',
  }));
};

export const normalizeReviewEmploymentHistory = (
  employmentHistory: ResumeData['employmentHistory'] | null | undefined,
): EmploymentHistory[] => {
  return safeReviewArray(employmentHistory).map((job, index) => ({
    ...job,
    id: safeReviewText(job?.id) || `experience-${index}`,
    jobTitle: safeReviewText(job?.jobTitle),
    employer: safeReviewText(job?.employer),
    city: safeReviewText(job?.city),
    startDate: safeReviewText(job?.startDate),
    endDate: safeReviewText(job?.endDate),
    description: safeReviewText(job?.description),
  }));
};

export const getSelectedReviewSuggestions = (
  suggestions: unknown,
  selectedSuggestionIds: unknown,
): AIReviewSuggestionLike[] => {
  const selectedIds = selectedSuggestionIds instanceof Set ? selectedSuggestionIds : new Set();
  if (!Array.isArray(suggestions)) return [];

  return suggestions.filter((suggestion): suggestion is AIReviewSuggestionLike => {
    const id = safeReviewText((suggestion as AIReviewSuggestionLike)?.id);
    return Boolean(id && selectedIds.has(id));
  });
};

export const addSelectedSkillSuggestionsToResume = (
  resume: ResumeData,
  suggestions: unknown,
  selectedSuggestionIds: unknown,
): ResumeData => {
  const copy = JSON.parse(JSON.stringify(resume || {})) as ResumeData;
  copy.skills = normalizeReviewSkills(copy.skills);

  getSelectedReviewSuggestions(suggestions, selectedSuggestionIds)
    .filter((suggestion) => suggestion.category === 'skills' && suggestion.type === 'add')
    .forEach((suggestion, index) => {
      const suggestedText = safeReviewText(suggestion.suggestedText).trim();
      if (!suggestedText) return;

      const suggestedTextLower = suggestedText.toLowerCase();
      const exists = copy.skills.some((skill) => safeReviewLower(skill?.name) === suggestedTextLower);
      if (!exists) {
        copy.skills.push({
          id: safeReviewText(suggestion.id) || `ai-skill-${index}`,
          name: suggestedText,
          level: 'Intermediate',
        });
      }
    });

  return copy;
};
