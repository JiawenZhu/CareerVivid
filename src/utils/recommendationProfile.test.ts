import { describe, expect, it } from 'vitest';
import { extractRecommendationProfileKeywords, getProfileKeywordFit } from './recommendationProfile';

describe('recommendation profile keyword extraction', () => {
    it('extracts resume and portfolio signals for job matching', () => {
        const keywords = extractRecommendationProfileKeywords({
            resumes: [{
                title: 'Software Engineer Resume',
                professionalSummary: 'Frontend engineer building React, TypeScript, accessibility, and Firebase products.',
                personalDetails: {
                    jobTitle: 'Full Stack Engineer',
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    postalCode: '',
                    country: '',
                    photo: '',
                },
                skills: [
                    { id: 'react', name: 'React', level: 'Expert' },
                    { id: 'ts', name: 'TypeScript', level: 'Advanced' },
                    { id: 'a11y', name: 'Accessibility', level: 'Advanced' },
                ],
                employmentHistory: [{
                    id: 'role-1',
                    jobTitle: 'Founder and Full-Stack Engineer',
                    employer: 'CareerVivid',
                    city: 'Champaign',
                    startDate: '2025-01',
                    endDate: '',
                    description: 'Built Chrome Extension, Firestore, and AI workflow tooling.',
                }],
            }],
            portfolios: [{
                id: 'portfolio-1',
                title: 'AI Full Stack Portfolio',
                techStack: ['Next.js', 'Firebase', 'LLM'],
                projects: [{
                    id: 'project-1',
                    title: 'Job Matching System',
                    description: 'A verified apply-link workflow using Greenhouse listings.',
                    tags: ['Agentic AI', 'REST APIs'],
                }],
            }],
        });

        expect(keywords).toEqual(expect.arrayContaining([
            'React',
            'TypeScript',
            'Accessibility',
            'Next.js',
            'Firebase',
            'LLM',
            'Agentic AI',
            'REST APIs',
        ]));
    });

    it('matches job text against extracted profile terms and reports gaps', () => {
        const fit = getProfileKeywordFit(
            'Build React and TypeScript interfaces for an AI job matching platform with REST APIs and GraphQL.',
            ['React', 'TypeScript', 'Accessibility', 'REST APIs', 'Firebase'],
            ['React', 'TypeScript', 'REST APIs', 'GraphQL']
        );

        expect(fit.matchedKeywords).toEqual(['React', 'TypeScript', 'REST APIs']);
        expect(fit.missingKeywords).toEqual(['GraphQL', 'AI']);
    });

    it('uses a nontechnical role title as a matching signal', () => {
        const keywords = extractRecommendationProfileKeywords({
            resumes: [{
                title: 'Lifecycle Marketing Resume',
                personalDetails: {
                    jobTitle: 'Lifecycle Marketing Manager',
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    postalCode: '',
                    country: '',
                    photo: '',
                },
                skills: [{ id: 'crm', name: 'CRM', level: 'Advanced' }],
                employmentHistory: [{
                    id: 'role-1',
                    jobTitle: 'Lifecycle Marketing Manager',
                    employer: 'Acme',
                    city: '',
                    startDate: '',
                    endDate: '',
                    description: '',
                }],
            }],
        });

        const fit = getProfileKeywordFit(
            'The Lifecycle Marketing Manager will own CRM campaigns and retention programs.',
            keywords
        );

        expect(keywords).toEqual(expect.arrayContaining(['Lifecycle Marketing Resume', 'Lifecycle Marketing Manager', 'CRM']));
        expect(fit.matchedKeywords).toEqual(expect.arrayContaining(['Lifecycle Marketing Manager', 'CRM']));
    });

    it('does not invent profile terms when no resume or portfolio signals exist', () => {
        expect(extractRecommendationProfileKeywords({ resumes: [], portfolios: [] })).toEqual([]);
    });
});
