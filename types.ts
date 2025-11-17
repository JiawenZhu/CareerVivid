



export interface PersonalDetails {
  jobTitle: string;
  photo: string; // URL to image in Firebase Storage
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface WebsiteLink {
  id: string;
  label: string;
  url: string;
}

export interface Skill {
  id: string;
  name: string;
  level: 'Novice' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface Language {
  id: string;
  name: string;
  level: string;
}

export interface EmploymentHistory {
  id: string;
  jobTitle: string;
  employer: string;
  city: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  city: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ResumeData {
  id: string;
  title: string;
  updatedAt: string;
  templateId: TemplateId;
  personalDetails: PersonalDetails;
  professionalSummary: string;
  websites: WebsiteLink[];
  skills: Skill[];
  employmentHistory: EmploymentHistory[];
  education: Education[];
  languages: Language[];
  themeColor: string;
  titleFont: string;
  bodyFont: string;
  language: string;
  section?: string;
}

export type TemplateId = string;

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  availableColors: string[];
}

export interface TemplateProps {
  resume: ResumeData;
  themeColor: string;
  titleFont: string;
  bodyFont: string;
}

// --- NEW ---
export interface EmailPreferences {
  enabled: boolean;
  frequency: 'daily' | 'every_3_days' | 'every_5_days' | 'every_week' | 'every_10_days' | 'every_14_days';
  topicSource: 'smart' | 'manual';
  manualTopic: string;
  lastSentAt?: any; // Firestore Timestamp
}

// --- Admin & User Management Types ---
export interface UserProfile {
  uid: string;
  email: string;
  createdAt: any; // Firestore timestamp
  status: 'active' | 'suspended';
  // Stripe-related fields
  stripeId?: string;
  stripeSubscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | null;
  promotions: {
    isPremium?: boolean;
    tokenCredits?: number;
  };
  emailPreferences?: EmailPreferences;
}

export type TrackEventType =
  | 'sign_in' | 'sign_out'
  | 'ai_assistant_query' | 'image_generation'
  | 'interview_start' | 'interview_analysis'
  | 'resume_suggestion' | 'question_generation'
  | 'resume_parse_text' | 'resume_parse_file' | 'resume_generate_prompt'
  | 'resume_download'
  | 'checkout_session_start'
  | 'job_prep_generation'
  | 'job_prep_regeneration'
  | 'job_parse_description'
  | 'resume_match_analysis';


// --- Interview Studio Types ---

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
}

export type InterviewStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'ended' | 'error' | 'analyzing';

export interface TranscriptEntry {
    speaker: 'user' | 'ai';
    text: string;
    isFinal: boolean;
    timestamp?: number;
}

export interface InterviewAnalysis {
  id: string;
  timestamp: number;
  overallScore: number;
  communicationScore: number;
  confidenceScore: number;
  relevanceScore: number;
  strengths: string;
  areasForImprovement: string;
  transcript: TranscriptEntry[];
}

export interface PracticeHistoryEntry {
  id: string;
  job: Job;
  questions: string[];
  timestamp: any; // Can be a number or a Firestore Timestamp
  interviewHistory: InterviewAnalysis[];
  section?: string;
}

// --- Job Tracker Types ---
export type ApplicationStatus = 'To Apply' | 'Applied' | 'Interviewing' | 'Offered' | 'Rejected';
export type WorkModel = 'On-site' | 'Hybrid' | 'Remote';

export const APPLICATION_STATUSES: ApplicationStatus[] = ['To Apply', 'Applied', 'Interviewing', 'Offered', 'Rejected'];
export const WORK_MODELS: WorkModel[] = ['On-site', 'Hybrid', 'Remote'];


export interface JobApplicationData {
  id: string; // Firestore doc ID
  userId: string;
  
  // Core Job Info
  jobTitle: string;
  companyName: string;
  location?: string;
  jobPostURL: string;
  applicationURL?: string;
  jobDescription?: string;
  
  // Tracking Info
  applicationStatus: ApplicationStatus;
  workModel?: WorkModel;
  interviewStage?: string;
  dateApplied?: any; // Firestore Timestamp
  salaryRange?: string;
  
  // Prep Notes
  prep_RoleOverview?: string;
  prep_MyStory?: string;
  prep_InterviewPrep?: string;
  prep_QuestionsForInterviewer?: string;
  notes?: string;

  // Timestamps
  createdAt: any;
  updatedAt: any;
  
  // Dashboard organization
  section?: string;
}

export interface ResumeMatchAnalysis {
  totalKeywords: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  matchPercentage: number;
  summary: string;
}


export interface GenAIBlob {
  data: string; // base64 encoded string
  mimeType: string;
}