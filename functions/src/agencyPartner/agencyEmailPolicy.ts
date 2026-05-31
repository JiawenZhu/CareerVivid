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
