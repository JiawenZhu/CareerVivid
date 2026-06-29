import { generateSafeUUID } from '../constants';
import type { AISuggestion } from '../contexts/AIReviewContext';
import { ResumeData } from '../types';
import { calculateResumeScore, parseBulletPoints } from './resumeScoreUtils';
import {
  normalizeReviewEmploymentHistory,
  normalizeReviewSkills,
  safeReviewArray,
  safeReviewLower,
  safeReviewText,
} from './aiReviewDataGuards';
import { normalizeReviewTagLabel } from './aiReviewLanguage';

const normalizeComparableText = (value: unknown): string =>
  safeReviewText(value)
    .replace(/^[-*•+\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const hashString = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

export const splitSuggestedSkillNames = (value: unknown): string[] => {
  const seen = new Set<string>();
  return safeReviewText(value)
    .split(/[\n;,]+/)
    .map((item) => item.replace(/^[-*•+\s]+/, '').trim())
    .filter((item) => item.length > 1)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export const getReviewSuggestionFingerprint = (suggestion: Pick<AISuggestion, 'category' | 'type' | 'fieldId' | 'originalText' | 'suggestedText'>): string =>
  [
    suggestion.category,
    suggestion.type,
    safeReviewText(suggestion.fieldId),
    normalizeComparableText(suggestion.originalText),
    normalizeComparableText(suggestion.suggestedText),
  ].join('|');

export const createStableReviewSuggestionId = (suggestion: Pick<AISuggestion, 'category' | 'type' | 'fieldId' | 'originalText' | 'suggestedText'>): string =>
  `ai-suggest-${hashString(getReviewSuggestionFingerprint(suggestion))}`;

const fieldBulletMatch = (resume: ResumeData, fieldId: string) => {
  const match = safeReviewText(fieldId).match(/^employmentHistory\[(\d+)\]\.description(?:#chunk-(\d+))?$/);
  if (!match) return null;

  const employmentHistory = normalizeReviewEmploymentHistory(resume.employmentHistory);
  const jobIdx = parseInt(match[1], 10);
  const chunkIdx = match[2] ? parseInt(match[2], 10) : null;
  const job = employmentHistory[jobIdx];
  if (!job) return null;

  return {
    employmentHistory,
    job,
    jobIdx,
    chunkIdx,
    bullets: parseBulletPoints(job.description || ''),
  };
};

export const isActionableReviewSuggestion = (resume: ResumeData, suggestion: AISuggestion): boolean => {
  const type = suggestion.type;
  const fieldId = safeReviewText(suggestion.fieldId);
  const originalText = safeReviewText(suggestion.originalText).trim();
  const suggestedText = safeReviewText(suggestion.suggestedText).trim();
  const normalizedOriginal = normalizeComparableText(originalText);
  const normalizedSuggested = normalizeComparableText(suggestedText);

  if (!['add', 'delete', 'replace'].includes(type)) return false;
  if (type === 'add' && !suggestedText) return false;
  if (type === 'delete' && !originalText) return false;
  if (type === 'replace' && (!fieldId || !suggestedText || normalizedOriginal === normalizedSuggested)) return false;

  if (suggestion.category === 'skills') {
    const skills = normalizeReviewSkills(resume.skills);
    if (type === 'add') {
      const suggestedSkills = splitSuggestedSkillNames(suggestedText);
      return suggestedSkills.some((name) => !skills.some((skill) => safeReviewLower(skill?.name) === name.toLowerCase()));
    }
    if (type === 'delete') {
      return skills.some((skill) => safeReviewLower(skill?.name) === normalizedOriginal);
    }
    const match = fieldId.match(/^skills\[(\d+)\]\.name$/);
    if (!match) return false;
    const skillIdx = parseInt(match[1], 10);
    return Boolean(skills[skillIdx] && safeReviewLower(skills[skillIdx].name) !== normalizedSuggested);
  }

  if (suggestion.category === 'personalDetails') {
    if (fieldId !== 'personalDetails.jobTitle') return false;
    return normalizeComparableText(resume.personalDetails?.jobTitle) !== normalizedSuggested;
  }

  if (suggestion.category === 'summary') {
    if (fieldId !== 'professionalSummary') return false;
    return normalizeComparableText(resume.professionalSummary) !== normalizedSuggested;
  }

  if (suggestion.category === 'experience') {
    const target = fieldBulletMatch(resume, fieldId);
    if (!target) return false;
    if (target.chunkIdx === null) {
      return type === 'replace' && normalizeComparableText(target.job.description) !== normalizedSuggested;
    }
    const currentBullet = target.bullets[target.chunkIdx];
    if (!currentBullet) return false;
    if (type === 'delete') return normalizeComparableText(currentBullet) === normalizedOriginal;
    if (type === 'replace') return normalizeComparableText(currentBullet) !== normalizedSuggested;
    return false;
  }

  return false;
};

export const normalizeActionableReviewSuggestions = (
  resume: ResumeData,
  rawSuggestions: unknown,
): AISuggestion[] => {
  const seen = new Set<string>();

  return safeReviewArray(rawSuggestions as any[]).map((raw: any, idx): AISuggestion => {
    const category = ['skills', 'experience', 'summary', 'personalDetails', 'general'].includes(safeReviewText(raw?.category))
      ? raw.category
      : 'general';
    const type = ['add', 'delete', 'replace'].includes(safeReviewText(raw?.type))
      ? raw.type
      : 'replace';
    const priority = ['high', 'medium', 'low'].includes(safeReviewText(raw?.priority))
      ? raw.priority
      : 'medium';

    const suggestion = {
      id: safeReviewText(raw?.id) || `ai-suggest-${idx}-${generateSafeUUID().slice(0, 6)}`,
      category,
      title: safeReviewText(raw?.title) || 'Suggested edit',
      explanation: safeReviewText(raw?.explanation),
      type,
      fieldId: safeReviewText(raw?.fieldId),
      originalText: safeReviewText(raw?.originalText),
      suggestedText: safeReviewText(raw?.suggestedText),
      tags: safeReviewArray(raw?.tags)
        .map((tag) => normalizeReviewTagLabel(safeReviewText(tag)))
        .filter((tag): tag is string => Boolean(tag)),
      priority,
    } as AISuggestion;

    suggestion.id = createStableReviewSuggestionId(suggestion);
    return suggestion;
  }).filter((suggestion) => {
    if (!isActionableReviewSuggestion(resume, suggestion)) return false;
    const fingerprint = getReviewSuggestionFingerprint(suggestion);
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
};

export const buildResumeWithReviewSuggestions = (
  resume: ResumeData,
  suggestions: AISuggestion[],
  selectedSuggestionIds: Set<string>,
): ResumeData => {
  const updated = JSON.parse(JSON.stringify(resume || {})) as ResumeData;
  updated.personalDetails = updated.personalDetails || ({} as ResumeData['personalDetails']);
  updated.skills = normalizeReviewSkills(updated.skills);
  updated.employmentHistory = normalizeReviewEmploymentHistory(updated.employmentHistory);

  suggestions
    .filter((suggestion) => selectedSuggestionIds.has(suggestion.id))
    .forEach((suggestion) => {
      const originalText = safeReviewText(suggestion.originalText).trim();
      const suggestedText = safeReviewText(suggestion.suggestedText).trim();

      if (suggestion.category === 'skills') {
        if (suggestion.type === 'add') {
          splitSuggestedSkillNames(suggestedText).forEach((name) => {
            const exists = updated.skills.some((skill) => safeReviewLower(skill?.name) === name.toLowerCase());
            if (!exists) updated.skills.push({ id: generateSafeUUID(), name, level: 'Intermediate' });
          });
          return;
        }

        if (suggestion.type === 'delete') {
          updated.skills = updated.skills.filter((skill) => safeReviewLower(skill?.name) !== originalText.toLowerCase());
          return;
        }

        const match = safeReviewText(suggestion.fieldId).match(/^skills\[(\d+)\]\.name$/);
        if (match) {
          const skillIdx = parseInt(match[1], 10);
          if (updated.skills[skillIdx]) updated.skills[skillIdx] = { ...updated.skills[skillIdx], name: suggestedText };
        }
        return;
      }

      if (suggestion.category === 'personalDetails' && suggestion.fieldId === 'personalDetails.jobTitle') {
        if (suggestion.type !== 'delete') updated.personalDetails.jobTitle = suggestedText;
        return;
      }

      if (suggestion.category === 'summary' && suggestion.fieldId === 'professionalSummary') {
        if (suggestion.type !== 'delete') updated.professionalSummary = suggestedText;
        return;
      }

      if (suggestion.category === 'experience') {
        const match = safeReviewText(suggestion.fieldId).match(/^employmentHistory\[(\d+)\]\.description(?:#chunk-(\d+))?$/);
        if (!match) return;
        const jobIdx = parseInt(match[1], 10);
        const chunkIdx = match[2] ? parseInt(match[2], 10) : null;
        const job = updated.employmentHistory[jobIdx];
        if (!job) return;

        if (chunkIdx === null) {
          if (suggestion.type === 'replace') job.description = suggestedText;
          return;
        }

        const bullets = parseBulletPoints(job.description || '');
        if (chunkIdx < 0 || chunkIdx >= bullets.length) return;

        if (suggestion.type === 'delete') {
          bullets.splice(chunkIdx, 1);
        } else if (suggestion.type === 'replace') {
          bullets[chunkIdx] = suggestedText;
        }

        job.description = bullets.map((bullet) => `- ${bullet}`).join('\n');
      }
    });

  return updated;
};

export const getReviewSuggestionScoreImpact = (
  resume: ResumeData,
  suggestion: AISuggestion,
): { scoreDelta: number; qualityDelta: number; lengthDelta: number } => {
  const before = calculateResumeScore(resume);
  const projected = buildResumeWithReviewSuggestions(resume, [suggestion], new Set([suggestion.id]));
  const after = calculateResumeScore(projected);

  return {
    scoreDelta: after.overallScore - before.overallScore,
    qualityDelta: after.qualityScore - before.qualityScore,
    lengthDelta: after.lengthScore - before.lengthScore,
  };
};

export const filterScoreRelevantReviewSuggestions = (
  resume: ResumeData,
  suggestions: AISuggestion[],
): AISuggestion[] =>
  suggestions.filter((suggestion) => {
    const impact = getReviewSuggestionScoreImpact(resume, suggestion);
    return impact.scoreDelta > 0 || impact.qualityDelta > 0 || impact.lengthDelta > 0;
  });
