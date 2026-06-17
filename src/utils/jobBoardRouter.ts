import type { ResumeData, Skill } from '../types';

export type JobBoardId = 'linkedin' | 'indeed' | 'handshake' | 'builtin';

export interface JobBoardRoute {
  id: JobBoardId;
  label: string;
  description: string;
  href: string;
}

export interface ResumeSearchQueryResult {
  query: string;
  terms: string[];
  source: 'resume-role' | 'resume-skills' | 'profile' | 'fallback';
}

const DEFAULT_JOB_QUERY = 'Software Engineer';

const TECH_SKILL_PRIORITY = [
  'React',
  'Next.js',
  'TypeScript',
  'JavaScript',
  'Python',
  'Node.js',
  'SQL',
  'GraphQL',
  'Firebase',
  'Google Cloud',
  'AWS',
  'Tailwind',
  'UI/UX',
  'System Design',
];

const ROLE_PHRASES = [
  'Software Engineer',
  'Frontend Engineer',
  'Front End Developer',
  'Front-End Developer',
  'Full Stack Engineer',
  'Full-Stack Engineer',
  'Web Developer',
  'UI Engineer',
  'UX Engineer',
  'Cloud Engineer',
  'Prompt Engineer',
  'Data Engineer',
  'Product Manager',
  'Technical Writer',
];

const GENERIC_RESUME_WORDS = new Set([
  'resume',
  'cv',
  'copy',
  'default',
  'autofill',
  'career',
  'careervivid',
  'jiawen',
  'zhu',
]);

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

const titleCaseToken = (value: string): string => {
  const cleaned = normalizeWhitespace(value.replace(/[_-]+/g, ' '));
  return cleaned.replace(/\b[a-z]/g, (char) => char.toUpperCase());
};

const getRolePhrasesFromText = (value?: string | null): string[] => {
  if (!value) return [];
  const normalized = normalizeWhitespace(value.replace(/[_-]+/g, ' ')).toLowerCase();
  return ROLE_PHRASES.filter(role => normalized.includes(role.toLowerCase()));
};

const isUsefulTerm = (value?: string | null): value is string => {
  if (!value) return false;
  const cleaned = normalizeWhitespace(value);
  if (cleaned.length < 2 || cleaned.length > 60) return false;
  return !GENERIC_RESUME_WORDS.has(cleaned.toLowerCase());
};

const getSkillName = (skill: Skill | string | unknown): string => {
  if (typeof skill === 'string') return skill;
  if (skill && typeof skill === 'object' && 'name' in skill) {
    return String((skill as { name?: unknown }).name || '');
  }
  return '';
};

const normalizeSkillTerm = (skill: string): string => {
  const titled = titleCaseToken(skill);
  return TECH_SKILL_PRIORITY.find(priority => priority.toLowerCase() === titled.toLowerCase()) || titled;
};

const collectProfileRoleCandidates = (profile: any): string[] => {
  if (!profile || typeof profile !== 'object') return [];

  return [
    profile.targetRole,
    profile.primaryTargetRole,
    profile.desiredRole,
    profile.jobTitle,
    profile.title,
    Array.isArray(profile.targetRoles) ? profile.targetRoles[0] : null,
    Array.isArray(profile.roles) ? profile.roles[0] : null,
  ].filter(isUsefulTerm).map(titleCaseToken);
};

const collectResumeRoleCandidates = (resume: ResumeData | null | undefined): string[] => {
  if (!resume) return [];

  const inferredRoles = getRolePhrasesFromText(resume.title);
  const titleFragments = normalizeWhitespace(resume.title || '')
    .split(/[-_|/]+/)
    .map(titleCaseToken)
    .filter(isUsefulTerm);

  return [
    resume.personalDetails?.jobTitle,
    resume.employmentHistory?.[0]?.jobTitle,
    ...inferredRoles,
    ...titleFragments,
  ].filter(isUsefulTerm).map(titleCaseToken);
};

const collectSkillCandidates = (resume: ResumeData | null | undefined, profile: any): string[] => {
  const resumeSkills = (resume?.skills || []).map(getSkillName);
  const profileSkills = Array.isArray(profile?.skills)
    ? profile.skills.map(getSkillName)
    : [];
  const allSkills = [...resumeSkills, ...profileSkills]
    .map(normalizeSkillTerm)
    .filter(isUsefulTerm);

  return allSkills.sort((left, right) => {
    const leftIndex = TECH_SKILL_PRIORITY.findIndex(priority => priority.toLowerCase() === left.toLowerCase());
    const rightIndex = TECH_SKILL_PRIORITY.findIndex(priority => priority.toLowerCase() === right.toLowerCase());
    const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
    return normalizedLeft - normalizedRight;
  });
};

const uniqueTerms = (terms: string[]): string[] => {
  const seen = new Set<string>();
  return terms.filter(term => {
    const key = term.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const buildResumeSearchQuery = (
  resume: ResumeData | null | undefined,
  profile: any
): ResumeSearchQueryResult => {
  const resumeRoles = uniqueTerms(collectResumeRoleCandidates(resume));
  const profileRoles = uniqueTerms(collectProfileRoleCandidates(profile));
  const skills = uniqueTerms(collectSkillCandidates(resume, profile));

  if (resumeRoles.length > 0) {
    const terms = uniqueTerms([resumeRoles[0], ...skills.slice(0, 2)]);
    return {
      query: terms.join(' '),
      terms,
      source: 'resume-role',
    };
  }

  if (profileRoles.length > 0) {
    const terms = uniqueTerms([profileRoles[0], ...skills.slice(0, 2)]);
    return {
      query: terms.join(' '),
      terms,
      source: 'profile',
    };
  }

  if (skills.length > 0) {
    const terms = skills.slice(0, 3);
    return {
      query: terms.join(' '),
      terms,
      source: 'resume-skills',
    };
  }

  return {
    query: DEFAULT_JOB_QUERY,
    terms: [DEFAULT_JOB_QUERY],
    source: 'fallback',
  };
};

const params = (record: Record<string, string>): string => new URLSearchParams(record).toString();

export const buildJobBoardSearchUrl = (boardId: JobBoardId, query: string): string => {
  const safeQuery = normalizeWhitespace(query) || DEFAULT_JOB_QUERY;

  switch (boardId) {
    case 'linkedin':
      return `https://www.linkedin.com/jobs/search/?${params({ keywords: safeQuery })}`;
    case 'indeed':
      return `https://www.indeed.com/jobs?${params({ q: safeQuery })}`;
    case 'handshake':
      return `https://app.joinhandshake.com/stu/postings?${params({ query: safeQuery })}`;
    case 'builtin':
      return `https://builtin.com/jobs?${params({ search: safeQuery })}`;
    default:
      return `https://www.linkedin.com/jobs/search/?${params({ keywords: safeQuery })}`;
  }
};

export const buildJobBoardRoutes = (query: string): JobBoardRoute[] => [
  {
    id: 'linkedin',
    label: 'LinkedIn Jobs',
    description: 'Recruiter-heavy roles and broad market coverage.',
    href: buildJobBoardSearchUrl('linkedin', query),
  },
  {
    id: 'indeed',
    label: 'Indeed',
    description: 'High-volume job search across company and ATS listings.',
    href: buildJobBoardSearchUrl('indeed', query),
  },
  {
    id: 'handshake',
    label: 'Handshake',
    description: 'University, internship, and early-career aligned roles.',
    href: buildJobBoardSearchUrl('handshake', query),
  },
  {
    id: 'builtin',
    label: 'BuiltIn',
    description: 'Tech-company roles filtered by your resume signal.',
    href: buildJobBoardSearchUrl('builtin', query),
  },
];
