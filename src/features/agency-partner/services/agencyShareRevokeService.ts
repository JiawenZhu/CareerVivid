import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';

export interface RevokeAgencyShareResult {
  ok: boolean;
  status: string;
}

/** Revoke an agency share via the revokeAgencyShare callable. */
export const revokeAgencyShare = async (sessionId: string): Promise<RevokeAgencyShareResult> => {
  const fn = httpsCallable<{ sessionId: string }, RevokeAgencyShareResult>(functions, 'revokeAgencyShare');
  const result = await fn({ sessionId });
  return result.data;
};
