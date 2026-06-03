import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';

export interface SendBulkReminderInput {
  branchId: string;
  sessionIds: string[];
  demo?: boolean;
}

export interface SendBulkReminderResult {
  sent: number;
  skipped: number;
}

/** Triggers the bulk candidate reminder nudge via Cloud Functions callable. */
export const sendBulkAgencyReminder = async (
  input: SendBulkReminderInput
): Promise<SendBulkReminderResult> => {
  const fn = httpsCallable<SendBulkReminderInput, SendBulkReminderResult>(
    functions,
    'sendBulkAgencyReminder'
  );
  const result = await fn(input);
  return result.data;
};
