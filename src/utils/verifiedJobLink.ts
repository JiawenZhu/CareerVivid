import { validateExternalJobLink } from '../services/scrapedJobsService';

export type VerifiedJobLinkInput = {
    url: string;
    title: string;
    company?: string;
    fallbackToOriginal?: boolean;
};

export type VerifiedJobLinkOpenResult = {
    finalUrl: string;
    verified: boolean;
    validationReason?: string;
};

export const isHttpJobUrl = (value?: string): boolean => /^https?:\/\//i.test((value || '').trim());

export const getJobLinkValidationStatus = (error: unknown): string | undefined => {
    if (!error || typeof error !== 'object') return undefined;
    const maybeError = error as {
        details?: {
            validationStatus?: string;
        };
        customData?: {
            validationStatus?: string;
        };
    };
    return maybeError.details?.validationStatus || maybeError.customData?.validationStatus;
};

export const getJobLinkValidationErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object') {
        const maybeError = error as {
            message?: string;
            details?: {
                validationReason?: string;
                validationStatus?: string;
            };
            customData?: {
                validationReason?: string;
                validationStatus?: string;
            };
        };
        if (maybeError.details?.validationReason) return maybeError.details.validationReason;
        if (maybeError.customData?.validationReason) return maybeError.customData.validationReason;
        if (maybeError.message) return maybeError.message;
    }

    return 'CareerVivid could not verify that this link still opens the exact job.';
};

export const isConfirmedBrokenJobLinkError = (error: unknown): boolean => {
    const status = getJobLinkValidationStatus(error);
    if (status === 'expired' || status === 'stale' || status === 'unknown') return true;

    if (!error || typeof error !== 'object') return false;
    const maybeError = error as { code?: string; message?: string };
    const message = maybeError.message || '';
    const explicitBrokenPage = /job is closed|job is no longer|closed or unavailable|HTTP 404|HTTP 410|generic careers page|not a specific job|application action|not include enough matching job/i.test(message);

    return explicitBrokenPage;
};

export const openVerifiedExternalJobLink = async ({
    url,
    title,
    company,
    fallbackToOriginal = false,
}: VerifiedJobLinkInput): Promise<VerifiedJobLinkOpenResult> => {
    if (!isHttpJobUrl(url)) {
        throw new Error('This job does not have a valid external apply link.');
    }

    const pendingTab = window.open('about:blank', '_blank');
    if (pendingTab) {
        pendingTab.opener = null;
        pendingTab.document.title = 'Checking job link...';
        pendingTab.document.body.innerHTML = '<p style="font-family: system-ui, sans-serif; padding: 24px;">CareerVivid is checking this job link...</p>';
    }

    try {
        const validation = await validateExternalJobLink({ url, title, company });
        if (pendingTab && !pendingTab.closed) {
            pendingTab.location.href = validation.finalUrl;
        } else {
            window.open(validation.finalUrl, '_blank', 'noopener,noreferrer');
        }
        return {
            finalUrl: validation.finalUrl,
            verified: true,
            validationReason: validation.validationReason,
        };
    } catch (error) {
        if (fallbackToOriginal && !isConfirmedBrokenJobLinkError(error)) {
            if (pendingTab && !pendingTab.closed) {
                pendingTab.location.href = url;
            } else {
                window.open(url, '_blank', 'noopener,noreferrer');
            }

            return {
                finalUrl: url,
                verified: false,
                validationReason: getJobLinkValidationErrorMessage(error),
            };
        }

        pendingTab?.close();
        throw error;
    }
};
