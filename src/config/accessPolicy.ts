/**
 * Central access policy for guest preview and plan-based entitlements.
 *
 * The product is browsable like a storefront:
 *  - Guests (signed out) can VIEW /learning, /interview-studio, /community.
 *  - Guests can OPEN the free course and company quest pages.
 *  - Everything else prompts the auth gate; paid tiers unlock the catalog.
 *
 * Keep every rule here — pages import these helpers instead of hard-coding
 * ids, so pricing changes are one-file edits.
 */

/** Courses anyone can open, signed in or not. */
export const FREE_COURSE_IDS: ReadonlySet<string> = new Set(['ai-foundations-map']);

export const isCourseFreeForGuests = (courseId: string): boolean => FREE_COURSE_IDS.has(courseId);

/**
 * Company quests: every quest PAGE is browsable by guests. Local coding and
 * whiteboard practice are also available without an account for every company.
 * AI review, voice coaching, diagram generation, persistence, XP, and all
 * real-time API work remain authenticated features.
 */

/** Only local, browser-executed technical stages are available to guests. */
export const canGuestUseLocalQuestStage = (_slug: string, stageId: string): boolean =>
    stageId === 'coding' || stageId === 'system_design';

/**
 * Course entitlement per account state:
 *  - guest / free account → free courses only (progress + XP require an account)
 *  - premium (Pro / Max / Enterprise) → full catalog
 */
export const canAccessCourse = (
    courseId: string,
    { isSignedIn, isPremium }: { isSignedIn: boolean; isPremium: boolean },
): boolean => {
    if (isPremium) return true;
    if (FREE_COURSE_IDS.has(courseId)) return true;
    // Signed-in free users are limited to the free tier catalog for now;
    // interviews are metered separately through AI credits.
    void isSignedIn;
    return false;
};
