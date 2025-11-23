
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { trackUsage } from '../services/trackingService';
import { navigate } from '../App';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAdminLoading: boolean;
  isEmailVerified: boolean;
  isPremium: boolean;
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
  logOut: () => {},
  updateUserProfile: async () => {},
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

    // Real-time listener for user profile data (including premium status)
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data() as UserProfile;
        setUserProfile(userData);
        
        // TEMP: All features are currently free for all users.
        setIsPremium(true);

      } else {
        // Also grant premium to new users whose doc might not exist yet
        setIsPremium(true);
      }
      setLoading(false);
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
                 const adminDoc = await getDoc(adminDocRef);
                 if (!adminDoc.exists()) {
                     // Use setDoc with merge to avoid overwriting if it exists but we got a false negative (unlikely)
                     // or just to be safe.
                     await setDoc(adminDocRef, { role: 'admin' }, { merge: true });
                     console.log("Restored admin record for hardcoded user.");
                 }
             } catch (e) {
                 console.warn("Self-healing admin check failed (likely permissions), but UI access is granted via hardcode.", e);
             }
             setIsAdminLoading(false);
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
        }
    };
    checkAdmin();

    return () => unsubscribeUser();

  }, [currentUser]);

  const logOut = () => {
    if (currentUser) {
        trackUsage(currentUser.uid, 'sign_out');
    }
    if (window.location.hash.startsWith('#/admin')) {
        navigate('/');
    }
    signOut(auth);
  };
  
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) {
        throw new Error("No user is currently signed in.");
    }
    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, data);
  };


  const value = {
    currentUser,
    userProfile,
    loading,
    isAdmin,
    isAdminLoading,
    isEmailVerified,
    isPremium,
    logOut,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
