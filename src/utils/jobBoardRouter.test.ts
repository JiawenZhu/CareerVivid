import { describe, expect, it } from 'vitest';
import type { ResumeData } from '../types';
import {
  buildJobBoardRoutes,
  buildJobBoardSearchUrl,
  buildResumeSearchQuery,
} from './jobBoardRouter';

describe('jobBoardRouter', () => {
  it('builds resume-powered search terms from explicit resume roles and skills', () => {
    const resume = {
      personalDetails: { jobTitle: 'Frontend Engineer' },
      skills: ['React', 'Next.js', 'TypeScript', 'Customer Support'],
    } as unknown as ResumeData;

    const result = buildResumeSearchQuery(resume, null);

    expect(result).toMatchObject({
      source: 'resume-role',
      terms: ['Frontend Engineer', 'React', 'Next.js'],
      query: 'Frontend Engineer React Next.js',
    });
  });

  it('infers role phrases from filename-style resume titles', () => {
    const resume = {
      title: 'Jiawen-Zhu-Software-Engineer-UIllinois (Copy)',
      skills: ['React', 'Firebase'],
    } as unknown as ResumeData;

    const result = buildResumeSearchQuery(resume, null);

    expect(result.terms[0]).toBe('Software Engineer');
    expect(result.query).toBe('Software Engineer React Firebase');
  });

  it('creates deep links for supported job boards', () => {
    expect(buildJobBoardSearchUrl('linkedin', 'Software Engineer')).toBe(
      'https://www.linkedin.com/jobs/search/?keywords=Software+Engineer'
    );
    expect(buildJobBoardSearchUrl('indeed', 'React Next.js')).toBe(
      'https://www.indeed.com/jobs?q=React+Next.js'
    );
    expect(buildJobBoardSearchUrl('handshake', 'Cloud Engineer')).toBe(
      'https://app.joinhandshake.com/stu/postings?query=Cloud+Engineer'
    );
    expect(buildJobBoardSearchUrl('builtin', 'TypeScript')).toBe(
      'https://builtin.com/jobs?search=TypeScript'
    );
  });

  it('returns all modal route targets with prefiltered hrefs', () => {
    const routes = buildJobBoardRoutes('Software Engineer React');

    expect(routes.map(route => route.label)).toEqual([
      'LinkedIn Jobs',
      'Indeed',
      'Handshake',
      'BuiltIn',
    ]);
    expect(routes.every(route => route.href.includes('Software+Engineer+React'))).toBe(true);
  });
});
