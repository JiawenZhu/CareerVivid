import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import ReactDOM from 'react-dom';
import { X, Lock, Loader2, UserPlus, LogIn } from 'lucide-react';

interface QuickAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (isNewUser: boolean) => void;
    title?: string;
    subtitle?: string;
}

const QuickAuthModal: React.FC<QuickAuthModalProps> = ({ isOpen, onClose, onSuccess, title = "Admin Access", subtitle = "Sign in to edit this portfolio" }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
                onSuccess(true); // isNewUser = true
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                onSuccess(false); // isNewUser = false
            }
            onClose();
        } catch (err: any) {
            console.error('Auth failed:', err);
            if (isSignUp) {
                if (err.code === 'auth/email-already-in-use') {
                    setError('Email already in use. Please sign in.');
                } else if (err.code === 'auth/weak-password') {
                    setError('Password should be at least 6 characters.');
                } else {
                    setError('Failed to create account. Please try again.');
                }
            } else {
                setError('Invalid credentials. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl relative border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center mb-6">
                    <div className={`p-3 rounded-full mb-3 ${isSignUp ? 'bg-green-100 dark:bg-green-900/30' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}>
                        {isSignUp ? (
                            <UserPlus className={`w-6 h-6 ${isSignUp ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
                        ) : (
                            <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">
                        {title || (isSignUp ? 'Create Account' : 'Sign In')}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
                        {subtitle || (isSignUp ? 'Join to save your design' : 'Sign in to edit this portfolio')}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800/30">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mb-4">
                    <div>
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-white"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-white"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-2.5 text-white rounded-lg font-medium shadow-sm transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed
                            ${isSignUp ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}
                        `}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {isSignUp ? 'Creating Account...' : 'Signing in...'}
                            </>
                        ) : (
                            isSignUp ? 'Create Account' : 'Sign In & Edit'
                        )}
                    </button>
                </form>

                {/* Toggle Mode */}
                <div className="text-center pt-2 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}
                        <button
                            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                            className="ml-1 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default QuickAuthModal;
