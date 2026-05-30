import * as admin from "firebase-admin";
import {
  CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER,
  EmailNotificationCategory,
  canonicalDashboardUrl,
  canonicalProfileUrl,
  canonicalResumeEditUrl,
  canonicalSignupUrl,
  getEmailFrequencySuppressionReason,
  getEmailPreferenceSuppressionReason,
  isRequiredEmailCategory,
} from "./emailPolicy";
import {
  CareerVividEmailActivity,
  CareerVividEmailFeature,
  CareerVividEmailModule,
  CareerVividEmailStat,
  generateCareerVividModuleEmail,
} from "./emailTemplates";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export type HydratedLifecycleEmailKey =
  | "onboarding_welcome"
  | "feature_ai_editor"
  | "weekly_status_digest"
  | "resume_performance_milestone"
  | "notification_settings_updated";

type HydratedLifecycleDefinition = {
  key: HydratedLifecycleEmailKey;
  category: EmailNotificationCategory;
  goal: string;
};

export type HydratedEmailContext = {
  userId: string;
  userData: admin.firestore.DocumentData;
  email: string;
  displayName: string;
  firstName: string;
  activeResumeId?: string;
  activeResume?: admin.firestore.DocumentData;
  professionalTitle: string;
  targetLocations: string[];
  metrics: {
    activeApplications: number;
    savedJobs: number;
    deadlines: number;
    interviews: number;
    aiPrepModules: number;
  };
  deadlineActivities: CareerVividEmailActivity[];
  interviewActivities: CareerVividEmailActivity[];
  urls: {
    signup: string;
    dashboard: string;
    profile: string;
    resumeEditor: string;
    jobTracker: string;
  };
};

type QueueHydratedLifecycleEmailOptions = {
  force?: boolean;
  reason?: string;
  to?: string;
  metadata?: Record<string, unknown>;
};

const HYDRATED_DEFINITIONS: Record<HydratedLifecycleEmailKey, HydratedLifecycleDefinition> = {
  onboarding_welcome: {
    key: "onboarding_welcome",
    category: "onboarding",
    goal: "profile_initialized",
  },
  feature_ai_editor: {
    key: "feature_ai_editor",
    category: "feature_spotlight",
    goal: "editor_ai_chunk_used",
  },
  weekly_status_digest: {
    key: "weekly_status_digest",
    category: "weekly_digest",
    goal: "weekly_digest_reengagement",
  },
  resume_performance_milestone: {
    key: "resume_performance_milestone",
    category: "milestone",
    goal: "resume_performance_review_opened",
  },
  notification_settings_updated: {
    key: "notification_settings_updated",
    category: "system",
    goal: "notification_settings_confirmed",
  },
};

const timestampToMillis = (value: unknown): number => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (value instanceof Date) return value.getTime();
  const timestamp = value as { toMillis?: () => number; seconds?: number; _seconds?: number };
  if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
  if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000;
  if (typeof timestamp._seconds === "number") return timestamp._seconds * 1000;
  return 0;
};

const cleanText = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
};

const normalizeName = (value: string): string => {
  const cleaned = value.replace(/\([^)]*\)/g, "").replace(/^@+/, "").trim();
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const isLikelyPlaceholderName = (firstName: string, lastName: string): boolean => {
  const full = `${firstName} ${lastName}`.trim().toLowerCase();
  return ["john doe", "jane doe", "test user", "community member"].includes(full);
};

const isLikelyPlaceholderResume = (resume: admin.firestore.DocumentData): boolean => {
  const personal = resume.personalDetails || {};
  return isLikelyPlaceholderName(cleanText(personal.firstName), cleanText(personal.lastName));
};

const getResumeUpdatedAt = (resume: admin.firestore.DocumentData): number =>
  timestampToMillis(resume.updatedAt) || timestampToMillis(resume.createdAt);

const getFullNameFromResume = (resume?: admin.firestore.DocumentData): string => {
  const personal = resume?.personalDetails || {};
  const firstName = cleanText(personal.firstName);
  const lastName = cleanText(personal.lastName);
  if (!firstName && !lastName) return "";
  if (isLikelyPlaceholderName(firstName, lastName)) return "";
  return normalizeName(`${firstName} ${lastName}`);
};

const getFullName = (userData: admin.firestore.DocumentData, resume?: admin.firestore.DocumentData): string => {
  const resumeName = getFullNameFromResume(resume);
  if (resumeName) return resumeName;

  const displayName = cleanText(userData.displayName || userData.name);
  if (displayName && !["anonymous developer", "community member"].includes(displayName.toLowerCase())) {
    return normalizeName(displayName);
  }

  const personal = userData.personalDetails || {};
  const firstName = cleanText(personal.firstName);
  const lastName = cleanText(personal.lastName);
  if (firstName || lastName) return normalizeName(`${firstName} ${lastName}`);

  return "there";
};

const getProfessionalTitle = (
  userData: admin.firestore.DocumentData,
  resume?: admin.firestore.DocumentData
): string => {
  const explicitTitle = cleanText(
    userData.activeProfessionalTitle ||
      userData.professionalTitle ||
      userData.jobTitle ||
      userData.title
  );
  const resumeTitle = cleanText(resume?.personalDetails?.jobTitle);
  const employmentHistory = Array.isArray(resume?.employmentHistory) ? resume?.employmentHistory : [];
  const currentRole = employmentHistory.find((item: admin.firestore.DocumentData) =>
    /present|current/i.test(cleanText(item.endDate))
  );
  const currentRoleTitle = cleanText(currentRole?.jobTitle);

  const baseTitle = explicitTitle || resumeTitle || currentRoleTitle || "CareerVivid user";
  if (
    currentRoleTitle &&
    /founder/i.test(currentRoleTitle) &&
    /careervivid/i.test(cleanText(currentRole?.employer)) &&
    /software engineer/i.test(baseTitle)
  ) {
    return "Software Engineer / Co-founder & CTO";
  }

  if (
    currentRoleTitle &&
    /(founder|co-founder|cto|chief technology officer)/i.test(currentRoleTitle) &&
    !baseTitle.toLowerCase().includes(currentRoleTitle.toLowerCase())
  ) {
    return `${baseTitle} / ${currentRoleTitle}`;
  }

  return baseTitle;
};

const addUniqueLocation = (locations: string[], value: unknown) => {
  const cleaned = cleanText(value);
  if (!cleaned) return;
  const normalized = cleaned
    .replace(/\bSF\b/gi, "San Francisco")
    .replace(/\bCA\b/g, "California")
    .replace(/\bIL\b/g, "Illinois");
  if (!locations.some((existing) => existing.toLowerCase() === normalized.toLowerCase())) {
    locations.push(normalized);
  }
};

const getTargetLocations = (
  userData: admin.firestore.DocumentData,
  resume: admin.firestore.DocumentData | undefined,
  jobs: admin.firestore.DocumentData[]
): string[] => {
  const locations: string[] = [];

  for (const value of [
    ...(Array.isArray(userData.targetLocations) ? userData.targetLocations : []),
    ...(Array.isArray(userData.targetCities) ? userData.targetCities : []),
    resume?.personalDetails?.city && resume?.personalDetails?.country
      ? `${resume.personalDetails.city}, ${resume.personalDetails.country}`
      : resume?.personalDetails?.city,
  ]) {
    addUniqueLocation(locations, value);
  }

  for (const job of jobs) {
    addUniqueLocation(locations, job.location);
  }

  for (const fallback of ["Champaign, Illinois", "Springfield", "San Francisco Bay Area"]) {
    if (locations.length >= 3) break;
    addUniqueLocation(locations, fallback);
  }

  return locations.slice(0, 4);
};

const getResumeCandidates = async (userId: string): Promise<Array<{ id: string; data: admin.firestore.DocumentData }>> => {
  const snap = await db.collection("users").doc(userId).collection("resumes").get();
  return snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
};

const selectActiveResume = (
  userData: admin.firestore.DocumentData,
  resumes: Array<{ id: string; data: admin.firestore.DocumentData }>
) => {
  const preferredIds = [
    cleanText(userData.activeResumeId),
    cleanText(userData.selectedResumeId),
    cleanText(userData.defaultResumeId),
    cleanText(userData.resumeId),
  ].filter(Boolean);

  for (const id of preferredIds) {
    const preferred = resumes.find((resume) => resume.id === id && !isLikelyPlaceholderResume(resume.data));
    if (preferred) return preferred;
  }

  return resumes
    .filter((resume) => !isLikelyPlaceholderResume(resume.data))
    .sort((a, b) => getResumeUpdatedAt(b.data) - getResumeUpdatedAt(a.data))[0] || resumes[0];
};

const getRecentJobs = async (userId: string): Promise<admin.firestore.DocumentData[]> => {
  const snap = await db
    .collection("users")
    .doc(userId)
    .collection("jobTracker")
    .limit(100)
    .get();

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const getMetricRows = (jobs: admin.firestore.DocumentData[], practiceCount: number) => {
  const activeJobs = jobs.filter((job) => cleanText(job.applicationStatus).toLowerCase() !== "rejected");
  const deadlines = jobs.filter((job) => timestampToMillis(job.nextActionDueDate) > 0);
  const interviews = jobs.filter((job) => /interview/i.test(cleanText(job.applicationStatus) || cleanText(job.interviewStage)));
  const aiPrepModules = jobs.filter((job) =>
    job.matchAnalyses ||
    cleanText(job.prep_InterviewPrep) ||
    cleanText(job.prep_RoleOverview) ||
    job.applicationAnswers
  ).length + practiceCount;

  return {
    activeApplications: activeJobs.length,
    savedJobs: jobs.length,
    deadlines: deadlines.length,
    interviews: interviews.length,
    aiPrepModules,
  };
};

const getPracticeCount = async (userId: string): Promise<number> => {
  const snap = await db.collection("users").doc(userId).collection("practiceHistory").limit(25).get();
  return snap.size;
};

const formatDueDate = (value: unknown): string => {
  const ms = timestampToMillis(value);
  if (!ms) return "Next";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(ms));
};

const buildDeadlineActivities = (jobs: admin.firestore.DocumentData[]): CareerVividEmailActivity[] => {
  const withDueDates = jobs
    .filter((job) => timestampToMillis(job.nextActionDueDate) > 0)
    .sort((a, b) => timestampToMillis(a.nextActionDueDate) - timestampToMillis(b.nextActionDueDate));

  const source = withDueDates.length ? withDueDates : jobs.slice(0, 3);
  return source.slice(0, 3).map((job, index) => ({
    label: withDueDates.length ? formatDueDate(job.nextActionDueDate) : index === 0 ? "Review" : "Next",
    title: `${cleanText(job.jobTitle) || "Saved role"}${cleanText(job.companyName) ? ` - ${cleanText(job.companyName)}` : ""}`,
    meta: cleanText(job.nextAction) || cleanText(job.applicationStatus) || "Open the role and choose the next application step.",
    status: index === 0 ? "warning" : "neutral",
  }));
};

const buildInterviewActivities = (jobs: admin.firestore.DocumentData[]): CareerVividEmailActivity[] => {
  const interviews = jobs.filter((job) =>
    /interview/i.test(cleanText(job.applicationStatus) || cleanText(job.interviewStage))
  );
  const source = interviews.length ? interviews : jobs.slice(0, 2);

  return source.slice(0, 2).map((job, index) => ({
    label: interviews.length ? "Interview" : "Prep",
    title: `${cleanText(job.jobTitle) || "Saved role"}${cleanText(job.companyName) ? ` - ${cleanText(job.companyName)}` : ""}`,
    meta: cleanText(job.prep_InterviewPrep) || "Prep module: role-specific stories, questions, and follow-up notes.",
    status: index === 0 ? "warning" : "neutral",
  }));
};

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const snap = await db.collection("users").where("email", "==", email).limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

export async function hydrateEmailContext(userId: string, toOverride?: string): Promise<HydratedEmailContext | null> {
  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return null;

  const userData = userSnap.data() || {};
  const [resumes, jobs, practiceCount] = await Promise.all([
    getResumeCandidates(userId),
    getRecentJobs(userId),
    getPracticeCount(userId),
  ]);
  const activeResume = selectActiveResume(userData, resumes);
  const displayName = getFullName(userData, activeResume?.data);
  const firstName = displayName.split(/\s+/)[0] || "there";
  const email = cleanText(toOverride || userData.email || activeResume?.data?.personalDetails?.email);
  const targetLocations = getTargetLocations(userData, activeResume?.data, jobs);

  return {
    userId,
    userData,
    email,
    displayName,
    firstName,
    activeResumeId: activeResume?.id,
    activeResume: activeResume?.data,
    professionalTitle: getProfessionalTitle(userData, activeResume?.data),
    targetLocations,
    metrics: getMetricRows(jobs, practiceCount),
    deadlineActivities: buildDeadlineActivities(jobs),
    interviewActivities: buildInterviewActivities(jobs),
    urls: {
      signup: canonicalSignupUrl("lifecycle_email"),
      dashboard: canonicalDashboardUrl("lifecycle_email"),
      profile: canonicalProfileUrl("lifecycle_email"),
      resumeEditor: canonicalResumeEditUrl(activeResume?.id, "lifecycle_email_editor"),
      jobTracker: canonicalDashboardUrl("lifecycle_email_job_tracker"),
    },
  };
}

const statsFromContext = (context: HydratedEmailContext): CareerVividEmailStat[] => [
  { value: String(context.metrics.savedJobs), label: "Saved jobs", helper: "In workspace" },
  { value: String(context.metrics.activeApplications), label: "Active applications", helper: "Not rejected" },
  { value: String(context.metrics.interviews), label: "Interviews", helper: "In pipeline" },
  { value: String(context.metrics.aiPrepModules), label: "AI prep", helper: "Available" },
];

export type ResumePerformanceSnapshot = {
  score: number;
  label: string;
  tone: "success" | "warning" | "critical";
  source: "stored" | "calculated";
  resumeTitle: string;
  suggestions: CareerVividEmailFeature[];
  stats: CareerVividEmailStat[];
};

const parseResumeScore = (resume?: admin.firestore.DocumentData): number | null => {
  const candidates = [
    resume?.resumeScore,
    resume?.score,
    resume?.overallScore,
    resume?.latestScore,
    resume?.scoreBreakdown?.overallScore,
    resume?.review?.overallScore,
    resume?.aiReview?.overallScore,
    resume?.analysis?.overallScore,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value >= 0) return Math.max(0, Math.min(100, Math.round(value)));
  }

  return null;
};

const splitResumeBullets = (description: unknown): string[] =>
  cleanText(description)
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•+\s]+/, "").trim())
    .filter((line) => line.length >= 10);

const calculateResumeScoreFromContent = (resume: admin.firestore.DocumentData): number => {
  const personal = resume.personalDetails || {};
  const skills = Array.isArray(resume.skills) ? resume.skills : [];
  const jobs = Array.isArray(resume.employmentHistory) ? resume.employmentHistory : [];
  const education = Array.isArray(resume.education) ? resume.education : [];
  const bullets = jobs.flatMap((job: admin.firestore.DocumentData) => splitResumeBullets(job.description));
  const summary = cleanText(resume.professionalSummary);
  const allText = [
    summary,
    ...skills.map((skill: admin.firestore.DocumentData) => cleanText(skill.name)),
    ...jobs.flatMap((job: admin.firestore.DocumentData) => [cleanText(job.jobTitle), cleanText(job.employer), cleanText(job.description)]),
  ].join(" ");

  const completionChecks = [
    cleanText(personal.firstName),
    cleanText(personal.lastName),
    cleanText(personal.email),
    cleanText(personal.phone),
    cleanText(personal.city) || cleanText(personal.country) || cleanText(personal.address),
    cleanText(personal.jobTitle),
    summary.length >= 80,
    skills.length >= 4,
    jobs.length >= 1,
    education.length >= 1,
  ];
  const completionScore = completionChecks.filter(Boolean).length / completionChecks.length;

  const quantifiedBullets = bullets.filter((bullet) => /\d|%|\$|x\b|users?|clients?|hours?|days?|weeks?|months?/i.test(bullet)).length;
  const actionVerbBullets = bullets.filter((bullet) =>
    /^(led|built|created|delivered|developed|implemented|managed|optimized|designed|improved|reduced|increased|launched|resolved|engineered|coordinated|automated)\b/i.test(bullet)
  ).length;
  const qualityChecks = [
    bullets.length >= Math.min(Math.max(jobs.length * 2, 3), 12),
    quantifiedBullets >= Math.min(Math.max(jobs.length, 2), 6),
    actionVerbBullets >= Math.min(Math.max(jobs.length, 2), 6),
    skills.length >= 6,
    allText.length >= 1200,
  ];
  const qualityScore = qualityChecks.filter(Boolean).length / qualityChecks.length;

  const lengthChecks = [
    summary.length >= 120 && summary.length <= 700,
    bullets.length >= 4 && bullets.length <= 24,
    jobs.every((job: admin.firestore.DocumentData) => {
      const jobBullets = splitResumeBullets(job.description);
      return jobBullets.length === 0 || (jobBullets.length >= 2 && jobBullets.length <= 6);
    }),
  ];
  const lengthScore = lengthChecks.filter(Boolean).length / lengthChecks.length;

  return Math.round((completionScore * 45) + (qualityScore * 40) + (lengthScore * 15));
};

const getResumeScoreLabel = (score: number): string => {
  if (score >= 90) return "Recruiter-ready";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Close";
  if (score >= 60) return "Needs focused edits";
  return "Needs setup";
};

const getResumeScoreTone = (score: number): ResumePerformanceSnapshot["tone"] => {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "critical";
};

const buildResumeScoreSuggestions = (score: number): CareerVividEmailFeature[] => {
  if (score >= 90) {
    return [
      { label: "Maintain", title: "Keep the resume current", body: "Before the next application, check that your latest project, role, or measurable result is reflected." },
      { label: "Target", title: "Tailor only the role-specific details", body: "Use the editor to align keywords and examples with the job you are about to submit." },
      { label: "Share", title: "Use a polished viewer link", body: "When the resume is ready, share a viewer-only public link with recruiters or agency partners." },
    ];
  }

  if (score >= 75) {
    return [
      { label: "Impact", title: "Add measurable outcomes to the strongest bullets", body: "Prioritize numbers, scope, speed, quality, users, clients, or business results where you can be accurate." },
      { label: "Skills", title: "Match skills to the target role", body: "Keep the skills list compact and aligned with the roles you are actively pursuing." },
      { label: "Review", title: "Run a focused editor pass", body: "Open the resume editor and tighten one summary line plus two work-history bullets." },
    ];
  }

  if (score >= 60) {
    return [
      { label: "Sections", title: "Fill any missing core sections", body: "Confirm contact details, job title, summary, skills, work history, and education are complete." },
      { label: "Bullets", title: "Break dense paragraphs into proof points", body: "Use two to four focused bullets per recent role so the resume is easier to scan." },
      { label: "Summary", title: "Clarify the target role", body: "Use the first summary line to state the role you want and the experience you bring." },
    ];
  }

  return [
    { label: "Baseline", title: "Complete the resume foundation", body: "Add contact details, target role, professional summary, work history, education, and at least four skills." },
    { label: "Proof", title: "Add recent work examples", body: "For each recent role, add concrete responsibilities and one measurable outcome when possible." },
    { label: "Next", title: "Use the editor as the checklist", body: "Open the workspace editor and work through the highest-impact missing sections first." },
  ];
};

export function getResumePerformanceSnapshot(context: HydratedEmailContext): ResumePerformanceSnapshot | null {
  if (!context.activeResume) return null;

  const storedScore = parseResumeScore(context.activeResume);
  const score = storedScore ?? calculateResumeScoreFromContent(context.activeResume);
  const resumeTitle = cleanText(context.activeResume.title) || "Active resume";

  return {
    score,
    label: getResumeScoreLabel(score),
    tone: getResumeScoreTone(score),
    source: storedScore === null ? "calculated" : "stored",
    resumeTitle,
    suggestions: buildResumeScoreSuggestions(score),
    stats: [
      { value: `${score}`, label: "Resume score", helper: getResumeScoreLabel(score) },
      { value: context.activeResumeId ? "Yes" : "No", label: "Resume selected", helper: resumeTitle },
      { value: score >= 85 ? "Ready" : "Improve", label: "Next step", helper: score >= 85 ? "Tailor for a role" : "Open editor" },
    ],
  };
}

const getEmailPreferenceCategories = (context: HydratedEmailContext): Record<string, unknown> => {
  const preferences = (context.userData.emailPreferences || {}) as Record<string, unknown>;
  return (preferences.categories || {}) as Record<string, unknown>;
};

const getPreferenceFrequencyLabel = (context: HydratedEmailContext): string => {
  const preferences = (context.userData.emailPreferences || {}) as Record<string, unknown>;
  const value = cleanText(preferences.frequency);
  const labels: Record<string, string> = {
    daily: "Daily",
    every_3_days: "Every 3 days",
    every_5_days: "Every 5 days",
    every_week: "Every week",
    every_10_days: "Every 10 days",
    every_14_days: "Every 2 weeks",
  };

  return labels[value] || "Every week";
};

const getActivePreferenceTrackLabels = (context: HydratedEmailContext): string[] => {
  const categories = getEmailPreferenceCategories(context);
  const trackLabels: Array<[string, string]> = [
    ["onboarding", "Workspace tips"],
    ["feature_spotlight", "Product and editor updates"],
    ["weekly_digest", "Weekly status digest"],
    ["practice", "Practice interviews"],
    ["advocacy", "Feedback requests"],
  ];

  return trackLabels
    .filter(([key]) => categories[key] !== false)
    .map(([, label]) => label);
};

function buildOnboardingEmail(context: HydratedEmailContext) {
  const locations = context.targetLocations.join(", ");
  const modules: CareerVividEmailModule[] = [
    {
      type: "hero",
      eyebrow: "Welcome to CareerVivid",
      title: "Your job search workspace is ready",
      subtitle: `${context.professionalTitle} workspace for ${locations}. Move beyond rigid tracking sheets and keep resumes, roles, and prep connected.`,
      visual: {
        kind: "mockup",
        background: "warm",
        mockup: {
          badge: "Profile baseline",
          title: context.displayName,
          subtitle: context.professionalTitle,
          metrics: statsFromContext(context).slice(0, 3),
          rows: [
            { label: "Profile", title: "Identity hydrated", meta: context.email, status: "success" },
            { label: "Resume", title: context.activeResume?.title || "Active resume", meta: context.activeResumeId || "Open dashboard", status: "success" },
            { label: "Markets", title: context.targetLocations.slice(0, 3).join(" / "), meta: "Target locations", status: "neutral" },
          ],
        },
      },
    },
    {
      type: "body",
      paragraphs: [
        `CareerVivid is now using your real workspace profile for email content: ${context.displayName}, ${context.professionalTitle}.`,
        "Instead of a rigid tracking sheet, your workspace can connect the active resume, saved roles, application status, and AI preparation modules that already live in your account.",
      ],
    },
    {
      type: "checklist",
      title: "Initialize the production profile path",
      items: [
        { title: "Confirm your account profile", body: "Use the signup and profile routes as the canonical identity path." },
        { title: "Open your workspace dashboard", body: "Review saved jobs, active applications, interviews, and prep modules from one place." },
        { title: "Keep the resume context current", body: "CareerVivid uses your active resume to personalize editor and prep links." },
      ],
    },
    {
      type: "cta",
      primary: { text: "Go to signup", url: context.urls.signup },
      secondary: { text: "Open dashboard", url: context.urls.dashboard },
    },
  ];

  return {
    subject: "Start your CareerVivid workspace",
    preheader: "CareerVivid is using your real profile, active resume, locations, and application metrics.",
    html: generateCareerVividModuleEmail({
      title: "Start your CareerVivid workspace",
      preheader: "CareerVivid is using your real profile, active resume, locations, and application metrics.",
      userName: context.displayName,
      modules,
      footerText: CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER,
    }),
    text: `Hi ${context.firstName}, CareerVivid is using your real profile for lifecycle emails: ${context.displayName}, ${context.professionalTitle}. Go to signup: ${context.urls.signup}. Open dashboard: ${context.urls.dashboard}. ${CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER}`,
  };
}

function buildFeatureEditorEmail(context: HydratedEmailContext) {
  const modules: CareerVividEmailModule[] = [
    {
      type: "hero",
      eyebrow: "AI editor spotlight",
      title: "Edit the exact resume bullet that needs attention",
      subtitle: `Open ${context.activeResume?.title || "your active resume"} for ${context.professionalTitle} and work one focused chunk at a time.`,
      variant: "feature",
      visual: {
        kind: "mockup",
        background: "lavender",
        mockup: {
          badge: "Resume editor",
          title: context.activeResume?.title || "Active resume",
          subtitle: `Editing route: ${context.urls.resumeEditor.replace("https://careervivid.app", "")}`,
          rows: [
            { label: "Profile", title: context.displayName, meta: context.professionalTitle, status: "success" },
            { label: "Chunk", title: "Select one bullet or summary line", meta: "Use the contextual toolbar beside the selected text.", status: "warning" },
            { label: "Context", title: "Use saved job data while editing", meta: context.deadlineActivities[0]?.title || "Open a saved role from the dashboard.", status: "neutral" },
          ],
          footer: "The editor CTA resolves to /edit/{activeResumeId}; no static /editor route is used.",
        },
      },
    },
    {
      type: "body",
      paragraphs: [
        "You do not need to rewrite an entire resume to improve it. CareerVivid works best when you edit short chunks: one bullet, one summary line, or one responsibility at a time.",
        `For this account, the editor link is bound to your active resume id: ${context.activeResumeId || "none found"}. That keeps the CTA on a real production route instead of a generic placeholder page.`,
      ],
    },
    {
      type: "featureList",
      title: "What the editor helps you control",
      items: [
        { label: "Chunking", title: "Edit one bullet without changing the rest", body: "Work in small selections so useful lines stay intact." },
        { label: "Toolbar", title: "Keep actions close to selected text", body: "Use contextual overlays for rewrite, tighten, expand, and role-align actions." },
        { label: "Impact", title: "Turn dense text into scannable proof", body: "Convert long responsibilities into short bullets hiring teams can understand quickly." },
        { label: "Context", title: "Use saved jobs as editing context", body: "Align wording with the role while keeping the final decision in your hands." },
      ],
    },
    {
      type: "cta",
      primary: { text: "Open active resume editor", url: context.urls.resumeEditor },
      secondary: { text: "Open dashboard", url: context.urls.dashboard },
    },
  ];

  return {
    subject: "Edit stronger resume bullets without rewriting everything",
    preheader: "Open your active CareerVivid resume editor and improve one selected chunk at a time.",
    html: generateCareerVividModuleEmail({
      title: "Edit stronger resume bullets without rewriting everything",
      preheader: "Open your active CareerVivid resume editor and improve one selected chunk at a time.",
      userName: context.displayName,
      modules,
      footerText: CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER,
    }),
    text: `Hi ${context.firstName}, open your active resume editor at ${context.urls.resumeEditor}. CareerVivid is using ${context.activeResume?.title || "your active resume"} and ${context.professionalTitle} for this email. ${CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER}`,
  };
}

function buildWeeklyDigestEmail(context: HydratedEmailContext) {
  const modules: CareerVividEmailModule[] = [
    {
      type: "body",
      paragraphs: [
        `Here is your CareerVivid status for ${context.displayName}, ${context.professionalTitle}.`,
        `Your workspace currently includes ${context.metrics.savedJobs} saved jobs, ${context.metrics.activeApplications} active applications, and target locations including ${context.targetLocations.slice(0, 3).join(", ")}.`,
      ],
    },
    {
      type: "stats",
      title: "Weekly workspace grid",
      caption: "These values are hydrated from your CareerVivid user profile, resume, job tracker, and interview practice collections.",
      stats: statsFromContext(context),
    },
    {
      type: "activityList",
      title: "Tracking deadlines",
      subtitle: "Open each role to update status, finish missing materials, or mark it complete.",
      activities: context.deadlineActivities,
    },
    {
      type: "activityList",
      title: "Upcoming interviews and preparation",
      subtitle: "Each row is derived from interview-stage jobs or recent saved roles that can use preparation modules.",
      activities: context.interviewActivities,
    },
    {
      type: "featureList",
      title: "AI preparation modules ready",
      items: [
        { title: "Resume match review", body: "Check missing proof and role keywords before submitting the next application." },
        { title: "Cover letter draft", body: "Use the saved job and your resume baseline to create an editable first draft." },
        { title: "Interview focus plan", body: "Prioritize the questions and stories most likely to matter for the next conversation." },
        { title: "Application answer prep", body: "Prepare reusable answers for recurring form questions without starting from scratch." },
      ],
    },
    {
      type: "cta",
      primary: { text: "Open dashboard", url: context.urls.dashboard },
      secondary: { text: "Manage notification settings", url: context.urls.profile },
    },
  ];

  return {
    subject: `Your CareerVivid week: ${context.metrics.deadlines} deadlines, ${context.metrics.interviews} interviews`,
    preheader: "Review your real saved jobs, active applications, target locations, and AI preparation modules.",
    html: generateCareerVividModuleEmail({
      title: "Your CareerVivid weekly status",
      preheader: "Review your real saved jobs, active applications, target locations, and AI preparation modules.",
      userName: context.displayName,
      modules,
      footerText: CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER,
    }),
    text: `Hi ${context.firstName}, your CareerVivid week includes ${context.metrics.savedJobs} saved jobs, ${context.metrics.activeApplications} active applications, ${context.metrics.deadlines} deadlines, and ${context.metrics.interviews} interviews. Open dashboard: ${context.urls.dashboard}. ${CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER}`,
  };
}

function buildResumePerformanceEmail(context: HydratedEmailContext) {
  const snapshot = getResumePerformanceSnapshot(context);
  const score = snapshot?.score ?? 0;
  const scoreLabel = snapshot?.label || "Resume score";
  const resumeTitle = snapshot?.resumeTitle || context.activeResume?.title || "Active resume";
  const suggestions = snapshot?.suggestions || buildResumeScoreSuggestions(score);

  const modules: CareerVividEmailModule[] = [
    {
      type: "hero",
      eyebrow: "Resume performance",
      title: score >= 85 ? "Your resume is in strong shape" : "Your resume has a clear next edit",
      subtitle: `${resumeTitle} is currently scoring ${score}/100. Use the editor to keep the next improvement focused and tied to your real resume data.`,
      variant: "milestone",
      visual: {
        kind: "mockup",
        background: "warm",
        mockup: {
          badge: scoreLabel,
          title: resumeTitle,
          subtitle: `${context.professionalTitle} workspace`,
          metrics: snapshot?.stats || [
            { value: `${score}`, label: "Resume score", helper: scoreLabel },
            { value: context.metrics.savedJobs.toString(), label: "Saved jobs", helper: "In workspace" },
            { value: context.metrics.aiPrepModules.toString(), label: "AI prep", helper: "Available" },
          ],
          rows: suggestions.slice(0, 3).map((suggestion, index) => ({
            label: suggestion.label || (index === 0 ? "Focus" : "Next"),
            title: suggestion.title,
            meta: suggestion.body,
            status: index === 0 ? snapshot?.tone || "warning" : "neutral",
          })),
          footer: snapshot?.source === "stored"
            ? "Score source: saved resume score from your workspace."
            : "Score source: calculated from your active resume content.",
        },
      },
    },
    {
      type: "body",
      paragraphs: [
        `Hi ${context.firstName}, your active resume score is ${score}/100.`,
        score >= 85
          ? "That is a strong baseline. The highest-value next step is a targeted pass for the exact role you want to apply to."
          : "There is enough progress to make the next pass specific. Focus on the suggestions below instead of rewriting the whole resume.",
      ],
    },
    {
      type: "featureList",
      title: "Recommended next edits",
      items: suggestions,
    },
    {
      type: "cta",
      primary: { text: "Open resume editor", url: context.urls.resumeEditor },
      secondary: { text: "Open dashboard", url: context.urls.dashboard },
      helper: "This email is based on the current score for your active CareerVivid resume.",
    },
  ];

  return {
    subject: score >= 85
      ? `Your resume score is ${score}/100 - ready for a targeted pass`
      : `Your resume score is ${score}/100 - focus on the next edit`,
    preheader: "Open the active resume editor for score-based suggestions tied to your current resume.",
    html: generateCareerVividModuleEmail({
      title: "Your CareerVivid resume performance update",
      preheader: "Open the active resume editor for score-based suggestions tied to your current resume.",
      userName: context.displayName,
      modules,
      footerText: CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER,
    }),
    text: [
      `Hi ${context.firstName},`,
      "",
      `Your active resume score is ${score}/100 for ${resumeTitle}.`,
      ...suggestions.map((suggestion) => `- ${suggestion.title}: ${suggestion.body}`),
      "",
      `Open resume editor: ${context.urls.resumeEditor}`,
      "",
      CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER,
    ].join("\n"),
  };
}

function buildNotificationSettingsEmail(context: HydratedEmailContext) {
  const activeTracks = getActivePreferenceTrackLabels(context);
  const activeTrackText = activeTracks.length ? activeTracks.join(", ") : "All optional lifecycle tracks are paused";
  const frequency = getPreferenceFrequencyLabel(context);
  const modules: CareerVividEmailModule[] = [
    {
      type: "hero",
      eyebrow: "Notification settings",
      title: "Your email controls were updated",
      subtitle: "Your CareerVivid profile now controls which lifecycle email tracks can reach your inbox. Required account, security, and billing messages stay on.",
      variant: "feature",
      visual: {
        kind: "mockup",
        background: "plain",
        mockup: {
          badge: "Profile settings",
          title: context.displayName,
          subtitle: `${context.professionalTitle} workspace`,
          metrics: statsFromContext(context).slice(0, 3),
          rows: [
            { label: "Settings", title: "Email notification settings", meta: "Manage tracks from your profile page.", status: "success" },
            { label: "Frequency", title: frequency, meta: "Digest cadence can be changed anytime.", status: "neutral" },
            { label: "Tracks", title: activeTrackText, meta: "Optional lifecycle email controls are saved on your account.", status: activeTracks.length ? "success" : "warning" },
          ],
          footer: "This confirmation is sent after a short delay so repeated saves collapse into one email.",
        },
      },
    },
    {
      type: "body",
      paragraphs: [
        "Your CareerVivid email settings were saved.",
        "You can return to your profile anytime to turn specific tracks on or off, adjust digest frequency, or pause optional lifecycle emails without affecting required account messages.",
        `CareerVivid will keep useful emails tied to your real workspace context: ${context.metrics.savedJobs} saved jobs, ${context.metrics.activeApplications} active applications, and ${context.metrics.aiPrepModules} AI preparation modules.`,
      ],
    },
    {
      type: "featureList",
      title: "Current controls",
      items: [
        { label: "Tracks", title: "Choose which lifecycle emails reach you", body: activeTrackText },
        { label: "Frequency", title: "Set your digest cadence", body: `${frequency} is currently selected for digest-style updates.` },
        { label: "Workspace", title: "Keep emails tied to live data", body: "Future lifecycle emails can reference saved roles, resume context, applications, and preparation modules." },
        { label: "Required", title: "Account messages stay separate", body: "Security, billing, and core system notifications are not paused with optional lifecycle tracks." },
      ],
    },
    {
      type: "cta",
      primary: { text: "Open notification settings", url: context.urls.profile },
      secondary: { text: "Open dashboard", url: context.urls.dashboard },
      helper: "This confirmation is generated from your latest saved CareerVivid profile settings.",
    },
  ];

  return {
    subject: "Your CareerVivid email settings were updated",
    preheader: "Review your saved notification tracks and digest frequency from Profile Settings.",
    html: generateCareerVividModuleEmail({
      title: "Your CareerVivid email controls were updated",
      preheader: "Review your saved notification tracks and digest frequency from Profile Settings.",
      userName: context.displayName,
      modules,
      footerText: CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER,
    }),
    text: [
      `Hi ${context.firstName},`,
      "",
      "Your CareerVivid email settings were saved.",
      `Current optional tracks: ${activeTrackText}.`,
      `Digest frequency: ${frequency}.`,
      `Open notification settings: ${context.urls.profile}.`,
      "",
      CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER,
    ].join("\n"),
  };
}

export function renderHydratedLifecycleEmail(key: HydratedLifecycleEmailKey, context: HydratedEmailContext) {
  if (key === "onboarding_welcome") return buildOnboardingEmail(context);
  if (key === "feature_ai_editor") return buildFeatureEditorEmail(context);
  if (key === "resume_performance_milestone") return buildResumePerformanceEmail(context);
  if (key === "notification_settings_updated") return buildNotificationSettingsEmail(context);
  return buildWeeklyDigestEmail(context);
}

export async function queueHydratedLifecycleEmail(
  userId: string,
  key: HydratedLifecycleEmailKey,
  options: QueueHydratedLifecycleEmailOptions = {}
) {
  const definition = HYDRATED_DEFINITIONS[key];
  const context = await hydrateEmailContext(userId, options.to);
  if (!context || !context.email) {
    return { queued: false, reason: "missing_user_context" };
  }

  if (!options.force) {
    const suppressionReason = getEmailPreferenceSuppressionReason(context.userData, definition.category, key);
    if (suppressionReason) {
      return { queued: false, reason: suppressionReason };
    }

    if (!isRequiredEmailCategory(definition.category)) {
      const frequencySuppressionReason = getEmailFrequencySuppressionReason(
        context.userData.emailPreferences as Record<string, unknown> | undefined
      );
      if (frequencySuppressionReason) {
        return { queued: false, reason: frequencySuppressionReason };
      }
    }
  }

  const rendered = renderHydratedLifecycleEmail(key, context);
  const resumePerformance = key === "resume_performance_milestone"
    ? getResumePerformanceSnapshot(context)
    : null;
  const mailRef = db.collection("mail").doc();
  const usageRef = db.collection("usage_logs").doc();
  const userRef = db.collection("users").doc(userId);
  const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
  const isRequired = isRequiredEmailCategory(definition.category);

  await db.runTransaction(async (transaction) => {
    transaction.set(mailRef, {
      userId,
      to: context.email,
      message: {
        subject: options.force ? `[DEMO] ${rendered.subject}` : rendered.subject,
        html: rendered.html,
        text: rendered.text,
      },
      notification: {
        category: definition.category,
        userId,
        preferencesChecked: !options.force,
        frequencyChecked: !options.force && !isRequired,
        force: options.force === true,
        preferenceRoute: canonicalProfileUrl("email_footer"),
      },
      lifecycle: {
        key,
        userId,
        goal: definition.goal,
        reason: options.reason || "hydrated_lifecycle_trigger",
        metadata: {
          ...(options.metadata || {}),
          activeResumeId: context.activeResumeId || null,
          professionalTitle: context.professionalTitle,
          targetLocations: context.targetLocations,
          metrics: context.metrics,
          resumePerformance,
        },
      },
      createdAt: serverTimestamp,
    });

    transaction.set(usageRef, {
      userId,
      eventType: "hydrated_lifecycle_email_queued",
      lifecycleEmailKey: key,
      lifecycleGoal: definition.goal,
      notificationCategory: definition.category,
      timestamp: serverTimestamp,
      source: options.force ? "demo" : "lifecycle",
      reason: options.reason || "hydrated_lifecycle_trigger",
    });

    const userUpdate: Record<string, unknown> = {
      lifecycleEmails: {
        sent: {
          [key]: {
            sentAt: serverTimestamp,
            subject: rendered.subject,
            goal: definition.goal,
            reason: options.reason || "hydrated_lifecycle_trigger",
            score: resumePerformance?.score ?? null,
          },
        },
        updatedAt: serverTimestamp,
      },
    };

    if (!isRequired) {
      userUpdate.lifecycleEmails = {
        ...(userUpdate.lifecycleEmails as Record<string, unknown>),
        lastEmailAt: serverTimestamp,
      };
      userUpdate.emailPreferences = {
        lastSentAt: serverTimestamp,
      };
    }

    transaction.set(userRef, userUpdate, { merge: true });
  });

  return {
    queued: true,
    reason: "queued",
    mailId: mailRef.id,
    to: context.email,
    activeResumeId: context.activeResumeId,
    resumeEditorUrl: context.urls.resumeEditor,
    dashboardUrl: context.urls.dashboard,
  };
}
