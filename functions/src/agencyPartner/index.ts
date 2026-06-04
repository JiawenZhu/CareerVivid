// Agency Partner backend module — public surface.
//
// All agency-specific callables and internal helpers live in this folder.
// The parent functions/src/index.ts re-exports the callables below.
//
// Adding new agency callables: define them in their own file and re-export
// here, then add the export name to functions/src/index.ts.

export { addRecruiterNote, updateRecruiterNote, deleteRecruiterNote } from "./recruiterNotes";
export { revokeAgencyShare } from "./agencyShareRevoke";
export { sendAgencyInvite } from "./agencyInvites";
export { resetDemoBranch } from "./resetDemoBranch";
export { onAgencyPrepSessionWritten } from "./onPrepSessionWritten";
export { sendBulkAgencyReminder, sendAgencyPrepReminders } from "./agencyReminders";

// Internal helpers (not exposed as callables, but available to triggers /
// other agency modules / direct server-side callers).
export { appendPrepEvent } from "./appendPrepEvent";
export type { AgencyPrepEventType, AppendPrepEventInput } from "./appendPrepEvent";
export { sendAgencyInviteEmail, sendAgencyReadinessEmail, sendAgencyReminderEmail } from "./agencyEmails";
export type { SendInviteEmailInput, SendReadinessEmailInput, SendReminderEmailInput } from "./agencyEmails";
export { getAgencyEmailSuppressionReason, getAgencyReminderThrottleReason } from "./agencyEmailPolicy";
export type { AgencyEmailCategory } from "./agencyEmailPolicy";
