import { ResumeData } from '../../../types';
import { PortfolioData } from '../types/portfolio';

export const mapResumeToPortfolio = (resume: ResumeData, userId: string): PortfolioData => {
    const now = Date.now();

    return {
        id: crypto.randomUUID(),
        userId,
        title: `${resume.title} - Portfolio`,
        templateId: 'minimalist', // Default start

        hero: {
            headline: `${resume.personalDetails.firstName} ${resume.personalDetails.lastName}`,
            subheadline: resume.personalDetails.jobTitle || 'Professional',
            avatarUrl: resume.personalDetails.photo,
            ctaPrimaryLabel: 'View My Work',
            ctaPrimaryUrl: '#projects',
            ctaSecondaryLabel: 'Contact Me',
            ctaSecondaryUrl: `mailto:${resume.personalDetails.email}`
        },

        about: resume.professionalSummary || '',

        timeline: resume.employmentHistory || [],
        education: resume.education || [],
        techStack: resume.skills || [],

        projects: [], // Start empty as Resume doesn't have structured projects usually

        socialLinks: resume.websites || [],
        contactEmail: resume.personalDetails.email,

        theme: {
            primaryColor: resume.themeColor || '#3b82f6',
            darkMode: true // Google IDX default style preference
        },

        createdAt: now,
        updatedAt: now
    };
};
