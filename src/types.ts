
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
  icon?: string; // Optional custom icon ID from AVAILABLE_ICONS
  showUrl?: boolean; // Toggle to show full URL on resume
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

export type SharePermission = 'viewer' | 'commenter' | 'editor';

export interface ShareConfig {
  enabled: boolean;
  permission: SharePermission;
  shareId?: string; // Optional unique token if we want to obfuscate IDs later
}

export interface SectionTitles {
  contact?: string;
  profile?: string;
  skills?: string;
  experience?: string;
  education?: string;
  languages?: string;
  websites?: string;
}

export interface CustomIcons {
  email?: string;
  phone?: string;
  location?: string;
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
  sectionTitles?: SectionTitles; // Custom section headers
  customIcons?: CustomIcons; // New field for custom icons
  shareConfig?: ShareConfig; // New field for sharing settings
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
  onUpdate?: (data: Partial<ResumeData>) => void;
  onFocus?: (fieldId: string) => void;
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
  displayName?: string; // Added for admin display
  createdAt: any; // Firestore timestamp
  status: 'active' | 'suspended';
  // Stripe-related fields
  stripeCustomerId?: string; // Renamed from stripeId for clarity
  stripeSubscriptionId?: string; // Added for subscription tracking
  stripeSubscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'active_canceling' | null;
  // Plan and limits
  plan?: 'free' | 'pro_sprint' | 'pro_monthly';
  resumeLimit?: number; // 2 (free), 8 (sprint), or 15 (monthly)
  expiresAt?: any; // Firestore Timestamp - for sprint plan
  promotions: {
    isPremium?: boolean;
    tokenCredits?: number;
  };
  emailPreferences?: EmailPreferences;
  updatedAt?: any; // Added for tracking when plan changes

  // Partner Fields
  role?: 'user' | 'admin' | 'academic_partner' | 'business_partner'; // Deprecated - kept for backward compatibility
  roles?: ('admin' | 'academic_partner' | 'business_partner')[]; // New: Users can have multiple roles
  referralCode?: string; // For partners: their unique code OR for premium users: their personal referral code
  referredBy?: string; // For students: code they used
  referredByUid?: string; // UID of user who referred this user
  academicPartnerId?: string; // For students: ID of their professor
  referralStats?: {
    totalReferred: number;      // Count of successful referrals
    maxReferrals: number;        // Maximum allowed (5 for premium users)
    referredUsers: string[];     // UIDs of referred users
  };

  // AI Usage Tracking
  aiUsage?: {
    count: number;        // Current month's usage (0-10 for free users)
    lastResetDate: any;   // Firestore Timestamp - when counter was last reset
    monthlyLimit: number; // 10 for free, -1 for premium (unlimited)
  };
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
  | 'resume_match_analysis'
  | 'portfolio_generation'
  | 'portfolio_refinement';


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
  jobPostingId?: string; // Link to original job posting for sync
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
  matchAnalyses?: Record<string, ResumeMatchAnalysis>; // Persist analysis results per resume

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

// --- NEW: Contact & Blog Types ---

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read';
  timestamp: any; // Firestore Timestamp
}

export interface BlogPost {
  id: string;
  title: string;
  slug?: string; // Optional URL friendly version
  excerpt: string;
  content: string; // Markdown supported
  author: string;
  category: string;
  coverImage: string;
  publishedAt: any; // Firestore Timestamp
  readTime?: string;
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: any;
}

// --- HR Partner Job Platform Types ---

export type JobLocationType = 'remote' | 'hybrid' | 'onsite';
export type JobEmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship';
export type JobPostingStatus = 'draft' | 'published' | 'closed';
export type JobApplicationStatus = 'new' | 'screening' | 'phone_screen' | 'interview' | 'final_round' | 'offer' | 'hired' | 'rejected' | 'withdrawn';

// Pipeline Stage Configuration
export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string; // Tailwind color name (e.g., 'blue', 'green', 'red')
  isTerminal?: boolean; // If true, candidates can't be moved from this stage
  isCustom?: boolean; // If true, this is a user-created custom stage
}

// Default pipeline stages
export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  { id: 'new', name: 'New', order: 0, color: 'blue' },
  { id: 'screening', name: 'Screening', order: 1, color: 'purple' },
  { id: 'phone_screen', name: 'Phone Screen', order: 2, color: 'indigo' },
  { id: 'interview', name: 'Interview', order: 3, color: 'orange' },
  { id: 'final_round', name: 'Final Round', order: 4, color: 'pink' },
  { id: 'offer', name: 'Offer', order: 5, color: 'emerald' },
  { id: 'hired', name: 'Hired', order: 6, color: 'green', isTerminal: true },
  { id: 'rejected', name: 'Rejected', order: 7, color: 'red', isTerminal: true },
];

// Pipeline customization settings
export type PipelineBackgroundTheme = 'none' | 'gradient' | 'geometric' | 'mountains' | 'abstract' | 'particles' | 'custom';

export interface PipelineSettings {
  customStages?: PipelineStage[];
  backgroundTheme: PipelineBackgroundTheme;
  customBackgroundUrl?: string; // Custom uploaded background
  columnTransparency: number; // 0-100, percentage of transparency
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

export interface JobPosting {
  id: string;
  hrUserId: string; // Creator's UID
  companyName: string;
  companyLogo?: string;
  jobTitle: string;
  department: string;
  location: string;
  locationType: JobLocationType;
  employmentType: JobEmploymentType;

  // Job Details
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];

  // Compensation
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  benefits: string[];

  // Application Settings
  applicationDeadline?: any; // Firestore Timestamp
  maxApplications?: number;
  status: JobPostingStatus;

  // Metadata
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  publishedAt?: any; // Firestore Timestamp
  viewCount: number;
  applicationCount: number;

  // Integration
  source?: 'internal' | 'google';
  applyUrl?: string;
}

export interface StatusHistoryEntry {
  status: JobApplicationStatus;
  timestamp: any; // Firestore Timestamp
  note?: string;
}

export interface CustomAnswer {
  questionId: string;
  answer: string;
}

export interface JobApplication {
  id: string;
  jobPostingId: string;
  applicantUserId: string;
  resumeId: string; // Which resume they submitted

  // Application Data
  coverLetter?: string;
  customAnswers?: CustomAnswer[];

  // Status Tracking
  status: JobApplicationStatus;
  statusHistory: StatusHistoryEntry[];

  // HR Notes
  hrNotes?: string;
  rating?: number; // 1-5 stars
  matchAnalysis?: ResumeMatchAnalysis; // Verification of match percentage

  // Metadata
  appliedAt: any; // Firestore Timestamp
  lastUpdated: any; // Firestore Timestamp
}
