
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, onSnapshot, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { trackUsage } from '../services/trackingService';
import { FREE_PLAN_CREDIT_LIMIT, PRO_PLAN_CREDIT_LIMIT, PRO_MAX_PLAN_CREDIT_LIMIT, ENTERPRISE_PLAN_CREDIT_LIMIT } from '../config/creditCosts';
import { navigate } from '../utils/navigation';
import { UserProfile } from '../types';

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
  logOut: () => { },
  updateUserProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

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

      if (!user) {
        setIsAdmin(false);
        setIsPremium(false);
        setUserProfile(null);
        setIsAdminLoading(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // We need both the user profile and the admin status to be resolved
    // before we set global loading to false to prevent UI flashes (e.g. Admin tag popping in).
    let userProfileLoaded = false;
    let adminCheckDone = false;

    const tryFinishLoading = () => {
      if (userProfileLoaded && adminCheckDone) {
        setLoading(false);
      }
    };

    // Real-time listener for user profile data (including premium status)
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, async (docSnap) => {
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
        setUserProfile(null);
      }
      userProfileLoaded = true;
      tryFinishLoading();
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

    return () => unsubscribeUser();

  }, [currentUser]);

  const logOut = () => {
    trackUsage(currentUser?.uid || '', 'sign_out');
    signOut(auth);
    navigate('/');
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, data);
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
    logOut,
    updateUserProfile
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
