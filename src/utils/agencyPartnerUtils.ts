import { AgencyPrepSessionStatus } from '../types';

export const normalizeAgencySlug = (value: string): string => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || 'agency-branch';
};

export const buildAgencyPrepSessionId = (agencyBranchId: string, candidateUserId: string): string =>
  `${agencyBranchId}_${candidateUserId}`.replace(/\//g, '_');

export const agencyPrepStatusLabels: Record<AgencyPrepSessionStatus, string> = {
  invited: 'Invited',
  started: 'Started',
  resume_imported: 'Resume imported',
  reviewed: 'AI reviewed',
  ready: 'Ready',
  shared: 'Shared',
  inactive: 'Inactive',
};

export const resolveAgencyPrepStatus = ({
  hasResume,
  latestScore,
  consentToShare,
}: {
  hasResume: boolean;
  latestScore?: number;
  consentToShare?: boolean;
}): AgencyPrepSessionStatus => {
  if (consentToShare) return 'shared';
  if (typeof latestScore === 'number' && latestScore >= 85) return 'ready';
  if (typeof latestScore === 'number') return 'reviewed';
  if (hasResume) return 'resume_imported';
  return 'started';
};

export const getAgencyReadinessSummary = (latestScore?: number, scoreDelta?: number): string => {
  if (typeof latestScore !== 'number') {
    return 'Candidate started the preparation flow but has not selected a resume yet.';
  }

  const deltaText = typeof scoreDelta === 'number' && scoreDelta > 0
    ? `, improving by ${scoreDelta} points`
    : '';

  if (latestScore >= 90) {
    return `Candidate reached a recruiter-ready score of ${latestScore}${deltaText}.`;
  }

  if (latestScore >= 85) {
    return `Candidate is close to recruiter-ready with a score of ${latestScore}${deltaText}.`;
  }

  return `Candidate is still preparing with a current score of ${latestScore}${deltaText}.`;
};

