import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Eye, EyeOff, ArrowLeft, Loader2, Mail, Lock, ChevronRight } from 'lucide-react';
import { trackUsage } from '../services/trackingService';
import Logo from '../components/Logo';
import { navigate } from '../utils/navigation';

const SignInPage: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    const loadingMessages = [
        t('auth.loading_secure'),
        t('auth.loading_process'),
        t('auth.loading_ready'),
        t('auth.loading_moment'),
    ];

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
                setError(t('auth.error_invalid'));
                break;
            case 'auth/popup-closed-by-user':
                break;
            case 'auth/account-exists-with-different-credential':
                setError(t('auth.error_diff_cred'));
                break;
            default:
                setError(err.message.replace('Firebase: ', ''));
                break;
        }
    }

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            trackUsage(cred.user.uid, 'sign_in');

            // Check for redirect param
            const params = new URLSearchParams(window.location.search);
            const redirectUrl = params.get('redirect');
            if (redirectUrl) {
                window.location.href = decodeURIComponent(redirectUrl);
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

            if (userDoc.exists()) {
                trackUsage(user.uid, 'sign_in', { provider: 'google' });
            } else {
                // New user signing up via Google - redirect to signup
                await auth.signOut();
                setLoading(false);
                navigate('/signup');
                return;
            }

            // Check for redirect param
            const params = new URLSearchParams(window.location.search);
            const redirectUrl = params.get('redirect');
            if (redirectUrl) {
                window.location.href = decodeURIComponent(redirectUrl);
            }
        } catch (err: any) {
            handleAuthError(err);
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            setError(t('auth.enter_email_reset'));
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(t('auth.reset_sent'));
        } catch (err: any) {
            handleAuthError(err);
        }
        setLoading(false);
    };

    const LoadingOverlay = () => (
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-4 animate-fade-in">
            <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-6">{t('auth.please_wait')}</h1>
            <div className="h-6 mt-2">
                <p key={loadingMessageIndex} className="text-gray-600 dark:text-gray-400 animate-fade-in font-medium">
                    {loadingMessages[loadingMessageIndex]}
                </p>
            </div>
        </div>
    );

    // Helper to check context - moved up for use in handlers
    const isBioLinkContext = new URLSearchParams(window.location.search).get('source') === 'bio-link'
        || localStorage.getItem('tiktok_auth_context') === 'bio-link';

    // TikTok Login Flow
    const handleTikTokLogin = () => {
        setLoading(true);
        // 1. Generate State
        const csrfState = Math.random().toString(36).substring(7);
        localStorage.setItem('tiktok_node_auth_state', csrfState);

        // Store context for after redirect (TikTok doesn't allow query params in redirect URI)
        if (isBioLinkContext) {
            localStorage.setItem('tiktok_auth_context', 'bio-link');
        }

        // 2. Redirect with CLEAN URL (no query params)
        const clientKey = 'aw1crl350g7yvps2';
        const redirectUri = `${window.location.origin}/signin`; // Clean base URL
        const scope = 'user.info.basic,user.info.profile,user.info.stats,video.list';
        const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${csrfState}`;
        window.location.href = url;
    };

    // Handle TikTok Callback
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        // Ensure we are processing a TikTok login attempt
        // We can check if state matches what we stored
        const storedState = localStorage.getItem('tiktok_node_auth_state');

        if (code && state && storedState && state === storedState) {
            const processTikTokAuth = async () => {
                setLoading(true);
                try {
                    // Exchange code for Custom Token via Backend
                    // Note: We use a direct HTTPs call logic or Callable. 
                    // Since `authWithTikTok` is onCall, we use functions client.
                    // But here we might not have `functions` exported from firebase.ts directly?
                    // Let's assume we can import it or use HTTP. 
                    // Actually, `authWithTikTok` was defined as onCall.

                    // Import functions dynamically or assume it's available. 
                    // Checking imports... `import { auth, googleProvider, db } from '../firebase';`
                    // I might need to update firebase.ts to export functions, or use `httpsCallable`.
                    // Let's assume I need to add `functions` to imports if not there.

                    // FALLBACK: If functions is not exported, I can use fetch to the HTTP trigger URL if I made it onRequest.
                    // BUT I made it `onCall`. So I MUST use `httpsCallable`.

                    // I'll grab functions from `../firebase` if possible. If not, I'll init it.
                    const { getFunctions, httpsCallable } = await import('firebase/functions');
                    const functions = getFunctions();
                    const authWithTikTokFn = httpsCallable(functions, 'authWithTikTok');

                    const result = await authWithTikTokFn({
                        code,
                        redirectUri: `${window.location.origin}/signin`
                    });

                    const { token } = result.data as { token: string };

                    // Sign in with Custom Token
                    const { signInWithCustomToken } = await import('firebase/auth');
                    await signInWithCustomToken(auth, token);

                    // Cleanup
                    localStorage.removeItem('tiktok_node_auth_state');

                    // Redirect
                    navigate('/dashboard');

                } catch (err: any) {
                    console.error("TikTok Auth Failed:", err);
                    setError("TikTok Login failed. Please try again.");
                    setLoading(false);
                }
            };
            processTikTokAuth();
        }
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 relative overflow-hidden font-sans">
            {/* Abstract Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-400/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-400/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
            </div>

            {loading && <LoadingOverlay />}

            <a
                href="/"
                className="absolute top-8 left-8 z-20 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
                <ArrowLeft size={18} />
                {t('auth.back_home')}
            </a>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 p-8 sm:p-10">

                    <div className="text-center mb-10">
                        <Logo className="h-10 w-10 mx-auto mb-6" />
                        {isBioLinkContext ? (
                            <>
                                <h2 className="text-3xl font-black text-black uppercase tracking-tighter">
                                    Welcome Creator!
                                </h2>
                                <p className="mt-3 text-gray-600 font-medium">
                                    Log in to manage your Bio-Link.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                    {t('auth.welcome_back')}
                                </h2>
                                <p className="mt-3 text-gray-500 dark:text-gray-400">
                                    {t('auth.enter_details')}
                                </p>
                            </>
                        )}
                    </div>

                    <form className="space-y-5" onSubmit={handleSignIn}>
                        <div>
                            <label htmlFor="email" className="sr-only">{t('auth.email_label')}</label>
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
                                    placeholder={t('auth.email_placeholder')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="sr-only">{t('auth.password_label')}</label>
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
                                    placeholder={t('auth.password_placeholder')}
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

                        <div className="flex items-center justify-end">
                            <button type="button" onClick={handlePasswordReset} className="text-sm font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                                {t('auth.forgot_password')}
                            </button>
                        </div>

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
                            {t('auth.sign_in')}
                        </button>
                    </form>

                    <div className="my-8 relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 font-medium">{t('auth.or_continue_with')}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* Contextual TikTok Button */}
                        {isBioLinkContext && (
                            <button
                                onClick={handleTikTokLogin}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-[#FE2C55] text-white text-sm font-black uppercase border-2 border-black hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 448 512"><path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0l88 0a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14z" /></svg>
                                Continue with TikTok
                            </button>
                        )}

                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                        >
                            <svg className="w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 398.2 0 256S111.8 0 244 0c71.2 0 130.9 27.8 176.9 72.9l-63.1 61.3C294.3 93.6 270.3 80 244 80 158.4 80 90 148.2 90 233.9s68.4 153.9 154 153.9c75.5 0 120.9-42.3 124.9-97.9H244v-77.3h236.1c2.4 12.7 3.9 26.1 3.9 40.2z"></path></svg>
                            {t('auth.google')}
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('auth.dont_have_account')}{' '}
                            <a
                                href="/signup"
                                className="font-bold text-primary-600 hover:text-primary-700 transition-colors inline-flex items-center gap-1"
                            >
                                {t('auth.sign_up_free')} <ChevronRight size={14} />
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignInPage;
