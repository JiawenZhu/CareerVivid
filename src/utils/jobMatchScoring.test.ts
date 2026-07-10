import { describe, expect, it } from 'vitest';
import { assessJobMatch, buildJobMatchProfile } from './jobMatchScoring';

const locationPreferences = {
    country: 'United States',
    locations: ['Chicago, Illinois, United States'],
    workModelPreference: 'remote' as const,
};

const resume = {
    title: 'Frontend Engineer Resume',
    personalDetails: { jobTitle: 'Frontend Engineer', city: 'Chicago', country: 'United States' },
    professionalSummary: 'Frontend engineer building accessible React applications.',
    skills: [
        { id: 'react', name: 'React', level: 'Expert' as const },
        { id: 'typescript', name: 'TypeScript', level: 'Advanced' as const },
        { id: 'accessibility', name: 'Accessibility', level: 'Advanced' as const },
    ],
    employmentHistory: [{
        id: 'role-1',
        jobTitle: 'Frontend Engineer',
        employer: 'Acme',
        city: 'Chicago',
        startDate: '2020-01',
        endDate: '2025-01',
        description: 'Built React and TypeScript design system components.',
    }],
    education: [{
        id: 'education-1',
        school: 'University',
        degree: 'Bachelor of Science',
        city: '',
        startDate: '',
        endDate: '',
        description: '',
    }],
};

const profile = buildJobMatchProfile(resume, {
    compensation: { minimumSalary: '120000', targetSalary: '140000', preferenceType: 'annual' },
    availability: { workSchedule: 'Full-time' },
}, locationPreferences);

describe('comprehensive job match scoring', () => {
    it('scores a well-supported role strongly without using link freshness', () => {
        const assessment = assessJobMatch({
            title: 'Senior Frontend Engineer, React',
            description: 'Build accessible React and TypeScript interfaces. Requires 5+ years and a bachelor degree.',
            location: 'Remote - United States',
            workModel: 'Remote',
            salary: '$150,000 - $190,000',
            jobType: 'Full-time',
            seniority: 'Senior',
            jobFunction: 'Engineering',
        }, profile);

        expect(assessment.score).toBeGreaterThanOrEqual(80);
        expect(assessment.missingSkills).toEqual([]);
        expect(assessment.factors).toHaveLength(7);
        expect(assessment.factors.reduce((sum, factor) => sum + factor.maxScore, 0)).toBe(100);
        expect(assessment.confidence).toBe('High confidence');
    });

    it('penalizes a title and required-skill mismatch instead of returning an inflated score', () => {
        const assessment = assessJobMatch({
            title: 'Enterprise Account Executive',
            description: 'Own a quota, outbound sales, Salesforce CRM, and enterprise SaaS negotiations. Requires 7+ years.',
            location: 'New York, United States',
            workModel: 'On-site',
            salary: '$100,000 - $130,000',
            jobType: 'Full-time',
            seniority: 'Senior',
            jobFunction: 'Sales & Partnerships',
        }, profile);

        expect(assessment.score).toBeLessThan(55);
        expect(assessment.missingSkills).toEqual(expect.arrayContaining(['Salesforce', 'CRM', 'SaaS']));
        expect(assessment.label).toBe('Low match');
    });

    it('uses neutral points and lowers confidence when the listing omits evidence', () => {
        const assessment = assessJobMatch({
            title: 'Frontend Engineer',
            description: 'Join our product team.',
            location: 'Remote',
            workModel: 'Remote',
            salary: 'Not listed',
            jobType: 'Full-time',
            seniority: 'Mid Level',
            jobFunction: 'Engineering',
        }, profile);

        expect(assessment.factors.find((item) => item.key === 'skills')?.score).toBe(15);
        expect(assessment.confidence).not.toBe('High confidence');
    });

    it('annualizes hourly compensation exactly once', () => {
        const hourlyProfile = buildJobMatchProfile(resume, {
            compensation: { minimumSalary: '50', targetSalary: '60', preferenceType: 'hourly' },
        }, locationPreferences);

        expect(hourlyProfile.minimumSalary).toBe(104000);
        expect(hourlyProfile.targetSalary).toBe(124800);
    });
});
