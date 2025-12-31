import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { Gift, Sparkles, Target, Zap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { navigate } from '../App';

const ReferralLandingPage: React.FC = () => {
    const { t } = useTranslation();
    const [referralCode, setReferralCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
    const [credits, setCredits] = useState(300); // Monthly plan: 300 AI Credits/Month

    // Get referral code from URL parameter
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get('ref');
        if (refCode) {
            setReferralCode(refCode);
            validateCode(refCode);
        }
    }, []);

    const validateCode = async (code: string) => {
        if (!code || code.length < 4) {
            setValidationStatus('idle');
            return;
        }

        setIsValidating(true);

        // Simulate validation (replace with actual Firebase call)
        setTimeout(() => {
            // For demo: codes starting with 'q' are valid
            const isValid = code.startsWith('q') || code.length === 8;
            setValidationStatus(isValid ? 'valid' : 'invalid');
            if (isValid) {
                setCredits(300); // Monthly plan: 300 AI Credits/Month
            }
            setIsValidating(false);
        }, 800);
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const code = e.target.value.toUpperCase();
        setReferralCode(code);
        if (code.length >= 4) {
            validateCode(code);
        } else {
            setValidationStatus('idle');
        }
    };

    const handleSignUp = () => {
        // Navigate to signup with referral code
        navigate(`/signup?ref=${referralCode}`);
    };

    const benefits = [
        {
            icon: <Gift className="w-8 h-8 text-yellow-500" />,
            title: `${credits} AI Credits/Month`,
            description: 'Generate professional resume content with AI'
        },
        {
            icon: <Sparkles className="w-8 h-8 text-purple-500" />,
            title: 'All Premium Templates',
            description: 'Access to all professional resume templates'
        },
        {
            icon: <Target className="w-8 h-8 text-blue-500" />,
            title: 'Unlimited Interview Practice',
            description: 'Mock interview sessions with AI coach'
        },
        {
            icon: <Zap className="w-8 h-8 text-green-500" />,
            title: 'AI Photo Editing',
            description: 'Professional photo enhancement with AI'
        }
    ];

    return (
        <div className="bg-gray-50 dark:bg-gray-950 min-h-screen flex flex-col font-sans">
            <PublicHeader />

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-full mb-6 shadow-sm">
                            <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                                Limited Time Offer
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
                            Get <span className="text-indigo-600 dark:text-indigo-400">Free AI Credits</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
                            Sign up with a referral code and unlock premium features to accelerate your job search.
                        </p>

                        {/* Referral Code Input */}
                        <div className="max-w-md mx-auto mb-12">
                            <label className="block text-left text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Enter Referral Code
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={referralCode}
                                    onChange={handleCodeChange}
                                    placeholder="e.g., q9MYCaKn"
                                    className="w-full px-4 py-4 pr-12 text-lg font-mono bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 transition-all outline-none"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    {isValidating && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
                                    {!isValidating && validationStatus === 'valid' && (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    )}
                                    {!isValidating && validationStatus === 'invalid' && (
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    )}
                                </div>
                            </div>
                            {validationStatus === 'valid' && (
                                <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <CheckCircle2 size={16} />
                                    Valid code! You'll receive {credits} AI credits
                                </p>
                            )}
                            {validationStatus === 'invalid' && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertCircle size={16} />
                                    Invalid referral code. Please check and try again.
                                </p>
                            )}
                        </div>

                        {/* CTA Button */}
                        <button
                            onClick={handleSignUp}
                            disabled={validationStatus !== 'valid'}
                            className={`inline-flex items-center gap-2 px-8 py-4 text-lg font-bold rounded-xl transition-all transform hover:scale-105 ${validationStatus === 'valid'
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30'
                                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                }`}
                        >
                            <Sparkles className="w-5 h-5" />
                            Sign Up & Get Credits
                        </button>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                            Already have an account?{' '}
                            <button
                                onClick={() => navigate('/signin')}
                                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12 tracking-tight">
                        What You'll Get
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {benefits.map((benefit, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg transition-all"
                            >
                                <div className="mb-4">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    {benefit.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    {benefit.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* How It Works */}
                <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12 tracking-tight">
                        How It Works
                    </h2>
                    <div className="space-y-6">
                        {[
                            { step: 1, title: 'Enter Referral Code', desc: 'Use the code shared by your friend or colleague' },
                            { step: 2, title: 'Create Your Account', desc: 'Sign up with your email in just a few seconds' },
                            { step: 3, title: 'Get Instant Credits', desc: 'AI credits are automatically added to your account' },
                            { step: 4, title: 'Start Building', desc: 'Use credits to create your perfect resume with AI' }
                        ].map((item) => (
                            <div key={item.step} className="flex flex-col items-center text-center gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-lg border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                    {item.step}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default ReferralLandingPage;
