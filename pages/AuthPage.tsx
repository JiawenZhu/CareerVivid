import React, { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { trackUsage } from '../services/trackingService';

const loadingMessages = [
    "Securing your connection...",
    "Processing your request...",
    "Getting things ready...",
    "Just a moment...",
];

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    let interval: number;
    if (loading) {
        setLoadingMessageIndex(0);
        interval = window.setInterval(() => {
            setLoadingMessageIndex(prevIndex => {
                if (prevIndex >= loadingMessages.length - 1) {
                    return prevIndex;
                }
                return prevIndex + 1;
            });
        }, 1800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleAuthError = (err: any) => {
    switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            setError('Invalid email or password. Please try again, or click "Sign up" if you\'re a new user.');
            break;
        case 'auth/email-already-in-use':
            setError('An account with this email already exists. Please "Sign in" instead.');
            break;
        case 'auth/weak-password':
            setError('Password is too weak. Please use at least 6 characters.');
            break;
        case 'auth/popup-closed-by-user':
            // Don't show an error, user closed it intentionally
            break;
        case 'auth/account-exists-with-different-credential':
            setError('An account with this email already exists using a different sign-in method.');
            break;
        default:
            setError(err.message.replace('Firebase: ', ''));
            break;
    }
  }

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        trackUsage(cred.user.uid, 'sign_in');
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Send verification email with continue URL
        const actionCodeSettings = {
            url: window.location.href.split('#')[0], // Redirect to the app's root URL
        };
        await sendEmailVerification(cred.user, actionCodeSettings);
        // Create user document in Firestore
        await setDoc(doc(db, 'users', cred.user.uid), {
            uid: cred.user.uid,
            email: cred.user.email,
            createdAt: serverTimestamp(),
            promotions: {},
            status: 'active'
        });
        trackUsage(cred.user.uid, 'sign_in', { signup: true });
      }
    } catch (err: any) {
      handleAuthError(err);
      setLoading(false);
    }
    // Don't setLoading(false) on success, because the component will unmount
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            promotions: {},
            status: 'active'
        });
        trackUsage(user.uid, 'sign_in', { signup: true, provider: 'google' });
      } else {
        trackUsage(user.uid, 'sign_in', { provider: 'google' });
      }
    } catch (err: any) {
       handleAuthError(err);
       setLoading(false);
    }
     // Don't setLoading(false) on success
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

  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 z-50 flex flex-col items-center justify-center text-center p-4 animate-fade-in">
        <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto" />
        <h1 className="text-2xl font-bold text-white mt-6">Please wait...</h1>
        <div className="h-6 mt-2">
            <p key={loadingMessageIndex} className="text-gray-300 animate-fade-in">
                {loadingMessages[loadingMessageIndex]}
            </p>
        </div>
    </div>
  );


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 relative">
       {loading && <LoadingOverlay />}
       <a 
        href="#/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold transition-colors"
        aria-label="Back Home"
      >
        <ArrowLeft size={20} />
        <span>Back Home</span>
      </a>
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg">
        <div className="text-center">
            <img src="https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/logo.png?alt=media&token=3d2f7db5-96db-4dce-ba00-43d8976da3a1" alt="CareerVivid Logo" className="h-12 w-12 mx-auto" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              {isLogin ? 'Sign in to CareerVivid' : 'Create your CareerVivid account'}
            </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleAuthAction}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
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
              {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up')}
            </button>
          </div>
        </form>

        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
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
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }} className="font-medium text-primary-600 hover:text-primary-500">
                {isLogin ? 'Sign up' : 'Sign in'}
            </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;