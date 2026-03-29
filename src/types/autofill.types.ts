/**
 * CareerVivid Auto-Apply — Core Type Definitions
 *
 * These types define the data contract between:
 *  - The background service worker (syncs data from Firebase)
 *  - The content script AutoFill Engine (reads from chrome.storage)
 *  - The popup UI (displays status, triggers fills)
 */

// ---------------------------------------------------------------------------
// User Profile — the normalized data used to fill forms
// ---------------------------------------------------------------------------
export interface AutoFillWorkExperience {
  title: string;
  company: string;
  /** ISO year-month: "2022-01" */
  startDate: string;
  /** ISO year-month or "Present" */
  endDate: string;
  description: string;
  location?: string;
}

export interface AutoFillEducation {
  degree: string;
  /** e.g. "Computer Science" */
  fieldOfStudy: string;
  school: string;
  /** ISO year-month: "2020-05" */
  graduationDate: string;
  gpa?: string;
}

export interface AutoFillProfile {
  // Personal
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  city?: string;
  state?: string;
  country?: string;

  // Professional narrative
  summary: string;

  // Experience & Education
  workExperience: AutoFillWorkExperience[];
  education: AutoFillEducation[];

  // Skills (flat array; joined with commas for text inputs)
  skills: string[];

  // Metadata
  sourceResumeId: string;
  lastSyncedAt: string;
}

// ---------------------------------------------------------------------------
// Form Field — what the ATS adapter discovers on the page
// ---------------------------------------------------------------------------
export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'url'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'date'
  | 'unknown';

export interface FormField {
  /** Normalized label text (lowercased, trimmed) */
  label: string;
  /** The raw DOM element */
  element: HTMLElement;
  type: FieldType;
  /** True if the adapter already filled this field */
  filled: boolean;
  /** The value we wrote, for reporting */
  filledValue?: string;
  /** Why it was skipped, if applicable */
  skipReason?: string;
}

// ---------------------------------------------------------------------------
// Adapter Interface — one implementation per ATS platform
// ---------------------------------------------------------------------------
export interface ATSAdapter {
  /** Human-readable platform name, e.g. "Greenhouse" */
  name: string;
  /** Hostname patterns that this adapter handles */
  matchPatterns: RegExp[];
  /** Returns true when the current page is actually an application form */
  isApplicationPage(): boolean;
  /** Discover all fillable fields on the current page */
  getFormFields(): FormField[];
  /** Write a value into a single form field (React-safe) */
  fillField(field: FormField, value: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// AutoFill Result — returned after a fill attempt
// ---------------------------------------------------------------------------
export interface AutoFillResult {
  platform: string;
  filledCount: number;
  skippedCount: number;
  errorCount: number;
  fields: FormField[];
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Chrome Extension Message Types
// ---------------------------------------------------------------------------
export type ExtensionMessage =
  | { type: 'GET_RESUME_DATA' }
  | { type: 'AUTOFILL_APPLICATION'; resumeId?: string }
  | { type: 'FILL_FORM'; profile: AutoFillProfile }
  | { type: 'FILL_COMPLETE'; result: AutoFillResult }
  | { type: 'EXTRACT_JOB_DATA' }
  | { type: 'SAVE_JOB'; job: Partial<JobData> }
  | { type: 'GET_ATS_CONTEXT' }
  | { type: 'AUTH_STATE_CHANGED'; isAuthenticated: boolean }
  | { type: 'SYNC_PROFILE'; userId: string; resumeId: string }
  | { type: 'OPEN_RESUME_PICKER' };

export interface JobData {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
}

export interface ATSContext {
  platform: string | null;
  isApplicationPage: boolean;
  isJobListingPage: boolean;
}
