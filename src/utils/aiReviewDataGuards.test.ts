import { describe, expect, it } from 'vitest';
import { ResumeData } from '../types';
import { addSelectedSkillSuggestionsToResume } from './aiReviewDataGuards';
import {
  buildResumeWithReviewSuggestions,
  normalizeActionableReviewSuggestions,
} from './aiReviewSuggestions';
import { calculateResumeScore } from './resumeScoreUtils';

describe('AI review data guards', () => {
  it('adds selected skill suggestions without crashing on sparse resume data', () => {
    const sparseResume = {
      id: 'resume-1',
      skills: [{ id: 'legacy-skill' }],
    } as unknown as ResumeData;

    const suggestions = [
      {
        id: 'missing-text',
        category: 'skills',
        type: 'add',
      },
      {
        id: 'valid-skill',
        category: 'skills',
        type: 'add',
        suggestedText: 'TypeScript',
      },
    ];

    const nextResume = addSelectedSkillSuggestionsToResume(
      sparseResume,
      suggestions,
      new Set(['missing-text', 'valid-skill']),
    );

    expect(nextResume.skills.map((skill) => skill.name)).toEqual(['', 'TypeScript']);
  });

  it('scores incomplete legacy resumes instead of throwing', () => {
    const sparseResume = {
      id: 'resume-2',
      personalDetails: { firstName: 'Peter' },
      employmentHistory: [{ id: 'exp-1' }],
      skills: [{ id: 'skill-1' }],
    } as unknown as ResumeData;

    const score = calculateResumeScore(sparseResume);

    expect(score.overallScore).toBeGreaterThanOrEqual(0);
    expect(score.completionItems.find((item) => item.id === 'lastName')?.isOk).toBe(false);
    expect(score.qualityItems.length).toBeGreaterThan(0);
  });

  it('removes selected experience delete suggestions instead of leaving blank bullets', () => {
    const resume = {
      id: 'resume-3',
      employmentHistory: [
        {
          id: 'exp-1',
          employer: 'CareerVivid',
          jobTitle: 'Founder',
          description: '- Founder & Full-Stack Engineer\n- Built AI resume tooling for job seekers',
        },
      ],
      skills: [],
    } as unknown as ResumeData;

    const suggestions = normalizeActionableReviewSuggestions(resume, [
      {
        category: 'experience',
        title: 'Remove redundant bullet',
        explanation: 'This bullet duplicates the role title.',
        type: 'delete',
        fieldId: 'employmentHistory[0].description#chunk-0',
        originalText: 'Founder & Full-Stack Engineer',
        suggestedText: '',
        tags: ['Grammar'],
        priority: 'medium',
      },
    ]);

    const nextResume = buildResumeWithReviewSuggestions(
      resume,
      suggestions,
      new Set(suggestions.map((suggestion) => suggestion.id)),
    );

    expect(nextResume.employmentHistory[0].description).toBe('- Built AI resume tooling for job seekers');
  });

  it('filters no-op and already-applied review suggestions', () => {
    const resume = {
      id: 'resume-4',
      professionalSummary: 'Senior engineer building reliable AI systems.',
      skills: [{ id: 'skill-1', name: 'TypeScript' }],
    } as unknown as ResumeData;

    const suggestions = normalizeActionableReviewSuggestions(resume, [
      {
        category: 'skills',
        type: 'add',
        fieldId: 'skills',
        originalText: '',
        suggestedText: 'TypeScript',
      },
      {
        category: 'summary',
        type: 'replace',
        fieldId: 'professionalSummary',
        originalText: 'Senior engineer building reliable AI systems.',
        suggestedText: 'Senior engineer building reliable AI systems.',
      },
    ]);

    expect(suggestions).toEqual([]);
  });

  it('adds comma-separated skill recommendations as separate skills', () => {
    const resume = {
      id: 'resume-5',
      skills: [{ id: 'skill-1', name: 'API Troubleshooting' }],
    } as unknown as ResumeData;

    const suggestions = normalizeActionableReviewSuggestions(resume, [
      {
        category: 'skills',
        title: 'Add support skills',
        explanation: 'Add missing support engineering skills.',
        type: 'add',
        fieldId: 'skills',
        originalText: '',
        suggestedText: 'Root Cause Analysis, Jira, ServiceNow',
        tags: ['Score Impact'],
        priority: 'high',
      },
    ]);

    const nextResume = buildResumeWithReviewSuggestions(
      resume,
      suggestions,
      new Set(suggestions.map((suggestion) => suggestion.id)),
    );

    expect(nextResume.skills.map((skill) => skill.name)).toEqual([
      'API Troubleshooting',
      'Root Cause Analysis',
      'Jira',
      'ServiceNow',
    ]);
  });

  it('raises the score when role-critical support skills are added', () => {
    const resume = {
      id: 'resume-6',
      personalDetails: {
        firstName: 'Jiawen',
        lastName: 'Zhu',
        email: 'jiawen@example.com',
        phone: '555-0100',
        city: 'Champaign',
        jobTitle: 'Technical Support Specialist',
      },
      professionalSummary: 'Technical Support Specialist with experience in API troubleshooting, customer issue resolution, and system performance analysis.',
      employmentHistory: [
        {
          id: 'exp-1',
          employer: 'CareerVivid',
          jobTitle: 'Technical Support Specialist',
          description: [
            '- Resolved API incidents for 200+ users, improving support turnaround by 30%.',
            '- Analyzed system logs and monitoring dashboards to identify recurring defects.',
            '- Coordinated with engineering teams to reproduce issues and validate fixes.',
          ].join('\n'),
        },
      ],
      education: [{ id: 'edu-1', school: 'Example University', degree: 'BS Computer Science' }],
      skills: [
        { id: 'skill-1', name: 'SQL' },
        { id: 'skill-2', name: 'API Troubleshooting' },
        { id: 'skill-3', name: 'Datadog/Splunk' },
        { id: 'skill-4', name: 'Postman' },
        { id: 'skill-5', name: 'Technical Writing' },
        { id: 'skill-6', name: 'JavaScript' },
        { id: 'skill-7', name: 'React' },
        { id: 'skill-8', name: 'Quality Assurance' },
      ],
    } as unknown as ResumeData;

    const baseScore = calculateResumeScore(resume).overallScore;
    const suggestions = normalizeActionableReviewSuggestions(resume, [
      {
        category: 'skills',
        title: 'Add support workflow keywords',
        explanation: 'These keywords improve Technical Support Specialist ATS coverage.',
        type: 'add',
        fieldId: 'skills',
        originalText: '',
        suggestedText: 'Root Cause Analysis, Jira, ServiceNow',
        tags: ['Score Impact'],
        priority: 'high',
      },
    ]);
    const nextResume = buildResumeWithReviewSuggestions(
      resume,
      suggestions,
      new Set(suggestions.map((suggestion) => suggestion.id)),
    );

    expect(calculateResumeScore(nextResume).overallScore).toBeGreaterThan(baseScore);
  });
});
