import type {
  ApplicationAnswerPlanItem,
  ApplicationProfile,
  ApplicationWorkModelPreference,
  EeoAnswer,
  ResumeData,
  SalaryPreferenceType,
  UserProfile,
} from '../types';

const PREFER_NOT_TO_ANSWER = 'prefer_not_to_answer';

const SENSITIVE_LABEL_PATTERNS = [
  /sponsor(ship)?|visa|h-?1b|work authorization|authorized to work|legally authorized/i,
  /\beeo\b|equal employment|gender|sex\b|race|ethnicity|hispanic|latino/i,
  /disability|disabled/i,
  /veteran|military service/i,
  /salary|compensation|pay expectation|expected pay|desired pay/i,
  /relocat|remote|hybrid|on-?site|onsite/i,
  /background check|criminal|conviction/i,
  /age|over 18|older than 18|eligib(le|ility) to work/i,
];

export function createDefaultApplicationProfile(
  uid?: string,
  resume?: ResumeData,
  userProfile?: UserProfile | null
): ApplicationProfile {
  const personal = resume?.personalDetails;
  const links = resume?.websites || [];
  const findUrl = (match: RegExp) => links.find(link => match.test(`${link.label} ${link.url}`))?.url || '';

  return {
    uid,
    workAuthorization: {
      legallyAuthorized: null,
      needsSponsorshipNow: null,
      needsSponsorshipFuture: null,
    },
    identity: {
      firstName: personal?.firstName || '',
      lastName: personal?.lastName || '',
      email: personal?.email || userProfile?.email || '',
      phone: personal?.phone || '',
      address: personal?.address || '',
      city: personal?.city || '',
      state: '',
      postalCode: personal?.postalCode || '',
      country: personal?.country || '',
      linkedinUrl: findUrl(/linkedin/i),
      portfolioUrl: findUrl(/portfolio|website|personal/i),
    },
    eeo: {
      gender: PREFER_NOT_TO_ANSWER,
      raceEthnicity: PREFER_NOT_TO_ANSWER,
      disabilityStatus: PREFER_NOT_TO_ANSWER,
      veteranStatus: PREFER_NOT_TO_ANSWER,
    },
    compensation: {
      targetSalary: '',
      minimumSalary: '',
      preferenceType: 'annual',
    },
    relocationRemote: {
      willingToRelocate: null,
      preferredLocations: [],
      workModelPreference: 'flexible',
    },
    availability: {
      startDate: '',
      workSchedule: 'Full-time',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    },
    backgroundLegal: {
      backgroundCheckConsent: null,
      ageEligibilityAttested: null,
      workEligibilityAttested: null,
    },
    autoApplyRules: {
      enabled: false,
      maxApplicationsPerDay: 10,
      maxApplicationsPerNight: 5,
      minimumMatchScore: 70,
      excludedCompanies: [],
      excludedJobTitles: [],
      requireApprovalForLowConfidence: true,
      requireApprovalForMissingSensitiveAnswers: true,
    },
    consent: {
      autoSubmitAuthorized: false,
      receiptStorageAuthorized: true,
    },
    completion: {
      requiredReady: false,
      missingRequiredFields: [],
    },
  };
}

export function isSensitiveApplicationField(label: string): boolean {
  return SENSITIVE_LABEL_PATTERNS.some(pattern => pattern.test(label));
}

export function formatEeoAnswer(value: EeoAnswer): string {
  if (!value || value === 'not_provided') return '';
  if (value === PREFER_NOT_TO_ANSWER) return 'Prefer not to answer';
  return value;
}

export function normalizeListInput(value: string): string[] {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

export function listToInputValue(values?: string[]): string {
  return (values || []).join(', ');
}

export function validateApplicationProfile(profile: ApplicationProfile): {
  requiredReady: boolean;
  missingRequiredFields: string[];
} {
  const missing: string[] = [];
  const requireText = (label: string, value?: string) => {
    if (!value?.trim()) missing.push(label);
  };
  const requireBoolean = (label: string, value: boolean | null) => {
    if (value === null || value === undefined) missing.push(label);
  };

  requireText('First name', profile.identity.firstName);
  requireText('Last name', profile.identity.lastName);
  requireText('Email', profile.identity.email);
  requireText('Phone', profile.identity.phone);
  requireText('Country', profile.identity.country);

  requireBoolean('Legally authorized to work', profile.workAuthorization.legallyAuthorized);
  requireBoolean('Sponsorship needed now', profile.workAuthorization.needsSponsorshipNow);
  requireBoolean('Sponsorship needed in the future', profile.workAuthorization.needsSponsorshipFuture);
  requireBoolean('Willing to relocate', profile.relocationRemote.willingToRelocate);
  requireBoolean('Background check consent', profile.backgroundLegal.backgroundCheckConsent);
  requireBoolean('Age eligibility attestation', profile.backgroundLegal.ageEligibilityAttested);
  requireBoolean('Work eligibility attestation', profile.backgroundLegal.workEligibilityAttested);

  if (!profile.eeo.gender) missing.push('EEO gender answer');
  if (!profile.eeo.raceEthnicity) missing.push('EEO race/ethnicity answer');
  if (!profile.eeo.disabilityStatus) missing.push('Disability status answer');
  if (!profile.eeo.veteranStatus) missing.push('Veteran status answer');
  if (!profile.consent.autoSubmitAuthorized) missing.push('Auto-submit authorization');
  if (profile.autoApplyRules.minimumMatchScore < 0 || profile.autoApplyRules.minimumMatchScore > 100) {
    missing.push('Minimum match score from 0 to 100');
  }

  return {
    requiredReady: missing.length === 0,
    missingRequiredFields: missing,
  };
}

export function withApplicationProfileCompletion(profile: ApplicationProfile): ApplicationProfile {
  const completion = validateApplicationProfile(profile);
  return {
    ...profile,
    completion,
  };
}

function boolAnswer(value: boolean | null): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '';
}

function salaryAnswer(profile: ApplicationProfile): string {
  const target = profile.compensation.targetSalary.trim();
  const minimum = profile.compensation.minimumSalary.trim();
  const unit = profile.compensation.preferenceType === 'hourly' ? 'hourly' : 'annual';
  if (target && minimum) return `${target} target, ${minimum} minimum ${unit}`;
  if (target) return `${target} ${unit}`;
  if (minimum) return `${minimum} minimum ${unit}`;
  return '';
}

function workModelLabel(value: ApplicationWorkModelPreference): string {
  if (value === 'onsite') return 'On-site';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function answerFromProfile(label: string, profile: ApplicationProfile): string {
  const normalized = label.toLowerCase();
  if (/sponsor|visa/.test(normalized)) {
    if (/future/.test(normalized)) return boolAnswer(profile.workAuthorization.needsSponsorshipFuture);
    return boolAnswer(profile.workAuthorization.needsSponsorshipNow);
  }
  if (/authorized|work authorization|legally authorized|eligible to work/.test(normalized)) {
    return boolAnswer(profile.workAuthorization.legallyAuthorized);
  }
  if (/gender|sex\b/.test(normalized)) return formatEeoAnswer(profile.eeo.gender);
  if (/race|ethnicity|hispanic|latino/.test(normalized)) return formatEeoAnswer(profile.eeo.raceEthnicity);
  if (/disability|disabled/.test(normalized)) return formatEeoAnswer(profile.eeo.disabilityStatus);
  if (/veteran|military/.test(normalized)) return formatEeoAnswer(profile.eeo.veteranStatus);
  if (/salary|compensation|pay/.test(normalized)) return salaryAnswer(profile);
  if (/relocat/.test(normalized)) return boolAnswer(profile.relocationRemote.willingToRelocate);
  if (/remote|hybrid|on-?site|onsite/.test(normalized)) return workModelLabel(profile.relocationRemote.workModelPreference);
  if (/background check|criminal|conviction/.test(normalized)) return boolAnswer(profile.backgroundLegal.backgroundCheckConsent);
  if (/age|over 18|older than 18/.test(normalized)) return boolAnswer(profile.backgroundLegal.ageEligibilityAttested);
  return '';
}

export function resolveSensitiveApplicationAnswer(
  label: string,
  profile: ApplicationProfile | null
): ApplicationAnswerPlanItem | null {
  if (!isSensitiveApplicationField(label)) return null;
  const answer = profile ? answerFromProfile(label, profile) : '';
  return {
    label,
    answer,
    confidence: answer ? 'high' : 'low',
    source: answer ? 'application_profile' : 'skipped',
    sensitive: true,
    requiresUser: !answer,
    reasoning: answer
      ? 'Resolved from the saved Application Profile.'
      : 'Sensitive application question requires a saved user-approved answer.',
  };
}

export function getApplicationProfileCompletionPercent(profile: ApplicationProfile | null): number {
  if (!profile) return 0;
  const { missingRequiredFields } = validateApplicationProfile(profile);
  const requiredCount = 17;
  return Math.max(0, Math.round(((requiredCount - missingRequiredFields.length) / requiredCount) * 100));
}
