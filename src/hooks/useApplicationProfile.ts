import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useResumes } from './useResumes';
import type { ApplicationProfile } from '../types';
import {
  getApplicationProfile,
  saveApplicationProfile,
  subscribeApplicationProfile,
} from '../services/applyAgentService';
import {
  createDefaultApplicationProfile,
  getApplicationProfileCompletionPercent,
  withApplicationProfileCompletion,
} from '../utils/applicationProfile';

export function useApplicationProfile() {
  const { currentUser, userProfile } = useAuth();
  const { resumes } = useResumes();
  const [profile, setProfile] = useState<ApplicationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser?.uid) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeApplicationProfile(
      currentUser.uid,
      nextProfile => {
        setProfile(nextProfile);
        setIsLoading(false);
      },
      err => {
        setError(err.message);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentUser?.uid]);

  const defaultProfile = useMemo(() => (
    createDefaultApplicationProfile(currentUser?.uid, resumes[0], userProfile)
  ), [currentUser?.uid, resumes, userProfile]);

  const profileWithDefaults = useMemo(() => (
    withApplicationProfileCompletion({
      ...defaultProfile,
      ...(profile || {}),
      identity: {
        ...defaultProfile.identity,
        ...(profile?.identity || {}),
      },
      workAuthorization: {
        ...defaultProfile.workAuthorization,
        ...(profile?.workAuthorization || {}),
      },
      eeo: {
        ...defaultProfile.eeo,
        ...(profile?.eeo || {}),
      },
      compensation: {
        ...defaultProfile.compensation,
        ...(profile?.compensation || {}),
      },
      relocationRemote: {
        ...defaultProfile.relocationRemote,
        ...(profile?.relocationRemote || {}),
      },
      availability: {
        ...defaultProfile.availability,
        ...(profile?.availability || {}),
      },
      backgroundLegal: {
        ...defaultProfile.backgroundLegal,
        ...(profile?.backgroundLegal || {}),
        backgroundCheckConsent:
          profile?.backgroundLegal?.backgroundCheckConsent ?? defaultProfile.backgroundLegal.backgroundCheckConsent,
      },
      autoApplyRules: {
        ...defaultProfile.autoApplyRules,
        ...(profile?.autoApplyRules || {}),
      },
      consent: {
        ...defaultProfile.consent,
        ...(profile?.consent || {}),
      },
    })
  ), [defaultProfile, profile]);

  const saveProfile = useCallback(async (nextProfile: ApplicationProfile) => {
    if (!currentUser?.uid) throw new Error('User not logged in');
    await saveApplicationProfile(currentUser.uid, nextProfile);
  }, [currentUser?.uid]);

  const reload = useCallback(async () => {
    if (!currentUser?.uid) return;
    setIsLoading(true);
    try {
      setProfile(await getApplicationProfile(currentUser.uid));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load application profile.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.uid]);

  return {
    profile,
    profileWithDefaults,
    completionPercent: getApplicationProfileCompletionPercent(profileWithDefaults),
    isLoading,
    error,
    saveProfile,
    reload,
  };
}
