
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { loadStripe } from '@stripe/stripe-js';
import { trackUsage } from '../services/trackingService';
import { navigate } from '../utils/navigation';


// Pricing plans with correct IDs from Stripe
const pricingPlans = [
    {
        name: 'Free',
        subtitle: 'Get started with basic features.',
        price: '$0',
        duration: 'forever',
        priceId: null, // No Stripe price for free tier
        features: [
            'Create & Edit 2 Resumes',
            'Create 1 Portfolio Website',
            'All Professional Templates',
            '10 AI Credits/Month',
            'AI Content Generation',
            'Image Exports',
        ],
        cta: 'Get Started',
        resumeLimit: 2,
    },
    {
        name: 'The 7-Day Sprint',
        subtitle: 'Perfect for a quick resume overhaul.',
        price: '$6.90',
        originalPrice: '$13.80',
        discount: '50% OFF',
        duration: 'one-time',
        priceId: 'price_1SXEhfEqIOIAAUV0gMU2RsIN',
        features: [
            'Create & Edit up to 8 Resumes',
            'Create up to 8 Portfolio Websites',
            'All Professional Templates',
            '100 AI Credits/Month',
            'AI Content Generation',
            'AI Photo Editing',
            'Unlimited Downloads',
            '7 Days Access',
        ],
        cta: 'Get Started',
        resumeLimit: 8,
    },
    {
        name: 'Pro Monthly',
        subtitle: 'Continuous AI coaching for your entire job search.',
        price: '$14.90',
        originalPrice: '$29.80',
        discount: '50% OFF',
        duration: '/month',
        priceId: 'price_1SXF15EqIOIAAUV01eD0To1q',
        features: [
            'Create & Edit up to 15 Resumes',
            'Create up to 8 Portfolio Websites',
            'All Professional Templates',
            '300 AI Credits/Month',
            'AI Content Generation',
            'AI Photo Editing',
            'Unlimited Downloads',
            'Unlimited Interview Practice',
        ],
        cta: 'Get Started',
        popular: true,
        resumeLimit: 15,
    },
];

// Use live key for production
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51STFUtRJNflGxv32CayeCcXNHhUP08C5ECNWVVpBJsTUEWGuCOk4RAbvW9nHioDwk0vyQGgKDmBQeyZu5oGFcOel00UsdE352Z';
const stripePromise = STRIPE_PUBLISHABLE_KEY.startsWith('pk_') ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;


const PricingPage: React.FC = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleChoosePlan = async (priceId: string | null) => {
        setError('');

        // Check if user is logged in
        if (!currentUser) {
            navigate('/signup');
            return;
        }

        // Free tier - just navigate to dashboard
        if (!priceId) {
            navigate('/');
            return;
        }

        setLoadingPriceId(priceId);

        try {
            // Track checkout session start
            await trackUsage(currentUser.uid, 'checkout_session_start', { priceId });

            // Call Cloud Function to create checkout session
            const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
            const result: any = await createCheckoutSession({
                priceId,
                successUrl: `${window.location.origin}/#/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/#/pricing`,
            });

            // Redirect to Stripe Checkout
            if (result.data.url) {
                window.location.href = result.data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error: any) {
            console.error('Error creating checkout session:', error);
            setError(t('pricing.error_checkout'));
            setLoadingPriceId(null);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col font-sans">
            <PublicHeader />
            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-full text-sm font-bold mb-6 animate-pulse">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            Limited Time Offer: 50% OFF All Plans
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t('pricing.title')}</h1>
                        <p className="mt-6 text-xl text-gray-600 dark:text-gray-400">
                            {t('pricing.subtitle')}
                        </p>
                    </div>

                    {error && <p className="mt-8 text-center text-red-500 bg-red-100 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}

                    <div className="mt-16 flex justify-center">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
                            {pricingPlans.map((plan: any) => (
                                <div key={plan.name} className={`relative rounded-3xl p-8 border ${plan.popular ? 'border-primary-500 border-2' : 'border-gray-200 dark:border-gray-800'} bg-white dark:bg-gray-900 shadow-lg flex flex-col transform hover:-translate-y-1 transition-transform`}>
                                    {plan.popular && (
                                        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 z-10">
                                            <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">{t('pricing.most_popular')}</span>
                                        </div>
                                    )}

                                    {plan.discount && (
                                        <div className="absolute top-0 right-0 p-6 z-10">
                                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded rotate-12 inline-block transform shadow-sm">
                                                {plan.discount}
                                            </span>
                                        </div>
                                    )}

                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{plan.name}</h3>

                                    <div className="mt-4 flex flex-col">
                                        {plan.originalPrice && (
                                            <span className="text-sm line-through text-gray-400">
                                                {plan.originalPrice}
                                            </span>
                                        )}
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400"> {plan.duration}</span>
                                        </div>
                                    </div>

                                    <ul className="mt-8 space-y-4 text-sm text-gray-600 dark:text-gray-300 flex-grow">
                                        {plan.features.map((feature: string) => (
                                            <li key={feature} className="flex items-start">
                                                <CheckCircle className="flex-shrink-0 w-5 h-5 text-primary-500 mr-3 mt-0.5" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={() => handleChoosePlan(plan.priceId)}
                                        disabled={plan.priceId !== null && loadingPriceId === plan.priceId}
                                        className={`mt-8 block w-full text-center rounded-xl px-6 py-3 text-sm font-bold transition-colors disabled:opacity-50 ${plan.popular ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                        {(plan.priceId !== null && loadingPriceId === plan.priceId) ? <Loader2 className="animate-spin mx-auto" /> : t('pricing.cta_get_started')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PricingPage;
