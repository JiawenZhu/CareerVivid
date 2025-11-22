
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
import { Eye, EyeOff, ArrowLeft, Loader2, Mail, Lock, ChevronRight } from 'lucide-react';
import { trackUsage } from '../services/trackingService';
import Logo from '../components/Logo';

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
            setError('Invalid email or password. Please try again.');
            break;
        case 'auth/email-already-in-use':
            setError('An account with this email already exists. Please "Sign in" instead.');
            break;
        case 'auth/weak-password':
            setError('Password is too weak. Please use at least 6 characters.');
            break;
        case 'auth/popup-closed-by-user':
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
        const actionCodeSettings = {
            url: window.location.href.split('#')[0],
        };
        await sendEmailVerification(cred.user, actionCodeSettings);
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
      setSuccess('Password reset email sent! Please check your inbox.');
    } catch (err: any) {
      handleAuthError(err);
    }
    setLoading(false);
  };

  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-4 animate-fade-in">
        <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-6">Please wait...</h1>
        <div className="h-6 mt-2">
            <p key={loadingMessageIndex} className="text-gray-600 dark:text-gray-400 animate-fade-in font-medium">
                {loadingMessages[loadingMessageIndex]}
            </p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 relative overflow-hidden font-sans">
       {/* Abstract Background Elements */}
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-400/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-400/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
        </div>

       {loading && <LoadingOverlay />}
       
       <a 
        href="#/" 
        className="absolute top-8 left-8 z-20 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        Back Home
      </a>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 p-8 sm:p-10">
            
            <div className="text-center mb-10">
                <Logo className="h-10 w-10 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {isLogin ? 'Welcome back' : 'Create an account'}
                </h2>
                <p className="mt-3 text-gray-500 dark:text-gray-400">
                    {isLogin ? 'Enter your details to access your workspace.' : 'Start building your career today.'}
                </p>
            </div>

            <form className="space-y-5" onSubmit={handleAuthAction}>
                <div>
                    <label htmlFor="email" className="sr-only">Email address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm font-medium"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="sr-only">Password</label>
                    <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            className="block w-full pl-11 pr-11 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm font-medium"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                         <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                {isLogin && (
                    <div className="flex items-center justify-end">
                        <button type="button" onClick={handlePasswordReset} className="text-sm font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                            Forgot password?
                        </button>
                    </div>
                )}

                {error && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                        <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                        <p className="text-sm text-green-600 dark:text-green-400 text-center font-medium">{success}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-500/20 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                >
                    {isLogin ? 'Sign in' : 'Create account'}
                </button>
            </form>

            <div className="my-8 relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 font-medium">Or continue with</span>
                </div>
            </div>

            <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
                <svg className="w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 398.2 0 256S111.8 0 244 0c71.2 0 130.9 27.8 176.9 72.9l-63.1 61.3C294.3 93.6 270.3 80 244 80 158.4 80 90 148.2 90 233.9s68.4 153.9 154 153.9c75.5 0 120.9-42.3 124.9-97.9H244v-77.3h236.1c2.4 12.7 3.9 26.1 3.9 40.2z"></path></svg>
                Google
            </button>

            <div className="mt-8 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }} 
                        className="font-bold text-primary-600 hover:text-primary-700 transition-colors inline-flex items-center gap-1"
                    >
                        {isLogin ? 'Sign up for free' : 'Log in'} <ChevronRight size={14} />
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;