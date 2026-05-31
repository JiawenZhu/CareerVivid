import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../firebase';
import type { AgencyInvite } from '../types';

const MAX_INVITES_PER_BRANCH = 200;

/** Subscribe to the invites subcollection for a single branch. */
export const listenAgencyInvites = (
  branchId: string,
  onChange: (invites: AgencyInvite[]) => void,
  onError?: (error: Error) => void,
) => {
  const invitesRef = collection(db, 'agencyBranches', branchId, 'invites');
  const invitesQuery = query(invitesRef, orderBy('createdAt', 'desc'), limit(MAX_INVITES_PER_BRANCH));

  return onSnapshot(
    invitesQuery,
    (snapshot) => {
      const invites = snapshot.docs.map((inviteDoc) => ({
        id: inviteDoc.id,
        ...inviteDoc.data(),
      })) as AgencyInvite[];
      onChange(invites);
    },
    onError,
  );
};

export interface SendAgencyInviteInput {
  branchId: string;
  email: string;
  firstName?: string;
  message?: string;
  demo?: boolean;
}

export interface SendAgencyInviteResult {
  inviteId: string;
  queued: boolean;
  reason: string;
}

/** Send an invite via the sendAgencyInvite callable. */
export const sendAgencyInvite = async (input: SendAgencyInviteInput): Promise<SendAgencyInviteResult> => {
  const fn = httpsCallable<SendAgencyInviteInput, SendAgencyInviteResult>(functions, 'sendAgencyInvite');
  const result = await fn(input);
  return result.data;
};
