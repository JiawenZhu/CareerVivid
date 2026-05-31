import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';

export interface ResetDemoBranchResult {
  ok: boolean;
  candidates: number;
}

/**
 * Reset the canonical demo branch via the admin-only resetDemoBranch callable.
 * The server enforces that only the demo branch is touched and only admins
 * may invoke it.
 */
export const resetDemoBranch = async (): Promise<ResetDemoBranchResult> => {
  const fn = httpsCallable<Record<string, never>, ResetDemoBranchResult>(functions, 'resetDemoBranch');
  const result = await fn({});
  return result.data;
};
