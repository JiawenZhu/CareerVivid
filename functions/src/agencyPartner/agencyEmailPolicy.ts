import * as admin from "firebase-admin";
import {
  EmailNotificationCategory,
  getEmailPreferenceSuppressionReason,
} from "../emailPolicy";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Agency-specific lifecycle email categories. These slot into the shared
 * EmailNotificationCategory aliasing in emailPolicy.ts via the "marketing"
 * category so existing preference UI can disable them.
 */
export type AgencyEmailCategory = "agency_invite" | "agency_readiness" | "agency_reminder";

/**
 * Map agency-specific categories to the shared notification category that
 * controls preference suppression. Both go through "marketing" so that
 * candidates and recruiters can opt out via existing email preference UI
 * (`emailPreferences.disabledCategories` includes "marketing").
 */
const SHARED_CATEGORY: Record<AgencyEmailCategory, EmailNotificationCategory> = {
  agency_invite: "marketing",
  agency_readiness: "marketing",
  agency_reminder: "marketing",
};

const AGENCY_REMINDER_THROTTLE_MS = 7 * 24 * 60 * 60 * 1000;

const timestampToMillis = (value: unknown): number => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (value instanceof Date) return value.getTime();
  const maybeTimestamp = value as { toMillis?: () => number; toDate?: () => Date };
  if (typeof maybeTimestamp.toMillis === "function") return maybeTimestamp.toMillis();
  if (typeof maybeTimestamp.toDate === "function") return maybeTimestamp.toDate().getTime();
  return 0;
};

/**
 * Resolve a user's email preferences and ask the shared policy module
 * whether the email should be suppressed. Returns null if the email is OK
 * to queue, or a string reason otherwise (e.g. "category_disabled").
 */
export async function getAgencyEmailSuppressionReason(
  recipientEmail: string,
  category: AgencyEmailCategory
): Promise<string | null> {
  const normalizedEmail = recipientEmail.trim().toLowerCase();
  if (!normalizedEmail) return "missing_email";

  // Look up the user by email so we can read their emailPreferences.
  // If no user exists yet (e.g. an invite to a brand-new candidate), we
  // do not suppress — they have not yet had the chance to set preferences.
  const userSnap = await db
    .collection("users")
    .where("email", "==", normalizedEmail)
    .limit(1)
    .get();

  if (userSnap.empty) return null;

  const userData = userSnap.docs[0].data();
  return getEmailPreferenceSuppressionReason(
    userData,
    SHARED_CATEGORY[category],
    category
  );
}

export function getAgencyReminderThrottleReason(
  sessionData: FirebaseFirestore.DocumentData,
  nowMs = Date.now()
): string | null {
  const lastReminderMs = Math.max(
    timestampToMillis(sessionData.lastAgencyReminderAt),
    timestampToMillis(sessionData.lastReminderAt)
  );

  if (!lastReminderMs) return null;
  return nowMs - lastReminderMs >= AGENCY_REMINDER_THROTTLE_MS
    ? null
    : "agency_reminder_recently_sent";
}
