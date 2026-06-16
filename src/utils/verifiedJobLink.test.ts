import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/scrapedJobsService', () => ({
    validateExternalJobLink: vi.fn(),
}));

import { validateExternalJobLink } from '../services/scrapedJobsService';
import {
    getJobLinkValidationErrorMessage,
    getJobLinkValidationStatus,
    isConfirmedBrokenJobLinkError,
    isHttpJobUrl,
    openVerifiedExternalJobLink,
} from './verifiedJobLink';

const mockedValidateExternalJobLink = vi.mocked(validateExternalJobLink);

const createPendingTab = () => ({
    closed: false,
    close: vi.fn(),
    document: document.implementation.createHTMLDocument('Checking'),
    location: { href: '' },
    opener: null as Window | null,
});

describe('verified job link helpers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('recognizes only HTTP(S) URLs as external job links', () => {
        expect(isHttpJobUrl(' https://jobs.example.com/123 ')).toBe(true);
        expect(isHttpJobUrl('http://jobs.example.com/123')).toBe(true);
        expect(isHttpJobUrl('/job-tracker')).toBe(false);
        expect(isHttpJobUrl('javascript:alert(1)')).toBe(false);
    });

    it('extracts validation status and detailed messages from callable errors', () => {
        const error = {
            message: 'Function failed',
            details: {
                validationStatus: 'expired',
                validationReason: 'Apply page says the job is closed.',
            },
        };

        expect(getJobLinkValidationStatus(error)).toBe('expired');
        expect(getJobLinkValidationErrorMessage(error)).toBe('Apply page says the job is closed.');
    });

    it('falls back to customData and plain messages for validation errors', () => {
        expect(getJobLinkValidationStatus({
            customData: {
                validationStatus: 'stale',
                validationReason: 'Redirected to a generic careers page.',
            },
        })).toBe('stale');

        expect(getJobLinkValidationErrorMessage({ message: 'HTTP 404' })).toBe('HTTP 404');
        expect(getJobLinkValidationErrorMessage(null)).toBe('CareerVivid could not verify that this link still opens the exact job.');
    });

    it('treats expired, stale, unknown, closed, and generic pages as broken', () => {
        expect(isConfirmedBrokenJobLinkError({ details: { validationStatus: 'expired' } })).toBe(true);
        expect(isConfirmedBrokenJobLinkError({ customData: { validationStatus: 'stale' } })).toBe(true);
        expect(isConfirmedBrokenJobLinkError({ details: { validationStatus: 'unknown' } })).toBe(true);
        expect(isConfirmedBrokenJobLinkError({ message: 'The job is closed or unavailable.' })).toBe(true);
        expect(isConfirmedBrokenJobLinkError({ message: 'Redirected to a generic careers page.' })).toBe(true);
        expect(isConfirmedBrokenJobLinkError({ message: 'HTTP 404' })).toBe(true);
        expect(isConfirmedBrokenJobLinkError({ message: 'Apply page did not expose an application action.' })).toBe(true);
    });

    it('does not delete jobs for temporary blocked or inconclusive validation errors', () => {
        expect(isConfirmedBrokenJobLinkError({
            code: 'functions/failed-precondition',
            message: 'Validation was blocked by the job site.',
            details: { validationStatus: 'blocked' },
        })).toBe(false);
        expect(isConfirmedBrokenJobLinkError({ message: 'Network timeout' })).toBe(false);
        expect(isConfirmedBrokenJobLinkError(undefined)).toBe(false);
    });

    it('opens the verified final URL after validation succeeds', async () => {
        const pendingTab = createPendingTab();
        vi.spyOn(window, 'open').mockReturnValue(pendingTab as unknown as Window);
        mockedValidateExternalJobLink.mockResolvedValue({
            finalUrl: 'https://job-boards.greenhouse.io/acme/jobs/123?gh_jid=123',
            validationStatus: 'valid',
            validationReason: 'Apply page is job-specific.',
            validatedAt: Date.now(),
        });

        const result = await openVerifiedExternalJobLink({
            url: 'https://job-boards.greenhouse.io/acme/jobs/123',
            title: 'Frontend Platform Engineer',
            company: 'Acme',
        });

        expect(result).toMatchObject({
            finalUrl: 'https://job-boards.greenhouse.io/acme/jobs/123?gh_jid=123',
            verified: true,
        });
        expect(pendingTab.location.href).toBe('https://job-boards.greenhouse.io/acme/jobs/123?gh_jid=123');
    });

    it('does not open the original URL by default when validation is inconclusive', async () => {
        const pendingTab = createPendingTab();
        vi.spyOn(window, 'open').mockReturnValue(pendingTab as unknown as Window);
        mockedValidateExternalJobLink.mockRejectedValue({
            code: 'functions/failed-precondition',
            message: 'Apply page appears to be blocking automated validation.',
            details: {
                validationStatus: 'blocked',
                validationReason: 'Apply page appears to be blocking automated validation.',
            },
        });

        await expect(openVerifiedExternalJobLink({
            url: 'https://jobs.example.com/acme/frontend',
            title: 'Frontend Platform Engineer',
            company: 'Acme',
        })).rejects.toMatchObject({
            details: {
                validationStatus: 'blocked',
            },
        });

        expect(pendingTab.close).toHaveBeenCalled();
        expect(pendingTab.location.href).toBe('');
    });

    it('does not open the original URL when the verified page lacks an application action', async () => {
        const pendingTab = createPendingTab();
        vi.spyOn(window, 'open').mockReturnValue(pendingTab as unknown as Window);
        mockedValidateExternalJobLink.mockRejectedValue({
            code: 'functions/failed-precondition',
            message: 'Apply page did not expose an application action.',
            details: {
                validationStatus: 'unknown',
                validationReason: 'Apply page did not expose an application action.',
            },
        });

        await expect(openVerifiedExternalJobLink({
            url: 'https://jobs.example.com/acme/frontend',
            title: 'Frontend Platform Engineer',
            company: 'Acme',
        })).rejects.toMatchObject({
            details: {
                validationStatus: 'unknown',
                validationReason: 'Apply page did not expose an application action.',
            },
        });

        expect(pendingTab.close).toHaveBeenCalled();
        expect(pendingTab.location.href).toBe('');
    });
});
