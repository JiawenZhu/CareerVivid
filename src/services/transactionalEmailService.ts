import { httpsCallable } from 'firebase/functions';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, functions } from '../firebase';

type TransactionalAuthEmailType =
    | 'email_verification'
    | 'password_reset'
    | 'password_reset_confirmation';

type TransactionalAuthEmailPayload = {
    type: TransactionalAuthEmailType;
    email?: string;
    continueUrl?: string;
};

export const queueTransactionalAuthEmail = async (payload: TransactionalAuthEmailPayload) => {
    const continueUrl = window.location.origin + (payload.type === 'password_reset' ? '/signin' : '/dashboard');
    const sendTransactionalAuthEmail = httpsCallable(functions, 'sendTransactionalAuthEmail');
    try {
        return await sendTransactionalAuthEmail({
            continueUrl,
            ...payload,
        });
    } catch (error: any) {
        if (payload.type !== 'password_reset') {
            throw error;
        }

        console.warn('Transactional password reset email failed; falling back to Firebase Auth email.', error);

        const email = payload.email?.trim();
        if (!email) throw error;

        try {
            await sendPasswordResetEmail(auth, email, { url: continueUrl });
            return { data: { queued: true, fallback: 'firebase_auth' } };
        } catch (fallbackError: any) {
            if (fallbackError?.code === 'auth/user-not-found') {
                return { data: { queued: true, fallback: 'firebase_auth' } };
            }
            throw fallbackError;
        }
    }
};
