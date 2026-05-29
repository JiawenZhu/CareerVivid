
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, onIdTokenChanged, User, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, onSnapshot, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { trackUsage } from '../services/trackingService';
import { FREE_PLAN_CREDIT_LIMIT, PRO_PLAN_CREDIT_LIMIT, PRO_MAX_PLAN_CREDIT_LIMIT, ENTERPRISE_PLAN_CREDIT_LIMIT } from '../config/creditCosts';
import { navigate } from '../utils/navigation';
import { UserProfile } from '../types';
import { createExtensionAuthPayload, syncAuthWithExtension } from '../utils/extensionAuthBridge';
import { isExtensionContext } from '../services/extensionStorage';

const isDevelopment = () => import.meta.env?.DEV === true ||
  (typeof process !== 'undefined' && process.env.NODE_ENV === 'development');

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAdminLoading: boolean;
  isEmailVerified: boolean;
  isPremium: boolean;
  aiUsage: { count: number; limit: number } | null;
  refreshAIUsage: () => Promise<void>;
  refreshEmailVerification: () => Promise<boolean>;
  logOut: () => void;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
  isAdminLoading: true,
  isEmailVerified: false,
  isPremium: false,
  aiUsage: null,
  refreshAIUsage: async () => { },
  refreshEmailVerification: async () => false,
  logOut: () => { },
  updateUserProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

const buildFallbackUserProfile = (user: User): UserProfile => ({
  uid: user.uid,
  email: user.email || '',
  displayName: user.displayName || '',
  createdAt: null,
  status: 'active',
  plan: 'free',
  role: 'user',
  promotions: { isPremium: false },
  aiUsage: { count: 0, lastResetDate: null, monthlyLimit: FREE_PLAN_CREDIT_LIMIT }
});

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null &&
  typeof value === 'object' &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

const removeUndefinedFirestoreValues = <T,>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map(item =>
      item === undefined ? null : removeUndefinedFirestoreValues(item)
    ) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, removeUndefinedFirestoreValues(entryValue)])
    ) as T;
  }

  return value;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [aiUsage, setAiUsage] = useState<{ count: number; limit: number } | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsEmailVerified(user ? user.emailVerified : false);

      if (user) {
        try {
          const token = await user.getIdToken();
          if (typeof document !== 'undefined') {
            const isLocalhost = isDevelopment() &&
              (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
            document.cookie = `session=${token}; path=/; max-age=31536000; SameSite=Lax${isLocalhost ? '' : '; secure'}`;
          }

          const apiKey = auth.app.options.apiKey || null;

          if (!isExtensionContext()) {
            // Direct web-to-extension auth sync. This is fire-and-forget here;
            // the dedicated extension auth route performs the blocking ACK flow.
            createExtensionAuthPayload(user, apiKey).then((payload) => {
              syncAuthWithExtension(payload, { attempts: 2, retryDelayMs: 500 });
            }).catch((err) => {
              console.debug('[CareerVivid] Extension auth sync skipped:', err);
            });
          }
        } catch (err) {
          console.error("Error setting session cookie:", err);
        }
      } else {
        setIsAdmin(false);
        setIsPremium(false);
        setUserProfile(null);
        setIsAdminLoading(false);
        setLoading(false);
        if (typeof document !== 'undefined') {
          const isLocalhost = isDevelopment() &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
          document.cookie = `session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isLocalhost ? '' : '; secure'}`;
        }
        if (!isExtensionContext()) {
          // Direct web-to-extension auth sync (clear). The extension popup is
          // not a Firebase web-app origin, so it must never clear background
          // auth just because its own Firebase Auth instance has no user.
          syncAuthWithExtension(null, { attempts: 2, retryDelayMs: 500 });
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (!user || isExtensionContext()) return;
      setIsEmailVerified(user.emailVerified);

      try {
        const apiKey = auth.app.options.apiKey || null;
        const payload = await createExtensionAuthPayload(user, apiKey);
        await syncAuthWithExtension(payload, { attempts: 2, retryDelayMs: 500 });
      } catch (err) {
        console.debug('[CareerVivid] Extension token refresh sync skipped:', err);
      }
    });

    return () => unsubscribeToken();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setIsAdminLoading(true);

    // We need both the user profile and the admin status to be resolved
    // before we set global loading to false to prevent UI flashes (e.g. Admin tag popping in).
    let isActive = true;
    let userProfileLoaded = false;
    let adminCheckDone = false;

    const tryFinishLoading = () => {
      if (isActive && userProfileLoaded && adminCheckDone) {
        setLoading(false);
      }
    };

    const failOpenUserProfile = (reason: string, error?: unknown) => {
      if (!isActive || userProfileLoaded) return;

      if (error) {
        console.error(`[AuthContext] ${reason}; continuing with fallback profile.`, error);
      } else {
        console.warn(`[AuthContext] ${reason}; continuing with fallback profile.`);
      }

      setUserProfile(buildFallbackUserProfile(currentUser));
      setIsPremium(false);
      setAiUsage({ count: 0, limit: FREE_PLAN_CREDIT_LIMIT });
      userProfileLoaded = true;
      tryFinishLoading();
    };

    const profileLoadTimeout = window.setTimeout(() => {
      failOpenUserProfile('User profile load timed out');
    }, 10000);

    // Real-time listener for user profile data (including premium status)
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, async (docSnap) => {
      if (!isActive) return;
      window.clearTimeout(profileLoadTimeout);

      if (docSnap.exists()) {
        const userData = docSnap.data() as UserProfile;
        setUserProfile(userData);

        // Check if user has a paid plan (new system)
        const now = Date.now();
        const expiresAtMillis = userData.expiresAt?.toMillis ? userData.expiresAt.toMillis() : null;

        // All paid plans are active if plan is present
        const isPaidPlan = userData.plan === 'pro' || userData.plan === 'max' || userData.plan === 'pro_max' || userData.plan === 'enterprise' || userData.plan === 'premium' || userData.plan === 'pro_monthly' || userData.plan === 'pro_sprint';

        // Legacy: Only use isPremium if there's NO expiresAt (true backward compat)
        const hasLegacyPremium = expiresAtMillis === null && userData.promotions?.isPremium === true;

        const isPremiumNow = isPaidPlan || hasLegacyPremium;
        setIsPremium(isPremiumNow);

        // Set AI Usage with plan-specific limits
        // IMPORTANT: Always derive the limit from canonical plan constants.
        // Never read monthlyLimit from Firestore (it can be stale/wrong).
        const aiUsageData = userData.aiUsage || { count: 0 };
        let monthlyLimit = FREE_PLAN_CREDIT_LIMIT;

        switch (userData?.plan) {
          case 'pro':
          case 'premium':        // legacy alias
          case 'pro_monthly':    // legacy alias
          case 'pro_sprint':     // legacy alias
            monthlyLimit = PRO_PLAN_CREDIT_LIMIT;
            break;
          case 'max':
          case 'pro_max':
            monthlyLimit = PRO_MAX_PLAN_CREDIT_LIMIT;
            break;
          case 'enterprise':
            monthlyLimit = (userData.seats || 1) * ENTERPRISE_PLAN_CREDIT_LIMIT;
            break;
          default:
            // Free plan or any unrecognized plan → FREE_PLAN_CREDIT_LIMIT
            monthlyLimit = FREE_PLAN_CREDIT_LIMIT;
            break;
        }

        const tokenCredits = userData.promotions?.tokenCredits || 0;
        monthlyLimit += tokenCredits;

        setAiUsage({
          count: aiUsageData.count ?? 0,
          limit: monthlyLimit
        });

        // AUTO-CLEANUP: Reset expired users to free plan
        // AUTO-CLEANUP: Reset expired users to free plan (if they still have legacy plan IDs)
        if (!isPremiumNow && (userData.plan as any === 'pro_sprint' || userData.plan as any === 'pro_monthly')) {
          if (expiresAtMillis !== null && expiresAtMillis < now) {
            // Plan expired, reset to free
            try {
              await updateDoc(userDocRef, {
                plan: 'free',
                role: 'user',
                stripeSubscriptionStatus: null,
                promotions: {
                  ...userData.promotions,
                  isPremium: false
                }
              });
              console.log('Auto-cleanup: Reset expired plan/role to free/user');
            } catch (err) {
              console.error('Failed to reset expired plan:', err);
            }
          }
        }
      } else {
        // New users default to free tier — create doc if it doesn't exist
        const defaultProfile: Partial<UserProfile> = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || '',
          status: 'active',
          plan: 'free',
          role: 'user',
          createdAt: serverTimestamp(),
          promotions: { isPremium: false },
          aiUsage: { count: 0, lastResetDate: serverTimestamp(), monthlyLimit: FREE_PLAN_CREDIT_LIMIT }
        };
        try {
          // Use setDoc with merge: true to avoid overwriting existing data if listener just haven't caught up
          await setDoc(userDocRef, defaultProfile, { merge: true });
        } catch (err) {
          console.error('Failed to initialize user profile:', err);
        }
        setIsPremium(false);
        setUserProfile(buildFallbackUserProfile(currentUser));
        setAiUsage({ count: 0, limit: FREE_PLAN_CREDIT_LIMIT });
      }
      userProfileLoaded = true;
      tryFinishLoading();
    }, (error) => {
      window.clearTimeout(profileLoadTimeout);
      failOpenUserProfile('User profile listener failed', error);
    });

    // One-time check for admin status
    const checkAdmin = async () => {
      setIsAdminLoading(true);

      // Hardcoded admin bypass for specific user (Self-Healing)
      const isHardcodedAdmin = currentUser.email === 'evan@jastalk.com' || currentUser.uid === 'n95XpkySLMhwcHcpKTOpFAqrOPi2';

      if (isHardcodedAdmin) {
        setIsAdmin(true);
        // Attempt self-healing (restore DB record if missing)
        try {
          const adminDocRef = doc(db, 'admins', currentUser.uid);
          // We blindly set (merge) to ensure the record exists without needing read permissions first if rules are strict
          await setDoc(adminDocRef, { role: 'admin', email: currentUser.email }, { merge: true });
        } catch (e: any) {
          if (e?.code !== 'permission-denied') {
            console.warn("Self-healing admin check failed, but UI access is still granted.", e);
          }
        }
        setIsAdminLoading(false);
        adminCheckDone = true;
        tryFinishLoading();
        return;
      }

      try {
        const adminDocRef = doc(db, 'admins', currentUser.uid);
        const adminDoc = await getDoc(adminDocRef);
        setIsAdmin(adminDoc.exists());
      } catch (error: any) {
        // Suppress expected "permission-denied" errors for normal users checking admins table
        if (error?.code !== 'permission-denied') {
          console.error("Error checking admin status:", error);
        }
        setIsAdmin(false);
      } finally {
        setIsAdminLoading(false);
        adminCheckDone = true;
        tryFinishLoading();
      }
    };
    checkAdmin();

    return () => {
      isActive = false;
      window.clearTimeout(profileLoadTimeout);
      unsubscribeUser();
    };

  }, [currentUser]);

  const logOut = async () => {
    if (currentUser?.uid) {
      trackUsage(currentUser.uid, 'sign_out').catch(() => {
        // Sign-out must not be blocked by analytics or Firestore logging.
      });
    }

    try {
      await signOut(auth);
    } catch (err) {
      console.error('Failed to sign out:', err);
    }

    if (!isExtensionContext()) {
      navigate('/');
    }
  };

  const refreshEmailVerification = async () => {
    const user = auth.currentUser;
    if (!user) {
      setIsEmailVerified(false);
      return false;
    }

    try {
      await user.reload();
      const refreshedUser = auth.currentUser || user;
      const verified = refreshedUser.emailVerified;
      setCurrentUser(refreshedUser);
      setIsEmailVerified(verified);

      if (verified) {
        await refreshedUser.getIdToken(true).catch(() => undefined);
      }

      return verified;
    } catch (err) {
      console.error('Failed to refresh email verification state:', err);
      return false;
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, removeUndefinedFirestoreValues(data));
  };

  const refreshAIUsage = async () => {
    if (!currentUser) return;
    try {
      const { getAIUsage } = await import('../services/aiUsageService');
      const usage = await getAIUsage(currentUser.uid);

      // Calculate limit based on plan (with null safety)
      let limit = FREE_PLAN_CREDIT_LIMIT;
      if (userProfile?.plan) {
        switch (userProfile.plan) {
          case 'pro':
          case 'premium':        // legacy alias
          case 'pro_monthly':    // legacy alias
          case 'pro_sprint':     // legacy alias
            limit = PRO_PLAN_CREDIT_LIMIT;
            break;
          case 'max':
          case 'pro_max':
            limit = PRO_MAX_PLAN_CREDIT_LIMIT;
            break;
          case 'enterprise':
            limit = (userProfile.seats || 1) * ENTERPRISE_PLAN_CREDIT_LIMIT;
            break;
        }
      }

      const tokenCredits = userProfile?.promotions?.tokenCredits || 0;
      limit += tokenCredits;

      setAiUsage({
        count: usage.count,
        limit: limit
      });
    } catch (err) {
      console.error('Failed to refresh AI usage:', err);
    }
  };

  const value = useMemo(() => ({
    currentUser,
    userProfile,
    loading,
    isAdmin,
    isAdminLoading,
    isEmailVerified,
    isPremium,
    aiUsage,
    refreshAIUsage,
    refreshEmailVerification,
    logOut,
    updateUserProfile,
  }), [
    currentUser,
    userProfile,
    loading,
    isAdmin,
    isAdminLoading,
    isEmailVerified,
    isPremium,
    aiUsage,
    refreshAIUsage,
    refreshEmailVerification,
    logOut,
    updateUserProfile
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
