
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { trackUsage } from '../services/trackingService';
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

        // Sprint: Must have expiresAt and not be expired
        const isSprintValid = userData.plan === 'pro_sprint' && expiresAtMillis !== null
          ? expiresAtMillis > now
          : false;

        // Monthly: Check BOTH subscription status AND expiresAt (if exists)
        // If expiresAt exists, it takes precedence even if Stripe says active
        const isMonthlyActive = userData.plan === 'pro_monthly' && (
          expiresAtMillis !== null
            ? expiresAtMillis > now // If we have expiry date, check it
            : (userData.stripeSubscriptionStatus === 'active' || userData.stripeSubscriptionStatus === 'trialing')
        );

        // Legacy: Only use isPremium if there's NO expiresAt (true backward compat)
        const hasLegacyPremium = expiresAtMillis === null && userData.promotions?.isPremium === true;

        const isPremiumNow = isSprintValid || isMonthlyActive || hasLegacyPremium;
        setIsPremium(isPremiumNow);

        // Set AI Usage with plan-specific limits
        const aiUsageData = userData.aiUsage || { count: 0, monthlyLimit: 10 };
        let monthlyLimit = 10; // Default for free users

        // Only calculate based on plan if userData exists
        if (isPremiumNow && userData?.plan) {
          if (userData.plan === 'pro_sprint') {
            monthlyLimit = 100; // Sprint: 100 AI Credits/month
          } else if (userData.plan === 'pro_monthly') {
            monthlyLimit = 300; // Monthly: 300 AI Credits/month
          } else {
            monthlyLimit = aiUsageData.monthlyLimit || 10;
          }
        }

        setAiUsage({
          count: aiUsageData.count,
          limit: monthlyLimit
        });

        // AUTO-CLEANUP: Reset expired users to free plan
        if (!isPremiumNow && (userData.plan === 'pro_sprint' || userData.plan === 'pro_monthly')) {
          if (expiresAtMillis !== null && expiresAtMillis < now) {
            // Plan expired, reset to free
            try {
              await updateDoc(userDocRef, {
                plan: 'free',
                role: 'user', // DOWNGRADE: Reset role to user so they lose Partner status
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
        // New users default to free tier
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
        } catch (e) {
          console.warn("Self-healing admin check failed (likely permissions), but UI access is granted via hardcode.", e);
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
      } catch (error) {
        console.error("Error checking admin status:", error);
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
      let limit = 10; // Default free
      if (userProfile?.plan) {
        if (userProfile.plan === 'pro_sprint') {
          limit = 100;
        } else if (userProfile.plan === 'pro_monthly') {
          limit = 300;
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

  const value = {
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
