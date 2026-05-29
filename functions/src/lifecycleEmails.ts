import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { generateCareerVividEmail } from "./emailTemplates";
import {
  CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER,
  canonicalDashboardUrl,
  canonicalSignupUrl,
  getEmailFrequencySuppressionReason,
  getEmailPreferenceSuppressionReason,
} from "./emailPolicy";
import {
  HydratedLifecycleEmailKey,
  findUserIdByEmail,
  queueHydratedLifecycleEmail,
} from "./emailDataBinding";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const REGION = "us-west1";
const TEMPLATE_VERSION = "2026-05-28";
const MIN_ACCOUNT_AGE_FOR_WELCOME_MS = 15 * 60 * 1000;
const LIFECYCLE_EMAIL_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const EMAIL_PREFERENCE_NOTIFICATION_QUEUE = "email_preference_notification_queue";
const EMAIL_PREFERENCE_CONFIRMATION_DELAY_MS = 5 * 60 * 1000;

export type LifecycleEmailKey =
  | "welcome_first_resume"
  | "resume_completed_tailor_job";

type LifecycleEmailDefinition = {
  key: LifecycleEmailKey;
  subject: string;
  preview: string;
  goal: string;
  eyebrow: string;
  title: string;
  messageLines: string[];
  boxTitle: string;
  boxType: "warning" | "info" | "success" | "critical";
  boxLines: string[];
  primaryCta: {
    text: string;
    url: string;
  };
  secondaryCta?: {
    text: string;
    url: string;
  };
  text: string;
};

type QueueLifecycleEmailOptions = {
  force?: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
  userData?: admin.firestore.DocumentData;
  to?: string;
};

const lifecycleEmailDefinitions: Record<LifecycleEmailKey, LifecycleEmailDefinition> = {
  welcome_first_resume: {
    key: "welcome_first_resume",
    subject: "Start your first CareerVivid resume",
    preview: "Set up the profile CareerVivid will use for matching, tracking, and applications.",
    goal: "first_resume_created",
    eyebrow: "Welcome to CareerVivid",
    title: "Start your first CareerVivid resume",
    messageLines: [
      "CareerVivid works best after you add one base resume. That profile becomes the source for resume matching, job tracking, application answers, and autofill.",
      "Start with the information you already have. You can refine the resume later when you compare it with a specific job."
    ],
    boxTitle: "A simple first setup",
    boxType: "success",
    boxLines: [
      "<strong>Add or import your base resume.</strong>",
      "<strong>Confirm the contact details and work history are current.</strong>",
      "<strong>Use it as the starting point for your next job match.</strong>"
    ],
    primaryCta: {
      text: "Go to signup",
      url: canonicalSignupUrl("lifecycle_welcome")
    },
    secondaryCta: {
      text: "Open dashboard",
      url: canonicalDashboardUrl("lifecycle_welcome")
    },
    text: "CareerVivid works best after you initialize your account profile. Continue from the canonical signup path: https://careervivid.app/signup?source=lifecycle_welcome"
  },
  resume_completed_tailor_job: {
    key: "resume_completed_tailor_job",
    subject: "Your resume is ready. Tailor it for one role.",
    preview: "Compare your resume with a job description and see what to improve.",
    goal: "first_resume_match_analysis",
    eyebrow: "First resume completed",
    title: "Your resume is ready. Tailor it for one role.",
    messageLines: [
      "You now have a reusable resume in CareerVivid. The next useful step is to compare it with a real job description before you apply.",
      "A job match review shows where the resume already fits and which proof, keywords, or bullets may need attention."
    ],
    boxTitle: "What the review helps you decide",
    boxType: "info",
    boxLines: [
      "<strong>Matched keywords:</strong> see what the resume already covers.",
      "<strong>Missing proof:</strong> find areas where the job asks for stronger evidence.",
      "<strong>Next edits:</strong> choose the changes worth making before applying."
    ],
    primaryCta: {
      text: "Analyze a job match",
      url: canonicalDashboardUrl("lifecycle_resume_ready")
    },
    secondaryCta: {
      text: "Open dashboard",
      url: canonicalDashboardUrl("lifecycle_resume_ready_secondary")
    },
    text: "Your resume is ready. Compare it with a job description and review the highest-impact suggestions from your CareerVivid dashboard: https://careervivid.app/dashboard?source=lifecycle_resume_ready"
  }
};

const lifecycleNotificationCategories: Record<LifecycleEmailKey, "onboarding" | "activation"> = {
  welcome_first_resume: "onboarding",
  resume_completed_tailor_job: "activation",
};

const timestampToMillis = (value: unknown): number => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (value instanceof Date) return value.getTime();
  const maybeTimestamp = value as { toMillis?: () => number };
  if (typeof maybeTimestamp.toMillis === "function") return maybeTimestamp.toMillis();
  return 0;
};

const normalizePreferencePayload = (value: unknown): string => {
  if (!value || typeof value !== "object") return "";

  const sortObject = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(sortObject);
    if (!input || typeof input !== "object") return input;

    return Object.keys(input as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObject((input as Record<string, unknown>)[key]);
        return acc;
      }, {});
  };

  return JSON.stringify(sortObject(value));
};

const getUserName = (userData: admin.firestore.DocumentData): string => {
  return (
    userData.displayName ||
    userData.personalDetails?.firstName ||
    userData.name ||
    "there"
  );
};

const getUserEmail = (userData: admin.firestore.DocumentData, override?: string): string => {
  return String(override || userData.email || "").trim();
};

const isLifecycleEmailSuppressed = (
  userData: admin.firestore.DocumentData,
  key: LifecycleEmailKey,
  force = false
): string | null => {
  if (force) return null;

  if (userData.lifecycleEmails?.unsubscribed === true || userData.lifecycleEmails?.unsubscribedAt) {
    return "lifecycle_unsubscribed";
  }

  const preferenceSuppressionReason = getEmailPreferenceSuppressionReason(
    userData,
    lifecycleNotificationCategories[key],
    key
  );
  if (preferenceSuppressionReason) return preferenceSuppressionReason;

  const frequencySuppressionReason = getEmailFrequencySuppressionReason(
    userData.emailPreferences as Record<string, unknown> | undefined
  );
  if (frequencySuppressionReason) return frequencySuppressionReason;

  if (userData.lifecycleEmails?.sent?.[key]?.sentAt) {
    return "already_sent";
  }

  const lastEmailAt = timestampToMillis(userData.lifecycleEmails?.lastEmailAt);
  if (lastEmailAt && Date.now() - lastEmailAt < LIFECYCLE_EMAIL_COOLDOWN_MS) {
    return "cooldown";
  }

  return null;
};

const renderLifecycleEmail = (
  key: LifecycleEmailKey,
  userData: admin.firestore.DocumentData
) => {
  const definition = lifecycleEmailDefinitions[key];
  const html = generateCareerVividEmail({
    title: definition.title,
    userName: getUserName(userData),
    eyebrow: definition.eyebrow,
    preheader: definition.preview,
    messageLines: definition.messageLines,
    boxContent: {
      title: definition.boxTitle,
      type: definition.boxType,
      lines: definition.boxLines
    },
    mainButton: definition.primaryCta,
    secondaryButton: definition.secondaryCta,
    footerText: CAREERVIVID_SYSTEM_NOTIFICATION_FOOTER
  });

  return {
    subject: definition.subject,
    preview: definition.preview,
    html,
    text: definition.text,
    goal: definition.goal
  };
};

export async function queueLifecycleEmail(
  userId: string,
  key: LifecycleEmailKey,
  options: QueueLifecycleEmailOptions = {}
) {
  const userRef = db.collection("users").doc(userId);

  return db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const userData = userSnap.exists ? userSnap.data() : options.userData;

    if (!userData || (!userSnap.exists && !options.force)) {
      return { queued: false, reason: "user_not_found" };
    }

    const to = getUserEmail(userData, options.to);
    if (!to) {
      return { queued: false, reason: "missing_email" };
    }

    const suppressedReason = isLifecycleEmailSuppressed(userData, key, options.force);
    if (suppressedReason) {
      return { queued: false, reason: suppressedReason };
    }

    const rendered = renderLifecycleEmail(key, userData);
    const mailRef = db.collection("mail").doc();
    const usageRef = db.collection("usage_logs").doc();
    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

    transaction.set(mailRef, {
      to,
      message: {
        subject: options.force ? `[DEMO] ${rendered.subject}` : rendered.subject,
        html: rendered.html,
        text: rendered.text
      },
      lifecycle: {
        key,
        goal: rendered.goal,
        templateVersion: TEMPLATE_VERSION,
        reason: options.reason || "lifecycle_trigger",
        metadata: options.metadata || {}
      },
      createdAt: serverTimestamp
    });

    transaction.set(usageRef, {
      userId,
      eventType: "lifecycle_email_queued",
      lifecycleEmailKey: key,
      lifecycleGoal: rendered.goal,
      timestamp: serverTimestamp,
      source: options.force ? "demo" : "lifecycle",
      reason: options.reason || "lifecycle_trigger"
    });

    if (userSnap.exists) {
      transaction.set(userRef, {
        lifecycleEmails: {
          sent: {
            [key]: {
              sentAt: serverTimestamp,
              subject: rendered.subject,
              goal: rendered.goal,
              reason: options.reason || "lifecycle_trigger",
              templateVersion: TEMPLATE_VERSION
            }
          },
          lastEmailAt: serverTimestamp,
          updatedAt: serverTimestamp
        },
        emailPreferences: {
          lastSentAt: serverTimestamp
        }
      }, { merge: true });
    }

    return { queued: true, reason: "queued" };
  });
}

async function hasAnyResume(userId: string): Promise<boolean> {
  const resumesSnap = await db
    .collection("users")
    .doc(userId)
    .collection("resumes")
    .limit(1)
    .get();

  return !resumesSnap.empty;
}

async function hasUsageEvent(userId: string, eventType: string): Promise<boolean> {
  const usageSnap = await db
    .collection("usage_logs")
    .where("userId", "==", userId)
    .where("eventType", "==", eventType)
    .limit(1)
    .get();

  return !usageSnap.empty;
}

export async function evaluateLifecycleEmailsForUser(userId: string) {
  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();
  const userData = userSnap.data();

  if (!userData || !getUserEmail(userData)) {
    return { evaluated: false, reason: "missing_user_or_email" };
  }

  const createdAtMs = timestampToMillis(userData.createdAt);
  const accountOldEnoughForWelcome =
    createdAtMs > 0 && Date.now() - createdAtMs >= MIN_ACCOUNT_AGE_FOR_WELCOME_MS;
  const hasResume = await hasAnyResume(userId);

  if (!hasResume && accountOldEnoughForWelcome) {
    return queueLifecycleEmail(userId, "welcome_first_resume", {
      userData,
      reason: "no_resume_after_signup_delay"
    });
  }

  if (hasResume) {
    const hasResumeMatch = await hasUsageEvent(userId, "resume_match_analysis");
    if (!hasResumeMatch) {
      return queueLifecycleEmail(userId, "resume_completed_tailor_job", {
        userData,
        reason: "first_resume_without_match_analysis"
      });
    }
  }

  return { evaluated: true, queued: false, reason: "no_matching_lifecycle_step" };
}

export const sendLifecycleActivationEmails = functions
  .region(REGION)
  .pubsub
  .schedule("every 30 minutes")
  .onRun(async () => {
    const usersSnap = await db
      .collection("users")
      .orderBy("createdAt", "desc")
      .limit(250)
      .get();

    let queued = 0;
    let evaluated = 0;

    for (const userDoc of usersSnap.docs) {
      evaluated += 1;
      try {
        const result = await evaluateLifecycleEmailsForUser(userDoc.id);
        if ((result as { queued?: boolean }).queued) queued += 1;
      } catch (error) {
        console.error(`[LifecycleEmails] Failed to evaluate user ${userDoc.id}:`, error);
      }
    }

    console.log(`[LifecycleEmails] Evaluated ${evaluated} users, queued ${queued} emails.`);
    return null;
  });

export const onLifecycleUsageLogCreated = functions
  .region(REGION)
  .firestore
  .document("usage_logs/{logId}")
  .onCreate(async (snap) => {
    const data = snap.data();
    const userId = data.userId;
    const eventType = data.eventType;

    if (!userId || eventType === "lifecycle_email_queued") {
      return null;
    }

    const lifecycleEventUpdates: Record<string, unknown> = {
      "lifecycleEmails.updatedAt": admin.firestore.FieldValue.serverTimestamp()
    };

    if (eventType === "resume_created") {
      lifecycleEventUpdates["lifecycleEmails.events.firstResumeCreatedAt"] =
        data.timestamp || admin.firestore.FieldValue.serverTimestamp();
    }

    if (eventType === "resume_match_analysis") {
      lifecycleEventUpdates["lifecycleEmails.events.firstResumeMatchAnalysisAt"] =
        data.timestamp || admin.firestore.FieldValue.serverTimestamp();
    }

    if (Object.keys(lifecycleEventUpdates).length > 1) {
      await db.collection("users").doc(userId).set(lifecycleEventUpdates, { merge: true });
    }

    if (eventType === "resume_created") {
      await evaluateLifecycleEmailsForUser(userId);
    }

    return null;
  });

export const onResumeCreatedLifecycle = functions
  .region(REGION)
  .firestore
  .document("users/{userId}/resumes/{resumeId}")
  .onCreate(async (_snap, context) => {
    const userId = context.params.userId;

    await db.collection("users").doc(userId).set({
      lifecycleEmails: {
        events: {
          firstResumeCreatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    }, { merge: true });

    await evaluateLifecycleEmailsForUser(userId);
    return null;
  });

export const onEmailPreferencesUpdated = functions
  .region(REGION)
  .firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const beforeData = change.before.data() || {};
    const afterData = change.after.data() || {};

    const beforePreferences = normalizePreferencePayload(beforeData.emailPreferences);
    const afterPreferences = normalizePreferencePayload(afterData.emailPreferences);

    if (beforePreferences === afterPreferences) {
      return null;
    }

    const email = getUserEmail(afterData);
    if (!email) {
      console.log(`[LifecycleEmails] Skipping preference confirmation for ${userId}: missing email.`);
      return null;
    }

    const scheduledFor = admin.firestore.Timestamp.fromMillis(Date.now() + EMAIL_PREFERENCE_CONFIRMATION_DELAY_MS);

    await db.collection(EMAIL_PREFERENCE_NOTIFICATION_QUEUE).doc(userId).set({
      userId,
      email,
      status: "pending",
      scheduledFor,
      preferenceSnapshot: afterData.emailPreferences || null,
      reason: "email_preferences_updated",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`[LifecycleEmails] Scheduled email preference confirmation for ${userId}.`);
    return null;
  });

export const sendEmailPreferenceUpdateNotifications = functions
  .region(REGION)
  .pubsub
  .schedule("every 5 minutes")
  .onRun(async () => {
    const queueSnap = await db
      .collection(EMAIL_PREFERENCE_NOTIFICATION_QUEUE)
      .where("status", "==", "pending")
      .limit(100)
      .get();

    let evaluated = 0;
    let queued = 0;
    let skipped = 0;
    const now = Date.now();

    for (const queueDoc of queueSnap.docs) {
      const queuedData = queueDoc.data();
      const userId = String(queuedData.userId || queueDoc.id);
      const scheduledAt = timestampToMillis(queuedData.scheduledFor);

      if (scheduledAt && scheduledAt > now) {
        skipped += 1;
        continue;
      }

      evaluated += 1;

      const claimed = await db.runTransaction(async (transaction) => {
        const freshSnap = await transaction.get(queueDoc.ref);
        const freshData = freshSnap.data();
        const freshScheduledAt = timestampToMillis(freshData?.scheduledFor);

        if (!freshSnap.exists || freshData?.status !== "pending") {
          return false;
        }

        if (freshScheduledAt && freshScheduledAt > Date.now()) {
          return false;
        }

        transaction.set(queueDoc.ref, {
          status: "sending",
          sendingAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return true;
      });

      if (!claimed) {
        skipped += 1;
        continue;
      }

      try {
        const result = await queueHydratedLifecycleEmail(userId, "notification_settings_updated", {
          reason: "email_preferences_updated",
          metadata: {
            queueId: queueDoc.id,
            scheduledFor: queuedData.scheduledFor || null,
          },
        });

        await queueDoc.ref.set({
          status: result.queued ? "sent" : "skipped",
          queuedMailId: result.mailId || null,
          skipReason: result.queued ? null : result.reason,
          sentAt: result.queued ? admin.firestore.FieldValue.serverTimestamp() : null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        if (result.queued) queued += 1;
        else skipped += 1;
      } catch (error: any) {
        await queueDoc.ref.set({
          status: "error",
          error: error.message || "Failed to queue email preference confirmation",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.error(`[LifecycleEmails] Failed to send email preference confirmation for ${userId}:`, error);
      }
    }

    console.log(`[LifecycleEmails] Preference confirmations evaluated=${evaluated}, queued=${queued}, skipped=${skipped}.`);
    return null;
  });

export const sendLifecycleDemoEmails = functions
  .region(REGION)
  .https
  .onRequest(async (req, res) => {
    const configuredToken = process.env.LIFECYCLE_DEMO_TOKEN;
    const suppliedToken = String(req.query.token || req.get("x-careervivid-demo-token") || "");

    if (!configuredToken || suppliedToken !== configuredToken) {
      res.status(403).json({ error: "Lifecycle demo email token is required." });
      return;
    }

    const targetEmail = String(req.query.to || "zhujiawen519@gmail.com").trim();
    const resolvedUserId =
      String(req.query.userId || "").trim() ||
      (await findUserIdByEmail(targetEmail));

    if (!resolvedUserId) {
      res.status(404).json({ error: `No CareerVivid user found for ${targetEmail}` });
      return;
    }

    try {
      const results = [];
      const demoKeys: HydratedLifecycleEmailKey[] = [
        "onboarding_welcome",
        "feature_ai_editor",
        "weekly_status_digest",
      ];
      for (const key of demoKeys) {
        const result = await queueHydratedLifecycleEmail(resolvedUserId, key, {
          force: true,
          reason: "manual_demo",
          to: targetEmail,
          metadata: {
            demo: true
          }
        });
        results.push({ key, ...result });
      }

      res.status(200).json({
        targetEmail,
        userId: resolvedUserId,
        count: results.filter((result) => result.queued).length,
        results
      });
    } catch (error: any) {
      console.error("[LifecycleEmails] Demo send failed:", error);
      res.status(500).json({ error: error.message || "Failed to queue lifecycle demo emails" });
    }
  });
