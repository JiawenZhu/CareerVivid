import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';

export interface ResetDemoBranchResult {
  ok: boolean;
  mode?: 'reseed' | 'delete_only';
  candidates: number;
  deleted?: {
    sessionsDeleted?: number;
    invitesDeleted?: number;
    rootInvitesDeleted?: number;
    demoUsersDeleted?: number;
    branchDeleted?: boolean;
  };
}

export type ResetDemoBranchMode = 'reseed' | 'delete_only';

/**
 * Reset the canonical demo branch via the admin-only resetDemoBranch callable.
 * The server enforces that only the demo branch is touched and only admins
 * may invoke it.
 */
export const resetDemoBranch = async (mode: ResetDemoBranchMode = 'reseed'): Promise<ResetDemoBranchResult> => {
  const fn = httpsCallable<{ mode: ResetDemoBranchMode }, ResetDemoBranchResult>(functions, 'resetDemoBranch');
  const result = await fn({ mode });
  return result.data;
};
