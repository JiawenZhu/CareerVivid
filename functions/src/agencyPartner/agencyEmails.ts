import * as admin from "firebase-admin";
import { generateCareerVividEmail } from "../emailTemplates";
import {
  CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER,
  canonicalCareerVividUrl,
  canonicalProfileUrl,
} from "../emailPolicy";
import {
  AgencyEmailCategory,
  getAgencyEmailSuppressionReason,
} from "./agencyEmailPolicy";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const TEMPLATE_VERSION = "agency-2026-05-30";

interface QueueAgencyEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  category: AgencyEmailCategory;
  metadata?: Record<string, unknown>;
  /** When true, prefixes subject with "[DEMO] " and skips preference suppression. */
  demo?: boolean;
}

/**
 * Write a CareerVivid mail-collection document in the canonical shape used by
 * lifecycleEmails. Returns { queued, reason } so callers can report status to
 * the recruiter or candidate-facing UI.
 */
async function queueAgencyEmail(opts: QueueAgencyEmailOptions): Promise<{ queued: boolean; reason: string }> {
  if (!opts.demo) {
    const suppression = await getAgencyEmailSuppressionReason(opts.to, opts.category);
    if (suppression) {
      return { queued: false, reason: suppression };
    }
  }

  const subject = opts.demo ? `[DEMO] ${opts.subject}` : opts.subject;

  await db.collection("mail").add({
    to: opts.to,
    message: {
      subject,
      html: opts.html,
      text: opts.text,
    },
    lifecycle: {
      key: opts.category,
      goal: opts.category === "agency_invite"
        ? "agency_invite_candidate"
        : "agency_recruiter_notification",
      templateVersion: TEMPLATE_VERSION,
      reason: opts.demo ? "agency_demo_send" : "agency_lifecycle",
      metadata: opts.metadata || {},
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { queued: true, reason: "queued" };
}

// ---------------------------------------------------------------------------
// Invite email — sent to a candidate by a recruiter from the dashboard.
// ---------------------------------------------------------------------------

export interface SendInviteEmailInput {
  branchId: string;
  branchName: string;
  branchSlug: string;
  recruiterName: string;
  recipientEmail: string;
  recipientFirstName?: string;
  customMessage?: string;
  demo?: boolean;
}

export async function sendAgencyInviteEmail(input: SendInviteEmailInput): Promise<{ queued: boolean; reason: string }> {
  const inviteUrl = canonicalCareerVividUrl(`/prepare/${encodeURIComponent(input.branchSlug)}`, {
    source: "agency_invite_email",
    branch: input.branchId,
  });
  const profileUrl = canonicalProfileUrl("agency_invite_email");

  const messageLines = [
    `${input.recruiterName} at ${input.branchName} wants to help you prepare your resume before they send it to employers.`,
    "Open the prep portal to import or create your CareerVivid resume, run an AI review, and download the polished PDF. Your full resume is never shared with the branch unless you choose to share it.",
  ];

  if (input.customMessage && input.customMessage.trim().length > 0) {
    messageLines.push(`Note from ${input.recruiterName}: ${input.customMessage.trim()}`);
  }

  const html = generateCareerVividEmail({
    title: `${input.branchName} invited you to prep your CareerVivid resume`,
    userName: input.recipientFirstName || "there",
    eyebrow: "Agency prep invite",
    messageLines,
    boxContent: {
      title: "What happens next",
      type: "info",
      lines: [
        "Select or create a resume.",
        "Run a quick AI review and lift your score.",
        `Share your readiness with ${input.branchName} when you're ready.`,
      ],
    },
    mainButton: {
      text: "Open my prep portal",
      url: inviteUrl,
    },
    secondaryButton: {
      text: "Manage email preferences",
      url: profileUrl,
    },
    footerText: CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER,
    closingName: input.recruiterName,
    closingRole: `${input.branchName}`,
  });

  const text = [
    `${input.recruiterName} at ${input.branchName} invited you to prep your CareerVivid resume.`,
    "",
    "Open the prep portal to import or create your resume, run an AI review, and download the polished PDF.",
    "",
    `Open the prep portal: ${inviteUrl}`,
    `Manage email preferences: ${profileUrl}`,
    "",
    CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER,
  ].join("\n");

  return queueAgencyEmail({
    to: input.recipientEmail,
    subject: `${input.branchName} invited you to prep your resume on CareerVivid`,
    html,
    text,
    category: "agency_invite",
    metadata: {
      branchId: input.branchId,
      branchName: input.branchName,
      branchSlug: input.branchSlug,
      recruiterName: input.recruiterName,
    },
    demo: input.demo,
  });
}

// ---------------------------------------------------------------------------
// Readiness notification — sent to the recruiter when a candidate shares.
// ---------------------------------------------------------------------------

export interface SendReadinessEmailInput {
  branchId: string;
  branchName: string;
  recruiterEmail: string;
  recruiterName?: string;
  candidateName: string;
  candidateEmail: string;
  latestScore: number;
  scoreDelta: number;
  readinessSummary: string;
  resumeSharePath?: string;
}

export async function sendAgencyReadinessEmail(input: SendReadinessEmailInput): Promise<{ queued: boolean; reason: string }> {
  const dashboardUrl = canonicalCareerVividUrl("/agency-partner/dashboard", {
    branchId: input.branchId,
    source: "agency_readiness_email",
  });
  const resumeUrl = input.resumeSharePath
    ? canonicalCareerVividUrl(input.resumeSharePath, { source: "agency_readiness_email" })
    : undefined;
  const profileUrl = canonicalProfileUrl("agency_readiness_email");

  const deltaText = input.scoreDelta > 0 ? ` (+${input.scoreDelta})` : "";
  const messageLines = [
    `${input.candidateName} just shared their CareerVivid readiness report with your branch.`,
    `Current resume score: <strong>${input.latestScore}${deltaText}</strong>.`,
    input.readinessSummary,
  ];

  const boxLines: string[] = [
    `Candidate: ${input.candidateName} (${input.candidateEmail})`,
    `Score lift: ${input.scoreDelta > 0 ? `+${input.scoreDelta}` : "n/a"}`,
  ];
  if (resumeUrl) {
    boxLines.push(`Resume access is enabled (viewer-only) until the candidate revokes.`);
  }

  const html = generateCareerVividEmail({
    title: `${input.candidateName} shared their CareerVivid readiness report`,
    userName: input.recruiterName || input.branchName,
    eyebrow: "Agency readiness update",
    messageLines,
    boxContent: {
      title: "Snapshot",
      type: "success",
      lines: boxLines,
    },
    mainButton: {
      text: resumeUrl ? "Open candidate resume" : "Open agency dashboard",
      url: resumeUrl || dashboardUrl,
    },
    secondaryButton: {
      text: "Open agency dashboard",
      url: dashboardUrl,
    },
    footerText: CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER,
    closingName: "CareerVivid",
    closingRole: "Agency Partner Pilot",
  });

  const text = [
    `${input.candidateName} shared their CareerVivid readiness report with ${input.branchName}.`,
    `Current resume score: ${input.latestScore}${deltaText}`,
    input.readinessSummary,
    "",
    resumeUrl ? `Open candidate resume: ${resumeUrl}` : "",
    `Open agency dashboard: ${dashboardUrl}`,
    `Manage email preferences: ${profileUrl}`,
    "",
    CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER,
  ].filter(Boolean).join("\n");

  return queueAgencyEmail({
    to: input.recruiterEmail,
    subject: `${input.candidateName} shared their CareerVivid readiness report`,
    html,
    text,
    category: "agency_readiness",
    metadata: {
      branchId: input.branchId,
      branchName: input.branchName,
      candidateEmail: input.candidateEmail,
      latestScore: input.latestScore,
      scoreDelta: input.scoreDelta,
    },
  });
}

export interface SendReminderEmailInput {
  branchId: string;
  branchName: string;
  branchSlug: string;
  recruiterName: string;
  recipientEmail: string;
  recipientFirstName?: string;
  demo?: boolean;
}

export async function sendAgencyReminderEmail(input: SendReminderEmailInput): Promise<{ queued: boolean; reason: string }> {
  const inviteUrl = canonicalCareerVividUrl(`/prepare/${encodeURIComponent(input.branchSlug)}`, {
    source: "agency_reminder_email",
    branch: input.branchId,
  });
  const profileUrl = canonicalProfileUrl("agency_reminder_email");

  const messageLines = [
    `Your recruiter ${input.recruiterName} at ${input.branchName} is waiting for your prepared resume.`,
    "Don't leave them hanging! Open the prep portal to continue refining your resume, run your AI review, and share your readiness report.",
    "A clean, polished resume significantly increases your chances of getting placed quickly.",
  ];

  const html = generateCareerVividEmail({
    title: "Finish your resume prep for " + input.branchName,
    userName: input.recipientFirstName || "there",
    eyebrow: "Reminder nudge",
    messageLines,
    boxContent: {
      title: "Why finish your prep?",
      type: "info",
      lines: [
        "Recruiters prefer candidates who have higher resume scores.",
        "It only takes a few minutes using CareerVivid's AI reviewer.",
        "Your resume stays fully private until you choose to click 'Share'.",
      ],
    },
    mainButton: {
      text: "Continue resume prep",
      url: inviteUrl,
    },
    secondaryButton: {
      text: "Manage email preferences",
      url: profileUrl,
    },
    footerText: CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER,
    closingName: input.recruiterName,
    closingRole: `${input.branchName}`,
  });

  const text = [
    `Your recruiter ${input.recruiterName} at ${input.branchName} is waiting for your prepared resume.`,
    "",
    "Open the prep portal to continue refining your resume, run your AI review, and share your readiness report.",
    "",
    `Continue resume prep: ${inviteUrl}`,
    `Manage email preferences: ${profileUrl}`,
    "",
    CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER,
  ].join("\n");

  return queueAgencyEmail({
    to: input.recipientEmail,
    subject: "Your recruiter is waiting — finish your resume prep on CareerVivid",
    html,
    text,
    category: "agency_reminder",
    metadata: {
      branchId: input.branchId,
      branchName: input.branchName,
      branchSlug: input.branchSlug,
      recruiterName: input.recruiterName,
    },
    demo: input.demo,
  });
}

