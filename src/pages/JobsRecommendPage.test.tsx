import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import JobsRecommendPage from './JobsRecommendPage';
import { ScrapedRecommendedJob } from '../services/scrapedJobsService';
import type { JobApplicationData } from '../types';

const mocks = vi.hoisted(() => ({
    addJobApplication: vi.fn(),
    getRecommendedScrapedJobs: vi.fn(),
    jobApplications: [] as JobApplicationData[],
    updateJobApplication: vi.fn(),
    validateRecommendedJobOpen: vi.fn(),
    navigate: vi.fn(),
}));

vi.mock('../components/Layout/AppLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('react-helmet-async', () => ({
    Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../hooks/useJobTracker', () => ({
    useJobTracker: () => ({
        jobApplications: mocks.jobApplications,
        addJobApplication: mocks.addJobApplication,
        updateJobApplication: mocks.updateJobApplication,
    }),
}));

vi.mock('../hooks/usePortfolios', () => ({
    usePortfolios: () => ({
        portfolios: [{ id: 'portfolio-1', title: 'Portfolio' }],
    }),
}));

vi.mock('../hooks/useResumes', () => ({
    useResumes: () => ({
        resumes: [{ id: 'resume-1', title: 'Resume' }],
    }),
}));

vi.mock('../services/scrapedJobsService', () => ({
    getRecommendedScrapedJobs: mocks.getRecommendedScrapedJobs,
    validateRecommendedJobOpen: mocks.validateRecommendedJobOpen,
}));

vi.mock('../utils/navigation', () => ({
    navigate: mocks.navigate,
}));

const makeScrapedJob = (overrides: Partial<ScrapedRecommendedJob> = {}): ScrapedRecommendedJob => ({
    id: 'greenhouse-acme-123',
    title: 'Frontend Platform Engineer',
    company: 'Acme AI',
    location: 'Remote - US',
    workModel: 'Remote',
    salary: '$150K - $190K',
    jobType: 'Full-time',
    seniority: 'Mid Level',
    postedAt: Date.now(),
    source: 'scraped',
    sourceLabel: 'Greenhouse verified',
    applyUrl: 'https://job-boards.greenhouse.io/acme/jobs/123',
    finalUrl: 'https://job-boards.greenhouse.io/acme/jobs/123',
    description: 'Build React and TypeScript product surfaces for a validated application workflow. Work with backend teams on reliable job matching.',
    matchedKeywords: ['React', 'TypeScript', 'Job matching'],
    missingKeywords: ['Greenhouse'],
    signals: ['Direct application page'],
    provider: 'greenhouse',
    sourceKey: 'acme',
    sourceJobId: '123',
    validationStatus: 'valid',
    validationReason: 'Apply page is job-specific, relevant, and has an application action.',
    validatedAt: Date.now(),
    fetchedAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
});

const createPendingTab = () => ({
    closed: false,
    close: vi.fn(),
    document: document.implementation.createHTMLDocument('Checking'),
    location: { href: '' },
    opener: null as Window | null,
});

describe('JobsRecommendPage apply-ready recommendations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.jobApplications = [];
        mocks.addJobApplication.mockResolvedValue('tracker-1');
        mocks.updateJobApplication.mockResolvedValue(undefined);
    });

    it('shows only validated scraped jobs in Recommended and opens the external apply URL directly', async () => {
        const validJob = makeScrapedJob();
        const expiredJob = makeScrapedJob({
            id: 'greenhouse-acme-expired',
            title: 'Expired Backend Engineer',
            applyUrl: 'https://job-boards.greenhouse.io/acme/jobs/expired',
            finalUrl: 'https://job-boards.greenhouse.io/acme/jobs/expired',
            validationStatus: 'expired',
            validationReason: 'Apply page says the job is closed or unavailable.',
        });
        const openedTab = createPendingTab();

        mocks.getRecommendedScrapedJobs.mockResolvedValue([validJob, expiredJob]);
        mocks.validateRecommendedJobOpen.mockResolvedValue({
            jobId: validJob.id,
            finalUrl: 'https://job-boards.greenhouse.io/acme/jobs/123?gh_jid=123',
            validationStatus: 'valid',
            validationReason: 'Apply page is job-specific, relevant, and has an application action.',
            validatedAt: Date.now(),
        });
        vi.spyOn(window, 'open').mockReturnValue(openedTab as unknown as Window);

        render(<JobsRecommendPage />);

        expect(await screen.findByRole('heading', { name: 'Frontend Platform Engineer' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Expired Backend Engineer' })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Apply now/i }));

        await waitFor(() => {
            expect(window.open).toHaveBeenCalledWith(validJob.finalUrl, '_blank', 'noopener,noreferrer');
        });
        expect(mocks.validateRecommendedJobOpen).not.toHaveBeenCalled();
        expect(await screen.findByText('Opened Acme AI\'s apply page.')).toBeInTheDocument();
    });

    it('keeps CLI Harness controls out of the recommendations WebUI', async () => {
        mocks.getRecommendedScrapedJobs.mockResolvedValue([makeScrapedJob()]);

        render(<JobsRecommendPage />);

        expect(await screen.findByRole('heading', { name: 'Frontend Platform Engineer' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Apply now/i })).toBeInTheDocument();
        expect(screen.queryByText(/Harness action plan/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Harness agent/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Run Harness plan/i })).not.toBeInTheDocument();
        expect(screen.queryByText(/cv agent --jobs/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Start best match/i })).not.toBeInTheDocument();
        expect(screen.queryByText(/Verify visible links/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Copy agent work plan/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Set up cv agent/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Shortlist saved/i)).not.toBeInTheDocument();
    });

    it('keeps a scraped job visible when the direct apply action opens its saved URL', async () => {
        const staleJob = makeScrapedJob();
        const openedTab = createPendingTab();

        mocks.getRecommendedScrapedJobs.mockResolvedValue([staleJob]);
        mocks.validateRecommendedJobOpen.mockRejectedValue({
            code: 'functions/failed-precondition',
            message: 'Apply page says the job is closed or unavailable.',
            details: {
                validationStatus: 'expired',
                validationReason: 'Apply page says the job is closed or unavailable.',
            },
        });
        vi.spyOn(window, 'open').mockReturnValue(openedTab as unknown as Window);

        render(<JobsRecommendPage />);

        expect(await screen.findByRole('heading', { name: 'Frontend Platform Engineer' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Apply now/i }));

        await waitFor(() => {
            expect(window.open).toHaveBeenCalledWith(staleJob.finalUrl, '_blank', 'noopener,noreferrer');
        });
        expect(openedTab.close).not.toHaveBeenCalled();
        expect(screen.getByRole('heading', { name: 'Frontend Platform Engineer' })).toBeInTheDocument();
        expect(await screen.findByText('Opened Acme AI\'s apply page.')).toBeInTheDocument();
    });

    it('opens tracker-backed recommendations directly instead of closing a temporary validation tab', async () => {
        const openedTab = createPendingTab();
        mocks.jobApplications = [{
            id: 'tracker-saved-1',
            userId: 'user-1',
            jobTitle: 'Saved Frontend Role',
            companyName: 'Acme AI',
            location: 'Remote',
            jobPostURL: 'https://jobs.example.com/acme/frontend',
            applicationURL: 'https://jobs.example.com/acme/frontend',
            jobDescription: 'Build frontend product surfaces.',
            applicationStatus: 'To Apply',
            workModel: 'Remote',
            createdAt: null,
            updatedAt: null,
        }];
        mocks.getRecommendedScrapedJobs.mockResolvedValue([]);
        vi.spyOn(window, 'open').mockReturnValue(openedTab as unknown as Window);

        render(<JobsRecommendPage />);

        fireEvent.click(await screen.findByRole('button', { name: /Saved 1/i }));
        expect(await screen.findByRole('heading', { name: 'Saved Frontend Role' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Open apply page/i }));

        await waitFor(() => {
            expect(window.open).toHaveBeenCalledWith('https://jobs.example.com/acme/frontend', '_blank', 'noopener,noreferrer');
        });
        expect(openedTab.close).not.toHaveBeenCalled();
        expect(mocks.updateJobApplication).not.toHaveBeenCalled();
        expect(screen.getByRole('heading', { name: 'Saved Frontend Role' })).toBeInTheDocument();
        expect(await screen.findByText('Opened Acme AI\'s apply page.')).toBeInTheDocument();
    });
});
