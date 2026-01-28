import React, { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, googleProvider, db } from '../../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { navigate } from '../../utils/navigation';

interface AdminLoginPageProps {
  accessDenied?: boolean;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ accessDenied }) => {
  const { logOut } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('evan@jastalk.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accessDenied) {
      setError("Access Denied. You do not have administrator privileges.");
      // Log out user to clear any non-admin session
      logOut();
    }
  }, [accessDenied, logOut]);

  const handleAuthError = (err: any) => {
    switch (err.code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        setError('Invalid email or password.');
        break;
      case 'auth/email-already-in-use':
        setError('An account with this email already exists. Please "Sign in" instead.');
        break;
      default:
        setError(err.message.replace('Firebase: ', ''));
        break;
    }
  }

  const verifyAdminAndRedirect = async (userId: string, userEmail: string | null) => {
    const adminDocRef = doc(db, 'admins', userId);
    const adminDoc = await getDoc(adminDocRef);

    if (adminDoc.exists()) {
      navigate('/admin');
    } else if (userEmail === 'evan@jastalk.com') {
      // Self-heal: Grant admin privileges if they're missing for the default admin
      await setDoc(adminDocRef, { role: 'admin' });
      navigate('/admin');
    } else {
      setError("Access Denied. You do not have administrator privileges.");
      logOut();
    }
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await verifyAdminAndRedirect(cred.user.uid, cred.user.email);
      } else { // Sign up
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;

        // Send verification email
        await sendEmailVerification(user);

        // Create user document in Firestore (optional for admins, but good practice)
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          createdAt: serverTimestamp(),
          status: 'active',
          promotions: {}
        });

        // Provision default admin account
        if (user.email === 'evan@jastalk.com') {
          await setDoc(doc(db, 'admins', user.uid), { role: 'admin' });
          // Don't redirect yet, user needs to verify email. The App router will handle it.
        } else {
          setError("This is an admin-only registration. Your account was created but does not have admin privileges.");
          logOut();
        }
      }
    } catch (err: any) {
      handleAuthError(err);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (user.email !== 'evan@jastalk.com') {
        setError("Access Denied. This Google account is not authorized for admin access.");
        logOut();
        setLoading(false);
        return;
      }

      const adminDocRef = doc(db, 'admins', user.uid);
      if (!(await getDoc(adminDocRef)).exists()) {
        await setDoc(adminDocRef, { role: 'admin' });
      }

      // Also ensure a user doc exists
      const userDocRef = doc(db, 'users', user.uid);
      if (!(await getDoc(userDocRef)).exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          createdAt: serverTimestamp(),
          status: 'active',
          promotions: {}
        });
      }

      await verifyAdminAndRedirect(user.uid, user.email);

    } catch (err: any) {
      handleAuthError(err);
    }
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent! Please check your inbox to continue.');
    } catch (err: any) {
      handleAuthError(err);
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-900 p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto text-primary-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Admin Portal
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleAuthAction}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700"
                placeholder="Admin email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700 pr-10"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-500 dark:text-green-400">{success}</p>}

          {isLogin && (
            <div className="flex items-center justify-end">
              <div className="text-sm">
                <button type="button" onClick={handlePasswordReset} className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none">
                  Forgot your password?
                </button>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up Admin')}
            </button>
          </div>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or</span>
          </div>
        </div>

        <div>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <svg className="w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 398.2 0 256S111.8 0 244 0c71.2 0 130.9 27.8 176.9 72.9l-63.1 61.3C294.3 93.6 270.3 80 244 80 158.4 80 90 148.2 90 233.9s68.4 153.9 154 153.9c75.5 0 120.9-42.3 124.9-97.9H244v-77.3h236.1c2.4 12.7 3.9 26.1 3.9 40.2z"></path></svg>
            Sign in with Google
          </button>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }} className="font-medium text-primary-600 hover:text-primary-500">
            {isLogin ? 'Sign up a new admin account' : 'Already have an admin account?'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
