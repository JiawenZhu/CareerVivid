import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MailCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { queueTransactionalAuthEmail } from '../services/transactionalEmailService';
import { navigate } from '../utils/navigation';

const VerifyEmailPage: React.FC = () => {
    const { currentUser, logOut, isEmailVerified, refreshEmailVerification } = useAuth();
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const continueTarget = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const rawRedirect = params.get('redirect') || '/dashboard';

        try {
            const decoded = decodeURIComponent(rawRedirect);
            const targetUrl = new URL(decoded, window.location.origin);
            if (targetUrl.origin !== window.location.origin) return '/dashboard';
            return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
        } catch {
            return rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/dashboard';
        }
    }, []);

    const handleVerificationCheck = useCallback(async (silent = false) => {
        if (!currentUser) return;
        if (!silent) {
            setChecking(true);
            setMessage('');
            setError('');
        }

        const verified = await refreshEmailVerification();

        if (verified) {
            navigate(continueTarget);
            return;
        }

        if (!silent) {
            setError('This email is not verified yet. Click the verification link in your inbox, then try again.');
        }

        setChecking(false);
    }, [continueTarget, currentUser, refreshEmailVerification]);

    useEffect(() => {
        if (isEmailVerified) {
            navigate(continueTarget);
        }
    }, [continueTarget, isEmailVerified]);

    useEffect(() => {
        const checkOnReturn = () => {
            if (document.visibilityState === 'visible') {
                handleVerificationCheck(true);
            }
        };

        window.addEventListener('focus', checkOnReturn);
        document.addEventListener('visibilitychange', checkOnReturn);

        return () => {
            window.removeEventListener('focus', checkOnReturn);
            document.removeEventListener('visibilitychange', checkOnReturn);
        };
    }, [handleVerificationCheck]);

    const handleResendVerification = async () => {
        if (!currentUser) return;
        setLoading(true);
        setMessage('');
        setError('');
        try {
            await queueTransactionalAuthEmail({ type: 'email_verification' });
            setMessage('A new verification email has been sent to your inbox.');
        } catch (err: any) {
            setError('Failed to send verification email. Please try again later.');
        }
        setLoading(false);
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg text-center">
                <div>
                    <MailCheck className="w-16 h-16 mx-auto text-primary-500" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        Verify Your Email
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                        A verification link has been sent to your email address:
                    </p>
                    <p className="font-semibold text-gray-800 dark:text-white mt-1">{currentUser?.email}</p>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        Please check your inbox, click the verification link, then return here to continue.
                    </p>
                </div>
                
                {message && <p className="text-sm text-green-500 dark:text-green-400">{message}</p>}
                {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

                <div className="mt-6 space-y-4">
                    <button
                        onClick={() => handleVerificationCheck(false)}
                        disabled={checking || loading}
                        className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-emerald-300"
                    >
                        {checking ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                        {checking ? 'Checking...' : 'I verified my email'}
                    </button>
                    <button
                        onClick={handleResendVerification}
                        disabled={loading || checking}
                        className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
                    >
                        {loading && <Loader2 className="animate-spin" size={16} />}
                        {loading ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                    <button onClick={logOut} className="text-sm text-gray-500 dark:text-gray-400 hover:underline">
                        Sign out and use a different account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
