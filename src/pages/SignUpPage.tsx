import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    createUserWithEmailAndPassword,
    signInWithPopup,
    sendEmailVerification,
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Eye, EyeOff, ArrowLeft, Loader2, Mail, Lock, ChevronRight } from 'lucide-react';
import { trackUsage } from '../services/trackingService';
import Logo from '../components/Logo';

const SignUpPage: React.FC = () => {
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
            case 'auth/email-already-in-use':
                setError(t('auth.error_exists'));
                break;
            case 'auth/weak-password':
                setError(t('auth.error_weak'));
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

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get('ref');
        if (refCode) {
            localStorage.setItem('careervivid_referral', refCode);
        }
    }, []);

    const getReferralCode = () => {
        return localStorage.getItem('careervivid_referral') || undefined;
    }

    const lookupPartnerByReferralCode = async (refCode: string) => {
        try {
            const q = query(
                collection(db, 'users'),
                where('referralCode', '==', refCode),
                where('role', '==', 'academic_partner')
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
                return snap.docs[0].id; // Return partner UID
            }
        } catch (err) {
            console.error('Error looking up referral code:', err);
        }
        return null;
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            const actionCodeSettings = {
                url: window.location.href.split('#')[0],
            };
            await sendEmailVerification(cred.user, actionCodeSettings);

            const referredBy = getReferralCode();
            let academicPartnerId: string | undefined;
            let grantTrial = false;

            if (referredBy) {
                academicPartnerId = await lookupPartnerByReferralCode(referredBy);
                if (academicPartnerId) {
                    grantTrial = true;
                }
            }

            const expiresAt = grantTrial
                ? Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                : undefined;

            await setDoc(doc(db, 'users', cred.user.uid), {
                uid: cred.user.uid,
                email: cred.user.email,
                createdAt: serverTimestamp(),
                promotions: {},
                status: 'active',
                ...(referredBy ? { referredBy } : {}),
                ...(academicPartnerId ? { academicPartnerId } : {}),
                ...(grantTrial ? {
                    plan: 'pro_sprint',
                    expiresAt: expiresAt
                } : {})
            });
            trackUsage(cred.user.uid, 'sign_in', { signup: true });

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

    const handleGoogleSignUp = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                const referredBy = getReferralCode();
                let academicPartnerId: string | undefined;
                let grantTrial = false;

                if (referredBy) {
                    academicPartnerId = await lookupPartnerByReferralCode(referredBy);
                    if (academicPartnerId) {
                        grantTrial = true;
                    }
                }

                const expiresAt = grantTrial
                    ? Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                    : undefined;

                await setDoc(userDocRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    createdAt: serverTimestamp(),
                    promotions: {},
                    status: 'active',
                    ...(referredBy ? { referredBy } : {}),
                    ...(academicPartnerId ? { academicPartnerId } : {}),
                    ...(grantTrial ? {
                        plan: 'pro_sprint',
                        expiresAt: expiresAt
                    } : {})
                });
                trackUsage(user.uid, 'sign_in', { signup: true, provider: 'google' });
            } else {
                trackUsage(user.uid, 'sign_in', { provider: 'google' });
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
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {t('auth.create_account')}
                        </h2>
                        <p className="mt-3 text-gray-500 dark:text-gray-400">
                            {t('auth.start_building')}
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSignUp}>
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
                            {t('auth.create_account_btn')}
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

                    <button
                        onClick={handleGoogleSignUp}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                        <svg className="w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 398.2 0 256S111.8 0 244 0c71.2 0 130.9 27.8 176.9 72.9l-63.1 61.3C294.3 93.6 270.3 80 244 80 158.4 80 90 148.2 90 233.9s68.4 153.9 154 153.9c75.5 0 120.9-42.3 124.9-97.9H244v-77.3h236.1c2.4 12.7 3.9 26.1 3.9 40.2z"></path></svg>
                        {t('auth.google')}
                    </button>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('auth.already_have_account')}{' '}
                            <a
                                href="/signin"
                                className="font-bold text-primary-600 hover:text-primary-700 transition-colors inline-flex items-center gap-1"
                            >
                                {t('auth.log_in')} <ChevronRight size={14} />
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;
