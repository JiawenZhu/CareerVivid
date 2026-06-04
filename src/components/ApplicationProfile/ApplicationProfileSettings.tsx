import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Bot, Briefcase, ClipboardCheck, Loader2, ShieldCheck } from 'lucide-react';
import type { ApplicationProfile, ApplicationWorkModelPreference, EeoAnswer, SalaryPreferenceType } from '../../types';
import { useApplicationProfile } from '../../hooks/useApplicationProfile';
import {
  listToInputValue,
  normalizeListInput,
  validateApplicationProfile,
  withApplicationProfileCompletion,
} from '../../utils/applicationProfile';

const EEO_OPTIONS = [
  { value: 'prefer_not_to_answer', label: 'Prefer not to answer' },
  { value: 'not_provided', label: 'Not provided yet' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'asian', label: 'Asian' },
  { value: 'black_or_african_american', label: 'Black or African American' },
  { value: 'hispanic_or_latino', label: 'Hispanic or Latino' },
  { value: 'white', label: 'White' },
  { value: 'two_or_more_races', label: 'Two or more races' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'not_disabled', label: 'Not disabled' },
  { value: 'protected_veteran', label: 'Protected veteran' },
  { value: 'not_a_veteran', label: 'Not a veteran' },
];

const booleanOptions = [
  { value: '', label: 'Choose' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

function booleanToInput(value: boolean | null): string {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return '';
}

function inputToBoolean(value: string): boolean | null {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
}

type NestedSection = keyof Omit<ApplicationProfile, 'uid' | 'completion' | 'createdAt' | 'updatedAt'>;

interface FieldProps {
  label: string;
  children: React.ReactNode;
  helper?: string;
}

const Field: React.FC<FieldProps> = ({ label, children, helper }) => (
  <label className="block">
    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{label}</span>
    <div className="mt-1">{children}</div>
    {helper && <span className="mt-1 block text-[11px] font-medium text-gray-400 dark:text-gray-500">{helper}</span>}
  </label>
);

const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-gray-800 dark:bg-[#0a0c10] dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-950/50';

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ icon, title, description, children }) => (
  <div className="rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#161b22]">
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-950 dark:text-gray-100">{title}</h3>
        <p className="mt-0.5 text-sm font-medium text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

export const ApplicationProfileSettings: React.FC = () => {
  const { profileWithDefaults, completionPercent, isLoading, error, saveProfile } = useApplicationProfile();
  const [draft, setDraft] = useState<ApplicationProfile>(profileWithDefaults);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setDraft(profileWithDefaults);
  }, [profileWithDefaults]);

  const validation = useMemo(() => validateApplicationProfile(draft), [draft]);

  const updateSection = <S extends NestedSection, K extends keyof ApplicationProfile[S]>(
    section: S,
    key: K,
    value: ApplicationProfile[S][K]
  ) => {
    setDraft(current => withApplicationProfileCompletion({
      ...current,
      [section]: {
        ...(current[section] as Record<string, unknown>),
        [key]: value,
      },
    } as ApplicationProfile));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      await saveProfile(withApplicationProfileCompletion(draft));
      setMessage('Application Profile saved.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(err.message || 'Failed to save Application Profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm font-semibold text-gray-500 dark:border-gray-800 dark:bg-[#161b22] dark:text-gray-400">
        Loading Application Profile...
      </div>
    );
  }

  return (
    <form id="application-profile" onSubmit={save} className="scroll-mt-6 space-y-5">
      <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-white p-5 shadow-sm dark:border-primary-900/50 dark:from-primary-950/30 dark:via-[#161b22] dark:to-[#161b22]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm dark:bg-gray-950 dark:text-primary-300">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-950 dark:text-gray-100">Application Profile</h2>
              <p className="mt-1 max-w-2xl text-sm font-medium text-gray-600 dark:text-gray-400">
                Saved answers the apply agent is allowed to use. Sensitive questions are never guessed.
              </p>
            </div>
          </div>
          <div className="min-w-[180px] rounded-xl border border-primary-100 bg-white px-4 py-3 dark:border-primary-900/50 dark:bg-gray-950">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
              <span>Readiness</span>
              <span>{completionPercent}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-2 rounded-full bg-primary-600 transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        </div>
        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      </div>

      <Section
        icon={<ShieldCheck size={18} />}
        title="Authorization and consent"
        description="Required before automatic submission can run."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Legally authorized to work">
            <select
              value={booleanToInput(draft.workAuthorization.legallyAuthorized)}
              onChange={event => updateSection('workAuthorization', 'legallyAuthorized', inputToBoolean(event.target.value))}
              className={inputClass}
            >
              {booleanOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Need sponsorship now">
            <select
              value={booleanToInput(draft.workAuthorization.needsSponsorshipNow)}
              onChange={event => updateSection('workAuthorization', 'needsSponsorshipNow', inputToBoolean(event.target.value))}
              className={inputClass}
            >
              {booleanOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Need sponsorship in future">
            <select
              value={booleanToInput(draft.workAuthorization.needsSponsorshipFuture)}
              onChange={event => updateSection('workAuthorization', 'needsSponsorshipFuture', inputToBoolean(event.target.value))}
              className={inputClass}
            >
              {booleanOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-4 grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950 md:grid-cols-2">
          <label className="flex items-start gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={draft.consent.autoSubmitAuthorized}
              onChange={event => updateSection('consent', 'autoSubmitAuthorized', event.target.checked)}
              className="mt-1"
            />
            CareerVivid may submit approved applications on my behalf.
          </label>
          <label className="flex items-start gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={draft.consent.receiptStorageAuthorized}
              onChange={event => updateSection('consent', 'receiptStorageAuthorized', event.target.checked)}
              className="mt-1"
            />
            Store receipts for submitted applications.
          </label>
        </div>
      </Section>

      <Section
        icon={<BadgeCheck size={18} />}
        title="Identity and contact"
        description="Used for standard ATS profile fields."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="First name"><input value={draft.identity.firstName} onChange={event => updateSection('identity', 'firstName', event.target.value)} className={inputClass} /></Field>
          <Field label="Last name"><input value={draft.identity.lastName} onChange={event => updateSection('identity', 'lastName', event.target.value)} className={inputClass} /></Field>
          <Field label="Email"><input value={draft.identity.email} onChange={event => updateSection('identity', 'email', event.target.value)} className={inputClass} /></Field>
          <Field label="Phone"><input value={draft.identity.phone} onChange={event => updateSection('identity', 'phone', event.target.value)} className={inputClass} /></Field>
          <Field label="Address"><input value={draft.identity.address} onChange={event => updateSection('identity', 'address', event.target.value)} className={inputClass} /></Field>
          <Field label="City"><input value={draft.identity.city} onChange={event => updateSection('identity', 'city', event.target.value)} className={inputClass} /></Field>
          <Field label="State"><input value={draft.identity.state} onChange={event => updateSection('identity', 'state', event.target.value)} className={inputClass} /></Field>
          <Field label="Postal code"><input value={draft.identity.postalCode} onChange={event => updateSection('identity', 'postalCode', event.target.value)} className={inputClass} /></Field>
          <Field label="Country"><input value={draft.identity.country} onChange={event => updateSection('identity', 'country', event.target.value)} className={inputClass} /></Field>
          <Field label="LinkedIn"><input value={draft.identity.linkedinUrl} onChange={event => updateSection('identity', 'linkedinUrl', event.target.value)} className={inputClass} /></Field>
          <Field label="Portfolio"><input value={draft.identity.portfolioUrl} onChange={event => updateSection('identity', 'portfolioUrl', event.target.value)} className={inputClass} /></Field>
        </div>
      </Section>

      <Section
        icon={<ClipboardCheck size={18} />}
        title="EEO, compensation, and logistics"
        description="EEO fields default to Prefer not to answer."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Gender">
            <select value={draft.eeo.gender} onChange={event => updateSection('eeo', 'gender', event.target.value as EeoAnswer)} className={inputClass}>
              {EEO_OPTIONS.slice(0, 5).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Race / ethnicity">
            <select value={draft.eeo.raceEthnicity} onChange={event => updateSection('eeo', 'raceEthnicity', event.target.value as EeoAnswer)} className={inputClass}>
              {[EEO_OPTIONS[0], EEO_OPTIONS[1], ...EEO_OPTIONS.slice(5, 10)].map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Disability status">
            <select value={draft.eeo.disabilityStatus} onChange={event => updateSection('eeo', 'disabilityStatus', event.target.value as EeoAnswer)} className={inputClass}>
              {[EEO_OPTIONS[0], EEO_OPTIONS[1], ...EEO_OPTIONS.slice(10, 12)].map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Veteran status">
            <select value={draft.eeo.veteranStatus} onChange={event => updateSection('eeo', 'veteranStatus', event.target.value as EeoAnswer)} className={inputClass}>
              {[EEO_OPTIONS[0], EEO_OPTIONS[1], ...EEO_OPTIONS.slice(12, 14)].map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Target compensation"><input value={draft.compensation.targetSalary} onChange={event => updateSection('compensation', 'targetSalary', event.target.value)} className={inputClass} /></Field>
          <Field label="Minimum compensation"><input value={draft.compensation.minimumSalary} onChange={event => updateSection('compensation', 'minimumSalary', event.target.value)} className={inputClass} /></Field>
          <Field label="Compensation type">
            <select value={draft.compensation.preferenceType} onChange={event => updateSection('compensation', 'preferenceType', event.target.value as SalaryPreferenceType)} className={inputClass}>
              <option value="annual">Annual</option>
              <option value="hourly">Hourly</option>
            </select>
          </Field>
          <Field label="Work model preference">
            <select value={draft.relocationRemote.workModelPreference} onChange={event => updateSection('relocationRemote', 'workModelPreference', event.target.value as ApplicationWorkModelPreference)} className={inputClass}>
              <option value="flexible">Flexible</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </Field>
          <Field label="Willing to relocate">
            <select value={booleanToInput(draft.relocationRemote.willingToRelocate)} onChange={event => updateSection('relocationRemote', 'willingToRelocate', inputToBoolean(event.target.value))} className={inputClass}>
              {booleanOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Preferred locations" helper="Comma-separated">
            <input value={listToInputValue(draft.relocationRemote.preferredLocations)} onChange={event => updateSection('relocationRemote', 'preferredLocations', normalizeListInput(event.target.value))} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section
        icon={<Briefcase size={18} />}
        title="Availability, legal, and auto-apply rules"
        description="Rules decide which jobs can be submitted automatically."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Start date"><input type="date" value={draft.availability.startDate} onChange={event => updateSection('availability', 'startDate', event.target.value)} className={inputClass} /></Field>
          <Field label="Work schedule"><input value={draft.availability.workSchedule} onChange={event => updateSection('availability', 'workSchedule', event.target.value)} className={inputClass} /></Field>
          <Field label="Timezone"><input value={draft.availability.timezone} onChange={event => updateSection('availability', 'timezone', event.target.value)} className={inputClass} /></Field>
          <Field label="Background check consent">
            <select value={booleanToInput(draft.backgroundLegal.backgroundCheckConsent)} onChange={event => updateSection('backgroundLegal', 'backgroundCheckConsent', inputToBoolean(event.target.value))} className={inputClass}>
              {booleanOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Age eligibility attested">
            <select value={booleanToInput(draft.backgroundLegal.ageEligibilityAttested)} onChange={event => updateSection('backgroundLegal', 'ageEligibilityAttested', inputToBoolean(event.target.value))} className={inputClass}>
              {booleanOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Work eligibility attested">
            <select value={booleanToInput(draft.backgroundLegal.workEligibilityAttested)} onChange={event => updateSection('backgroundLegal', 'workEligibilityAttested', inputToBoolean(event.target.value))} className={inputClass}>
              {booleanOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Max per day"><input type="number" min={1} max={100} value={draft.autoApplyRules.maxApplicationsPerDay} onChange={event => updateSection('autoApplyRules', 'maxApplicationsPerDay', Number(event.target.value))} className={inputClass} /></Field>
          <Field label="Max per night"><input type="number" min={1} max={50} value={draft.autoApplyRules.maxApplicationsPerNight} onChange={event => updateSection('autoApplyRules', 'maxApplicationsPerNight', Number(event.target.value))} className={inputClass} /></Field>
          <Field label="Minimum match score"><input type="number" min={0} max={100} value={draft.autoApplyRules.minimumMatchScore} onChange={event => updateSection('autoApplyRules', 'minimumMatchScore', Number(event.target.value))} className={inputClass} /></Field>
          <Field label="Excluded companies" helper="Comma-separated">
            <input value={listToInputValue(draft.autoApplyRules.excludedCompanies)} onChange={event => updateSection('autoApplyRules', 'excludedCompanies', normalizeListInput(event.target.value))} className={inputClass} />
          </Field>
          <Field label="Excluded job titles" helper="Comma-separated">
            <input value={listToInputValue(draft.autoApplyRules.excludedJobTitles)} onChange={event => updateSection('autoApplyRules', 'excludedJobTitles', normalizeListInput(event.target.value))} className={inputClass} />
          </Field>
        </div>
        <div className="mt-4 grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950 md:grid-cols-3">
          <label className="flex items-start gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <input type="checkbox" checked={draft.autoApplyRules.enabled} onChange={event => updateSection('autoApplyRules', 'enabled', event.target.checked)} className="mt-1" />
            Enable Apply Agent queueing.
          </label>
          <label className="flex items-start gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <input type="checkbox" checked={draft.autoApplyRules.requireApprovalForLowConfidence} onChange={event => updateSection('autoApplyRules', 'requireApprovalForLowConfidence', event.target.checked)} className="mt-1" />
            Require approval for low confidence.
          </label>
          <label className="flex items-start gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <input type="checkbox" checked={draft.autoApplyRules.requireApprovalForMissingSensitiveAnswers} onChange={event => updateSection('autoApplyRules', 'requireApprovalForMissingSensitiveAnswers', event.target.checked)} className="mt-1" />
            Stop when sensitive answers are missing.
          </label>
        </div>
      </Section>

      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-gray-800 dark:bg-[#161b22]/95 md:flex-row md:items-center md:justify-between">
        <div>
          <p className={`text-sm font-bold ${validation.requiredReady ? 'text-emerald-600' : 'text-amber-600'}`}>
            {validation.requiredReady ? 'Ready for auto-apply' : `${validation.missingRequiredFields.length} required item(s) missing`}
          </p>
          {!validation.requiredReady && (
            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              {validation.missingRequiredFields.slice(0, 4).join(', ')}
              {validation.missingRequiredFields.length > 4 ? '...' : ''}
            </p>
          )}
          {message && <p className="mt-1 text-xs font-bold text-primary-600 dark:text-primary-300">{message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          Save Application Profile
        </button>
      </div>
    </form>
  );
};

export default ApplicationProfileSettings;
