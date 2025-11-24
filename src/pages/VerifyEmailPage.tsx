import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { MailCheck, Loader2 } from 'lucide-react';

const VerifyEmailPage: React.FC = () => {
    const { currentUser, logOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleResendVerification = async () => {
        if (!currentUser) return;
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const actionCodeSettings = {
                url: window.location.href.split('#')[0], // Redirect to the app's root URL
            };
            await sendEmailVerification(currentUser, actionCodeSettings);
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
                        Please check your inbox (and spam folder) and click the link to activate your account. You can close this tab after verifying.
                    </p>
                </div>
                
                {message && <p className="text-sm text-green-500 dark:text-green-400">{message}</p>}
                {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

                <div className="mt-6 space-y-4">
                    <button
                        onClick={handleResendVerification}
                        disabled={loading}
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