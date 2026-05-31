import { useEffect, useState } from 'react';
import type { AgencyInvite } from '../types';
import { listenAgencyInvites } from '../services/agencyInvitesService';

/** Subscribe to the invites subcollection for a single branch. */
export const useAgencyInvites = (branchId: string | null) => {
  const [invites, setInvites] = useState<AgencyInvite[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(branchId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!branchId) {
      setInvites([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = listenAgencyInvites(
      branchId,
      (next) => {
        setInvites(next);
        setIsLoading(false);
      },
      (err) => {
        console.error('Failed to load agency invites:', err);
        setError(err);
        setIsLoading(false);
      },
    );
    return () => unsubscribe();
  }, [branchId]);

  return { invites, isLoading, error };
};
